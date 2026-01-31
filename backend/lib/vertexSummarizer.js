const { GoogleAuth } = require('google-auth-library');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use global fetch (Node 18+) or a local require if needed for old versions
const getFetch = () => {
  if (typeof fetch !== 'undefined') return fetch;
  try {
    return require('node-fetch');
  } catch (err) {
    throw new Error('fetch is not available. Please use Node 18+ or install node-fetch.');
  }
};

// Unified generation function: supports Gemini API Key (preferred) or Vertex AI (legacy/fallback)
async function generateWithVertex(prompt, options = {}) {
  // 1. Try Gemini API Key first
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({ model: modelName });

      const parts = [{ text: prompt }];

      // If a file is provided (e.g., from multer), add it as an inlineData part
      if (options.file) {
        parts.push({
          inlineData: {
            mimeType: options.file.mimeType,
            data: options.file.data // base64 string
          }
        });
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (err) {
      console.error('Gemini API generation failed:', err);
      throw new Error(`Gemini API Error: ${err.message}`);
    }
  }

  // 2. Fallback to Vertex AI if no Gemini Key
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const model = process.env.VERTEX_MODEL; // e.g., 'text-bison@001' or 'chat-bison@001'

  if (!project || !model) {
    throw new Error('Configuration missing: Provide GEMINI_API_KEY or (GCP_PROJECT_ID and VERTEX_MODEL)');
  }

  // Build endpoint
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;

  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token) throw new Error('Failed to get access token for Vertex');

  const body = {
    instances: [{ content: prompt }],
    parameters: {
      temperature: options.temperature || 0.2,
      maxOutputTokens: options.maxOutputTokens || 1024
    }
  };

  const fetch = getFetch();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.token || token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Vertex returned ${res.status}: ${txt.slice(0, 500)}`);
  }

  const json = await res.json();
  // Attempt to extract text depending on model response shape
  // Typical: json.predictions[0].content or json.predictions[0].text
  const pred = json.predictions && json.predictions[0];
  if (!pred) throw new Error('No prediction from Vertex');
  const text = pred.content || pred.output || pred.text || JSON.stringify(pred);
  return text;
}

async function validateVertex() {
  // Validate Gemini if Key is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const modelName = process.env.GEMINI_MODEL || 'gemini-pro';
      const model = genAI.getGenerativeModel({ model: modelName });
      // Simple generation to test
      const result = await model.generateContent("Hello");
      await result.response;
      return { ok: true, modelAvailable: true, provider: 'gemini' };
    } catch (err) {
      console.error("Gemini validation failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // Fallback to Vertex validation
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const model = process.env.VERTEX_MODEL;

  if (!project) throw new Error('GCP_PROJECT_ID is not set');

  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token) throw new Error('Unable to obtain access token from GoogleAuth');

  // If model specified, verify model metadata endpoint is reachable
  if (model) {
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}`;
    const fetch = getFetch();
    const res = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token.token || token}` } });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Vertex model check failed: ${res.status} ${txt.slice(0, 200)}`);
    }
    return { ok: true, modelAvailable: true, provider: 'vertex' };
  }

  return { ok: true, modelAvailable: false, provider: 'vertex' };
}

module.exports = { generateWithVertex, validateVertex };
