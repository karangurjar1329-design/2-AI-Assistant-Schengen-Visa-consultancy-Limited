import { getMetrics } from './_shared';
export default async function handler(_req, res) {
  const m = getMetrics();
  const { leads, conversions } = m.counts;
  const avgFR = (m.firstResponseTimes.reduce((a,b)=>a+b,0) / (m.firstResponseTimes.length || 1)) || 0;
  const csatAvg = (m.csatScores.reduce((a,b)=>a+b,0) / (m.csatScores.length || 1)) || 0;
  const conversionRate = leads > 0 ? conversions / leads : 0;
  res.status(200).json({
    since: m.since,
    counts: m.counts,
    kpis: {
      leads_per_day: { current: leads, target: null },
      conversion_rate: { current: conversionRate, target: null },
      first_response_ms: { current: avgFR, target: null },
      csat_avg: { current: csatAvg, target: null }
    },
    logs: m.logs.slice(-50)
  });
}
