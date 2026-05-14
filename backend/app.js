import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client'; 
import multer from 'multer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
// Ping Supabase toutes les 4 minutes pour éviter la mise en pause
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.log('Ping DB failed:', e.message);
  }
}, 4 * 60 * 1000);
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
const { name, firstName, lastName, email, password, role } = req.body;

  if (!email || !password)
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
      include: { 
        agent: { select: { firstName: true, lastName: true } }, 
        stops: { include: { container: true }, orderBy: { order: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tournees);
  } catch (err) {
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

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD ADMIN
// ─────────────────────────────────────────────────────────────────────────────
app.get('/dashboard/admin', authMiddleware, authorize(['ADMIN']), async (req, res) => {
  try {
    const [agents, containers, tournees, signalements, signalements_pending] = await Promise.all([
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.container.count(),
      prisma.route.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);
    res.json({ agents, containers, tournees, signalements, signalements_pending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération stats dashboard' });
  }
});

// ─── AUTH ME ─────────────────────────────────────────────────────────────────
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { gamifications: true },
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    
    const gamification = user.gamifications?.[0] || { points: 0, level: 1, badges: [] };
    const { password, ...safeUser } = user;
    
    res.json({
      ...safeUser,
      points: gamification.points,
      level:  gamification.level,
      badges: gamification.badges,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════

// ─── PROFIL : Mise à jour infos personnelles ─────────────────────────────────
app.put('/auth/profile', authMiddleware, async (req, res) => {
  const { firstName, lastName, email, phone, address, bio } = req.body;
  try {
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName  !== undefined) updateData.lastName  = lastName;
    if (email     !== undefined) updateData.email     = email;
    if (phone     !== undefined) updateData.phone     = phone;
    if (address   !== undefined) updateData.address   = address;
    if (bio       !== undefined) updateData.bio       = bio;

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      include: { gamifications: true },
    });

    const { password, ...safeUser } = updated;
    const gamification = updated.gamifications?.[0] || { points: 0, level: 1, badges: [] };
    res.json({
      ...safeUser,
      points: gamification.points,
      level:  gamification.level,
      badges: gamification.badges,
    });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

// ─── PROFIL : Changement de mot de passe ─────────────────────────────────────
app.put('/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Les deux mots de passe sont requis.' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du changement.' });
  }
});

// ─── PROFIL : Upload avatar ───────────────────────────────────────────────────
app.post('/auth/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });
  try {
    const avatarUrl = `/uploads/${req.file.filename}`;
    await prisma.user.update({ where: { id: req.userId }, data: { avatar: avatarUrl } });
    res.json({ avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l\'upload.' });
  }
});

// ─── 2FA : Setup (générer QR code) ───────────────────────────────────────────
app.post('/auth/2fa/setup', authMiddleware, async (req, res) => {
  try {
    // Import speakeasy dynamiquement
    const speakeasy = (await import('speakeasy')).default;
    const QRCode    = (await import('qrcode')).default;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const secret = speakeasy.generateSecret({
      name: `EcoTrack (${user.email})`,
      length: 20,
    });

    await prisma.user.update({
      where: { id: req.userId },
      data: { twoFactorSecret: secret.base32, twoFactorEnabled: true },
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ qrCode, secret: secret.base32 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l\'activation 2FA.' });
  }
});

// ─── 2FA : Désactiver ────────────────────────────────────────────────────────
app.post('/auth/2fa/disable', authMiddleware, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    res.json({ message: '2FA désactivé avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la désactivation 2FA.' });
  }
});

// ─── 2FA : Vérifier code ─────────────────────────────────────────────────────
app.post('/auth/2fa/verify', async (req, res) => {
  const { tempToken, token } = req.body;
  if (!tempToken || !token)
    return res.status(400).json({ error: 'Token et code requis.' });
  try {
    const speakeasy = (await import('speakeasy')).default;
    const payload   = jwt.verify(tempToken, SECRET_KEY);
    if (payload.type !== '2fa') return res.status(401).json({ error: 'Token invalide.' });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.twoFactorSecret)
      return res.status(401).json({ error: '2FA non configuré.' });

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!valid) return res.status(401).json({ error: 'Code 2FA invalide ou expiré.' });

    const finalToken = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    res.json({
      token: finalToken,
      role: user.role,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
});

// ─── SESSIONS : Révoquer toutes les sessions ──────────────────────────────────
// (Simple : on génère un nouveau salt pour invalider tous les anciens tokens)
app.post('/auth/sessions/revoke-all', authMiddleware, async (req, res) => {
  try {
    // On met à jour le champ updatedAt pour invalider les anciens tokens côté client
    await prisma.user.update({
      where: { id: req.userId },
      data: { updatedAt: new Date() },
    });
    res.json({ message: 'Toutes les sessions ont été révoquées.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la révocation des sessions.' });
  }
});

// ─── COMPTE : Supprimer son compte ───────────────────────────────────────────
app.delete('/auth/account', authMiddleware, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ message: 'Compte supprimé avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte.' });
  }
});

