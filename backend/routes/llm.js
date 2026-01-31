const express = require('express');
const router = express.Router();

// Require auth middleware from reports route (simple copy)
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

const { generateWithVertex } = require('../lib/vertexSummarizer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for temporary chat file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// POST /api/llm/chat
// Body: { prompt: string, temperature?: number, maxOutputTokens?: number }
// File: optional file upload
router.post('/chat', auth, upload.single('file'), async (req, res) => {
  try {
    const { prompt, temperature, maxOutputTokens } = req.body;
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt is required' });

    const options = {};
    if (temperature) options.temperature = parseFloat(temperature);
    if (maxOutputTokens) options.maxOutputTokens = parseInt(maxOutputTokens, 10);

    // Handle file if present
    if (req.file) {
      options.file = {
        mimeType: req.file.mimetype,
        data: req.file.buffer.toString('base64')
      };
    }

    const text = await generateWithVertex(prompt, options);

    // simple response
    res.json({ text });
  } catch (err) {
    console.error('LLM chat error:', err);
    res.status(500).json({ error: err.message || 'LLM generation failed' });
  }
});

// DEVELOPMENT: unauthenticated demo chat route for quick local preview
// Only available in non-production to help preview UI without Vertex credentials
if (process.env.NODE_ENV !== 'production') {
  router.post('/chat-demo', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt is required' });

      // A simple canned response mimicking an LLM
      const demoText = `Demo response: I received your prompt (${prompt.slice(0, 120)}) and can respond here. Replace with /api/llm/chat when authenticated.`;
      res.json({ text: demoText });
    } catch (err) {
      console.error('LLM demo error:', err);
      res.status(500).json({ error: 'Demo chat failed' });
    }
  });
}

module.exports = router;
