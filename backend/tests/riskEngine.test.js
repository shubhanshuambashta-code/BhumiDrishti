const { calculateRisk } = require('../src/services/riskEngine');
const factors = { ownership_risk: 8, legal_risk: 5, compensation_risk: 2, environmental_risk: 1, social_risk: 9, delay_risk: 4 };
const res = calculateRisk(factors);
console.log(res);
