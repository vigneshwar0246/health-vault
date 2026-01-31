const fs = require('fs');
const path = require('path');
const { generateSummaryAndPDF } = require('../lib/summaryGenerator');

test('generate pdf creates a file', async () => {
  const dummyReport = {
    title: 'Dummy Report',
    date: new Date().toISOString(),
    parsedData: {
      blood_pressure: { systolic: 150, diastolic: 95 },
      glucose: { value: 180, unit: 'mg/dL' }
    }
  };

  const dummyMember = { name: 'John Doe' };

  const res = await generateSummaryAndPDF({ report: dummyReport, member: dummyMember });
  expect(res.outPath).toBeDefined();
  expect(fs.existsSync(res.outPath)).toBe(true);

  // cleanup
  fs.unlinkSync(res.outPath);
});
