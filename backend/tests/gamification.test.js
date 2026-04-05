import request from 'supertest';
import app from '../app.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /gamification
// Votre route réelle : authMiddleware + vérifie que l'utilisateur existe
// Retourne ou crée { points, level, badges } pour l'user connecté
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /gamification', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/gamification');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Token manquant');
  });

  it('retourne 401 avec token invalide', async () => {
    const res = await request(app)
      .get('/gamification')
      .set('Authorization', 'Bearer tokenbidon');
    expect(res.statusCode).toBe(401);
  });

  it('retourne 401 avec token malformé (sans Bearer)', async () => {
    const res = await request(app)
      .get('/gamification')
      .set('Authorization', 'tokenbidon');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /agents
// Votre route réelle : ADMIN uniquement
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /agents', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/agents');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/admin
// Votre route réelle : ADMIN uniquement → { agents, containers, tournees, signalements }
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /dashboard/admin', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/dashboard/admin');
    expect(res.statusCode).toBe(401);
  });

  it('retourne 401 avec token invalide', async () => {
    const res = await request(app)
      .get('/dashboard/admin')
      .set('Authorization', 'Bearer tokenbidon');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /missions
// Votre route réelle : ADMIN ou MANAGER uniquement
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /missions', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/missions');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /missions/mes-missions
// Votre route réelle : authMiddleware (tous les rôles)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /missions/mes-missions', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/missions/mes-missions');
    expect(res.statusCode).toBe(401);
  });
});
