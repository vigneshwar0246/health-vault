const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const MedicalReport = require('../models/MedicalReport');
const ActivityLog = require('../models/ActivityLog');
const VitalReading = require('../models/VitalReading');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseReportFromFile } = require('../lib/reportParser');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get reports for a member
router.get('/:memberId', auth, async (req, res) => {
  try {
    const reports = await MedicalReport.find({ memberId: req.params.memberId })
      .sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Multer setup for file uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Upload and parse a medical report file (PDF / image)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const memberId = req.body.memberId;
    if (!memberId) return res.status(400).json({ error: 'memberId is required' });

    const filePath = req.file.path;
    const { text, parsedData } = await parseReportFromFile(filePath);

    const report = new MedicalReport({
      memberId,
      title: req.body.title || req.file.originalname,
      type: req.body.type || 'lab',
      date: req.body.date ? new Date(req.body.date) : new Date(),
      fileUrl: `/uploads/${path.basename(filePath)}`,
      fileType: req.file.mimetype,
      notes: req.body.notes || '',
      parsedData,
      originalText: text,
    });

    await report.save();

    // Convert parsed labs into vital readings where possible
    const vitalsToCreate = [];
    if (parsedData) {
      if (parsedData.blood_pressure) {
        vitalsToCreate.push({
          memberId,
          type: 'blood_pressure',
          value: parsedData.blood_pressure.systolic,
          secondaryValue: parsedData.blood_pressure.diastolic,
          unit: parsedData.blood_pressure.unit || 'mmHg',
          recordedAt: report.date,
          notes: 'Imported from report'
        });
      }
      if (parsedData.glucose) {
        vitalsToCreate.push({
          memberId,
          type: 'blood_sugar',
          value: parsedData.glucose.value,
          unit: parsedData.glucose.unit || 'mg/dL',
          recordedAt: report.date,
          notes: 'Imported from report'
        });
      }
      if (parsedData.weight) {
        vitalsToCreate.push({
          memberId,
          type: 'weight',
          value: parsedData.weight.value,
          unit: parsedData.weight.unit || 'kg',
          recordedAt: report.date,
          notes: 'Imported from report'
        });
      }
      if (parsedData.hemoglobin) {
        vitalsToCreate.push({
          memberId,
          type: 'custom',
          value: parsedData.hemoglobin.value,
          unit: parsedData.hemoglobin.unit || 'g/dL',
          recordedAt: report.date,
          notes: 'Hemoglobin from report',
        });
      }
      if (parsedData.creatinine) {
        vitalsToCreate.push({
          memberId,
          type: 'custom',
          value: parsedData.creatinine.value,
          unit: parsedData.creatinine.unit || 'mg/dL',
          recordedAt: report.date,
          notes: 'Creatinine from report',
        });
      }
      if (typeof parsedData.bmi !== 'undefined') {
        vitalsToCreate.push({
          memberId,
          type: 'bmi',
          value: parsedData.bmi,
          unit: '',
          recordedAt: report.date,
          notes: 'BMI from report'
        });
      }
    }

    if (vitalsToCreate.length > 0) {
      await VitalReading.insertMany(vitalsToCreate);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'report',
      entityId: report._id.toString(),
      description: `Uploaded medical report: ${report.title}`
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// Generate a rule-based summarized PDF from a report and store as new MedicalReport
router.post('/:id/summarize', auth, async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const member = await (require('../models/FamilyMember')).findById(report.memberId);

    const { generateSummaryAndPDF } = require('../lib/summaryGenerator');

    const result = await generateSummaryAndPDF({ report, member });

    const newReport = new MedicalReport({
      memberId: report.memberId,
      title: `Summary: ${report.title}`,
      type: 'other',
      date: new Date(),
      fileUrl: `/uploads/${result.fileName}`,
      fileType: 'application/pdf',
      notes: result.summaryText,
      parsedData: { summary: true, alertLevel: result.alertLevel, inferred: result.inferred }
    });

    await newReport.save();

    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'report',
      entityId: newReport._id.toString(),
      description: `Generated summary PDF for report: ${report.title}`
    });

    res.status(201).json(newReport);
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Summarization failed' });
  }
});

// Translate a report's text and parsed data into target language (e.g., 'ta')
router.post('/:id/translate', auth, async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const { lang } = req.body;
    if (!lang) return res.status(400).json({ error: 'lang is required' });

    // Check cache
    report.translations = report.translations || {};
    if (report.translations[lang] && !req.body.force) {
      return res.json(report.translations[lang]);
    }

    const { translateText, translateParsedData } = require('../lib/translator');

    const translatedText = report.originalText ? await translateText(report.originalText, lang) : '';
    const translatedParsed = report.parsedData ? await translateParsedData(report.parsedData, async (t) => await translateText(t, lang)) : {};

    const payload = {
      text: translatedText,
      parsedData: translatedParsed,
      translatedAt: new Date()
    };

    report.translations[lang] = payload;
    await report.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'update',
      entityType: 'report',
      entityId: report._id.toString(),
      description: `Translated report ${report.title} to ${lang}`
    });

    res.json(payload);
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Queue an LLM summarization job (background) using Vertex AI (Gemini)
router.post('/:id/summarize-llm', auth, async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // Ensure user consent is provided in request
    const consent = req.body.consent === true;
    if (!consent) return res.status(400).json({ error: 'User consent required to send data to external LLM' });

    const LLMJob = require('../models/LLMJob');
    const job = new LLMJob({ reportId: report._id, userId: req.userId });
    await job.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'report',
      entityId: report._id.toString(),
      description: `Queued LLM summary job for report: ${report.title}`
    });

    res.status(202).json({ jobId: job._id, status: job.status, message: 'LLM summarization queued. Processing will occur in background.' });
  } catch (error) {
    console.error('LLM queue error:', error);
    res.status(500).json({ error: 'Failed to queue LLM summarization' });
  }
});

// Create medical report
router.post('/', auth, [
  body('memberId').isMongoId(),
  body('title').trim().isLength({ min: 1 }),
  body('type').isIn(['lab', 'imaging', 'prescription', 'discharge', 'other']),
  body('date').isISO8601(),
  body('fileUrl').trim().isLength({ min: 1 }),
  body('fileType').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const report = new MedicalReport(req.body);
    await report.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'report',
      entityId: report._id.toString(),
      description: `Added medical report: ${report.title}`
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update medical report
router.put('/:id', auth, async (req, res) => {
  try {
    const report = await MedicalReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Medical report not found' });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'update',
      entityType: 'report',
      entityId: report._id.toString(),
      description: `Updated medical report: ${report.title}`
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete medical report
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Medical report not found' });
    }

    await MedicalReport.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'delete',
      entityType: 'report',
      entityId: report._id.toString(),
      description: `Deleted medical report: ${report.title}`
    });

    res.json({ message: 'Medical report deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;