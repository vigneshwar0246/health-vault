const fetch = global.fetch || require('node-fetch');

async function translateWithGoogle(text, target, apiKey) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const body = new URLSearchParams();
  body.append('q', text);
  body.append('target', target);
  body.append('format', 'text');

  const res = await fetch(url, { method: 'POST', body });
  const json = await res.json();
  if (json && json.data && json.data.translations && json.data.translations[0]) return json.data.translations[0].translatedText;
  throw new Error('Google translate error: ' + JSON.stringify(json));
}

async function translateWithLibre(text, target) {
  const hosts = ['https://libretranslate.de/translate', 'https://translate.argosopentech.com/translate'];
  let lastErr = null;

  for (const url of hosts) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'auto', target, format: 'text' })
      });

      // If service returned non-JSON (e.g., HTML error page), read as text and surface useful error
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`LibreTranslate (${url}) returned status ${res.status}: ${txt.slice(0,200)}`);
      }

      if (!contentType.includes('application/json')) {
        const txt = await res.text();
        throw new Error(`LibreTranslate (${url}) returned non-JSON response: ${txt.slice(0,200)}`);
      }

      const json = await res.json();
      if (json && json.translatedText) return json.translatedText;
      throw new Error(`LibreTranslate (${url}) error: ${JSON.stringify(json)}`);
    } catch (err) {
      lastErr = err;
      console.warn('LibreTranslate host failed, trying next host if available:', url, err.message || err);
      continue;
    }
  }

  throw lastErr || new Error('LibreTranslate: all hosts failed');
}

async function translateText(text, targetLang) {
  if (!text) return '';
  const provider = process.env.TRANSLATE_PROVIDER || 'libre';
  try {
    if (provider === 'google' && process.env.TRANSLATE_API_KEY) {
      return await translateWithGoogle(text, targetLang, process.env.TRANSLATE_API_KEY);
    }
    return await translateWithLibre(text, targetLang);
  } catch (err) {
    console.error('Translation error:', err.message || err);
    throw err;
  }
}

// Translate parsedData keys (top-level only) using a translator function that returns translated text for labels
async function translateParsedData(parsedData, translateFn) {
  if (!parsedData || typeof parsedData !== 'object') return {};
  const entries = Object.entries(parsedData);
  const keys = entries.map(([k]) => k);

  // Translate keys in bulk by joining with delimiter to minimize requests
  const delimiter = ' ||| ';
  const joined = keys.join(delimiter);
  const translatedJoined = await translateFn(joined);
  const translatedKeys = translatedJoined.split(delimiter).map(s => s.trim());

  const translated = {};
  for (let i = 0; i < entries.length; i++) {
    const [origKey, val] = entries[i];
    const tKey = translatedKeys[i] || origKey;
    // If value is a string, translate the value too
    if (typeof val === 'string') {
      try {
        translated[tKey] = await translateFn(val);
      } catch (e) {
        translated[tKey] = val;
      }
    } else {
      translated[tKey] = val;
    }
  }

  return translated;
}

module.exports = { translateText, translateParsedData };
