document.addEventListener('alpine:init', () => {
    Alpine.store('cart', {
        items: [],
        deliveryMethod: 'delivery', // 'delivery' or 'pickup'

        init() {
            // Auto-wipe stale data from older versions
            if (localStorage.getItem('mj_cart_version') !== '11') {
                console.log('[Cart] Wiping local storage for clean V11 migration.');
                localStorage.removeItem('mj_cart');
                localStorage.removeItem('mj_deliveryMethod');
                localStorage.setItem('mj_cart_version', '11');
            }

            // Load from localStorage if available
            if (localStorage.getItem('mj_cart')) {
                try {
                    const saved = JSON.parse(localStorage.getItem('mj_cart'));
                    // Ensure every item has a valid string id
                    this.items = (Array.isArray(saved) ? saved : []).map(item => ({
                        ...item,
                        id: item.id ? String(item.id) : ('cart_' + Date.now() + '_' + Math.random().toString(36).slice(2))
                    }));
                } catch (e) {
                    console.error('Failed to parse localStorage cart:', e);
                    this.items = [];
                }
            }
            if (localStorage.getItem('mj_deliveryMethod')) {
                this.deliveryMethod = localStorage.getItem('mj_deliveryMethod');
            }

            // Watch for changes and save to localStorage
            Alpine.effect(() => {
                localStorage.setItem('mj_cart', JSON.stringify(this.items));
                localStorage.setItem('mj_deliveryMethod', this.deliveryMethod);
            });
        },

        add(item) {
            // Normalize for comparison
            const newName = (item.name || '').trim();
            const newDetails = (item.details || '').trim();

            // Find existing item with matching name AND details
            const existingIndex = this.items.findIndex(i =>
                (i.name || '').trim() === newName &&
                (i.details || '').trim() === newDetails
            );

            if (existingIndex !== -1) {
                // Build new array for Alpine reactivity
                const updated = [];
                for (let idx = 0; idx < this.items.length; idx++) {
                    if (idx === existingIndex) {
                        updated.push({
                            ...this.items[idx],
                            quantity: this.items[idx].quantity + (item.quantity || 1),
                            file: item.file || this.items[idx].file,
                            imagePreview: item.imagePreview || this.items[idx].imagePreview,
                            price: item.price || this.items[idx].price
                        });
                    } else {
                        updated.push(this.items[idx]);
                    }
                }
                this.items = updated;
            } else {
                const newItem = {
                    id: 'cart_' + Date.now() + '_' + Math.random().toString(36).slice(2),
                    name: newName,
                    details: newDetails,
                    file: item.file || '',
                    imagePreview: item.imagePreview || null,
                    price: item.price || 0,
                    quantity: item.quantity || 1
                };
                // Spread for reactivity
                this.items = [...this.items, newItem];
            }

            // Notify user
            window.dispatchEvent(new CustomEvent('notify', {
                detail: { message: `${newName} added to quote!`, type: 'success' }
            }));
        },

        remove(id) {
            this.items = this.items.filter(item => String(item.id) !== String(id));
        },

        updateQuantity(id, newQty) {
            if (newQty < 1) return;
            this.items = this.items.map(item => {
                if (String(item.id) === String(id)) {
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        },

        clear() {
            this.items = [];
            this.deliveryMethod = 'delivery';
            localStorage.removeItem('mj_cart');
            localStorage.removeItem('mj_deliveryMethod');
        },

        get count() {
            return this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        },

        get subtotal() {
            return this.items.reduce((sum, item) => {
                const price = typeof item.price === 'string'
                    ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
                    : (item.price || 0);
                return sum + (price * (item.quantity || 0));
            }, 0);
        },

        get shipping() {
            // Flat rate shipping of 20 for delivery, 0 for pickup
            if (this.deliveryMethod === 'pickup') return 0;
            return this.items.length > 0 ? 20 : 0;
        },

        get total() {
            return this.subtotal + this.shipping;
        },

        get formattedSubtotal() {
            return '₱' + this.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        get formattedTotal() {
            return '₱' + this.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    });

    // Simple Notification Store
    Alpine.store('notification', {
        visible: false,
        message: '',
        type: 'success', // success, error

        show(message, type = 'success') {
            this.message = message;
            this.type = type;
            this.visible = true;
            setTimeout(() => {
                this.visible = false;
            }, 3000);
        }
    });

    // Products Store
    Alpine.store('products', {
        items: [],
        categories: [],
        loading: false,

        async fetchCategories() {
            try {
                this.categories = await ProductsAPI.getCategories();
            } catch (e) {
                console.error('Failed to fetch categories', e);
            }
        },

        async fetchByCategory(category) {
            this.loading = true;
            try {
                this.items = await ProductsAPI.getAll(category);
            } catch (e) {
                console.error('Failed to fetch products', e);
            } finally {
                this.loading = false;
            }
        },

        async fetchAll() {
            this.loading = true;
            try {
                this.items = await ProductsAPI.getAll();
            } catch (e) {
                console.error('Failed to fetch products', e);
            } finally {
                this.loading = false;
            }
        }
    });

    // Auth Store
    Alpine.store('auth', {
        user: null,

        async init() {
            // Check auth first
            if (typeof AuthAPI !== 'undefined' && AuthAPI.isAuthenticated()) {
                try {
                    // Only load the user profile
                    this.user = await AuthAPI.getCurrentUser();
                } catch (error) {
                    console.error('Failed to load user in store:', error);
                    if (error.message && error.message.includes('Not authorized')) {
                        AuthAPI.logout();
                    }
                }
            }
        },

        get isLoggedIn() {
            return !!this.user;
        },

        logout() {
            // Remove the token
            if (typeof AuthAPI !== 'undefined') {
                AuthAPI.logout();
            } else {
                localStorage.removeItem('mj_session');
            }

            this.user = null;

            // Clear local cart data immediately upon logout
            const cartStore = Alpine.store('cart');
            if (cartStore) {
                cartStore.clear();
            }

            window.location.href = 'index.html';
        }
    });
});

// Global event listener for notifications
window.addEventListener('notify', (event) => {
    Alpine.store('notification').show(event.detail.message, event.detail.type);
});
