#!/usr/bin/env python3
import subprocess
from pathlib import Path

token = Path.home().joinpath(".hermes/secrets/vercel_token").read_text().strip()
key = None
for line in Path("/tmp/pages-bff.env").read_text().splitlines():
    if line.startswith("GATEWAY_CLIENT_API_KEY=***        key = line.split("=", 1)[1].strip().strip('"')
        break
if not key:
    raise SystemExit("missing key")

wd = Path("/Users/hayabusa/image_space")
env = {"VERCEL_TOKEN": token}

def run(cmd):
    print(">", " ".join(cmd[:6]), "...")
    return subprocess.run(cmd, cwd=wd, env={**__import__("os").environ, **env}, capture_output=True, text=True)

for var in ["VITE_API_URL", "GEMINI_API_KEY", "VITE_GEMINI_API_KEY", "VITE_CLIENT_API_KEY"]:
    run(["npx", "vercel", "env", "rm", var, "production", "--token", token, "--yes"])

for var, val in [("AI_API_URL", "https://api.yucelgumus.dev"), ("GATEWAY_CLIENT_API_KEY", key)]:
    p = subprocess.Popen(
        ["npx", "vercel", "env", "add", var, "production", "--token", token, "--force"],
        cwd=wd,
        stdin=subprocess.PIPE,
        env={**__import__("os").environ, **env},
        text=True,
    )
    p.communicate(val)
    print(p.returncode, var)

p = run(["npx", "vercel", "--prod", "--yes", "--token", token])
print(p.stdout[-800:] if p.stdout else "")
print(p.stderr[-400:] if p.stderr else "")
print("exit", p.returncode)