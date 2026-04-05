import { useEffect, useState } from "react";
import API from "../api/api";

export default function SignalementsCitoyen({ user }) {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignalements = async () => {
      try {
        const res = await API.get("/signalements/citoyen"); // endpoint backend pour citoyen
        setSignalements(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSignalements();
  }, []);

  return (
    <div className="min-h-screen px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Mes signalements</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : signalements.length === 0 ? (
        <p>Vous n'avez aucun signalement pour le moment.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {signalements.map(s => (
            <div key={s.id} className="bg-white p-4 rounded-lg shadow">
              {s.photoUrl && <img src={s.photoUrl} alt="signalement" className="mb-2 h-40 w-full object-cover rounded" />}
              <span className="text-xs text-gray-500">{s.type}</span>
              <p className="text-gray-700 mt-1">{s.comment || "Aucun commentaire"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
