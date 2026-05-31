export function Confirmation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center space-y-6">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-extrabold">
          Signalement envoyé
        </h2>
        <p className="text-gray-600">
          Merci pour votre contribution.  
          Nos équipes vont traiter votre signalement dans les plus brefs délais.
        </p>

        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Retour à l’accueil
        </a>
      </div>
    </div>
  );
}
