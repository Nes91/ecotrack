// backend/src/routes/tours.js
const express = require('express');
const router = express.Router();
const { optimizeRoute } = require('../services/routeOptimizer');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * POST /api/tours/optimize
 * Génère une tournée optimisée pour un gestionnaire
 */
router.post('/optimize', authenticateToken, requireRole('gestionnaire'), async (req, res) => {
  try {
    const { depot, fillThreshold = 70 } = req.body;

    // Récupère les conteneurs au-dessus du seuil de remplissage
    const containers = await db.query(
      `SELECT id, ST_X(location::geometry) as lng, 
              ST_Y(location::geometry) as lat,
              fill_level, address
       FROM containers 
       WHERE fill_level >= $1 
       ORDER BY fill_level DESC`,
      [fillThreshold]
    );

    if (containers.rows.length === 0) {
      return res.json({
        message: 'Aucun conteneur à collecter pour ce seuil',
        route: [],
      });
    }

    const result = optimizeRoute(depot, containers.rows);

    // Sauvegarde la tournée en base
    const tour = await db.query(
      `INSERT INTO tours (route_data, total_distance_km, containers_count, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [JSON.stringify(result.route), result.totalDistanceKm, result.containersCount, req.user.id]
    );

    res.status(201).json({
      tourId: tour.rows[0].id,
      ...result,
    });

  } catch (error) {
    console.error('Erreur optimisation tournée:', error);
    res.status(500).json({ error: 'Erreur lors de l\'optimisation' });
  }
});

module.exports = router;