import { useEffect, useState } from "react";
import API from "../api/api";
import Card from "../components/card";
import dayjs from "dayjs";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const getMarkerIcon = (fillLevel) => {
  const color = fillLevel < 50 ? "green" : fillLevel < 80 ? "orange" : "red";
  return new L.Icon({
    iconUrl: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${color}`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -35],
  });
};

export default function Tournees() {
  const [tournees, setTournees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournees = async () => {
      try {
        const res = await API.get("/tournees");
        setTournees(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTournees();
  }, []);

  if (loading) return <p className="text-center mt-16 text-gray-500">Chargement des tournées...</p>;

  return (
    <div className="pt-20 max-w-6xl mx-auto px-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Tournées & Containers</h1>

      {tournees.map(t => (
        <Card key={t.id}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Tournée #{t.id}</h2>
            <p>Début : {t.startTime ? dayjs(t.startTime).format("DD/MM/YYYY HH:mm") : "Non défini"}</p>
            <p>Fin : {t.endTime ? dayjs(t.endTime).format("DD/MM/YYYY HH:mm") : "Non défini"}</p>

            {t.containers && t.containers.length > 0 ? (
              <MapContainer
                center={[t.containers[0].lat || 48.8566, t.containers[0].lng || 2.3522]}
                zoom={13} scrollWheelZoom={false}
                className="leaflet-container"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {t.containers.map(c => (
                  <Marker
                    key={c.id}
                    position={[c.lat || 48.8566, c.lng || 2.3522]}
                    icon={getMarkerIcon(c.fillLevel)}
                  >
                    <Popup>
                      <p className="font-semibold">{c.type}</p>
                      <p>Remplissage : {c.fillLevel}%</p>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : <p className="text-gray-500">Aucun container associé</p>}
          </div>
        </Card>
      ))}
    </div>
  );
}