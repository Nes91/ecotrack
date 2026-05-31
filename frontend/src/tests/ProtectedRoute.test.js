import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../pages/ProtectedRoute';

// ─────────────────────────────────────────────────────────────────────────────
// Composant ProtectedRoute.js
// Votre vrai composant : user + allowedRoles → affiche children ou redirige
// ─────────────────────────────────────────────────────────────────────────────

const renderProtected = (user, allowedRoles) =>
  render(
    <MemoryRouter initialEntries={['/protege']}>
      <Routes>
        <Route
          path="/protege"
          element={
            <ProtectedRoute user={user} allowedRoles={allowedRoles}>
              <div>Contenu protégé</div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<div>Accueil</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  it('affiche le contenu si le rôle est autorisé', () => {
    renderProtected({ role: 'ADMIN' }, ['ADMIN', 'MANAGER']);
    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('affiche le contenu si MANAGER et rôle autorisé', () => {
    renderProtected({ role: 'MANAGER' }, ['ADMIN', 'MANAGER']);
    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('redirige si le rôle n\'est pas autorisé (CITIZEN vers page admin)', () => {
    renderProtected({ role: 'CITIZEN' }, ['ADMIN', 'MANAGER']);
    // Le contenu protégé ne doit pas être affiché
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('redirige si aucun utilisateur (null)', () => {
    renderProtected(null, ['ADMIN']);
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('affiche le contenu pour AGENT si autorisé', () => {
    renderProtected({ role: 'AGENT' }, ['ADMIN', 'AGENT', 'MANAGER']);
    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });
});
