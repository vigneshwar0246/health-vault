const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');

// Middleware - touch to trigger restart
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthhub')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/family', require('./routes/family'));
app.use('/api/vitals', require('./routes/vitals'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/symptoms', require('./routes/symptoms'));
app.use('/api/doctor-notes', require('./routes/doctorNotes'));
// Translate (generic)
app.use('/api/translate', require('./routes/translate'));

// LLM endpoints (Gemini / Vertex) for chat and LLM operations
app.use('/api/llm', require('./routes/llm'));

// Export endpoints (merge PDFs, generate combined exports)
app.use('/api/export', require('./routes/export'));

// Internal endpoints for diagnostics (no secrets are leaked)
app.use('/api/internal', require('./routes/internal'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Health Hub Backend is running' });
});

// Background worker: process pending LLM jobs every 10 seconds
const processLLMJobs = async () => {
  try {
    const LLMJob = require('./models/LLMJob');
    const job = await LLMJob.findOneAndUpdate({ status: 'pending' }, { status: 'processing' });
    if (!job) return;

    console.log('Processing LLM job:', job._id.toString());

    const report = await require('./models/MedicalReport').findById(job.reportId);
    if (!report) {
      job.status = 'failed';
      job.error = 'Original report not found';
      await job.save();
      return;
    }

    try {
      const { generateWithVertex } = require('./lib/vertexSummarizer');
      const { generateSummaryAndPDF } = require('./lib/summaryGenerator');

      // Build prompt with parsedData and originalText (truncate if too long)
      let prompt = 'You are a helpful medical summarizer. Given the following report text and parsed labs, produce a concise patient-friendly summary (2-4 sentences), a short list of possible conditions, and recommendations to consult a clinician. Do not provide definitive diagnoses.' + '\n\n';
      if (report.parsedData) prompt += 'Parsed labs: ' + JSON.stringify(report.parsedData) + '\n\n';
      if (report.originalText) {
        const textSnippet = report.originalText.length > 5000 ? report.originalText.slice(0, 5000) + '\n...[truncated]' : report.originalText;
        prompt += 'Extracted text: ' + textSnippet + '\n\n';
      }

      const llmText = await generateWithVertex(prompt, { temperature: 0.2, maxOutputTokens: 800 });

      // Use LLM text as summaryText in PDF generation
      const member = await require('./models/FamilyMember').findById(report.memberId);
      const result = await generateSummaryAndPDF({ report, member, summaryText: llmText });

      // Create a new MedicalReport entry for the generated summary PDF
      const newReport = new (require('./models/MedicalReport'))({
        memberId: report.memberId,
        title: `LLM Summary: ${report.title}`,
        type: 'other',
        date: new Date(),
        fileUrl: `/uploads/${result.fileName}`,
        fileType: 'application/pdf',
        notes: llmText,
        parsedData: { llmSummary: true, alertLevel: result.alertLevel, inferred: result.inferred }
      });
      await newReport.save();

      job.status = 'done';
      job.resultReportId = newReport._id;
      await job.save();

      // Log activity
      await require('./models/ActivityLog').create({
        userId: job.userId,
        action: 'create',
        entityType: 'report',
        entityId: newReport._id.toString(),
        description: `Generated LLM summary for report: ${report.title}`
      });

      console.log('LLM job completed:', job._id.toString());
    } catch (err) {
      console.error('LLM job processing error:', err);
      job.status = 'failed';
      job.error = err.message || String(err);
      await job.save();
    }
  } catch (err) {
    console.error('Error in LLM job processor:', err);
  }
};

setInterval(processLLMJobs, 10000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});