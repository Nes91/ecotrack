import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Signalement({ user }) {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSignalements = async () => {
      try {
        let endpoint = "/signalements";

        // Si c'est un citoyen, on prend ses propres signalements
        if (user.role === "CITIZEN") {
          endpoint = "/mes-signalements";
        }

        const res = await API.get(endpoint);
        setSignalements(res.data);
      } catch (err) {
        console.error("Erreur récupération signalements :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignalements();
  }, [user.role]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-12 py-10 relative">
      {/* HEADER */}
      <div className="text-center mb-12 space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          {user.role === "CITIZEN" ? "Mes signalements" : "Signalements citoyens"}
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          {user.role === "CITIZEN"
            ? "Suivez l’état de vos signalements."
            : "Consultez l’ensemble des signalements envoyés par les citoyens."}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total" value={signalements.length} />
        <StatCard
          title="Avec photo"
          value={signalements.filter((s) => s.photoUrl).length}
        />
        <StatCard
          title="Sans commentaire"
          value={signalements.filter((s) => !s.comment).length}
        />
      </div>

      {/* CONTENU */}
      {loading ? (
        <p className="text-center text-gray-400 animate-pulse">
          Chargement des signalements...
        </p>
      ) : signalements.length === 0 ? (
        <div className="text-center text-gray-400 mt-20">
          <p className="text-lg">📭 Aucun signalement disponible</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {signalements.map((s) => (
            <SignalementCard key={s.id} signalement={s} />
          ))}
        </div>
      )}

      {/* BOUTON FLOTTANT pour les citoyens */}
      {user.role === "CITIZEN" && (
        <button
          onClick={() => navigate("/signaler")}
          className="fixed bottom-8 right-8 w-16 h-16 bg-yellow-500 rounded-full shadow-lg flex items-center justify-center text-white text-3xl hover:bg-yellow-600 transition"
          title="Nouveau signalement"
        >
          +
        </button>
      )}
    </div>
  );
}

/* ===================== */
/*       COMPONENTS      */
/* ===================== */

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}

function SignalementCard({ signalement }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden hover:scale-[1.02]">
      {signalement.photoUrl && (
        <img
          src={signalement.photoUrl}
          alt="signalement"
          className="h-48 w-full object-cover"
        />
      )}

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
            {signalement.type}
          </span>
          <span className="text-xs text-gray-400">
            {signalement.createdAt
              ? new Date(signalement.createdAt).toLocaleDateString()
              : "—"}
          </span>
        </div>

        <p className="text-gray-700 text-sm line-clamp-3">
          {signalement.comment || "Aucun commentaire fourni"}
        </p>

        <button className="text-sm font-medium text-blue-600 hover:underline">
          Voir le détail →
        </button>
      </div>
    </div>
  );
}