import { getMetrics, log } from './_shared';
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { type, value } = req.body || {};
  const m = getMetrics();
  switch (type) {
    case 'lead':
      m.counts.leads += 1; log({ type: 'lead' }); break;
    case 'conversion':
      m.counts.conversions += 1; log({ type: 'conversion' }); break;
    case 'csat':
      if (typeof value !== 'number' || value < 1 || value > 5) {
        res.status(400).json({ error: 'CSAT value must be 1..5' });
        return;
      }
      m.csatScores.push(value); log({ type: 'csat', value }); break;
    default:
      res.status(400).json({ error: 'Unknown event type' });
      return;
  }
  res.status(200).json({ ok: true });
}