// ─── MISSIONS ─────────────────────────────────────────────────────────────────
app.get('/missions', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const missions = await prisma.mission.findMany({
      include: {
        agent: { select: { id: true, firstName: true, lastName: true, email: true } },
        admin: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération missions.' });
  }
});

app.get('/missions/mes-missions', authMiddleware, async (req, res) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { agentId: req.userId },
      include: {
        admin: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération missions.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MISSIONS
// ─────────────────────────────────────────────────────────────────────────────

app.post('/missions', authMiddleware, async (req, res) => {
  const { title, agentId } = req.body;

  try {
    const newRoute = await prisma.route.create({
      data: {
        name: title, // Utilise 'name' car c'est le champ dans ton schéma Prisma
        agentId: parseInt(agentId),
        status: 'PENDING',
      },
      // On inclut l'agent pour que le frontend reçoive immédiatement son nom
      include: {
        agent: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    res.status(201).json(newRoute);
  } catch (err) {
    console.error("Erreur création mission:", err);
    res.status(400).json({ error: "Impossible de créer la mission." });
  }
});

app.put('/missions/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const { id } = req.params;
  const { title, description, agentId, status } = req.body;
  try {
    const updateData = {};
    if (title       !== undefined) updateData.title       = title;
    if (description !== undefined) updateData.description = description;
    if (agentId     !== undefined) updateData.agentId     = parseInt(agentId);
    if (status      !== undefined) updateData.status      = status;

    const updated = await prisma.mission.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        agent: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Mission introuvable.' });
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

app.delete('/missions/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    await prisma.mission.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Mission supprimée.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Mission introuvable.' });
    res.status(500).json({ error: 'Erreur suppression mission.' });
  }
});

app.patch('/missions/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'DONE'];
  if (!status || !validStatuses.includes(status))
    return res.status(400).json({ error: 'Statut invalide.' });
  try {
    const updated = await prisma.mission.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur mise à jour statut.' });
  }
});

// ─── ROUTES (tournées) : routes manquantes ────────────────────────────────────
app.get('/routes', authMiddleware, authorize(['ADMIN', 'MANAGER', 'AGENT']), async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (req.userRole === 'AGENT') where.agentId = req.userId;
    if (status) where.status = status;

    const routes = await prisma.route.findMany({
      where,
      include: {
        stops: {
          include: { container: true },
          orderBy: { order: 'asc' },
        },
        agent: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(routes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération routes.' });
  }
});

app.post('/routes/optimize', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const { depot, fillThreshold = 70, agentId, name } = req.body;
  if (!depot?.lat || !depot?.lng)
    return res.status(400).json({ error: 'Le dépôt (lat/lng) est obligatoire.' });
  if (!agentId)
    return res.status(400).json({ error: 'L\'agent est obligatoire.' });
  try {
    const { optimizeRoute } = await import('./services/routeOptimizer.js');
    const containers = await prisma.container.findMany({
      where: { fillLevel: { gte: parseFloat(fillThreshold) } },
      orderBy: { fillLevel: 'desc' },
    });
    if (containers.length === 0)
      return res.json({ message: `Aucun conteneur au-dessus de ${fillThreshold}%`, route: null, containersCount: 0 });

    const result = optimizeRoute(depot, containers);

    const route = await prisma.route.create({
      data: {
        agentId: parseInt(agentId),
        name: name || `Tournée ${new Date().toLocaleDateString('fr-FR')}`,
        totalDistanceKm: result.totalDistanceKm,
        fillThreshold: parseInt(fillThreshold),
        containersCount: result.containersCount,
        status: 'ASSIGNED',
        stops: {
          create: result.orderedContainers.map((c, i) => ({
            order: i + 1,
            distanceFromPrevious: 0,
            containerId: c.id,
          })),
        },
      },
      include: {
        stops: { include: { container: true }, orderBy: { order: 'asc' } },
        agent: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.status(201).json(route);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l\'optimisation.', details: err.message });
  }
});

app.put('/routes/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const { id } = req.params;
  const { name, agentId, status, startTime, endTime } = req.body;
  try {
    const updateData = {};
    if (name      !== undefined) updateData.name      = name;
    if (agentId   !== undefined) updateData.agentId   = parseInt(agentId);
    if (status    !== undefined) updateData.status    = status;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime   !== undefined) updateData.endTime   = new Date(endTime);

    const updated = await prisma.route.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        stops: { include: { container: true }, orderBy: { order: 'asc' } },
        agent: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Tournée introuvable.' });
    res.status(500).json({ error: 'Erreur mise à jour tournée.' });
  }
});

app.patch('/routes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await prisma.route.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur mise à jour statut tournée.' });
  }
});

