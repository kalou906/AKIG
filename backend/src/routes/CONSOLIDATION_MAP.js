/**
 * AKIG BACKEND - ROUTES CONSOLIDATION MAP
 * ========================================
 * Ce fichier est une référence pour la consolidation complète des routes
 * Toutes les routes doivent être centralisées ici
 */

module.exports = {
    // ===== CORE AUTHENTICATION =====
    '/api/auth/register': {
        method: 'POST',
        file: 'routes/auth.js',
        implemented: true,
        controller: 'registerUser'
    },
    '/api/auth/login': {
        method: 'POST',
        file: 'routes/auth.js',
        implemented: true,
        controller: 'loginUser'
    },
    '/api/auth/logout': {
        method: 'POST',
        file: 'routes/auth.js',
        implemented: true,
        controller: 'logoutUser'
    },
    '/api/auth/profile': {
        method: 'GET',
        file: 'routes/auth.js',
        middleware: ['authMiddleware'],
        implemented: true,
        controller: 'getProfile'
    },

    // ===== USERS MANAGEMENT =====
    '/api/users': {
        GET: {
            method: 'GET',
            file: 'routes/users.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        POST: {
            method: 'POST',
            file: 'routes/users.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },
    '/api/users/:id': {
        GET: {
            method: 'GET',
            file: 'routes/users.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        PUT: {
            method: 'PUT',
            file: 'routes/users.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        DELETE: {
            method: 'DELETE',
            file: 'routes/users.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },

    // ===== TENANTS MANAGEMENT =====
    '/api/tenants': {
        GET: {
            method: 'GET',
            file: 'routes/tenants.js',
            middleware: ['authMiddleware'],
            implemented: true,
            description: 'Lister tous les locataires'
        },
        POST: {
            method: 'POST',
            file: 'routes/tenants.js',
            middleware: ['authMiddleware'],
            implemented: true,
            description: 'Créer un nouveau locataire'
        }
    },
    '/api/tenants/:id': {
        GET: {
            method: 'GET',
            file: 'routes/tenants.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        PUT: {
            method: 'PUT',
            file: 'routes/tenants.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        DELETE: {
            method: 'DELETE',
            file: 'routes/tenants.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },

    // ===== PROPERTIES MANAGEMENT =====
    '/api/properties': {
        GET: {
            method: 'GET',
            file: 'routes/properties.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        POST: {
            method: 'POST',
            file: 'routes/properties.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },
    '/api/properties/:id': {
        GET: {
            method: 'GET',
            file: 'routes/properties.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        PUT: {
            method: 'PUT',
            file: 'routes/properties.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        DELETE: {
            method: 'DELETE',
            file: 'routes/properties.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },

    // ===== CONTRACTS MANAGEMENT =====
    '/api/contracts': {
        GET: {
            method: 'GET',
            file: 'routes/contracts.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        POST: {
            method: 'POST',
            file: 'routes/contracts.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },
    '/api/contracts/:id': {
        GET: {
            method: 'GET',
            file: 'routes/contracts.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        PUT: {
            method: 'PUT',
            file: 'routes/contracts.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        DELETE: {
            method: 'DELETE',
            file: 'routes/contracts.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },

    // ===== PAYMENTS MANAGEMENT =====
    '/api/payments': {
        GET: {
            method: 'GET',
            file: 'routes/payments.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        POST: {
            method: 'POST',
            file: 'routes/payments.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },
    '/api/payments/:id': {
        GET: {
            method: 'GET',
            file: 'routes/payments.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        PUT: {
            method: 'PUT',
            file: 'routes/payments.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },

    // ===== EXPENSES MANAGEMENT =====
    '/api/expenses': {
        GET: {
            method: 'GET',
            file: 'routes/expenses.js',
            middleware: ['authMiddleware'],
            implemented: true
        },
        POST: {
            method: 'POST',
            file: 'routes/expenses.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },
    '/api/expenses/:id': {
        DELETE: {
            method: 'DELETE',
            file: 'routes/expenses.js',
            middleware: ['authMiddleware'],
            implemented: true
        }
    },

    // ===== REPORTS =====
    '/api/reports/dashboard': {
        method: 'GET',
        file: 'routes/reports.js',
        middleware: ['authMiddleware'],
        implemented: true
    },
    '/api/reports/payments': {
        method: 'GET',
        file: 'routes/reports.js',
        middleware: ['authMiddleware'],
        implemented: true
    },
    '/api/reports/properties': {
        method: 'GET',
        file: 'routes/reports.js',
        middleware: ['authMiddleware'],
        implemented: true
    },

    // ===== HEALTH CHECK =====
    '/api/health': {
        method: 'GET',
        file: 'routes/health.js',
        public: true,
        implemented: true
    }
};
