const express = require('express');
const router = express.Router();
const { validateVertex } = require('../lib/vertexSummarizer');

// Validate Vertex auth and (optionally) model availability
router.get('/vertex/validate', async (req, res) => {
  try {
    const result = await validateVertex();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Return masked env status (do not leak secrets)
router.get('/env/status', (req, res) => {
  const status = {
    hasGCPProject: !!process.env.GCP_PROJECT_ID,
    hasVertexModel: !!process.env.VERTEX_MODEL,
    hasVertexLocation: !!process.env.VERTEX_LOCATION,
    hasGoogleCredentialsPath: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    hasServiceAccountJson: !!process.env.GCP_SERVICE_ACCOUNT_JSON,
    hasGoogleTranslateKey: !!process.env.GOOGLE_TRANSLATE_API_KEY
  };
  res.json({ success: true, status });
});

module.exports = router;