document.addEventListener('alpine:init', () => {
    // Maximum quantity allowed per item
    const MAX_QUANTITY_PER_ITEM = 100;

    Alpine.store('cart', {
        items: [],
        deliveryMethod: 'delivery', // 'delivery' or 'pickup'
        paymentMethod: 'gcash', // gcash only
        paymentType: 'full', // 'full' or 'downpayment'

        // Dynamic key getters based on logged in user
        _getUserPrefix() {
            if (typeof getCurrentUserFromToken === 'function') {
                const user = getCurrentUserFromToken();
                if (user && user.id) return user.id;
            }
            return 'guest';
        },
        get cartKey() { return `mj_cart_${this._getUserPrefix()}`; },
        get deliveryKey() { return `mj_deliveryMethod_${this._getUserPrefix()}`; },
        get paymentMethodKey() { return `mj_paymentMethod_${this._getUserPrefix()}`; },
        get paymentTypeKey() { return `mj_paymentType_${this._getUserPrefix()}`; },

        init() {
            // Load from localStorage if available using dynamic keys
            if (localStorage.getItem(this.cartKey)) {
                try {
                    const saved = JSON.parse(localStorage.getItem(this.cartKey));
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
            if (localStorage.getItem(this.deliveryKey)) {
                this.deliveryMethod = localStorage.getItem(this.deliveryKey);
            }
            if (localStorage.getItem(this.paymentMethodKey)) {
                this.paymentMethod = localStorage.getItem(this.paymentMethodKey);
            }
            if (localStorage.getItem(this.paymentTypeKey)) {
                this.paymentType = localStorage.getItem(this.paymentTypeKey);
            }

            // Watch for changes and save to localStorage
            Alpine.effect(() => {
                localStorage.setItem(this.cartKey, JSON.stringify(this.items));
                localStorage.setItem(this.deliveryKey, this.deliveryMethod);
                localStorage.setItem(this.paymentMethodKey, this.paymentMethod);
                localStorage.setItem(this.paymentTypeKey, this.paymentType);
            });
        },

        add(item) {
            // Normalize for comparison
            const newName = (item.name || '').trim();
            const newDetails = (item.details || '').trim();
            const newQuantity = item.quantity || 1;

            // Find existing item with matching name AND details
            const existingIndex = this.items.findIndex(i =>
                (i.name || '').trim() === newName &&
                (i.details || '').trim() === newDetails
            );

            if (existingIndex !== -1) {
                const currentQty = this.items[existingIndex].quantity || 0;
                const totalQty = currentQty + newQuantity;

                // Check quantity limit
                if (totalQty > MAX_QUANTITY_PER_ITEM) {
                    window.dispatchEvent(new CustomEvent('notify', {
                        detail: { message: `Maximum quantity limit is ${MAX_QUANTITY_PER_ITEM} per item`, type: 'error' }
                    }));
                    return;
                }

                // Build new array for Alpine reactivity
                const updated = [];
                for (let idx = 0; idx < this.items.length; idx++) {
                    if (idx === existingIndex) {
                        updated.push({
                            ...this.items[idx],
                            quantity: totalQty,
                            file: item.file || this.items[idx].file,
                            imagePreview: item.imagePreview || this.items[idx].imagePreview,
                            image: item.image || this.items[idx].image || '',
                            price: item.price || this.items[idx].price
                        });
                    } else {
                        updated.push(this.items[idx]);
                    }
                }
                this.items = updated;
            } else {
                // Check initial quantity
                if (newQuantity > MAX_QUANTITY_PER_ITEM) {
                    window.dispatchEvent(new CustomEvent('notify', {
                        detail: { message: `Maximum quantity limit is ${MAX_QUANTITY_PER_ITEM} per item`, type: 'error' }
                    }));
                    return;
                }

                const newItem = {
                    id: 'cart_' + Date.now() + '_' + Math.random().toString(36).slice(2),
                    name: newName,
                    details: newDetails,
                    file: item.file || '',
                    imagePreview: item.imagePreview || null,
                    image: item.image || '',
                    price: item.price || 0,
                    quantity: newQuantity
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
            if (newQty > MAX_QUANTITY_PER_ITEM) {
                window.dispatchEvent(new CustomEvent('notify', {
                    detail: { message: `Maximum quantity limit is ${MAX_QUANTITY_PER_ITEM} per item`, type: 'error' }
                }));
                return;
            }
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
            localStorage.removeItem(this.cartKey);
            localStorage.removeItem(this.deliveryKey);
            localStorage.removeItem(this.paymentMethodKey);
            localStorage.removeItem(this.paymentTypeKey);
        },

        get count() {
            return this.items.length;
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

            // We do not want to clear the cart visually by setting items = [], 
            // because Alpine.effect will immediately trigger and overwrite their saved cart with [] in localStorage before the page reloads.
            // Since the page reloads to index.html immediately, they won't see their items anyway, 
            // and upon reload, _getUserPrefix() evaluates to 'guest', loading a separate empty guest cart.
            window.location.href = 'index.html';
        }
    });
});

// Global event listener for notifications
window.addEventListener('notify', (event) => {
    Alpine.store('notification').show(event.detail.message, event.detail.type);
});
