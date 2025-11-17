/**
 * Tests des routes de préférences utilisateur
 */

const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/db');

// Mock du pool
jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

const mockUser = {
  id: 1,
  email: 'test@akig.com',
  name: 'Test User',
};

const mockPreferences = {
  user_id: 1,
  locale: 'fr',
  theme: 'light',
  notif_channel: 'email',
  notif_email: true,
  notif_sms: false,
  notif_push: false,
  notif_frequency: 'immediate',
  widgets: [],
  saved_filters: {},
};

// Mock du middleware d'authentification
jest.mock('../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = mockUser;
    next();
  },
}));

describe('Preferences Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/preferences', () => {
    test('retourne les préférences de l\'utilisateur', async () => {
      pool.query.mockResolvedValue({
        rows: [mockPreferences],
      });

      const res = await request(app)
        .get('/api/user/preferences/');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual(mockPreferences);
    });

    test('retourne un objet vide si pas de préférences', async () => {
      pool.query.mockResolvedValue({
        rows: [],
      });

      const res = await request(app)
        .get('/api/user/preferences/');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('gère les erreurs de base de données', async () => {
      pool.query.mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .get('/api/user/preferences/');

      expect(res.status).toBe(500);
      expect(res.body.ok).toBe(false);
      expect(res.body.code).toBe('PREF_FETCH_ERROR');
    });
  });

  describe('PUT /api/user/preferences', () => {
    test('met à jour le thème', async () => {
      pool.query.mockResolvedValue({
        rows: [{ ...mockPreferences, theme: 'dark' }],
      });

      const res = await request(app)
        .put('/api/user/preferences/')
        .send({ theme: 'dark' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.theme).toBe('dark');
    });

    test('met à jour la locale', async () => {
      pool.query.mockResolvedValue({
        rows: [{ ...mockPreferences, locale: 'en' }],
      });

      const res = await request(app)
        .put('/api/user/preferences/')
        .send({ locale: 'en' });

      expect(res.status).toBe(200);
      expect(res.body.data.locale).toBe('en');
    });

    test('met à jour plusieurs champs', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          ...mockPreferences,
          theme: 'dark',
          locale: 'en',
          notif_frequency: 'daily',
        }],
      });

      const res = await request(app)
        .put('/api/user/preferences/')
        .send({
          theme: 'dark',
          locale: 'en',
          notif_frequency: 'daily',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.theme).toBe('dark');
      expect(res.body.data.locale).toBe('en');
    });

    test('retourne erreur si aucun champ fourni', async () => {
      const res = await request(app)
        .put('/api/user/preferences/')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.code).toBe('NO_UPDATES');
    });

    test('valide la locale', async () => {
      pool.query.mockRejectedValue(
        new Error('Locale invalide: xx')
      );

      const res = await request(app)
        .put('/api/user/preferences/')
        .send({ locale: 'xx' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    test('valide le thème', async () => {
      pool.query.mockRejectedValue(
        new Error('Thème invalide: neon')
      );

      const res = await request(app)
        .put('/api/user/preferences/')
        .send({ theme: 'neon' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/user/preferences/widgets', () => {
    test('retourne les widgets configurés', async () => {
      const widgets = [
        { id: 'occupancy', type: 'chart' },
        { id: 'revenue', type: 'stat' },
      ];

      pool.query.mockResolvedValue({
        rows: [{ ...mockPreferences, widgets }],
      });

      const res = await request(app)
        .get('/api/user/preferences/widgets');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual(widgets);
    });

    test('retourne un array vide si pas de widgets', async () => {
      pool.query.mockResolvedValue({
        rows: [{ ...mockPreferences, widgets: null }],
      });

      const res = await request(app)
        .get('/api/user/preferences/widgets');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('PUT /api/user/preferences/widgets', () => {
    test('met à jour les widgets', async () => {
      const widgets = [
        { id: 'occupancy', type: 'chart' },
        { id: 'revenue', type: 'stat' },
      ];

      pool.query.mockResolvedValue({
        rows: [{ widgets }],
      });

      const res = await request(app)
        .put('/api/user/preferences/widgets')
        .send({ widgets });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual(widgets);
    });

    test('retourne erreur si widgets manquant', async () => {
      const res = await request(app)
        .put('/api/user/preferences/widgets')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_WIDGETS');
    });

    test('valide que widgets est un array', async () => {
      pool.query.mockRejectedValue(
        new Error('Les widgets doivent être un array')
      );

      const res = await request(app)
        .put('/api/user/preferences/widgets')
        .send({ widgets: 'not-array' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/user/preferences/filters', () => {
    test('retourne les filtres sauvegardés', async () => {
      const filters = {
        active: { config: { status: 'active' } },
        recent: { config: { period: '7d' } },
      };

      pool.query.mockResolvedValue({
        rows: [{ ...mockPreferences, saved_filters: filters }],
      });

      const res = await request(app)
        .get('/api/user/preferences/filters');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual(filters);
    });
  });

  describe('POST /api/user/preferences/filters/:filterName', () => {
    test('sauvegarde un nouveau filtre', async () => {
      const config = { status: 'active', period: '30d' };
      const filters = {
        my_filter: {
          config,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ saved_filters: {} }] })
        .mockResolvedValueOnce({ rows: [{ saved_filters: filters }] });

      const res = await request(app)
        .post('/api/user/preferences/filters/my_filter')
        .send({ config });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toContain('my_filter');
    });

    test('valide le nom du filtre', async () => {
      const res = await request(app)
        .post('/api/user/preferences/filters/')
        .send({ config: { status: 'active' } });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_FILTER_NAME');
    });

    test('retourne erreur si configuration manquante', async () => {
      const res = await request(app)
        .post('/api/user/preferences/filters/test')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_CONFIG');
    });
  });

  describe('GET /api/user/preferences/filters/:filterName', () => {
    test('retourne un filtre spécifique', async () => {
      const filter = {
        config: { status: 'active' },
        created_at: '2025-10-24T00:00:00Z',
      };

      pool.query.mockResolvedValue({
        rows: [{
          ...mockPreferences,
          saved_filters: { my_filter: filter },
        }],
      });

      const res = await request(app)
        .get('/api/user/preferences/filters/my_filter');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual(filter);
    });

    test('retourne 404 si filtre non trouvé', async () => {
      pool.query.mockResolvedValue({
        rows: [{ ...mockPreferences, saved_filters: {} }],
      });

      const res = await request(app)
        .get('/api/user/preferences/filters/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('FILTER_NOT_FOUND');
    });
  });

  describe('DELETE /api/user/preferences/filters/:filterName', () => {
    test('supprime un filtre existant', async () => {
      const filters = { other_filter: {} };

      pool.query
        .mockResolvedValueOnce({
          rows: [{
            saved_filters: {
              my_filter: {},
              other_filter: {},
            },
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ saved_filters: filters }],
        });

      const res = await request(app)
        .delete('/api/user/preferences/filters/my_filter');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toContain('supprimé');
    });

    test('retourne 404 si filtre non trouvé', async () => {
      pool.query.mockRejectedValue(
        new Error('Filtre "nonexistent" non trouvé')
      );

      const res = await request(app)
        .delete('/api/user/preferences/filters/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('FILTER_NOT_FOUND');
    });
  });

  describe('POST /api/user/preferences/reset', () => {
    test('réinitialise les préférences par défaut', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          user_id: 1,
          locale: 'fr',
          theme: 'light',
          notif_channel: 'email',
          widgets: [],
        }],
      });

      const res = await request(app)
        .post('/api/user/preferences/reset');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toContain('par défaut');
      expect(res.body.data.locale).toBe('fr');
      expect(res.body.data.theme).toBe('light');
    });

    test('gère les erreurs de réinitialisation', async () => {
      pool.query.mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .post('/api/user/preferences/reset');

      expect(res.status).toBe(500);
      expect(res.body.code).toBe('PREF_RESET_ERROR');
    });
  });

  describe('Integration', () => {
    test('met à jour puis récupère les préférences', async () => {
      // Mock PUT
      pool.query.mockResolvedValueOnce({
        rows: [{ ...mockPreferences, theme: 'dark' }],
      });

      const updateRes = await request(app)
        .put('/api/user/preferences/')
        .send({ theme: 'dark' });

      expect(updateRes.status).toBe(200);

      // Mock GET
      pool.query.mockResolvedValueOnce({
        rows: [{ ...mockPreferences, theme: 'dark' }],
      });

      const getRes = await request(app)
        .get('/api/user/preferences/');

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.theme).toBe('dark');
    });
  });
});
