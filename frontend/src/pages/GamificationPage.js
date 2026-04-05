import { Doughnut } from "react-chartjs-2";
import API from "../api/api";
import { useEffect, useState } from "react";
import BadgeCard from "../components/BadgeCard";

export default function Gamification() {
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    API.get("/gamification")
      .then(res => setGamification(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!gamification) return <p className="text-center mt-24">Chargement...</p>;

  const gamificationData = {
    labels: gamification.badges.length > 0 ? gamification.badges : ["Aucun badge"],
    datasets: [{
      label: "Badges",
      data: gamification.badges.length > 0 ? gamification.badges.map(() => 1) : [1],
      backgroundColor: ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"],
    }],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Gamification</h1>
      <BadgeCard points={gamification.points} level={gamification.level} badges={gamification.badges} />
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Vos badges</h2>
        <Doughnut data={gamificationData} />
      </div>
    </div>
  );
}