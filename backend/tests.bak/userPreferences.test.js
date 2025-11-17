/**
 * Tests du service de préférences utilisateur
 */

const {
  getPreferences,
  createDefaultPreferences,
  updatePreferences,
  updateWidgets,
  saveFilter,
  deleteFilter,
} = require('../src/services/userPreferences');

// Mock du pool
const mockPool = {
  query: jest.fn(),
};

describe('User Preferences Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    test('retourne les préférences existantes', async () => {
      const mockPreferences = {
        user_id: 1,
        locale: 'fr',
        theme: 'dark',
        notif_channel: 'email',
        widgets: [],
        saved_filters: {},
      };

      mockPool.query.mockResolvedValue({ rows: [mockPreferences] });

      const result = await getPreferences(mockPool, 1);

      expect(result.user_id).toBe(1);
      expect(result.locale).toBe('fr');
      expect(result.theme).toBe('dark');
    });

    test('crée les préférences par défaut si elles n\'existent pas', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Première requête: pas trouvé
        .mockResolvedValueOnce({
          rows: [{
            user_id: 2,
            locale: 'fr',
            theme: 'light',
            notif_channel: 'email',
          }],
        }); // Deuxième requête: créé

      const result = await getPreferences(mockPool, 2);

      expect(result.user_id).toBe(2);
      expect(result.locale).toBe('fr');
    });

    test('gère les erreurs de base de données', async () => {
      mockPool.query.mockRejectedValue(new Error('DB Error'));

      await expect(getPreferences(mockPool, 1)).rejects.toThrow('DB Error');
    });
  });

  describe('createDefaultPreferences', () => {
    test('crée les préférences par défaut pour un nouvel utilisateur', async () => {
      const mockCreated = {
        user_id: 3,
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

      mockPool.query.mockResolvedValue({ rows: [mockCreated] });

      const result = await createDefaultPreferences(mockPool, 3);

      expect(result.user_id).toBe(3);
      expect(result.locale).toBe('fr');
      expect(result.theme).toBe('light');
      expect(result.notif_email).toBe(true);
    });
  });

  describe('updatePreferences', () => {
    test('met à jour un champ simple', async () => {
      const mockUpdated = {
        user_id: 1,
        locale: 'fr',
        theme: 'dark',
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdated] });

      const result = await updatePreferences(mockPool, 1, { theme: 'dark' });

      expect(result.theme).toBe('dark');
    });

    test('met à jour plusieurs champs', async () => {
      const mockUpdated = {
        user_id: 1,
        locale: 'en',
        theme: 'dark',
        notif_frequency: 'daily',
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdated] });

      const result = await updatePreferences(mockPool, 1, {
        locale: 'en',
        theme: 'dark',
        notif_frequency: 'daily',
      });

      expect(result.locale).toBe('en');
      expect(result.theme).toBe('dark');
      expect(result.notif_frequency).toBe('daily');
    });

    test('valide la locale', async () => {
      await expect(
        updatePreferences(mockPool, 1, { locale: 'invalid' })
      ).rejects.toThrow('Locale invalide');
    });

    test('valide le thème', async () => {
      await expect(
        updatePreferences(mockPool, 1, { theme: 'invalid' })
      ).rejects.toThrow('Thème invalide');
    });

    test('valide la fréquence de notification', async () => {
      await expect(
        updatePreferences(mockPool, 1, { notif_frequency: 'invalid' })
      ).rejects.toThrow('Fréquence invalide');
    });

    test('valide les booléens de notification', async () => {
      await expect(
        updatePreferences(mockPool, 1, { notif_email: 'true' })
      ).rejects.toThrow('notif_email doit être un booléen');
    });

    test('ignore les champs invalides', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ user_id: 1 }] });

      await updatePreferences(mockPool, 1, {
        invalidField: 'value',
        theme: 'dark',
      });

      // Devrait ignorer invalidField
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('updateWidgets', () => {
    test('met à jour les widgets', async () => {
      const widgets = [
        { id: 'occupancy', type: 'chart' },
        { id: 'revenue', type: 'stat' },
      ];

      mockPool.query.mockResolvedValue({
        rows: [{ widgets }],
      });

      const result = await updateWidgets(mockPool, 1, widgets);

      expect(result).toEqual(widgets);
    });

    test('valide que widgets est un array', async () => {
      await expect(
        updateWidgets(mockPool, 1, 'not-array')
      ).rejects.toThrow('Les widgets doivent être un array');
    });

    test('valide que chaque widget a id et type', async () => {
      const invalidWidgets = [
        { id: 'occupancy' }, // Manque type
      ];

      await expect(
        updateWidgets(mockPool, 1, invalidWidgets)
      ).rejects.toThrow('invalide: id et type requis');
    });

    test('gère les widgets vides', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ widgets: [] }],
      });

      const result = await updateWidgets(mockPool, 1, []);

      expect(result).toEqual([]);
    });
  });

  describe('saveFilter', () => {
    test('sauvegarde un nouveau filtre', async () => {
      const filterConfig = { status: 'active', period: '30d' };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ saved_filters: {} }],
        })
        .mockResolvedValueOnce({
          rows: [{
            saved_filters: {
              my_filter: {
                config: filterConfig,
                created_at: expect.any(String),
                updated_at: expect.any(String),
              },
            },
          }],
        });

      const result = await saveFilter(mockPool, 1, 'my_filter', filterConfig);

      expect(result.my_filter).toBeDefined();
      expect(result.my_filter.config).toEqual(filterConfig);
    });

    test('met à jour un filtre existant', async () => {
      const oldFilter = {
        my_filter: {
          config: { status: 'inactive' },
          created_at: '2025-10-20T00:00:00Z',
          updated_at: '2025-10-20T00:00:00Z',
        },
      };

      const newConfig = { status: 'active', period: '7d' };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ saved_filters: oldFilter }],
        })
        .mockResolvedValueOnce({
          rows: [{
            saved_filters: {
              ...oldFilter,
              my_filter: {
                ...oldFilter.my_filter,
                config: newConfig,
                updated_at: expect.any(String),
              },
            },
          }],
        });

      const result = await saveFilter(mockPool, 1, 'my_filter', newConfig);

      expect(result.my_filter.config).toEqual(newConfig);
      expect(result.my_filter.created_at).toBe(oldFilter.my_filter.created_at);
    });
  });

  describe('deleteFilter', () => {
    test('supprime un filtre existant', async () => {
      const savedFilters = {
        filter1: { config: {} },
        filter2: { config: {} },
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ saved_filters: savedFilters }],
        })
        .mockResolvedValueOnce({
          rows: [{
            saved_filters: {
              filter2: savedFilters.filter2,
            },
          }],
        });

      const result = await deleteFilter(mockPool, 1, 'filter1');

      expect(result.filter1).toBeUndefined();
      expect(result.filter2).toBeDefined();
    });

    test('lance une erreur si le filtre n\'existe pas', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ saved_filters: {} }],
      });

      await expect(
        deleteFilter(mockPool, 1, 'nonexistent')
      ).rejects.toThrow('Filtre "nonexistent" non trouvé');
    });

    test('gère les filtres sauvegardés vides', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ saved_filters: {} }],
      });

      await expect(
        deleteFilter(mockPool, 1, 'any_filter')
      ).rejects.toThrow('Filtre "any_filter" non trouvé');
    });
  });

  describe('Validation', () => {
    test('valide les locales supportées', async () => {
      const validLocales = ['fr', 'en', 'es'];

      for (const locale of validLocales) {
        mockPool.query.mockResolvedValue({ rows: [{ user_id: 1 }] });

        // Devrait pas lever d'erreur
        await updatePreferences(mockPool, 1, { locale });
      }

      expect(mockPool.query).toHaveBeenCalledTimes(validLocales.length);
    });

    test('valide les thèmes supportés', async () => {
      const validThemes = ['light', 'dark', 'auto'];

      for (const theme of validThemes) {
        mockPool.query.mockResolvedValue({ rows: [{ user_id: 1 }] });

        // Devrait pas lever d'erreur
        await updatePreferences(mockPool, 1, { theme });
      }

      expect(mockPool.query).toHaveBeenCalledTimes(validThemes.length);
    });

    test('valide les canaux de notification', async () => {
      const validChannels = ['email', 'sms', 'push', 'none'];

      for (const channel of validChannels) {
        mockPool.query.mockResolvedValue({ rows: [{ user_id: 1 }] });

        // Devrait pas lever d'erreur
        await updatePreferences(mockPool, 1, { notif_channel: channel });
      }

      expect(mockPool.query).toHaveBeenCalledTimes(validChannels.length);
    });
  });

  describe('Edge Cases', () => {
    test('gère les préférences NULL', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          user_id: 1,
          locale: null,
          widgets: null,
          saved_filters: null,
        }],
      });

      const result = await getPreferences(mockPool, 1);
      expect(result.user_id).toBe(1);
    });

    test('gère les widgets complexes avec configuration imbriquée', async () => {
      const complexWidgets = [
        {
          id: 'chart1',
          type: 'chart',
          config: {
            title: 'Revenue',
            series: [
              { name: 'income', data: [1, 2, 3] },
              { name: 'expense', data: [0.5, 1, 1.5] },
            ],
          },
        },
      ];

      mockPool.query.mockResolvedValue({
        rows: [{ widgets: complexWidgets }],
      });

      const result = await updateWidgets(mockPool, 1, complexWidgets);

      expect(result[0].config.series).toHaveLength(2);
    });

    test('gère plusieurs filtres sauvegardés', async () => {
      const manyFilters = {};
      for (let i = 0; i < 10; i++) {
        manyFilters[`filter${i}`] = {
          config: { index: i },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ saved_filters: manyFilters }],
        })
        .mockResolvedValueOnce({
          rows: [{ saved_filters: manyFilters }],
        });

      const result = await deleteFilter(mockPool, 1, 'filter5');

      expect(Object.keys(result)).toHaveLength(9);
    });
  });
});
