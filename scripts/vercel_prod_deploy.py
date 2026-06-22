#!/usr/bin/env python3
"""Set image_space Vercel env from gateway and deploy prod. Reads key via SSH base64."""
import base64
import os
import subprocess
from pathlib import Path

token = Path.home().joinpath(".hermes/secrets/vercel_token").read_text().strip()
wd = Path("/Users/hayabusa/image_space")
venv = {**os.environ, "VERCEL_TOKEN": token}

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
b64 = (r.stdout or "").strip()
if not b64:
    raise SystemExit(f"ssh key fetch failed: {r.stderr[:300]}")
key = base64.b64decode(b64).decode()

subprocess.run(
    ["npx", "vercel", "link", "--yes", "--project", "image-space", "--token", token],
    cwd=wd,
    check=False,
    capture_output=True,
    text=True,
)


def add(name: str, val: str) -> None:
    p = subprocess.Popen(
        ["npx", "vercel", "env", "add", name, "production", "--token", token, "--force"],
        cwd=wd,
        stdin=subprocess.PIPE,
        env=venv,
        text=True,
    )
    p.communicate(val)
    if p.returncode != 0:
        raise SystemExit(f"env add failed: {name}")


for var in ["VITE_API_URL", "GEMINI_API_KEY", "VITE_GEMINI_API_KEY", "VITE_CLIENT_API_KEY"]:
    subprocess.run(
        ["npx", "vercel", "env", "rm", var, "production", "--token", token, "--yes"],
        cwd=wd,
        env=venv,
        capture_output=True,
    )

add("AI_API_URL", "https://api.yucelgumus.dev")
add("GATEWAY_CLIENT_API_KEY", key)

p = subprocess.run(
    ["npx", "vercel", "--prod", "--yes", "--token", token],
    cwd=wd,
    env=venv,
    capture_output=True,
    text=True,
)
print(p.stdout[-1500:])
if p.stderr:
    print(p.stderr[-800:])
raise SystemExit(p.returncode)