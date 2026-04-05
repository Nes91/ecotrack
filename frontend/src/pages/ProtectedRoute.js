import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) return <Navigate to="/" />;
  if (!allowedRoles.includes(user.role)) return (
    <div className="text-center mt-20 text-red-500">
      Accès refusé - Vous n'avez pas les droits pour cette page
    </div>
  );
  return children;
}