/**
 * Service d'optimisation des tournées ECOTRACK
 * Algorithme : Nearest Neighbor (init) + 2-opt (amélioration)
 */

/**
 * Calcule la distance en km entre deux points GPS (formule de Haversine)
 */
function haversineDistance(pointA, pointB) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLon = toRad(pointB.lng - pointA.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pointA.lat)) *
      Math.cos(toRad(pointB.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calcule la distance totale d'un itinéraire
 */
function totalDistance(route, distMatrix) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += distMatrix[route[i]][route[i + 1]];
  }
  // Retour au dépôt
  total += distMatrix[route[route.length - 1]][route[0]];
  return total;
}

/**
 * Étape 1 : Nearest Neighbor — construit un itinéraire initial
 * Part du dépôt, va toujours vers le conteneur le plus proche non visité
 */
function nearestNeighbor(distMatrix) {
  const n = distMatrix.length;
  const visited = new Array(n).fill(false);
  const route = [0]; // On commence au dépôt (index 0)
  visited[0] = true;

  for (let step = 1; step < n; step++) {
    const last = route[route.length - 1];
    let nearest = -1;
    let minDist = Infinity;

    for (let j = 0; j < n; j++) {
      if (!visited[j] && distMatrix[last][j] < minDist) {
        minDist = distMatrix[last][j];
        nearest = j;
      }
    }

    route.push(nearest);
    visited[nearest] = true;
  }

  return route;
}

/**
 * Étape 2 : 2-opt — améliore l'itinéraire en échangeant des segments
 * Répète jusqu'à ce qu'aucune amélioration ne soit possible
 */
function twoOpt(route, distMatrix) {
  let improved = true;
  let bestRoute = [...route];
  let bestDistance = totalDistance(bestRoute, distMatrix);

  while (improved) {
    improved = false;

    for (let i = 1; i < bestRoute.length - 1; i++) {
      for (let j = i + 1; j < bestRoute.length; j++) {
        // On inverse le segment entre i et j
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1),
        ];

        const newDistance = totalDistance(newRoute, distMatrix);

        if (newDistance < bestDistance - 0.001) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return { route: bestRoute, distance: bestDistance };
}

/**
 * Fonction principale : optimise une tournée à partir d'une liste de conteneurs
 * 
 * @param {Array} depot - Point de départ { lat, lng, name }
 * @param {Array} containers - Liste de conteneurs [{ id, lat, lng, fillLevel, address }]
 * @returns {Object} - Itinéraire optimisé avec distance et ordre de passage
 */
function optimizeRoute(depot, containers) {
  if (containers.length === 0) {
    return { route: [], totalDistanceKm: 0, improvement: 0 };
  }

  if (containers.length === 1) {
    return {
      route: [{ ...containers[0], order: 1 }],
      totalDistanceKm: haversineDistance(depot, containers[0]) * 2,
      improvement: 0,
    };
  }

  // On construit la liste de tous les points (dépôt + conteneurs)
  const points = [depot, ...containers];
  const n = points.length;

  // Construction de la matrice de distances
  const distMatrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j ? 0 : haversineDistance(points[i], points[j])
    )
  );

  // Itinéraire initial (Nearest Neighbor)
  const initialRoute = nearestNeighbor(distMatrix);
  const initialDistance = totalDistance(initialRoute, distMatrix);

  // Amélioration avec 2-opt
  const { route: optimizedRoute, distance: optimizedDistance } = twoOpt(
    initialRoute,
    distMatrix
  );

  // On calcule le gain obtenu
  const improvement = (
    ((initialDistance - optimizedDistance) / initialDistance) * 100
  ).toFixed(1);

  // On reconstruit la liste ordonnée des conteneurs (sans le dépôt à l'index 0)
  const orderedContainers = optimizedRoute
    .filter((idx) => idx !== 0)
    .map((idx, order) => ({
      ...containers[idx - 1],
      order: order + 1,
      distanceFromPrevious: distMatrix[optimizedRoute[order]][idx].toFixed(2),
    }));

  return {
    route: orderedContainers,
    totalDistanceKm: optimizedDistance.toFixed(2),
    improvement: `${improvement}%`,
    containersCount: containers.length,
  };
}

export { optimizeRoute, haversineDistance, totalDistance };