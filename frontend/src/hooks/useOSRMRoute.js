import { useState, useEffect } from "react";

export function useOSRMRoute(stops, depot) {
  const [routeCoords, setRouteCoords] = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [duration, setDuration]       = useState(null); // en secondes
  const [distance, setDistance]       = useState(null); // en mètres

  useEffect(() => {
    if (!stops || stops.length === 0 || !depot) return;

    const validStops = stops.filter(
      s => s.container?.latitude && s.container?.longitude
    );

    if (validStops.length === 0) return;

    async function fetchRoute() {
      setIsLoading(true);
      try {
        // Construit la liste de coordonnées : dépôt → arrêts → dépôt
        const coordinates = [
          `${depot.lng},${depot.lat}`,
          ...validStops.map(s =>
            `${s.container.longitude},${s.container.latitude}`
          ),
          `${depot.lng},${depot.lat}`,
        ].join(";");

        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
        const res  = await fetch(url);
        const data = await res.json();

        if (data.code === "Ok" && data.routes?.[0]) {
          const route = data.routes[0];
          // Convertit les coordonnées GeoJSON [lng, lat] en [lat, lng] pour Leaflet
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRouteCoords(coords);
          setDuration(route.duration);
          setDistance(route.distance);
        }
      } catch (err) {
        console.error("Erreur OSRM:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoute();
  }, [stops, depot]);

  return { routeCoords, isLoading, duration, distance };
}