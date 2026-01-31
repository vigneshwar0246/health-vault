const express = require('express');
const router = express.Router();
const { translateText } = require('../lib/translator');

// Translate a single text or an array of texts
// POST /api/translate
// body: { text: string } or { texts: string[] }, { lang: 'ta' }
router.post('/', async (req, res) => {
  try {
    const lang = req.body.lang || 'ta';
    if (req.body.text) {
      const translated = await translateText(req.body.text, lang);
      return res.json({ translated });
    }

    if (Array.isArray(req.body.texts)) {
      const texts = req.body.texts;
      // translate joined with delimiter to reduce requests
      const delimiter = ' ||| ';
      const joined = texts.join(delimiter);
      const translatedJoined = await translateText(joined, lang);
      const translated = translatedJoined.split(delimiter).map(s => s.trim());
      return res.json({ translated });
    }

    res.status(400).json({ error: 'text or texts is required' });
  } catch (error) {
    console.error('Translate endpoint error:', error);
    const message = error && error.message ? error.message : 'Translation failed';
    res.status(502).json({ error: 'Translation provider error', details: message });
  }
});

module.exports = router;
