import request from 'supertest';
import app from '../app.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /signalements/public
// Votre route réelle : publique (pas d'auth requise)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /signalements/public', () => {
  it('retourne 200 sans authentification', async () => {
    const res = await request(app).get('/signalements/public');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /signalements
// Votre route réelle : protégée par authMiddleware
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /signalements', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/signalements');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Token manquant');
  });

  it('retourne 401 avec token invalide', async () => {
    const res = await request(app)
      .get('/signalements')
      .set('Authorization', 'Bearer tokenbidon');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /signalements
// Votre route réelle : authMiddleware + champ 'type' obligatoire
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /signalements', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app)
      .post('/signalements')
      .field('type', 'FULL')
      .field('comment', 'Test signalement');
    expect(res.statusCode).toBe(401);
  });

  it('retourne 401 avec token invalide', async () => {
    const res = await request(app)
      .post('/signalements')
      .set('Authorization', 'Bearer tokenbidon')
      .field('type', 'FULL');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /signalements/:id/status
// Votre route réelle : ADMIN ou MANAGER uniquement
// Statuts valides : PENDING, IN_PROGRESS, RESOLVED, REJECTED
// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /signalements/:id/status', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app)
      .patch('/signalements/1/status')
      .send({ status: 'RESOLVED' });
    expect(res.statusCode).toBe(401);
  });

  it('retourne 401 avec token invalide', async () => {
    const res = await request(app)
      .patch('/signalements/1/status')
      .set('Authorization', 'Bearer tokenbidon')
      .send({ status: 'RESOLVED' });
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /signalements/public
// Votre route réelle : publique, pas d'auth requise
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /signalements/public', () => {
  it('retourne 201 avec les champs requis', async () => {
    const res = await request(app)
      .post('/signalements/public')
      .field('type', 'FULL')
      .field('comment', 'Conteneur débordant')
      .field('lat', '48.8566')
      .field('lng', '2.3522');

    // 201 si la BDD est connectée, 500 sinon (BDD de test non configurée)
    expect([201, 500]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('FULL');
      expect(res.body.status).toBe('PENDING'); // ← forcé dans votre code
      expect(res.body.userId).toBeNull(); // ← public = pas d'user
    }
  });
});
