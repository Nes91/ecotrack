import AdminDashboard from "./AdminDashboard";
import CitizenDashboard from "./CitizenDashboard"
import ManagerDashboard from "./ManagerDashboard"
import AgentDashboard from "./AgentDashboard"
import "../App.css"

export default function Dashboard({ user }) {
  if (user.role === "ADMIN") return <AdminDashboard user={user} />;
  if (user.role === "MANAGER") return <ManagerDashboard user={user} />;
  if (user.role === "CITIZEN") return <CitizenDashboard user={user} />;
  return <AgentDashboard user={user} />;
}