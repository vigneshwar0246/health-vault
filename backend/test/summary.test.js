const { inferConditions, computeAlertLevel } = require('../lib/summaryGenerator');

test('infer hypertension and diabetes and alert level', () => {
  const parsed = {
    blood_pressure: { systolic: 150, diastolic: 95 },
    glucose: { value: 180, unit: 'mg/dL' },
    bmi: 28,
    ldl: 140,
    hemoglobin: { value: 11 }
  };

  const inferred = inferConditions(parsed);
  expect(inferred.conditions.length).toBeGreaterThan(0);
  const level = computeAlertLevel(inferred.flags);
  expect(level).toBe('yellow');
});
