"""Download official Tawjihi past-paper archives (Ministry e-learning portal) into a local cache.
Usage: python3 -I tools/fetch_exams.py CACHE_DIR branch1,branch2"""
import json, os, re, subprocess, sys
cache, branches = sys.argv[1], sys.argv[2].split(",")
cfg = json.load(open(os.path.join(os.path.dirname(__file__), "exam_sources.json"), encoding="utf-8"))
data = [dict(id=k, **v) for k, v in cfg["branches"].items()]
os.makedirs(cache, exist_ok=True)
for b in data:
    if b["id"] not in branches: continue
    for y in ("2022", "2023", "2024", "2025"):
        out = os.path.join(cache, f"{b['id']}_{y}.rar")
        if os.path.exists(out): print("cached", out); continue
        r = subprocess.run(["/usr/bin/curl", "-sfL", "--max-time", "900", "-o", out, b["files"][y]])
        print(b["id"], y, "ok" if r.returncode == 0 else f"FAILED {r.returncode}", os.path.getsize(out) if os.path.exists(out) else 0)