app.delete('/routes/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    await prisma.route.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Tournée supprimée.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Tournée introuvable.' });
    res.status(500).json({ error: 'Erreur suppression tournée.' });
  }
});

// ─── ROUTES STOPS : Valider une collecte ─────────────────────────────────────
app.patch('/routes/:tourId/stops/:stopId/collect', authMiddleware, authorize(['AGENT', 'ADMIN', 'MANAGER']), async (req, res) => {
  const { tourId, stopId } = req.params;
  try {
    const stop = await prisma.routeStop.update({
      where: { id: parseInt(stopId) },
      data: { collectedAt: new Date() },
      include: { container: true },
    });

    // Vérifier si toutes les étapes sont collectées
    const allStops = await prisma.routeStop.findMany({
      where: { routeId: parseInt(tourId) },
    });
    const allDone = allStops.every(s => s.collectedAt !== null);
    if (allDone) {
      await prisma.route.update({
        where: { id: parseInt(tourId) },
        data: { status: 'COMPLETED' },
      });
    }
    res.json(stop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur validation collecte.' });
  }
});

// ─── CONTAINERS : Mise à jour et suppression ──────────────────────────────────
app.put('/containers/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
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
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Conteneur introuvable.' });
    res.status(500).json({ error: 'Erreur mise à jour conteneur.' });
  }
});

app.delete('/containers/:id', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    await prisma.container.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Conteneur supprimé.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Conteneur introuvable.' });
    res.status(500).json({ error: 'Erreur suppression conteneur.' });
  }
});

// ─── SIGNALEMENTS : Mise à jour statut ───────────────────────────────────────
app.patch('/signalements/:id/status', authMiddleware, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
  if (!status || !validStatuses.includes(status))
    return res.status(400).json({ error: 'Statut invalide.' });
  try {
    const updated = await prisma.report.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Signalement introuvable.' });
    res.status(500).json({ error: 'Erreur mise à jour statut.' });
  }
});

// ─── USERS : Gestion admin (backoffice) ──────────────────────────────────────
app.get('/users', authMiddleware, authorize(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, createdAt: true, phone: true, address: true,
        twoFactorEnabled: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur récupération utilisateurs.' });
  }
});

app.put('/users/:id', authMiddleware, authorize(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, role, phone, address } = req.body;
  const VALID_ROLES = ['ADMIN', 'MANAGER', 'AGENT', 'CITIZEN'];
  if (role && !VALID_ROLES.includes(role))
    return res.status(400).json({ error: 'Rôle invalide.' });
  try {
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName  !== undefined) updateData.lastName  = lastName;
    if (email     !== undefined) updateData.email     = email;
    if (role      !== undefined) updateData.role      = role;
    if (phone     !== undefined) updateData.phone     = phone;
    if (address   !== undefined) updateData.address   = address;

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, phone: true, address: true, createdAt: true,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Utilisateur introuvable.' });
    if (err.code === 'P2002') return res.status(400).json({ error: 'Email déjà utilisé.' });
    res.status(500).json({ error: 'Erreur mise à jour utilisateur.' });
  }
});

app.delete('/users/:id', authMiddleware, authorize(['ADMIN']), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Utilisateur supprimé.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.status(500).json({ error: 'Erreur suppression utilisateur.' });
  }
});

