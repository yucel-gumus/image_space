#!/usr/bin/env python3
import base64
import json
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
meta = json.loads((ROOT / "public/meta.json").read_text())
corpus = json.dumps(meta, separators=(",", ":"))
prompt = (
    "Cevabını kesinlikle json formatında ver: {filenames:[], commentary:\"\"}\n"
    f"Korpus:\n{corpus}\n\nSorgu: deniz\n"
)
body = json.dumps({"prompt": prompt}).encode()
print("prompt_chars", len(prompt))

r = subprocess.run(
    [
        "sshpass",
        "-p",
        "6137",
        "ssh",
        "-o",
        "StrictHostKeyChecking=no",
        "yucel@192.168.1.106",
        "cd ~/python_backend && python3 scripts/export_client_key_b64.py",
    ],
    capture_output=True,
    text=True,
)
key = base64.b64decode(r.stdout.strip()).decode()

def post(url: str, headers: dict) -> None:
    req = urllib.request.Request(
        url,
        data=body,
        headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            print(url, "OK", resp.status, resp.read()[:250].decode(errors="replace"))
    except urllib.error.HTTPError as e:
        print(url, "ERR", e.code, e.read()[:400].decode(errors="replace"))

post("https://api.yucelgumus.dev/api/generate", {"X-API-Key": key})
post("https://image-space-ten.vercel.app/api/generate", {})