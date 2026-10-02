const DEFAULT_WEIGHTS = {
  ownership_risk: 0.20,
  legal_risk: 0.25,
  compensation_risk: 0.20,
  environmental_risk: 0.15,
  social_risk: 0.10,
  delay_risk: 0.10,
};

function getRiskLevel(score) {
  if (score <= 25) return 'Low';
  if (score <= 50) return 'Medium';
  if (score <= 75) return 'High';
  return 'Critical';
}

function formatLabel(factor) {
  return factor.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function generateSummary(score, breakdown) {
  if (!breakdown || breakdown.length === 0) return 'No risk factors evaluated.';
  const topFactor = breakdown[0];
  return `Overall risk is ${getRiskLevel(score)} (${score}/100). Primary driver is ${topFactor.label}.`;
}

function calculateRisk(factors, weights = DEFAULT_WEIGHTS) {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let score = 0;
  const breakdown = [];
  for (const [factor, weight] of Object.entries(weights)) {
    const raw = factors[factor] ?? 0;
    const contribution = (raw / 10) * weight * 100;
    score += contribution;
    breakdown.push({ factor, raw_value: raw, weight, contribution: Math.round(contribution * 10) / 10, label: formatLabel(factor) });
  }
  score = Math.min(100, Math.round(score));
  breakdown.sort((a, b) => b.contribution - a.contribution);
  return { score, level: getRiskLevel(score), breakdown, summary: generateSummary(score, breakdown) };
}

module.exports = { calculateRisk, getRiskLevel, DEFAULT_WEIGHTS };
