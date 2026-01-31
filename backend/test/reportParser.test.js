const { extractKeyValues } = require('../lib/reportParser');

test('extract lipids, glucose, bp and hemoglobin from text', () => {
  const sample = `Patient Name: John Doe\nBP: 128/82 mmHg\nHemoglobin: 13.5 g/dL\nFasting Glucose: 95 mg/dL\nCholesterol: 190 mg/dL\nLDL: 110\nHDL: 45\nTriglycerides: 120`;
  const parsed = extractKeyValues(sample);
  expect(parsed.blood_pressure).toBeDefined();
  expect(parsed.blood_pressure.systolic).toBe(128);
  expect(parsed.blood_pressure.diastolic).toBe(82);
  expect(parsed.hemoglobin.value).toBeCloseTo(13.5);
  expect(parsed.glucose.value).toBe(95);
  expect(parsed.cholesterol.value).toBe(190);
  expect(parsed.ldl).toBe(110);
  expect(parsed.hdl).toBe(45);
  expect(parsed.triglycerides).toBe(120);
});
