// backend/routes/mesSignalements.js
import express from 'express';
import { prisma } from '../prismaClient.js';
import authMiddleware from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();

// Route pour récupérer les signalements du citoyen connecté
router.get('/', authMiddleware, authorize(['CITIZEN']), async (req, res) => {
  try {
    const signalements = await prisma.report.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(signalements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;