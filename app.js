// backend/app.js
// ⚠️ CE FICHIER est nécessaire pour que Jest/Supertest fonctionne.
// Il exporte l'app Express SANS appeler app.listen().
// Le vrai démarrage reste dans server.js.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';


import { createUserSchema, updateUserSchema } from './validator/userValidator.js';
import { createContainerSchema, updateContainerSchema } from './validator/containerValidator.js';
import { createReportSchema } from './validator/reportValidator.js';
import { createRouteSchema } from './validator/routeValidator.js';
import { optimizeRoute } from './services/routeOptimizer.js';

const app = express();
// Autoriser uniquement ton front Vercel
// fichier serveur, par ex. index.js ou app.js
const cors = require('cors');

const allowedOrigins = ['https://ecotrack-five.vercel.app', 'http://localhost:3000'];

app.use(cors({
  origin: 'https://ecotrack-five.vercel.app', // autoriser ton front
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true // si tu gères les cookies
}));
export const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY || 'secret';
const VALID_ROLES = ['ADMIN', 'MANAGER', 'AGENT', 'CITIZEN'];

const upload = multer({ dest: 'uploads/' });

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ─── Middlewares ────────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    return res.status(401).json({ error: 'Format de token invalide' });

  try {
    const payload = jwt.verify(parts[1], SECRET_KEY);
    req.user = payload;
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

const authorize = (roles) => (req, res, next) => {
  if (!req.userRole || !roles.includes(req.userRole))
    return res.status(403).json({ error: 'Accès interdit' });
  next();
};

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({ message: 'Validation échouée', details: error.details.map(d => d.message) });
  next();
};

// ─── Health check (pour les tests CI) ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ecotrack-api' });
});

// ─── Auth ────────────────────────────────────────────────────────────────────
app.post('/auth/register', validate(createUserSchema), async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName, lastName, email,
        password: hashedPassword,
        role: 'CITIZEN',
        gamifications: { create: { points: 0, level: 1, badges: [] } },
      },
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    res.status(201).json({ token, role: user.role, id: user.id, name: `${user.firstName} ${user.lastName}` });
  } catch (err) {
    res.status(400).json({ error: 'Email déjà utilisé ou erreur de création' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ userId: user.id, type: '2fa' }, SECRET_KEY, { expiresIn: '15m' });
      return res.json({ requires2FA: true, tempToken });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, role: user.role, id: user.id, name: `${user.firstName} ${user.lastName}` });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, createdAt: true,
        gamifications: { select: { points: true, level: true, badges: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const gamification = user.gamifications?.[0] || { points: 0, level: 1, badges: [] };
    res.json({ ...user, points: gamification.points, level: gamification.level, badges: gamification.badges });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Deux mots de passe requis' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Au moins 8 caractères requis' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Containers ──────────────────────────────────────────────────────────────
app.get('/containers', authMiddleware, async (req, res) => {
  try {
    const containers = await prisma.container.findMany();
    res.json(containers);
  } catch {
    res.status(500).json({ error: 'Erreur récupération containers' });
  }
});

app.post('/containers', authMiddleware, authorize(['ADMIN', 'MANAGER']), validate(createContainerSchema), async (req, res) => {
  const { type, capacity, fillLevel, zone, latitude, longitude } = req.body;
  try {
    const container = await prisma.container.create({
      data: {
        type, capacity: parseFloat(capacity),
        fillLevel: parseFloat(fillLevel || 0),
        zone,
        latitude: parseFloat(latitude || 48.8566),
        longitude: parseFloat(longitude || 2.3522),
      },
    });
    res.status(201).json(container);
  } catch {
    res.status(500).json({ error: 'Erreur création container' });
  }
});

app.put('/containers/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), validate(updateContainerSchema), async (req, res) => {
  const { id } = req.params;
  const { type, capacity, fillLevel, zone, latitude, longitude } = req.body;
  try {
    const updateData = {};
    if (type      !== undefined) updateData.type      = type;
    if (capacity  !== undefined) updateData.capacity  = parseFloat(capacity);
    if (fillLevel !== undefined) updateData.fillLevel = parseFloat(fillLevel);
    if (zone      !== undefined) updateData.zone      = zone;
    if (latitude  !== undefined) updateData.latitude  = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    const updated = await prisma.container.update({ where: { id: parseInt(id) }, data: updateData });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Container introuvable' });
    res.status(500).json({ error: 'Erreur mise à jour container' });
  }
});

app.delete('/containers/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    await prisma.container.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Container supprimé avec succès' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Container introuvable' });
    res.status(500).json({ error: 'Erreur suppression container' });
  }
});

// ─── Signalements ────────────────────────────────────────────────────────────
app.get('/signalements/public', async (req, res) => {
  try {
    const signalements = await prisma.report.findMany({ where: { userId: null }, orderBy: { createdAt: 'desc' } });
    res.json(signalements);
  } catch {
    res.status(500).json({ error: 'Erreur récupération signalements publics' });
  }
});

app.post('/signalements/public', upload.single('photo'), async (req, res) => {
  const { type, comment, lat, lng } = req.body;
  try {
    const report = await prisma.report.create({
      data: {
        type, comment,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
        userId: null, status: 'PENDING',
      },
    });
    res.status(201).json(report);
  } catch {
    res.status(500).json({ error: 'Erreur création signalement public' });
  }
});

