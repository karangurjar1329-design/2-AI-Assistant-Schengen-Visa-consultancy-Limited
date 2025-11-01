export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'messages must be an array of {role, content}' });
      return;
    }
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      res.status(resp.status).json({ error: 'OpenAI API error', details: errText });
      return;
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    res.status(200).json({ content });
  } catch (e) {
    res.status(500).json({ error: 'Server error', details: String(e) });
  }
}
