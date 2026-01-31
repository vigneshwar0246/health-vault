jest.mock('google-auth-library', () => {
  return { GoogleAuth: jest.fn().mockImplementation(() => ({ getClient: async () => ({ getAccessToken: async () => ({ token: 'fake-token' }) }) })) };
});

const fetch = require('node-fetch');
jest.mock('node-fetch');

const { validateVertex } = require('../lib/vertexSummarizer');

describe('vertexSummarizer.validateVertex', () => {
  beforeEach(() => {
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.VERTEX_LOCATION = 'us-central1';
    process.env.VERTEX_MODEL = 'chat-bison@001';
  });

  afterEach(() => {
    delete process.env.GCP_PROJECT_ID;
    delete process.env.VERTEX_LOCATION;
    delete process.env.VERTEX_MODEL;
    jest.clearAllMocks();
  });

  test('succeeds when access token and model endpoint respond ok', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' });
    const res = await validateVertex();
    expect(res).toEqual({ ok: true, modelAvailable: true });
  });

  test('throws when GCP_PROJECT_ID missing', async () => {
    delete process.env.GCP_PROJECT_ID;
    await expect(validateVertex()).rejects.toThrow('GCP_PROJECT_ID is not set');
  });

  test('throws when model endpoint returns error', async () => {
    fetch.mockResolvedValue({ ok: false, status: 403, text: async () => 'forbidden' });
    await expect(validateVertex()).rejects.toThrow(/Vertex model check failed/);
  });
});