app.get('/signalements', authMiddleware, async (req, res) => {
  try {
    let signalements;
    if (req.userRole === 'CITIZEN') {
      signalements = await prisma.report.findMany({
        where: { userId: req.userId },
        include: { container: { select: { id: true, type: true, zone: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      signalements = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
    }
    res.json(signalements);
  } catch {
    res.status(500).json({ error: 'Erreur récupération signalements' });
  }
});

app.post('/signalements', authMiddleware, upload.single('photo'), async (req, res) => {
  const { type, comment, containerId, lat, lng, lieu } = req.body;
  if (!type) return res.status(400).json({ error: 'Le type est obligatoire' });
  try {
    const report = await prisma.report.create({
      data: {
        type, comment: comment || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        lieu: lieu || null,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
        user: { connect: { id: req.userId } },
        ...(containerId && { container: { connect: { id: parseInt(containerId) } } }),
      },
    });
    res.status(201).json({ report });
  } catch (err) {
    res.status(500).json({ error: 'Erreur création signalement' });
  }
});

app.patch('/signalements/:id/status', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
  if (!status || !validStatuses.includes(status))
    return res.status(400).json({ error: 'Statut invalide' });
  try {
    const updated = await prisma.report.update({ where: { id: parseInt(req.params.id) }, data: { status } });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Signalement introuvable' });
    res.status(500).json({ error: 'Erreur mise à jour statut' });
  }
});

// ─── Routes (tournées) ───────────────────────────────────────────────────────
app.get('/routes', authMiddleware, authorize(['ADMIN', 'MANAGER', 'AGENT']), async (req, res) => {
  try {
    const where = req.userRole === 'AGENT' ? { agentId: req.userId } : {};
    const routes = await prisma.route.findMany({
      where,
      include: {
        stops: { include: { container: true }, orderBy: { order: 'asc' } },
        agent: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(routes);
  } catch {
    res.status(500).json({ error: 'Erreur récupération routes' });
  }
});

app.post('/routes/optimize', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const { depot, fillThreshold = 70, assignedToId } = req.body;
  if (!depot?.lat || !depot?.lng)
    return res.status(400).json({ error: 'Le dépôt (lat/lng) est obligatoire' });
  try {
    const containers = await prisma.container.findMany({
      where: { fillLevel: { gte: fillThreshold } },
      orderBy: { fillLevel: 'desc' },
    });
    if (containers.length === 0)
      return res.json({ message: `Aucun conteneur au-dessus de ${fillThreshold}%`, route: [], containersCount: 0 });
    const result = optimizeRoute(depot, containers);
    res.status(201).json({ totalDistanceKm: result.totalDistanceKm, containersCount: result.containersCount });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'optimisation", details: err.message });
  }
});

app.delete('/routes/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    await prisma.route.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Tournée supprimée' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Tournée introuvable' });
    res.status(500).json({ error: 'Erreur suppression tournée' });
  }
});

// ─── Tournées (alias) ─────────────────────────────────────────────────────────
app.get('/tournees', authMiddleware, authorize(['ADMIN', 'MANAGER', 'AGENT']), async (req, res) => {
  try {
    const where = req.userRole === 'AGENT' ? { agentId: req.userId } : {};
    const tournees = await prisma.route.findMany({
      where,
      include: { agent: { select: { firstName: true, lastName: true } }, containers: true },
    });
    res.json(tournees);
  } catch {
    res.status(500).json({ error: 'Erreur récupération tournées' });
  }
});

// ─── Agents ───────────────────────────────────────────────────────────────────
app.get('/agents', authMiddleware, authorize(['ADMIN']), async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
    res.json(agents);
  } catch {
    res.status(500).json({ error: 'Erreur récupération agents' });
  }
});

// ─── Gamification ─────────────────────────────────────────────────────────────
app.get('/gamification', authMiddleware, async (req, res) => {
  try {
    const userExists = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!userExists) return res.status(401).json({ error: 'Session invalide. Veuillez vous reconnecter.' });
    let gamification = await prisma.gamification.findFirst({ where: { userId: req.userId } });
    if (!gamification) {
      gamification = await prisma.gamification.create({
        data: { userId: req.userId, points: 0, level: 1, badges: [] },
      });
    }
    res.json(gamification);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// ─── Dashboard admin ──────────────────────────────────────────────────────────
app.get('/dashboard/admin', authMiddleware, authorize(['ADMIN']), async (req, res) => {
  try {
    const [agentsCount, containersCount, tourneesCount, signalementsCount] = await Promise.all([
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.container.count(),
      prisma.route.count(),
      prisma.report.count(),
    ]);
    res.json({ agents: agentsCount, containers: containersCount, tournees: tourneesCount, signalements: signalementsCount });
  } catch {
    res.status(500).json({ error: 'Erreur récupération stats' });
  }
});

// ─── Missions ─────────────────────────────────────────────────────────────────
app.get('/missions', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const missions = await prisma.mission.findMany({
      include: { agent: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(missions);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/missions/mes-missions', authMiddleware, async (req, res) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { agentId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(missions);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default app;