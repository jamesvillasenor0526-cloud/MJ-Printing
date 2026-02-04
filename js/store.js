document.addEventListener('alpine:init', () => {
    Alpine.store('cart', {
        items: [],

        init() {
            // Load from localStorage if available
            if (localStorage.getItem('mj_cart')) {
                this.items = JSON.parse(localStorage.getItem('mj_cart'));
            }

            // Watch for changes and save to localStorage
            Alpine.effect(() => {
                localStorage.setItem('mj_cart', JSON.stringify(this.items));
            });
        },

        add(item) {
            // Check if item already exists (optional, maybe we want duplicates or quantity update)
            // For this simple version, we'll just add as new line item or increment quantity if exact match
            const existingItem = this.items.find(i => i.id === item.id && i.name === item.name);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.items.push({
                    id: Date.now(), // Generate a unique ID for the line item if none provided
                    ...item,
                    quantity: 1
                });
            }

            // Notify user (simple alert for now, can be a toast later)
            // alert(`${item.name} added to quote!`); 
            // Better: Dispatch an event for a UI toast
            window.dispatchEvent(new CustomEvent('notify', {
                detail: { message: `${item.name} added to quote!`, type: 'success' }
            }));
        },

        remove(id) {
            this.items = this.items.filter(item => item.id !== id);
        },

        clear() {
            this.items = [];
        },

        get count() {
            return this.items.reduce((sum, item) => sum + item.quantity, 0);
        },

        get subtotal() {
            // Assuming price is a number. If it's a string like "₱450.00", we need to parse it.
            return this.items.reduce((sum, item) => {
                const price = typeof item.price === 'string'
                    ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
                    : item.price;
                return sum + (price * item.quantity);
            }, 0);
        },

        get shipping() {
            // Flat rate shipping of 20
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
    // Auth Store
    Alpine.store('auth', {
        user: null,

        init() {
            const session = localStorage.getItem('mj_session');
            if (session) {
                this.user = JSON.parse(session);
            }
        },

        get isLoggedIn() {
            return !!this.user;
        },

        logout() {
            localStorage.removeItem('mj_session');
            this.user = null;
            window.location.href = 'index.html';
        }
    });
});

// Global event listener for notifications
window.addEventListener('notify', (event) => {
    Alpine.store('notification').show(event.detail.message, event.detail.type);
});
