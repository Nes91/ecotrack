import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client'; 
import multer from 'multer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = 8000;
const SECRET_KEY = process.env.SECRET_KEY || 'secret';

// Configuration multer
const upload = multer({ dest: 'uploads/' });

app.use(cors({
  origin: ['http://localhost:3000', 'https://ecotrack-five.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Servir les fichiers uploadés

// ===== Rôles autorisés =====
const VALID_ROLES = ['ADMIN', 'MANAGER', 'AGENT', 'CITIZEN'];

// ===== Middleware : vérifie le token =====
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ===== Middleware : vérifie le rôle =====
const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.userRole)) {
    return res.status(403).json({ error: 'Accès interdit' });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { 
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ')[1] || '',
        email, 
        password: hashedPassword, 
        role: role || 'CITIZEN',
        gamifications: {  // ← Créer la gamification en même temps
          create: {
            points: 0,
            level: 1,
            badges: []
          }
        }
      },
      include: {
        gamifications: true
      }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });

    res.status(201).json({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Email déjà utilisé ou erreur de création' });
  }
})

// Après votre route /auth/register existante (ligne ~48)

// Route alternative pour l'inscription (alias de /auth/register)
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { 
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ')[1] || '',
        email, 
        password: hashedPassword, 
        role: 'CITIZEN',
        gamifications: {  // 👈 Créer automatiquement la gamification
          create: {
            points: 0,
            level: 1,
            badges: []
          }
        }
      },
      include: {
        gamifications: true
      }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });

    res.status(201).json({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Email déjà utilisé ou erreur de création' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Email ou mot de passe invalide' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Email ou mot de passe invalide' });

    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });

    res.json({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFIL
// ─────────────────────────────────────────────────────────────────────────────
app.get('/profil', authMiddleware, async (req, res) => {
  try {
    const profil = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { reports: true, routes: true, gamifications: true },
    });
    res.json(profil);
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération profil' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENTS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/agents', authMiddleware, authorize(['ADMIN']), async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, address: true, lat: true, lng: true },
    });
    res.json(agents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération agents' });
  }
});

app.post('/agents', authMiddleware, authorize(['ADMIN']), async (req, res) => {
  const { firstName, lastName, role, address, latitude, longitude } = req.body;

  if (!firstName || !lastName || !role)
    return res.status(400).json({ error: 'Prénom, nom et rôle sont obligatoires' });

  if (!VALID_ROLES.includes(role))
    return res.status(400).json({ error: 'Rôle invalide' });

  try {
    const tempEmail = `agent_${Date.now()}_${Math.random().toString(36).slice(2)}@temp.local`;
    const tempPassword = await bcrypt.hash('changeme', 10);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: tempEmail,
        password: tempPassword,
        role,
        address: address || null,
        lat: latitude ? parseFloat(latitude) : null,
        lng: longitude ? parseFloat(longitude) : null,
      },
    });

    const { password: _, ...safe } = newUser;
    res.status(201).json({
      message: 'Agent créé',
      user: safe,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/agents/:id', authMiddleware, authorize(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, role, address, latitude, longitude } = req.body;

  if (role && !VALID_ROLES.includes(role))
    return res.status(400).json({ error: `Rôle invalide. Autorisés : ${VALID_ROLES.join(', ')}` });

  try {
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;
    if (address) updateData.address = address;
    if (latitude) updateData.lat = parseFloat(latitude);
    if (longitude) updateData.lng = parseFloat(longitude);

    const updatedAgent = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    const { password: _, ...safe } = updatedAgent;
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Erreur lors de la mise à jour' });
  }
});

