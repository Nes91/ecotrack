import request from 'supertest';
import app from '../app.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /routes
// Votre route réelle : ADMIN, MANAGER ou AGENT uniquement
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /routes', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/routes');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Token manquant');
  });

  it('retourne 401 avec token invalide', async () => {
    const res = await request(app)
      .get('/routes')
      .set('Authorization', 'Bearer tokenbidon');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /routes/optimize
// Votre route réelle : ADMIN ou MANAGER uniquement + depot (lat/lng) obligatoire
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /routes/optimize', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app)
      .post('/routes/optimize')
      .send({ depot: { lat: 48.8566, lng: 2.3522 } });
    expect(res.statusCode).toBe(401);
  });

  it('retourne 401 avec token invalide', async () => {
    const res = await request(app)
      .post('/routes/optimize')
      .set('Authorization', 'Bearer tokenbidon')
      .send({ depot: { lat: 48.8566, lng: 2.3522 } });
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /routes/:id
// Votre route réelle : ADMIN ou MANAGER uniquement
// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /routes/:id', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).delete('/routes/999');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /tournees (votre ancienne route, doublonnée avec /routes)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /tournees', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/tournees');
    expect(res.statusCode).toBe(401);
  });
});
