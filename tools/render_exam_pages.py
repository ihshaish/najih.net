"""Pre-render every exam PDF page to WebP so the site never depends on PDF.js.

PDF.js mangles the embedded Arabic fonts in the Ministry papers (broken glyphs and
spacing); poppler renders them exactly like the original. This script rasterises each
page with `pdftoppm` (poppler) and encodes it with Pillow:

  exams/2025/scientific/math-s1-p1.pdf  ->  exams/2025/scientific/math-s1-p1/p1.webp, p2.webp, ...

* Width is fixed at WIDTH px (height follows the page's aspect ratio).
* Encoding: the papers are typeset text, so a small palette encoded *losslessly* is both
  smaller and sharper than lossy WebP (no ringing around Arabic letterforms).
  Pages with no meaningful colour -> GRAY_LEVELS grey levels; pages with real colour
  (coloured diagrams) -> COLOURS colours. If that lossless file is over MAX_KB, smaller
  lossless palettes (COLOURS_FALLBACK / GRAY_FALLBACK) are tried, then lossy WebP
  (QUALITY stepping down to MIN_QUALITY); the smallest file is kept.
* Idempotent: a page whose .webp already exists and is newer than its PDF is skipped.
  Pass --force to re-render everything.
* After rendering, it injects page data into assets/js/exams.js (see inject_pages()):
  each paper gets "pages", "img" (folder) and "ratio" (height/width of page 1).
  tools/build_exams.py calls the same function, so a full rebuild keeps the data.

Usage:  python3 -I tools/render_exam_pages.py [--force] [--jobs N] [--only SUBSTRING] [--no-index]
Needs:  poppler (pdftoppm, pdfinfo) and Pillow with WebP support.
"""
import glob, io, json, os, re, subprocess, sys, tempfile
from concurrent.futures import ProcessPoolExecutor

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EXAMS_JS = os.path.join(ROOT, "assets", "js", "exams.js")
WIDTH = 1300          # px; A4 -> 1300 x 1839
GRAY_LEVELS = 16      # palette size for black-and-white pages (lossless)
COLOURS = 128         # palette size for pages with colour (lossless)
COLOURS_FALLBACK = (64, 48, 32)  # smaller lossless palettes tried when a page is over MAX_KB
GRAY_FALLBACK = (12, 8)
QUALITY = 80          # lossy fallback: starting WebP quality
MIN_QUALITY = 55
MAX_KB = 120
COLOUR_THRESHOLD = 24  # max channel spread (0-255) a pixel needs to count as "coloured"
COLOUR_FRACTION = 0.002  # share of coloured pixels above which the page is kept RGB


def img_dir(pdf_rel):
    """exams/2025/scientific/math-s1-p1.pdf -> exams/2025/scientific/math-s1-p1"""
    return pdf_rel[:-4]


