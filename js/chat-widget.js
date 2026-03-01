function chatWidget() {
    return {
        isOpen: false,
        newMessage: '',
        messages: [],
        isTyping: false,
        sessionId: null,
        hasGreeted: false,
        chatLoaded: false,

        async init() {
            // Only works for logged-in users
            // Wait for store to be ready
            if (typeof Alpine === 'undefined') return;

            this.$watch('$store.auth.user', (user) => {
                if (user && user.email) {
                    this.sessionId = 'chat_' + user.email.replace(/[^a-zA-Z0-9]/g, '_');
                    // Start polling if chat is open
                    if (this.isOpen) {
                        this.loadMessages();
                    }
                }
            });

            // Initial check
            const user = Alpine.store('auth') && Alpine.store('auth').user;
            if (user && user.email) {
                this.sessionId = 'chat_' + user.email.replace(/[^a-zA-Z0-9]/g, '_');
            }

            // Poll for new messages (admin replies) every 3 seconds
            setInterval(() => {
                if (this.isOpen && this.chatLoaded && this.sessionId) {
                    this.pollMessages();
                }
            }, 3000);
        },

        async loadMessages() {
            if (!this.sessionId) return;
            try {
                // Start or get chat session from DB
                const chat = await ChatsAPI.startOrGet();
                this.sessionId = chat.sessionId;
                // Convert DB format to widget format
                this.messages = (chat.messages || []).map(m => ({
                    id: m._id || m.timestamp,
                    text: m.text,
                    isUser: m.sender === 'customer',
                    timestamp: m.timestamp
                }));
                this.chatLoaded = true;
                if (this.messages.length > 0) this.hasGreeted = true;
                this.scrollToBottom();
            } catch (e) {
                console.error('Failed to load chat:', e);
            }
        },

        async pollMessages() {
            if (!this.sessionId) return;
            try {
                const chat = await ChatsAPI.getHistory(this.sessionId);
                const newMessages = (chat.messages || []).map(m => ({
                    id: m._id || m.timestamp,
                    text: m.text,
                    isUser: m.sender === 'customer',
                    timestamp: m.timestamp
                }));
                // Only update if there are new messages
                if (newMessages.length > this.messages.length) {
                    this.messages = newMessages;
                    this.scrollToBottom();
                }
            } catch (e) {
                // Silently fail on poll errors
            }
        },

        toggleChat() {
            if (!Alpine.store('auth').isLoggedIn) {
                window.dispatchEvent(new CustomEvent('trigger-login-modal'));
                return;
            }
            this.isOpen = !this.isOpen;
            if (this.isOpen && !this.chatLoaded) {
                this.loadMessages();
            }
        },

        async sendMessage() {
            const text = this.newMessage.trim();
            if (!text) return;

            // Optimistic UI update
            const tempMsg = {
                id: Date.now(),
                text: text,
                isUser: true,
                timestamp: new Date().toISOString()
            };
            this.messages.push(tempMsg);
            this.newMessage = '';
            this.scrollToBottom();

            try {
                // Make sure chat session exists
                if (!this.chatLoaded || !this.sessionId) {
                    const chat = await ChatsAPI.startOrGet();
                    this.sessionId = chat.sessionId;
                    this.chatLoaded = true;
                }

                // Send message to DB
                await ChatsAPI.sendMessage(this.sessionId, text);

                // Auto-greet on first message
                if (!this.hasGreeted) {
                    this.hasGreeted = true;
                    this.isTyping = true;
                    this.scrollToBottom();
                    setTimeout(async () => {
                        this.isTyping = false;
                        const botText = 'Thanks for reaching out! An admin will review your message shortly.';

                        // Save bot message to DB
                        try {
                            await ChatsAPI.sendMessage(this.sessionId, botText, true);
                        } catch (e) {
                            console.error('Failed to save bot reply:', e);
                        }

                        const botMsg = {
                            id: Date.now() + 1,
                            text: botText,
                            isUser: false,
                            timestamp: new Date().toISOString()
                        };
                        this.messages.push(botMsg);
                        this.scrollToBottom();
                    }, 1500);
                }
            } catch (e) {
                console.error('Failed to send message:', e);
                // Remove optimistic message on failure (optional, or show error)
                alert('Failed to send message. Please check your connection.');
            }
        },

        scrollToBottom() {
            this.$nextTick(() => {
                const container = document.getElementById('chat-messages');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        }
    }
}