// ─── DASHBOARD MANAGER ────────────────────────────────────────────────────────
app.get('/dashboard/manager', authMiddleware, authorize(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const [containers, signalements, routes, agents] = await Promise.all([
      prisma.container.findMany({ orderBy: { fillLevel: 'desc' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.route.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.user.count({ where: { role: 'AGENT' } }),
    ]);
    const critical = containers.filter(c => (c.fillLevel || 0) >= 90).length;
    const warning  = containers.filter(c => (c.fillLevel || 0) >= 70 && (c.fillLevel || 0) < 90).length;
    res.json({
      containers: containers.length,
      containersCritical: critical,
      containersWarning: warning,
      signalementsPending: signalements,
      routesActive: routes,
      agents,
      containersData: containers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur dashboard manager.' });
  }
});

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
app.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const gamifications = await prisma.gamification.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
      },
      orderBy: { points: 'desc' },
      take: 20,
    });
    const leaderboard = gamifications.map((g, i) => ({
      rank: i + 1,
      userId: g.userId,
      name: `${g.user.firstName} ${g.user.lastName}`,
      avatar: g.user.avatar,
      role: g.user.role,
      points: g.points,
      level: g.level,
      badges: g.badges,
    }));
    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur leaderboard.' });
  }
});

// ─── HORAIRES COLLECTE ───────────────────────────────────────────────────────
app.get('/horaires', async (req, res) => {
  // Horaires statiques pour l'instant (peuvent être configurés en base plus tard)
  const horaires = [
    { jour: 'Lundi',    zones: ['Centre', 'Nord'],   horaire: '07h00 - 12h00' },
    { jour: 'Mardi',    zones: ['Est', 'Ouest'],      horaire: '07h00 - 12h00' },
    { jour: 'Mercredi', zones: ['Sud', 'Centre'],     horaire: '08h00 - 13h00' },
    { jour: 'Jeudi',    zones: ['Nord', 'Est'],       horaire: '07h00 - 12h00' },
    { jour: 'Vendredi', zones: ['Ouest', 'Sud'],      horaire: '07h00 - 12h00' },
    { jour: 'Samedi',   zones: ['Toutes les zones'],  horaire: '08h00 - 14h00' },
  ];
  res.json(horaires);
});

// ─── DEFIS ────────────────────────────────────────────────────────────────────
app.get('/defis', authMiddleware, async (req, res) => {
  // Défis statiques (à migrer en base de données si besoin)
  const defis = [
    {
      id: 1, titre: 'Zéro débordement - Quartier Centre',
      description: 'Signalez tous les conteneurs pleins dans le quartier Centre pendant 7 jours.',
      pointsRecompense: 100, dateDebut: '2026-05-01', dateFin: '2026-05-31',
      statut: 'ACTIF', participants: 42,
    },
    {
      id: 2, titre: 'Champion du recyclage',
      description: 'Effectuez 10 signalements en 1 mois pour gagner le badge Champion.',
      pointsRecompense: 150, dateDebut: '2026-05-01', dateFin: '2026-05-31',
      statut: 'ACTIF', participants: 28,
    },
    {
      id: 3, titre: 'Éco-citoyen du mois',
      description: 'Accumulez 200 points en signalements pour devenir Éco-citoyen du mois.',
      pointsRecompense: 200, dateDebut: '2026-05-01', dateFin: '2026-05-31',
      statut: 'ACTIF', participants: 15,
    },
  ];
  res.json(defis);
});

app.post('/defis/:id/inscrire', authMiddleware, async (req, res) => {
  // Enregistre la participation (points bonus)
  try {
    const gamification = await prisma.gamification.findFirst({ where: { userId: req.userId } });
    if (gamification) {
      await prisma.gamification.update({
        where: { id: gamification.id },
        data: { points: gamification.points + 5 }, // 5 points pour l'inscription
      });
    }
    res.json({ message: 'Inscription au défi réussie ! +5 points', defiId: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l\'inscription au défi.' });
  }
});

// ─── DASHBOARD AGENT ──────────────────────────────────────────────────────────
app.get('/dashboard/agent', authMiddleware, authorize(['AGENT']), async (req, res) => {
  try {
    const [tournees, containers] = await Promise.all([
      prisma.route.findMany({
        where: { agentId: req.userId },
        include: {
          stops: { include: { container: true } },
        },
      }),
      prisma.route.findMany({
        where: { agentId: req.userId, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
        include: { stops: true },
      }),
    ]);

    const nbContainers = containers.reduce((acc, r) => acc + (r.stops?.length || 0), 0);

    res.json({
      nbTournees:   tournees.length,
      nbContainers: nbContainers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur dashboard agent.' });
  }
});

// ─── MISSIONS : Terminer ──────────────────────────────────────────────────────
app.put('/missions/:id/terminer', authMiddleware, authorize(['AGENT']), async (req, res) => {
  try {
    const updated = await prisma.mission.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'DONE' },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la terminaison.' });
  }
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;