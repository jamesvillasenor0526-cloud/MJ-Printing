// API Helper Library for MJ Print Services
// Base URL for backend API - dynamically detects current host
const API_URL = (window.location.protocol === 'file:')
    ? 'http://localhost:5000/api'
    : window.location.origin + '/api';

// Store JWT token in localStorage with context awareness
const TokenManager = {
    isAdminPage: () => window.location.pathname.includes('admin'),

    get: () => {
        if (TokenManager.isAdminPage()) {
            return localStorage.getItem('mj_admin_token');
        }
        return localStorage.getItem('mj_token');
    },

    set: (token, role) => {
        if (role === 'admin' || role === 'superadmin') {
            localStorage.setItem('mj_admin_token', token);
        } else {
            localStorage.setItem('mj_token', token);
        }
    },

    remove: () => {
        if (TokenManager.isAdminPage()) {
            localStorage.removeItem('mj_admin_token');
        } else {
            localStorage.removeItem('mj_token');
        }
    }
};

// Generic API request function
async function apiRequest(endpoint, options = {}) {
    const token = TokenManager.get();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    // Remove Content-Type for FormData (file uploads)
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        // Check if response is OK before parsing JSON
        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            let errorMessage = `API request failed: ${response.status}`;
            try {
                const data = await response.json();
                if (data.message) {
                    errorMessage = data.message;
                }
            } catch (parseError) {
                // If JSON parsing fails, use status text
                errorMessage = `API request failed: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Products API
const ProductsAPI = {
    getAll: async (category) => {
        let url = '/products';
        if (category) url += `?category=${encodeURIComponent(category)}`;
        return await apiRequest(url, { method: 'GET' });
    },

    getCategories: async () => {
        return await apiRequest('/products/categories', { method: 'GET' });
    },

    // Admin methods
    getAllAdmin: async () => {
        return await apiRequest('/products/admin/all', { method: 'GET' });
    },

    create: async (formData) => {
        return await apiRequest('/products/admin', {
            method: 'POST',
            body: formData
        });
    },

    update: async (id, formData) => {
        return await apiRequest(`/products/admin/${id}`, {
            method: 'PUT',
            body: formData
        });
    },

    delete: async (id) => {
        return await apiRequest(`/products/admin/${id}`, {
            method: 'DELETE'
        });
    },

    uploadPortfolioImages: async (id, formData) => {
        return await apiRequest(`/products/admin/${id}/portfolio`, {
            method: 'POST',
            body: formData
        });
    },

    deletePortfolioImage: async (id, imageUrl) => {
        return await apiRequest(`/products/admin/${id}/portfolio/remove`, {
            method: 'PUT',
            body: JSON.stringify({ imageUrl })
        });
    }
};

// Authentication API
const AuthAPI = {
    register: async (userData) => {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (data.token) TokenManager.set(data.token, data.role || 'user');
        return data;
    },

    login: async (identifier, password) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username: identifier, password })
        });
        if (data.token) TokenManager.set(data.token, data.role);
        return data;
    },

    getCurrentUser: async () => {
        return await apiRequest('/auth/me', {
            method: 'GET'
        });
    },

    logout: () => {
        TokenManager.remove();
        // Clear both just in case of confused state during migration, 
        // OR rely on context. For safety, we can explicitly clear legacy if needed, 
        // but TokenManager.remove() handles the current context.
        // We'll leave localStorage.removeItem('mj_session') as legacy cleanup.
        localStorage.removeItem('mj_session');
    },

    isAuthenticated: () => {
        return !!TokenManager.get();
    }
};

// Users API
const UsersAPI = {
    getProfile: async () => {
        return await apiRequest('/users/profile', {
            method: 'GET'
        });
    },

    updateProfile: async (userData) => {
        return await apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    changePassword: async (currentPassword, newPassword) => {
        return await apiRequest('/users/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    // Addresses
    addAddress: async (address) => {
        return await apiRequest('/users/addresses', {
            method: 'POST',
            body: JSON.stringify(address)
        });
    },

    updateAddress: async (id, address) => {
        return await apiRequest(`/users/addresses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(address)
        });
    },

    deleteAddress: async (id) => {
        return await apiRequest(`/users/addresses/${id}`, {
            method: 'DELETE'
        });
    },

    // Notifications
    updateNotifications: async (notifications) => {
        return await apiRequest('/users/notifications', {
            method: 'PUT',
            body: JSON.stringify(notifications)
        });
    }
};

