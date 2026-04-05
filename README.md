# 🌿 ECOTRACK — Plateforme Intelligente de Gestion des Déchets Urbains

![CI](https://github.com/Nes91/ecotrack/actions/workflows/ci.yml/badge.svg)

> Projet de fin d'études — Master 2 Développement Web — INGETIS 2026

---

## 📋 Présentation

ECOTRACK est une plateforme IoT intelligente qui transforme la gestion des déchets urbains en un système connecté, optimisé et participatif.

**4 types d'utilisateurs :**
- 👤 **Citoyen** — Signale des conteneurs pleins, accumule des points de gamification
- 🦺 **Agent** — Reçoit ses tournées optimisées sur mobile, valide les collectes
- 👔 **Manager** — Supervise les conteneurs en temps réel, gère les signalements
- ⚙️ **Admin** — Administre la plateforme, les utilisateurs et les agents

---

## 🚀 Stack Technique

| Côté | Technologie |
|---|---|
| Frontend | React 19, React Router, TailwindCSS, Leaflet, Socket.io |
| Backend | Node.js, Express 5, Prisma ORM, JWT, Socket.io |
| Base de données | PostgreSQL + PostGIS |
| Auth | JWT + 2FA (speakeasy) |
| Tests | Jest + Supertest (backend), React Testing Library (frontend) |
| CI/CD | GitHub Actions + Vercel + Render |

---

## 📁 Structure du projet

```
ecotrack/
├── .github/
│   └── workflows/
│       └── ci.yml          # Pipeline CI/CD
├── backend/
│   ├── app.js              # Application Express (sans listen)
│   ├── server.js           # Démarrage serveur + Socket.io
│   ├── prisma/
│   │   └── schema.prisma   # Modèle de données
│   ├── routes/             # Routes supplémentaires
│   ├── middleware/         # Auth, authorize
│   ├── validator/          # Validation Joi
│   ├── services/           # Optimisation tournées (TSP)
│   └── tests/              # Tests Jest + Supertest
└── frontend/
    ├── src/
    │   ├── pages/          # Dashboards par rôle
    │   ├── components/     # Navbar, cards, modals
    │   ├── api/            # Appels Axios
    │   ├── hooks/          # useSocket, useOSRMRoute
    │   └── tests/          # Tests React Testing Library
    └── public/
```

---

## ⚙️ Installation et lancement

### Prérequis
- Node.js 20+
- PostgreSQL 14+

### Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos valeurs

# Appliquer les migrations Prisma
npx prisma migrate dev

# Lancer en développement
npm run dev
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer en développement
npm start
```

L'application sera disponible sur `http://localhost:3000`

---

## 🧪 Tests

### Backend (Jest + Supertest)

```bash
cd backend
npm test
```

```
Test Suites: 6 passed
Tests:       45 passed
```

### Frontend (React Testing Library)

```bash
cd frontend
npm test -- --watchAll=false
```

```
Test Suites: 4 passed
Tests:       22 passed
```

---

## 🔐 Variables d'environnement

### Backend — `.env`

```env
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/ecotrack
SECRET_KEY=votre_secret_jwt_super_long
FRONTEND_URL=http://localhost:3000
```

### Frontend — `.env`

```env
REACT_APP_API_URL=http://localhost:8000
```

---

## 🌐 Déploiement

| Service | URL |
|---|---|
| Frontend (Vercel) | `https://ecotrack.vercel.app` |
| Backend (Render) | `https://ecotrack-api.onrender.com` |

---

## 📊 Fonctionnalités principales

- ✅ Authentification JWT + 2FA (TOTP)
- ✅ RBAC — 4 rôles (Admin, Manager, Agent, Citoyen)
- ✅ Carte interactive des conteneurs (Leaflet + OpenStreetMap)
- ✅ Signalements citoyens avec photo et géolocalisation
- ✅ Optimisation des tournées (algorithme TSP + 2-opt)
- ✅ Gamification (points, badges, niveaux)
- ✅ Notifications temps réel (Socket.io)
- ✅ Dashboard analytics par rôle
- ✅ Missions agents avec suivi en temps réel

---

## 👩‍💻 Auteur

**Nesrine Berra** — Master 2 Développement Web — INGETIS 2026

---

*Projet réalisé dans le cadre du fil rouge INGETIS-ITIS — Usage pédagogique uniquement*