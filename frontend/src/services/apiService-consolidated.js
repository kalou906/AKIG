/**
 * AKIG Frontend - Consolidated API Service
 * Centralized API calls for all backend endpoints
 * Version: 1.0 (Production)
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// ===== HELPER FUNCTIONS =====

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

// ===== AUTHENTICATION SERVICE =====

export const authService = {
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email, password })
        });
        return handleResponse(response);
    },

    register: async (name, email, password, role = 'user') => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, email, password, role })
        });
        return handleResponse(response);
    },

    logout: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    getProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

// ===== TENANTS SERVICE =====

export const tenantsService = {
    list: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/tenants?${queryString}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/tenants`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    getContracts: async (id) => {
        const response = await fetch(`${API_BASE_URL}/tenants/${id}/contracts`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    getPayments: async (id) => {
        const response = await fetch(`${API_BASE_URL}/tenants/${id}/payments`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

// ===== PROPERTIES SERVICE =====

export const propertiesService = {
    list: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/properties?${queryString}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/properties`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    search: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/properties/search/advanced?${queryString}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    getTenants: async (id) => {
        const response = await fetch(`${API_BASE_URL}/properties/${id}/tenants`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

// ===== CONTRACTS SERVICE =====

export const contractsService = {
    list: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/contracts?${queryString}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/contracts/${id}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/contracts`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/contracts/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/contracts/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    renew: async (id, newEndDate) => {
        const response = await fetch(`${API_BASE_URL}/contracts/${id}/renew`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ newEndDate })
        });
        return handleResponse(response);
    },

    terminate: async (id, terminationDate, reason) => {
        const response = await fetch(`${API_BASE_URL}/contracts/${id}/terminate`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ terminationDate, reason })
        });
        return handleResponse(response);
    }
};

// ===== PAYMENTS SERVICE =====

export const paymentsService = {
    list: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/payments?${queryString}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/payments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    getMonthlyStats: async (year) => {
        const response = await fetch(`${API_BASE_URL}/payments/stats/monthly?year=${year}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    getTenantPayments: async (tenantId) => {
        const response = await fetch(`${API_BASE_URL}/payments/tenant/${tenantId}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    bulkImport: async (payments) => {
        const response = await fetch(`${API_BASE_URL}/payments/bulk`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ payments })
        });
        return handleResponse(response);
    }
};

// ===== HEALTH SERVICE =====

export const healthService = {
    check: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return handleResponse(response);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ===== DEFAULT EXPORT =====

export default {
    authService,
    tenantsService,
    propertiesService,
    contractsService,
    paymentsService,
    healthService
};
