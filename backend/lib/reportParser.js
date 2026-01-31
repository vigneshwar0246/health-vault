const fs = require('fs');
const pdf = require('pdf-parse');
const { createWorker } = require('tesseract.js');

const runPdfParse = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text || '';
  } catch (err) {
    return '';
  }
};

const runOCR = async (filePath) => {
  const worker = createWorker({});
  try {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(filePath);
    return text || '';
  } finally {
    await worker.terminate();
  }
};

const extractKeyValues = (text) => {
  const parsed = {};
  const t = text.replace(/\r/g, '\n');

  // Blood pressure e.g., 120/80 mmHg
  const bpMatch = t.match(/(blood pressure|bp)[:\s]*([0-9]{2,3})\s*\/?\s*([0-9]{2,3})/i) || t.match(/([0-9]{2,3})\s*\/\s*([0-9]{2,3})\s*mmHg/i);
  if (bpMatch) {
    parsed.blood_pressure = {
      systolic: Number(bpMatch[2] || bpMatch[1]),
      diastolic: Number(bpMatch[3] || bpMatch[2]),
      unit: 'mmHg'
    };
  }

  // Hemoglobin / Hb
  const hb = t.match(/(?:hemoglobin|hb)[:\s]*([0-9]+\.?[0-9]*)\s*(g\/dL)?/i);
  if (hb) parsed.hemoglobin = { value: Number(hb[1]), unit: hb[2] || 'g/dL' };

  // Glucose
  const glucose = t.match(/(?:glucose|blood sugar|sugar)[:\s]*([0-9]+\.?[0-9]*)\s*(mg\/?dL|mmol\/L)?/i);
  if (glucose) parsed.glucose = { value: Number(glucose[1]), unit: glucose[2] || 'mg/dL' };

  // Cholesterol / LDL / HDL / Triglycerides
  const chol = t.match(/(?:cholesterol)[:\s]*([0-9]+\.?[0-9]*)\s*(mg\/?dL)?/i);
  if (chol) parsed.cholesterol = { value: Number(chol[1]), unit: chol[2] || 'mg/dL' };
  const ldl = t.match(/(?:ldl)[:\s]*([0-9]+\.?[0-9]*)/i);
  if (ldl) parsed.ldl = Number(ldl[1]);
  const hdl = t.match(/(?:hdl)[:\s]*([0-9]+\.?[0-9]*)/i);
  if (hdl) parsed.hdl = Number(hdl[1]);
  const tg = t.match(/(?:triglycerides|triglyceride|tg)[:\s]*([0-9]+\.?[0-9]*)/i);
  if (tg) parsed.triglycerides = Number(tg[1]);

  // Creatinine
  const cr = t.match(/(?:creatinine)[:\s]*([0-9]+\.?[0-9]*)\s*(mg\/?dL)?/i);
  if (cr) parsed.creatinine = { value: Number(cr[1]), unit: cr[2] || 'mg/dL' };

  // Weight and BMI
  const weight = t.match(/(?:weight)[:\s]*([0-9]+\.?[0-9]*)\s*(kg|kgs|lb|lbs)?/i);
  if (weight) parsed.weight = { value: Number(weight[1]), unit: (weight[2] || 'kg').toLowerCase() };
  const bmi = t.match(/(?:bmi)[:\s]*([0-9]+\.?[0-9]*)/i);
  if (bmi) parsed.bmi = Number(bmi[1]);

  return parsed;
};

async function parseReportFromFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  let text = await runPdfParse(buffer);

  // If text is absent or too short, fall back to OCR
  if (!text || text.trim().length < 50) {
    text = await runOCR(filePath);
  }

  const parsedData = extractKeyValues(text || '');

  return { text, parsedData };
}

module.exports = { parseReportFromFile, extractKeyValues };
