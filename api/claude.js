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
 
IMPORTANT PRICING RULES — follow these exactly:
- sourcingPrice: what you buy it for on AliExpress (e.g. 8.99)
- sellPrice: what you sell it for to customers — MUST be higher than sourcingPrice (e.g. 34.99)
- margin: sellPrice minus sourcingPrice — MUST be a positive number less than sellPrice (e.g. 26.00)
 
Example: sourcingPrice=8.99, sellPrice=34.99, margin=26.00 ✓
Never: margin=55, sellPrice=24.99 ✗ (margin cannot be higher than sell price)
 
Return ONLY a JSON array starting with [ and ending with ]. No markdown, no text before or after:
 
[
  {
    "rank": ${startRank},
    "name": "Exact Product Name",
    "category": "${category.split(' ')[0]}",
    "trend": "Hot",
    "score": 90,
    "sourcingPrice": "8.99",
    "sellPrice": "34.99",
    "margin": "26.00",
    "why": "One sentence why this product is winning right now.",
    "audience": "Specific target audience for ads",
    "trendScore": 88,
    "competitionScore": 45,
    "profitScore": 85,
    "hooks": [
      "Hook 1 — curiosity angle",
      "Hook 2 — problem/solution angle",
      "Hook 3 — social proof or urgency"
    ]
  }
]
 
Rules:
- trend: exactly "Hot", "Rising", or "Cooling"
- All prices: numbers only, no dollar sign
- sellPrice must ALWAYS be greater than sourcingPrice
- margin = sellPrice - sourcingPrice exactly
- ranks go from ${startRank} to ${startRank + 9}
- Real products trending in 2025`;
 
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
 