def has_colour(im):
    from PIL import ImageChops
    small = im.convert("RGB").resize((im.width // 4, im.height // 4))
    r, g, b = small.split()
    spread = ImageChops.subtract(ImageChops.lighter(ImageChops.lighter(r, g), b),
                                 ImageChops.darker(ImageChops.darker(r, g), b))
    hist = spread.histogram()
    coloured = sum(hist[COLOUR_THRESHOLD:])
    return coloured / (small.width * small.height) > COLOUR_FRACTION


def encode(im, out):
    from PIL import Image
    colour = has_colour(im)
    base = im.convert("RGB") if colour else im.convert("L")
    # FASTOCTREE keeps saturated diagram colours exact (median-cut darkens them); it needs RGB.
    # Dense pages: step the palette down (still lossless, so letterforms stay crisp)
    # before falling back to lossy WebP.
    best = how = None
    for k in ((COLOURS,) + COLOURS_FALLBACK if colour else (GRAY_LEVELS,) + GRAY_FALLBACK):
        pal = (base.quantize(k, method=Image.Quantize.FASTOCTREE) if colour
               else base.quantize(k, method=Image.Quantize.MEDIANCUT))
        buf = io.BytesIO()
        pal.save(buf, "WEBP", lossless=True, quality=100, method=6)
        if best is None or buf.tell() < best.tell():
            best, how = buf, f"lossless {k}"
        if best.tell() <= MAX_KB * 1024:
            break
    if best.tell() > MAX_KB * 1024:
        q = QUALITY
        while True:
            lossy = io.BytesIO()
            base.save(lossy, "WEBP", quality=q, method=6)
            if lossy.tell() <= MAX_KB * 1024 or q <= MIN_QUALITY:
                break
            q -= 5
        if lossy.tell() < best.tell():
            best, how = lossy, f"q{q}"
    tmp = out + ".tmp"
    with open(tmp, "wb") as f:
        f.write(best.getvalue())
    os.replace(tmp, out)
    return best.tell(), ("RGB" if colour else "L") + " " + how


def page_count(pdf):
    out = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True, check=True).stdout
    return int(re.search(r"^Pages:\s+(\d+)", out, re.M).group(1))


def render_pdf(args):
    pdf_rel, force = args
    from PIL import Image
    pdf = os.path.join(ROOT, pdf_rel)
    d = os.path.join(ROOT, img_dir(pdf_rel))
    os.makedirs(d, exist_ok=True)
    n = page_count(pdf)
    mtime = os.path.getmtime(pdf)
    done, log = 0, []
    for i in range(1, n + 1):
        out = os.path.join(d, f"p{i}.webp")
        if not force and os.path.exists(out) and os.path.getmtime(out) >= mtime:
            continue
        with tempfile.TemporaryDirectory(prefix="najih_pg_") as tmp:
            base = os.path.join(tmp, "pg")
            subprocess.run(["pdftoppm", "-f", str(i), "-l", str(i), "-png", "-singlefile",
                            "-scale-to-x", str(WIDTH), "-scale-to-y", "-1",
                            "-aa", "yes", "-aaVector", "yes", pdf, base], check=True)
            with Image.open(base + ".png") as im:
                im.load()
                size, how = encode(im, out)
        done += 1
        if size > MAX_KB * 1024:
            log.append(f"  over budget: {img_dir(pdf_rel)}/p{i}.webp {size // 1024} KB ({how})")
    # drop stale pages if the PDF shrank
    for extra in glob.glob(os.path.join(d, "p*.webp")):
        m = re.search(r"p(\d+)\.webp$", extra)
        if m and int(m.group(1)) > n:
            os.remove(extra)
    return pdf_rel, n, done, log


def page_info(pdf_rel):
    """Return {"pages", "img", "ratio"} for a rendered paper, or None if not rendered."""
    from PIL import Image
    d = img_dir(pdf_rel)
    files = sorted(glob.glob(os.path.join(ROOT, d, "p*.webp")),
                   key=lambda p: int(re.search(r"p(\d+)\.webp$", p).group(1)))
    if not files:
        return None
    with Image.open(files[0]) as im:
        ar = round(im.height / im.width, 4)
    return {"pages": len(files), "img": d, "ratio": ar}


def inject_pages(papers):
    """Add page-image data to paper dicts in place (used by build_exams.py too)."""
    missing = []
    for p in papers:
        info = page_info(p["file"])
        if info:
            p.update(info)
        else:
            p.pop("img", None); p.pop("ratio", None)
            missing.append(p["id"])
    return missing


def update_exams_js():
    src = open(EXAMS_JS, encoding="utf-8").read()
    m = re.search(r"window\.EXAMS = (.*);\s*$", src, re.S)
    data = json.loads(m.group(1))
    missing = inject_pages(data["papers"])
    out = src[:m.start(1)] + json.dumps(data, ensure_ascii=False, indent=0) + ";\n"
    open(EXAMS_JS, "w", encoding="utf-8").write(out)
    print(f"exams.js: page data for {len(data['papers']) - len(missing)} papers; missing {missing}")


def main():
    argv = sys.argv[1:]
    force = "--force" in argv
    jobs = int(argv[argv.index("--jobs") + 1]) if "--jobs" in argv else (os.cpu_count() or 4)
    only = argv[argv.index("--only") + 1] if "--only" in argv else ""
    pdfs = sorted(os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(ROOT, "exams", "**", "*.pdf"), recursive=True))
    pdfs = [p for p in pdfs if only in p]
    total_pages = rendered = 0
    with ProcessPoolExecutor(max_workers=jobs) as ex:
        for pdf_rel, n, done, log in ex.map(render_pdf, [(p, force) for p in pdfs]):
            total_pages += n; rendered += done
            if done: print(f"{pdf_rel}: {done}/{n} pages rendered")
            for line in log: print(line)
    print(f"{len(pdfs)} PDFs, {total_pages} pages, {rendered} newly rendered")
    if "--no-index" not in argv:
        update_exams_js()


if __name__ == "__main__":
    main()
