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

  return (
  <div className="max-w-6xl mx-auto px-4 pt-24 space-y-6">
    <h1 className="text-3xl font-bold text-center mb-6">Gamification</h1>
    <BadgeCard points={gamification.points} level={gamification.level} badges={gamification.badges} />
  </div>
);
}