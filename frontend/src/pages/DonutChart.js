import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";

export function ContainersChart({ data }) {
  return (
    <div className="bg-white p-4 rounded shadow h-64">
      <h3 className="font-semibold mb-2">État des containers</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
