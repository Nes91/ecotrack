// routes/dashboard.js
router.get("/admin", async (req, res) => {
  const agents = await prisma.user.count({ where: { role: "AGENT" } });
  const containers = await prisma.container.count();
  const tournees = await prisma.route.count();
  const signalements = await prisma.report.count();

  res.json({
    agents,
    containers,
    tournees,
    signalements,
  });
});


router.get("/manager", async (req, res) => {
  const tourneesToday = await prisma.route.count({
    where: {
      date: {
        gte: new Date(new Date().setHours(0,0,0,0)),
      },
    },
  });

  const signalements = await prisma.report.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0,0,0,0)),
      },
    },
  });

  res.json({
    tourneesToday,
    signalements,
  });
});


router.get("/agent/:userId", async (req, res) => {
  const { userId } = req.params;

  const tournees = await prisma.route.findMany({
    where: { agentId: Number(userId) },
    include: { containers: true },
  });

  res.json({
    nbTournees: tournees.length,
    nbContainers: tournees.reduce(
      (sum, t) => sum + t.containers.length,
      0
    ),
  });
});


router.get(
  "/stats/signalements/week",
  authenticate,
  authorize(["MANAGER", "ADMIN"]),
  async (req, res) => {
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0,0,0,0);

      const end = new Date(start);
      end.setHours(23,59,59,999);

      const count = await prisma.report.count({
        where: { createdAt: { gte: start, lte: end } }
      });

      data.push({
        day: start.toLocaleDateString("fr-FR", { weekday: "short" }),
        count
      });
    }

    res.json(data);
  }
);

router.get(
  "/stats/containers",
  authenticate,
  authorize(["MANAGER", "ADMIN"]),
  async (req, res) => {
    const plein = await prisma.container.count({ where: { status: "PLEIN" } });
    const vide = await prisma.container.count({ where: { status: "VIDE" } });

    res.json([
      { name: "Plein", value: plein },
      { name: "Vide", value: vide },
    ]);
  }
);

router.get(
  "/stats/containers",
  authenticate,
  authorize(["MANAGER", "ADMIN"]),
  async (req, res) => {
    const plein = await prisma.container.count({ where: { status: "PLEIN" } });
    const vide = await prisma.container.count({ where: { status: "VIDE" } });

    res.json([
      { name: "Plein", value: plein },
      { name: "Vide", value: vide },
    ]);
  }
);

// GET /mes-signalements
// Un citoyen ne peut voir que ses propres signalements
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorize.js";
import prisma from "../prismaClient.js"; // Assure-toi que prisma est bien exporté

const router = express.Router();

router.get(
  "/mes-signalements",
  authMiddleware,
  authorize(["CITIZEN"]),
  async (req, res) => {
    try {
      // req.userId est défini par authMiddleware
      const signalements = await prisma.report.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
      });

      res.json(signalements);
    } catch (error) {
      console.error("Erreur récupération mes-signalements:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

export default router;
