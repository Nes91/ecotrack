import request from 'supertest';
import app from '../app.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /containers
// Votre route réelle : protégée par authMiddleware (tous les rôles)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /containers', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/containers');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Token manquant');
  });

  it('retourne 401 avec token invalide', async () => {
    const res = await request(app)
      .get('/containers')
      .set('Authorization', 'Bearer tokenbidon');
    expect(res.statusCode).toBe(401);
  });

  it('retourne 401 sans "Bearer" dans le header', async () => {
    const res = await request(app)
      .get('/containers')
      .set('Authorization', 'tokenbidon');
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /containers
// Votre route réelle : ADMIN ou MANAGER uniquement + validate(createContainerSchema)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /containers', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app)
      .post('/containers')
      .send({ type: 'RECYCLABLE', capacity: 500, zone: 'Centre' });
    expect(res.statusCode).toBe(401);
  });

  it('retourne 401 avec token invalide', async () => {
    const res = await request(app)
      .post('/containers')
      .set('Authorization', 'Bearer tokenbidon')
      .send({ type: 'RECYCLABLE', capacity: 500, zone: 'Centre' });
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /containers/:id
// Votre route réelle : ADMIN ou MANAGER uniquement
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /containers/:id', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app)
      .put('/containers/1')
      .send({ fillLevel: 80 });
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /containers/:id
// Votre route réelle : ADMIN ou MANAGER uniquement
// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /containers/:id', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app)
      .delete('/containers/999');
    expect(res.statusCode).toBe(401);
  });
});
