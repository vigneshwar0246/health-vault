const { translateParsedData } = require('../lib/translator');

// Fake translator that prefixes "TA:" to each string
const fakeTranslator = async (text) => {
  return `TA:${text}`;
};

test('translateParsedData maps keys and string values using translator function', async () => {
  const parsed = {
    blood_pressure: { systolic: 120, diastolic: 80 },
    hemoglobin: '13.2 g/dL',
    glucose: 95
  };

  const res = await translateParsedData(parsed, fakeTranslator);

  // Keys should be translated (prefixed)
  expect(Object.keys(res).some(k => k.startsWith('TA:'))).toBe(true);
  // Numeric values should be preserved
  const vals = Object.values(res);
  expect(vals.some(v => typeof v === 'object' && v.systolic === 120)).toBe(true);
  // String value should be translated
  expect(Object.values(res).some(v => typeof v === 'string' && v.startsWith('TA:'))).toBe(true);
});
