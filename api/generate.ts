import type { VercelRequest, VercelResponse } from '@vercel/node';

const gatewayBase = (): string => {
  const url =
    process.env.AI_API_URL ||
    process.env.GEMINI_GATEWAY_URL ||
    'https://api.yucelgumus.dev';
  return url.replace(/\/$/, '');
};

const clientKey = (): string | null => {
  const key = process.env.GATEWAY_CLIENT_API_KEY || process.env.CLIENT_API_KEY || '';
  return key.trim() || null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const key = clientKey();
  if (!key) {
    return res.status(500).json({ detail: 'GATEWAY_CLIENT_API_KEY is not configured' });
  }

  const body = req.body ?? {};
  if (!body.prompt || typeof body.prompt !== 'string') {
    return res.status(400).json({ detail: 'prompt is required' });
  }

  try {
    const upstream = await fetch(`${gatewayBase()}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': key,
      },
      body: JSON.stringify({
        prompt: body.prompt,
        ...(body.model ? { model: body.model } : {}),
      }),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.send(text);
  } catch {
    return res.status(502).json({ detail: 'Gateway unreachable' });
  }
}