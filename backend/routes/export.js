const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Simple auth reuse
const jwt = require('jsonwebtoken');
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/export/generate
// body: { memberId: string, options: { includeReports: boolean, includeReportFiles: boolean, includeVitals, etc. } }
router.post('/generate', auth, async (req, res) => {
  try {
    const { memberId, options } = req.body;

    // We allow memberId to be null to generate exports for all members
    // We don't have a central storage module on backend, so read members and reports from DB
    const FamilyMember = require('../models/FamilyMember');
    const MedicalReport = require('../models/MedicalReport');

    const members = memberId ? [await FamilyMember.findById(memberId)] : await FamilyMember.find();
    if (!members || members.length === 0) return res.status(404).json({ error: 'No members found' });

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    for (const member of members) {
      // Add a cover page with member summary
      const page = mergedPdf.addPage();
      const { width, height } = page.getSize();
      const font = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
      page.drawText(`Health Export for ${member.name}`, { x: 50, y: height - 80, size: 24, font });

      page.drawText(`Date of Birth: ${member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A'}`, { x: 50, y: height - 110, size: 12 });
      page.drawText(`Generated: ${new Date().toLocaleString()}`, { x: 50, y: height - 130, size: 10, color: rgb(0.4,0.4,0.4) });

      // Optionally append each report's original PDF if available
      if (options?.includeReportFiles && options?.includeReports) {
        const reports = await MedicalReport.find({ memberId: member._id });
        for (const rep of reports) {
          if (!rep.fileUrl) continue;
          // fileUrl like /uploads/<filename>
          const filename = path.basename(rep.fileUrl);
          const filePath = path.join(__dirname, '..', 'uploads', filename);
          if (!fs.existsSync(filePath)) continue;

          const bytes = fs.readFileSync(filePath);
          try {
            const donorPdf = await PDFDocument.load(bytes);
            const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
            copiedPages.forEach(p => mergedPdf.addPage(p));
          } catch (err) {
            // If failing to load as PDF (e.g., image), create a page with a link/note
            const p = mergedPdf.addPage();
            p.drawText(`Could not embed report file: ${filename}`, { x: 50, y: height - 50, size: 12, color: rgb(1,0,0) });
          }
        }
      }

      // Add a separator page between members
      if (members.indexOf(member) < members.length - 1) {
        mergedPdf.addPage();
      }
    }

    const mergedBytes = await mergedPdf.save();

    const outName = `export-${memberId}-${Date.now()}.pdf`;
    const outPath = path.join(__dirname, '..', 'uploads', outName);
    fs.writeFileSync(outPath, mergedBytes);

    res.json({ fileUrl: `/uploads/${outName}` });
  } catch (err) {
    console.error('Export generate error:', err);
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

module.exports = router;
