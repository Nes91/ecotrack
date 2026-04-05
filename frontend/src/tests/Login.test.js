import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../pages/Login';
import API from '../api/api';

jest.mock('../api/api', () => ({
  post: jest.fn(),
}));


// ─────────────────────────────────────────────────────────────────────────────
// Composant Login.js
// Votre vrai composant : email + password → POST /login → onLoginSuccess(data)
// ─────────────────────────────────────────────────────────────────────────────
describe('Login', () => {
  beforeEach(() => {
    API.post.mockClear();
  });

  it('affiche le titre "Connexion"', () => {
    render(<Login onLoginSuccess={() => {}} />);
    expect(screen.getByText('Connexion')).toBeInTheDocument();
  });

  it('affiche les champs email et mot de passe', () => {
    render(<Login onLoginSuccess={() => {}} />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument();
  });

  it('affiche le bouton "Se connecter"', () => {
    render(<Login onLoginSuccess={() => {}} />);
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('met à jour le champ email à la saisie', () => {
    render(<Login onLoginSuccess={() => {}} />);
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'agent@ecotrack.fr' } });
    expect(emailInput.value).toBe('agent@ecotrack.fr');
  });

  it('met à jour le champ mot de passe à la saisie', () => {
    render(<Login onLoginSuccess={() => {}} />);
    const passInput = screen.getByPlaceholderText('Mot de passe');
    fireEvent.change(passInput, { target: { value: 'monmotdepasse' } });
    expect(passInput.value).toBe('monmotdepasse');
  });

  it('appelle API.post avec les bons paramètres au submit', async () => {
    API.post.mockResolvedValueOnce({ data: { token: 'jwt_token', role: 'CITIZEN', id: 1, name: 'Jean Dupont' } });

    render(<Login onLoginSuccess={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'jean@ecotrack.fr' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), {
      target: { value: 'monmotdepasse' },
    });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/login', {
        email: 'jean@ecotrack.fr',
        password: 'monmotdepasse',
      });
    });
  });

  it('appelle onLoginSuccess avec les données reçues si login réussi', async () => {
    const mockData = { token: 'jwt_token', role: 'AGENT', id: 2, name: 'Marie Dupont' };
    API.post.mockResolvedValueOnce({ data: mockData });
    const mockOnSuccess = jest.fn();

    render(<Login onLoginSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'marie@ecotrack.fr' } });
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockData);
    });
  });

  it('affiche un message d\'erreur si la connexion échoue', async () => {
    API.post.mockRejectedValueOnce({
      response: { data: { error: 'Email ou mot de passe invalide' } },
    });

    render(<Login onLoginSuccess={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'faux@ecotrack.fr' } });
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), { target: { value: 'mauvaispass' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('Email ou mot de passe invalide')).toBeInTheDocument();
    });
  });

  it('affiche un message d\'erreur générique si pas de message serveur', async () => {
    API.post.mockRejectedValueOnce({});

    render(<Login onLoginSuccess={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'faux@ecotrack.fr' } });
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), { target: { value: 'mauvaispass' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de la connexion')).toBeInTheDocument();
    });
  });
});
