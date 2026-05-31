import request from 'supertest';
import app from '../app.js';

// ─── Health Check ─────────────────────────────────────────────────────────────
// Vérifie que le serveur répond correctement sur la route de santé.
describe('GET /health', () => {
  it('retourne 200 avec status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ecotrack-api');
  });
});
