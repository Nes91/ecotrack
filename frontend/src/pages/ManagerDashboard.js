export default function ManagerDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Vue globale</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Agents actifs" value="12" />
        <Stat title="Tournées aujourd’hui" value="8" />
        <Stat title="Signalements" value="5" />
      </div>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <p className="text-gray-500">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}