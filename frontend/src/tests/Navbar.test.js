import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

const mockUser = {
  firstName: 'Jean',
  lastName: 'Dupont',
  role: 'ADMIN',
};

const mockUserCitoyen = {
  firstName: 'Marie',
  lastName: 'Martin',
  role: 'CITIZEN',
};

const renderNavbar = (user = mockUser, onLogout = jest.fn()) =>
  render(
    <MemoryRouter>
      <Navbar user={user} onLogout={onLogout} />
    </MemoryRouter>
  );

describe('Navbar', () => {
  it('affiche le logo EcoTrack', () => {
    renderNavbar();
    expect(screen.getByText(/eco/i)).toBeInTheDocument();
  });

  it('affiche le prénom et nom de l\'utilisateur', () => {
    renderNavbar();
    // getAllByText car desktop + mobile affichent le nom
    expect(screen.getAllByText('Jean Dupont')[0]).toBeInTheDocument();
  });

  it('affiche le rôle de l\'utilisateur', () => {
    renderNavbar();
    // Navbar affiche le rôle 2 fois (desktop + mobile) → on prend le premier
    expect(screen.getAllByText('ADMIN')[0]).toBeInTheDocument();
  });

  it('affiche les initiales de l\'utilisateur dans l\'avatar', () => {
    renderNavbar();
    // Initiales affichées 2 fois (desktop + mobile) → on prend le premier
    expect(screen.getAllByText('JD')[0]).toBeInTheDocument();
  });

  it('appelle onLogout quand on clique sur le bouton de déconnexion', () => {
    const mockLogout = jest.fn();
    renderNavbar(mockUser, mockLogout);
    const logoutBtns = screen.getAllByRole('button');
    fireEvent.click(logoutBtns[0]);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('affiche "CITIZEN" pour un utilisateur citoyen', () => {
    renderNavbar(mockUserCitoyen);
    // Rôle affiché 2 fois (desktop + mobile) → getAllByText
    expect(screen.getAllByText('CITIZEN')[0]).toBeInTheDocument();
  });

  it('affiche les initiales MM pour Marie Martin', () => {
    renderNavbar(mockUserCitoyen);
    // Initiales affichées 2 fois (desktop + mobile) → getAllByText
    expect(screen.getAllByText('MM')[0]).toBeInTheDocument();
  });
});