import { useEffect, useState } from "react";
import API from "../api/api";
import { Bar } from "react-chartjs-2";

export default function Containers() {
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    const fetchContainers = async () => {
      try {
        const res = await API.get("/containers");
        setContainers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchContainers();
  }, []);

  const containerData = {
    labels: containers.map(c => c.type),
    datasets: [{
      label: "Remplissage (%)",
      data: containers.map(c => c.fillLevel),
      backgroundColor: containers.map(c =>
        c.fillLevel < 50 ? "#34D399" : c.fillLevel < 80 ? "#FBBF24" : "#F87171"
      ),
    }],
  };

  return (
    <div className="pt-20 max-w-6xl mx-auto space-y-10 px-4">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Containers</h1>
      <section className="bg-white p-6 rounded-lg shadow-lg">
        <Bar data={containerData} />
      </section>
    </div>
  );
}
