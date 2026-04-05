import { useEffect, useState } from "react";
import API from "../api/api";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import BadgeCard from "../components/BadgeCard";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Gamification() {
  const [gamification, setGamification] = useState({ points: 0, level: 1, badges: [] });

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const res = await API.get("/gamification");
        setGamification(res.data || { points: 0, level: 1, badges: [] });
      } catch (err) {
        console.error(err);
      }
    };
    fetchGamification();
  }, []);

  const gamificationData = {
    labels: gamification.badges.length > 0 ? gamification.badges : ["Aucun badge"],
    datasets: [{
      label: "Badges",
      data: gamification.badges.length > 0 ? gamification.badges.map(() => 1) : [1],
      backgroundColor: ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"],
    }],
  };

  return (
    <div className="pt-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">Gamification</h1>
      <BadgeCard points={gamification.points} level={gamification.level} badges={gamification.badges} />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Vos badges</h2>
        <div className="max-w-md mx-auto h-64">
          <Doughnut data={gamificationData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </section>
    </div>
  );
}