app.delete('/agents/:id', authMiddleware, authorize(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Erreur lors de la suppression' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINERS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/containers', authMiddleware, async (req, res) => {
  try {
    const containers = await prisma.container.findMany();
    res.json(containers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération containers' });
  }
});

app.post('/containers', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const { type, capacity, fillLevel, zone, latitude, longitude } = req.body;
  try {
    const container = await prisma.container.create({
      data: {
        type,
        capacity: parseFloat(capacity),
        fillLevel: parseFloat(fillLevel || 0),
        zone,
        latitude: parseFloat(latitude || 48.8566),
        longitude: parseFloat(longitude || 2.3522),
      },
    });
    res.status(201).json(container);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur création container' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SIGNALEMENTS
// ─────────────────────────────────────────────────────────────────────────────

// Route publique (sans authentification)
app.get('/signalements/public', async (req, res) => {
  try {
    const signalements = await prisma.report.findMany({
      where: { userId: null },
      orderBy: { createdAt: 'desc' }
    });
    res.json(signalements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération signalements publics' });
  }
});

// Signalement public (sans authentification)
app.post('/signalements/public', upload.single('photo'), async (req, res) => {
  const { type, comment, lat, lng } = req.body;
  try {
    const report = await prisma.report.create({
      data: {
        type,
        comment,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
        userId: null,
        status: 'PENDING'
      }
    });
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur création signalement public' });
  }
});

// Admins et Managers : voir tous les signalements
app.get('/signalements', authMiddleware, authorize(['ADMIN', 'MANAGER', 'CITIZEN']), async (req, res) => {
  try {
    const signalements = await prisma.report.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        container: { select: { id: true, type: true, zone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(signalements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération signalements' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SIGNALEMENTS - LECTURE
// ─────────────────────────────────────────────────────────────────────────────

// Admins et Managers : voir tous les signalements
app.get('/signalements', authMiddleware, async (req, res) => {
  try {
    let signalements;
    
    // Si CITIZEN : voir uniquement ses propres signalements
    if (req.userRole === 'CITIZEN') {
      signalements = await prisma.report.findMany({
        where: { userId: req.userId },
        include: {
          container: { select: { id: true, type: true, zone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } 
    // Si ADMIN ou MANAGER : voir tous les signalements
    else if (req.userRole === 'ADMIN' || req.userRole === 'MANAGER') {
      signalements = await prisma.report.findMany({
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          container: { select: { id: true, type: true, zone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    // Si AGENT : voir les signalements de sa zone (optionnel)
    else {
      signalements = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }
    
    res.json(signalements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération signalements' });
  }
});

// Route spécifique citoyens (peut être supprimée si vous utilisez la route ci-dessus)
// app.get('/signalements/citoyen', authMiddleware, authorize(['CITIZEN']), async (req, res) => {
//   ... (cette route devient obsolète)
// });

// Citoyens : voir uniquement leurs propres signalements
app.get('/signalements/citoyen', authMiddleware, authorize(['CITIZEN']), async (req, res) => {
  try {
    const signalements = await prisma.report.findMany({
      where: { userId: req.userId },
      include: {
        container: { select: { id: true, type: true, zone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(signalements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération signalements' });
  }
});

// Création d'un signalement (citoyen connecté)
app.post('/signalements', authMiddleware, upload.single('photo'), async (req, res) => {
  console.log("📝 Création signalement - Body:", req.body);
  console.log("📝 User ID:", req.userId);

  const { type, comment, containerId, lat, lng } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Le type est obligatoire' });
  }

  try {
    // 1. Créer le signalement
    const report = await prisma.report.create({
      data: {
        type: type,
        comment: comment || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
        user: { connect: { id: req.userId } },
        ...(containerId && { container: { connect: { id: parseInt(containerId) } } })
      }
    });

    console.log("✅ Signalement créé:", report);

    // 2. Ajouter des points de gamification
    const POINTS_PER_REPORT = 10; // Points pour un signalement
    const BONUS_WITH_PHOTO = 5;   // Bonus si photo
    
    let pointsToAdd = POINTS_PER_REPORT;
    if (req.file) {
      pointsToAdd += BONUS_WITH_PHOTO;
    }

    try {
      // Chercher la gamification de l'utilisateur
      let gamification = await prisma.gamification.findFirst({
        where: { userId: req.userId }
      });

      if (!gamification) {
        // Créer si elle n'existe pas
        gamification = await prisma.gamification.create({
          data: {
            userId: req.userId,
            points: pointsToAdd,
            level: 1,
            badges: []
          }
        });
        console.log(`🎮 Gamification créée avec ${pointsToAdd} points`);
      } else {
        // Mettre à jour les points
        const newPoints = gamification.points + pointsToAdd;
        const newLevel = Math.floor(newPoints / 100) + 1; // Niveau = points / 100

        gamification = await prisma.gamification.update({
          where: { id: gamification.id },
          data: {
            points: newPoints,
            level: newLevel
          }
        });
        console.log(`🎮 Points ajoutés: +${pointsToAdd} (Total: ${newPoints}, Niveau: ${newLevel})`);
      }

      // Vérifier et attribuer des badges
      const badges = await checkAndAwardBadges(gamification, req.userId);
      
      res.status(201).json({
        report,
        gamification: {
          pointsEarned: pointsToAdd,
          totalPoints: gamification.points,
          level: gamification.level,
          newBadges: badges
        }
      });

    } catch (gamError) {
      console.error("⚠️ Erreur gamification:", gamError);
      // On envoie quand même le signalement même si la gamification échoue
      res.status(201).json({ report });
    }

  } catch (err) {
    console.error("❌ Erreur Prisma:", err.message);
    res.status(500).json({ error: 'Erreur création signalement', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FONCTION : Vérifier et attribuer des badges
// ─────────────────────────────────────────────────────────────────────────────
async function checkAndAwardBadges(gamification, userId) {
  const newBadges = [];
  const currentBadges = gamification.badges || [];

  // Compter le nombre de signalements de l'utilisateur
  const reportCount = await prisma.report.count({
    where: { userId: userId }
  });

  // Définir les badges possibles
  const BADGES = [
    { id: "first_report", name: "Premier Signalement 🌟", condition: reportCount >= 1 },
    { id: "reporter_5", name: "Citoyen Actif 🔥", condition: reportCount >= 5 },
    { id: "reporter_10", name: "Super Citoyen 🏆", condition: reportCount >= 10 },
    { id: "reporter_25", name: "Héros Urbain 🦸", condition: reportCount >= 25 },
    { id: "level_5", name: "Niveau 5 Atteint ⭐", condition: gamification.level >= 5 },
    { id: "level_10", name: "Niveau 10 Atteint 💎", condition: gamification.level >= 10 },
    { id: "points_100", name: "100 Points 🎯", condition: gamification.points >= 100 },
    { id: "points_500", name: "500 Points 🚀", condition: gamification.points >= 500 },
  ];

  // Vérifier chaque badge
  for (const badge of BADGES) {
    if (badge.condition && !currentBadges.includes(badge.id)) {
      currentBadges.push(badge.id);
      newBadges.push(badge);
    }
  }

  // Mettre à jour si de nouveaux badges
  if (newBadges.length > 0) {
    await prisma.gamification.update({
      where: { id: gamification.id },
      data: { badges: currentBadges }
    });
    console.log(`🏅 Nouveaux badges attribués:`, newBadges.map(b => b.name));
  }

  return newBadges;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNALEMENTS - MODIFICATION
// ─────────────────────────────────────────────────────────────────────────────
app.put('/signalements/:id', authMiddleware, upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { type, comment, lat, lng } = req.body;

  console.log("🔧 Modification signalement ID:", id);
  console.log("🔧 Données reçues:", { type, comment, lat, lng });

  try {
    const existingReport = await prisma.report.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingReport) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }

    if (req.userRole === 'CITIZEN' && existingReport.userId !== req.userId) {
      return res.status(403).json({ error: 'Non autorisé à modifier ce signalement' });
    }

    const updateData = {};
    if (type) updateData.type = type;
    if (comment !== undefined) updateData.comment = comment;
    if (lat) updateData.lat = parseFloat(lat);
    if (lng) updateData.lng = parseFloat(lng);
    if (req.file) updateData.photoUrl = `/uploads/${req.file.filename}`;

    const updatedReport = await prisma.report.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    console.log("✅ Signalement modifié:", updatedReport);
    res.json(updatedReport);

  } catch (err) {
    console.error("❌ Erreur modification signalement:", err.message);
    res.status(500).json({ error: 'Erreur modification signalement', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TOURNÉES
// ─────────────────────────────────────────────────────────────────────────────
app.get('/tournees', authMiddleware, authorize(['ADMIN', 'MANAGER', 'AGENT']), async (req, res) => {
  try {
    const where = req.userRole === 'AGENT' ? { agentId: req.userId } : {};
    const tournees = await prisma.route.findMany({
      where,
      include: { agent: { select: { firstName: true, lastName: true } }, containers: true },
    });
    res.json(tournees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération tournées' });
  }
});

app.post('/tournees', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const { agentId, name, startTime, endTime } = req.body;

  if (!agentId)
    return res.status(400).json({ error: 'agentId est obligatoire' });

  try {
    const route = await prisma.route.create({
      data: {
        agentId: parseInt(agentId),
        name: name || 'Route sans nom',
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
      },
    });
    res.status(201).json(route);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur création tournée' });
  }
});

app.put('/tournees/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const { id } = req.params;
  const { agentId, startTime, endTime, name } = req.body;

  try {
    const updateData = {};
    if (agentId) updateData.agentId = parseInt(agentId);
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (name) updateData.name = name;

    const updatedRoute = await prisma.route.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(updatedRoute);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Erreur lors de la mise à jour de la tournée' });
  }
});

app.delete('/tournees/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.route.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Tournée supprimée avec succès' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Erreur lors de la suppression de la tournée' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GAMIFICATION
// ─────────────────────────────────────────────────────────────────────────────
app.get('/gamification', authMiddleware, async (req, res) => {
  try {
    // 1. Vérifier que l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!userExists) {
      return res.status(401).json({ 
        error: 'Session invalide. Veuillez vous reconnecter.' 
      });
    }

    // 2. Chercher ou créer la gamification
    let gamification = await prisma.gamification.findFirst({
      where: { userId: req.userId },
    });
    
    if (!gamification) {
      gamification = await prisma.gamification.create({
        data: { 
          userId: req.userId, 
          points: 0, 
          level: 1, 
          badges: [] 
        },
      });
    }
    
    res.json(gamification);
  } catch (err) {
    console.error('❌ Erreur gamification:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

export default app;