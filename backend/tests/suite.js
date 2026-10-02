const assert = require('assert');
const path = require('path');

// Set DATA_PATH environment variable for testing
process.env.DATA_PATH = path.resolve(__dirname, '..', '..', 'data');

const { calculateRisk, getRiskLevel, DEFAULT_WEIGHTS } = require('../src/services/riskEngine');
const { getProjects, getParcels, getParcelById, searchParcels } = require('../src/services/dataService');
const { getStatistics } = require('../src/services/statisticsService');

async function runTests() {
  console.log('--- BhumiDrishti Comprehensive Test Suite ---');
  let passed = 0;
  let failed = 0;

  function it(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  async function itAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Risk Engine Tests
  it('Risk Engine: assigns correct levels for scores', () => {
    assert.strictEqual(getRiskLevel(15), 'Low');
    assert.strictEqual(getRiskLevel(40), 'Medium');
    assert.strictEqual(getRiskLevel(65), 'High');
    assert.strictEqual(getRiskLevel(90), 'Critical');
  });

  it('Risk Engine: calculates 0 for all zero factors', () => {
    const factors = { ownership_risk: 0, legal_risk: 0, compensation_risk: 0, environmental_risk: 0, social_risk: 0, delay_risk: 0 };
    const res = calculateRisk(factors);
    assert.strictEqual(res.score, 0);
    assert.strictEqual(res.level, 'Low');
  });

  it('Risk Engine: calculates 100 for all max factors', () => {
    const factors = { ownership_risk: 10, legal_risk: 10, compensation_risk: 10, environmental_risk: 10, social_risk: 10, delay_risk: 10 };
    const res = calculateRisk(factors);
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.level, 'Critical');
    assert.strictEqual(res.breakdown.length, 6);
  });

  it('Risk Engine: explainable breakdown matches contributions', () => {
    const factors = { ownership_risk: 10, legal_risk: 10, compensation_risk: 0, environmental_risk: 0, social_risk: 0, delay_risk: 0 };
    const res = calculateRisk(factors);
    // legal = (10/10)*0.25*100 = 25, ownership = (10/10)*0.20*100 = 20
    assert.strictEqual(res.score, 45);
    assert.strictEqual(res.level, 'Medium');
    const legal = res.breakdown.find(b => b.factor === 'legal_risk');
    assert.strictEqual(legal.contribution, 25);
    const ownership = res.breakdown.find(b => b.factor === 'ownership_risk');
    assert.strictEqual(ownership.contribution, 20);
  });

  // 2. Data Service Tests
  await itAsync('Data Service: loads projects correctly from storage', async () => {
    const projects = await getProjects();
    assert.ok(Array.isArray(projects), 'Projects should be an array');
    assert.ok(projects.length >= 3, `Expected at least 3 projects, got ${projects.length}`);
    const nh44 = projects.find(p => p.id === 'NH44');
    assert.ok(nh44, 'NH44 project should exist');
    assert.strictEqual(nh44.name, 'NH-44 Expressway Corridor');
  });

  await itAsync('Data Service: loads 540 parcels from storage', async () => {
    const parcels = await getParcels();
    assert.ok(Array.isArray(parcels), 'Parcels should be an array');
    assert.strictEqual(parcels.length, 540, `Expected 540 parcels, got ${parcels.length}`);
  });

  await itAsync('Data Service: fetches parcel by ID', async () => {
    const parcel = await getParcelById('NH44-001');
    assert.ok(parcel, 'NH44-001 parcel should exist');
    assert.strictEqual(parcel.id, 'NH44-001');
    assert.ok(typeof parcel.latitude === 'number');
    assert.ok(typeof parcel.longitude === 'number');
    assert.ok(parcel.risk_score >= 0 && parcel.risk_score <= 100);
  });

  await itAsync('Data Service: searches parcels by keyword', async () => {
    const results = await searchParcels('Nagpur');
    assert.ok(results.length > 0, 'Should return parcels in Nagpur');
    results.forEach(p => {
      assert.ok(p.district === 'Nagpur' || p.project_name.includes('Nagpur') || p.id.includes('NH44'));
    });
  });

  await itAsync('Data Service: filters parcels by risk level', async () => {
    const critical = await searchParcels('', { risk_level: 'Critical' });
    assert.ok(critical.length > 0, 'Should find Critical risk parcels');
    critical.forEach(p => assert.strictEqual(p.risk_level, 'Critical'));
  });

  // 3. Statistics Service Tests
  await itAsync('Statistics Service: computes accurate aggregated metrics', async () => {
    const stats = await getStatistics();
    assert.strictEqual(stats.total_projects, 3);
    assert.strictEqual(stats.total_parcels, 540);
    assert.ok(stats.total_area_hectares > 0);
    assert.ok(stats.risk_distribution.Critical > 0);
    assert.ok(stats.risk_distribution.High > 0);
    assert.ok(stats.risk_distribution.Medium > 0);
    assert.ok(stats.risk_distribution.Low > 0);
    const sumRisks = stats.risk_distribution.Low + stats.risk_distribution.Medium + stats.risk_distribution.High + stats.risk_distribution.Critical;
    assert.strictEqual(sumRisks, 540, 'Risk distribution sum should equal total parcels');
    assert.strictEqual(stats.by_project.length, 3);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
