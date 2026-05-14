export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'Missing API key' });

  const { batch = 1 } = req.body;

  const categories = [
    'Tech gadgets and electronics',
    'Beauty and skincare',
    'Home and kitchen',
    'Fashion and accessories',
    'Pets',
    'Sports and fitness',
    'Kids and baby',
    'Outdoor and travel',
    'Health and wellness',
    'Car accessories',
  ];

  const category = categories[(batch - 1) % categories.length];
  const startRank = (batch - 1) * 10 + 1;

  const prompt = `You are a dropshipping expert. List the 10 best trending dropshipping products in "${category}" in 2025.

IMPORTANT: Return ONLY a JSON array. Start your response with [ and end with ]. Nothing else before or after.

[
  {
    "rank": ${startRank},
    "name": "Product Name",
    "category": "${category.split(' ')[0]}",
    "emoji": "📦",
    "trend": "Hot",
    "score": 90,
    "margin": "25",
    "sellPrice": "39.99",
    "why": "Why this product wins right now.",
    "audience": "Who to target with ads",
    "trendScore": 88,
    "competitionScore": 45,
    "profitScore": 85,
    "hooks": ["Hook 1", "Hook 2", "Hook 3"]
  }
]

Rules:
- trend: "Hot", "Rising", or "Cooling" only
- margin and sellPrice: numbers only, no $ sign
- ranks go from ${startRank} to ${startRank + 9}
- Start immediately with [ — no intro text`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const text = data.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('') || '';

    return res.status(200).json({ text, batch });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