// Orders API
const OrdersAPI = {
    create: async (orderData, files = [], paymentProofFile = null) => {
        const formData = new FormData();

        // Add order data
        formData.append('items', JSON.stringify(orderData.items));
        formData.append('subtotal', orderData.subtotal);
        formData.append('shippingFee', orderData.shippingFee || 20);
        formData.append('total', orderData.total);
        formData.append('address', orderData.address);
        formData.append('deliveryMethod', orderData.deliveryMethod);
        formData.append('paymentMethod', orderData.paymentMethod || 'gcash');
        formData.append('paymentType', orderData.paymentType || 'full');
        formData.append('phone', orderData.phone);

        // Add files
        files.forEach(file => {
            formData.append('files', file);
        });

        // Add payment proof if available
        if (paymentProofFile) {
            formData.append('paymentProof', paymentProofFile);
        }

        return await apiRequest('/orders', {
            method: 'POST',
            body: formData
        });
    },

    getUserOrders: async () => {
        return await apiRequest('/orders', {
            method: 'GET'
        });
    },

    getById: async (id) => {
        return await apiRequest(`/orders/${id}`, {
            method: 'GET'
        });
    },

    trackByReference: async (referenceId) => {
        return await fetch(`${API_URL}/orders/track/${referenceId}`)
            .then(res => res.json());
    },

    cancel: async (id) => {
        return await apiRequest(`/orders/${id}/cancel`, {
            method: 'PUT'
        });
    },

    confirmReceived: async (id) => {
        return await apiRequest(`/orders/${id}/confirm`, {
            method: 'PUT'
        });
    },

    // Admin
    getAllOrders: async () => {
        return await apiRequest('/orders/admin/all', {
            method: 'GET'
        });
    },

    updateStatus: async (id, status) => {
        return await apiRequest(`/orders/admin/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    delete: async (id) => {
        return await apiRequest(`/orders/admin/${id}`, {
            method: 'DELETE'
        });
    },

    uploadProof: async (id, file) => {
        console.log('OrdersAPI.uploadProof called with id:', id, 'file:', file);
        const formData = new FormData();
        formData.append('proof', file);
        console.log('FormData prepared, calling apiRequest');
        return await apiRequest(`/orders/admin/${id}/proof`, {
            method: 'PUT',
            body: formData
        });
    }
};

// Reviews API
const ReviewsAPI = {
    getAll: async () => {
        return await fetch(`${API_URL}/reviews`)
            .then(res => res.json());
    },

    create: async (rating, text, orderId, imageFile = null) => {
        if (imageFile) {
            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('text', text);
            if (orderId) formData.append('orderId', orderId);
            formData.append('image', imageFile);
            return await apiRequest('/reviews', {
                method: 'POST',
                body: formData
            });
        }
        return await apiRequest('/reviews', {
            method: 'POST',
            body: JSON.stringify({ rating, text, orderId })
        });
    },

    addReply: async (id, reply) => {
        return await apiRequest(`/reviews/${id}/reply`, {
            method: 'PUT',
            body: JSON.stringify({ reply })
        });
    },

    delete: async (id) => {
        return await apiRequest(`/reviews/${id}`, {
            method: 'DELETE'
        });
    }
};

// Chats API
const ChatsAPI = {
    startOrGet: async () => {
        return await apiRequest('/chats', {
            method: 'POST'
        });
    },

    getHistory: async (sessionId) => {
        return await apiRequest(`/chats/${sessionId}`, {
            method: 'GET'
        });
    },

    sendMessage: async (sessionId, text, isAutoReply = false) => {
        return await apiRequest(`/chats/${sessionId}/message`, {
            method: 'POST',
            body: JSON.stringify({ text, isAutoReply })
        });
    },

    // Admin
    getAllChats: async () => {
        return await apiRequest('/chats/admin/all', {
            method: 'GET'
        });
    },

    updateStatus: async (sessionId, status) => {
        return await apiRequest(`/chats/admin/${sessionId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    deleteChat: async (sessionId) => {
        return await apiRequest(`/chats/admin/${sessionId}`, {
            method: 'DELETE'
        });
    }
};

// Notifications API (Admin)
const NotificationsAPI = {
    getAll: async () => {
        return await apiRequest('/notifications', { method: 'GET' });
    },

    markRead: async (id) => {
        return await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
    },

    markAllRead: async () => {
        return await apiRequest('/notifications/read-all', { method: 'PUT' });
    },

    delete: async (id) => {
        return await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
    }
};

// Helper to check if user is logged in
function isAuthenticated() {
    return !!TokenManager.get();
}

// Helper to get current user from token (decode JWT)
function getCurrentUserFromToken() {
    const token = TokenManager.get();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (error) {
        return null;
    }
}
