// utils/menuConfig.js
// Clés = exactement ce que le backend envoie dans res.data.role
export const menuByRole = {
  ADMIN: [
    { label: "Dashboard",     path: "/dashboard",     icon: "📊" },
    { label: "Agents",        path: "/agents",        icon: "👷" },
    { label: "Tournées",      path: "/tournees",      icon: "🛣️" },
    { label: "Containers",    path: "/containers",    icon: "🗑️" },
    { label: "Signalements",  path: "/signalements",  icon: "⚠️" },
    { label: "Gamification",  path: "/gamification",  icon: "🏆" },
    { label: "Profil",        path: "/profile",       icon: "👤" },
  ],
  MANAGER: [
    { label: "Dashboard",     path: "/dashboard",     icon: "📊" },
    { label: "Tournées",      path: "/tournees",      icon: "🛣️" },
    { label: "Containers",    path: "/containers",    icon: "🗑️" },
    { label: "Signalements",  path: "/signalements",  icon: "⚠️" },
    { label: "Gamification",  path: "/gamification",  icon: "🏆" },
    { label: "Profil",        path: "/profile",       icon: "👤" },
  ],
  AGENT: [
    { label: "Dashboard",     path: "/dashboard",     icon: "📊" },
    { label: "Mes tournées",  path: "/tournees",      icon: "🛣️" },
    { label: "Signalements",  path: "/signalements",  icon: "⚠️" },
    { label: "Gamification",  path: "/gamification",  icon: "🏆" },
    { label: "Profil",        path: "/profile",       icon: "👤" },
  ],
  CITIZEN: [
    { label: "Dashboard",     path: "/dashboard",     icon: "📊" },
    { label: "Signalements",  path: "/signalements",  icon: "⚠️" },
    { label: "Gamification",  path: "/gamification",  icon: "🏆" },
    { label: "Profil",        path: "/profile",       icon: "👤" },
  ],
};