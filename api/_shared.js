let metrics = {
  since: new Date().toISOString(),
  counts: { leads: 0, conversions: 0, messages: 0 },
  firstResponseTimes: [],
  csatScores: [],
  logs: []
};
export function getMetrics() { return metrics; }
export function log(entry) {
  metrics.logs.push({ t: new Date().toISOString(), ...entry });
  if (metrics.logs.length > 200) metrics.logs.shift();
}
