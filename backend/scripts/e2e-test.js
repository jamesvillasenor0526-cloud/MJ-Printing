/**
 * End-to-End API Test Script
 * Tests the full flow: Register → Login → Products → Cart → Order → Track → Admin
 */

const http = require('http');

const BASE = 'http://localhost:5000';
let customerToken = '';
let adminToken = '';
let orderId = '';
let referenceId = '';

const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'TestPass123';
const testName = 'Test User E2E';
const testPhone = `09${Date.now().toString().slice(-9)}`;

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function pass(name) { console.log(`  ✅ ${name}`); }
function fail(name, detail) { console.log(`  ❌ ${name}: ${detail}`); }

async function run() {
    console.log('\n🧪 MJ Print Services - End-to-End API Test');
    console.log('='.repeat(55));

    // ====== 1. REGISTER ======
    console.log('\n📝 1. REGISTRATION');
    const reg = await request('POST', '/api/auth/register', {
        name: testName, email: testEmail, password: testPassword, phone: testPhone
    });
    if (reg.status === 201 && reg.body.token) {
        customerToken = reg.body.token;
        pass(`Registered: ${reg.body.email}`);
    } else {
        fail('Register', JSON.stringify(reg.body));
        return;
    }

    // ====== 2. LOGIN ======
    console.log('\n🔑 2. LOGIN');
    // Login with email
    const loginEmail = await request('POST', '/api/auth/login', {
        email: testEmail, password: testPassword
    });
    if (loginEmail.status === 200 && loginEmail.body.token) {
        pass('Login with email');
    } else {
        fail('Login with email', JSON.stringify(loginEmail.body));
    }

    // Login with phone
    const loginPhone = await request('POST', '/api/auth/login', {
        email: testPhone, password: testPassword
    });
    if (loginPhone.status === 200 && loginPhone.body.token) {
        pass('Login with phone');
    } else {
        fail('Login with phone', JSON.stringify(loginPhone.body));
    }

    // Wrong password
    const loginBad = await request('POST', '/api/auth/login', {
        email: testEmail, password: 'wrongpass'
    });
    if (loginBad.status === 401) {
        pass('Rejects wrong password (401)');
    } else {
        fail('Wrong password', `Expected 401, got ${loginBad.status}`);
    }

    // ====== 3. GET PROFILE (/me) ======
    console.log('\n👤 3. PROFILE');
    const me = await request('GET', '/api/auth/me', null, customerToken);
    if (me.status === 200 && me.body.email === testEmail) {
        pass(`GET /me returns correct user (status ${me.status})`);
    } else {
        fail('GET /me', `Status: ${me.status}, Body: ${JSON.stringify(me.body)}`);
    }

    // Invalid token test
    const meBad = await request('GET', '/api/auth/me', null, 'invalidtoken123');
    if (meBad.status === 401) {
        pass('Invalid token rejected (401, no server crash)');
    } else {
        fail('Invalid token', `Expected 401, got ${meBad.status}`);
    }

    // No token test
    const meNone = await request('GET', '/api/auth/me');
    if (meNone.status === 401) {
        pass('No token rejected (401)');
    } else {
        fail('No token', `Expected 401, got ${meNone.status}`);
    }

    // ====== 4. PRODUCTS ======
    console.log('\n📦 4. PRODUCTS');
    const products = await request('GET', '/api/products');
    if (products.status === 200 && Array.isArray(products.body)) {
        pass(`Fetched ${products.body.length} products`);
    } else {
        fail('Get products', JSON.stringify(products.body));
    }

    const docProducts = await request('GET', '/api/products?category=Document%20Printing');
    if (docProducts.status === 200 && docProducts.body.length > 0) {
        pass(`Document Printing: ${docProducts.body.map(p => p.name).join(', ')}`);
    } else {
        fail('Document Printing category', JSON.stringify(docProducts.body));
    }

    const categories = await request('GET', '/api/products/categories');
    if (categories.status === 200 && Array.isArray(categories.body)) {
        pass(`Categories: ${categories.body.join(', ')}`);
    } else {
        fail('Get categories', JSON.stringify(categories.body));
    }

    // (Cart is now 100% localStorage — no backend sync to test)

    // ====== 5. ADDRESS MANAGEMENT ======
    console.log('\n📍 6. ADDRESSES');
    const addAddr = await request('POST', '/api/users/addresses', {
        label: 'Home', street: '123 Test St', barangay: 'San Antonio',
        city: 'Makati', province: 'Metro Manila', zip: '1200', default: true
    }, customerToken);
    if (addAddr.status === 201 && addAddr.body.length > 0) {
        pass(`Added address: ${addAddr.body[0].label}`);
    } else {
        fail('Add address', JSON.stringify(addAddr.body));
    }

    // ====== 7. CREATE ORDER ======
    console.log('\n📋 7. ORDER CREATION');
    const order = await request('POST', '/api/orders', {
        items: JSON.stringify(cartItems),
        subtotal: 25, shippingFee: 20, total: 45,
        address: '123 Test St, San Antonio, Makati, Metro Manila, 1200',
        phone: testPhone, deliveryMethod: 'delivery'
    }, customerToken);
    if (order.status === 201 && order.body.referenceId) {
        orderId = order.body._id;
        referenceId = order.body.referenceId;
        pass(`Order created: ${referenceId} (6-digit ID: ${referenceId.split('-')[2]?.length === 6 ? 'YES' : 'NO'})`);
    } else {
        fail('Create order', JSON.stringify(order.body));
        return;
    }

    // ====== 8. TRACK ORDER ======
    console.log('\n🔍 8. ORDER TRACKING');
    const track = await request('GET', `/api/orders/track/${referenceId}`);
    if (track.status === 200 && track.body.referenceId === referenceId) {
        pass(`Tracked order: ${referenceId} → Status: ${track.body.status}`);
    } else {
        fail('Track order', JSON.stringify(track.body));
    }

    // Get user orders
    const myOrders = await request('GET', '/api/orders', null, customerToken);
    if (myOrders.status === 200 && myOrders.body.length > 0) {
        pass(`My orders: ${myOrders.body.length} order(s)`);
    } else {
        fail('My orders', JSON.stringify(myOrders.body));
    }

    // ====== 9. ADMIN LOGIN ======
    console.log('\n👑 9. ADMIN');
    const adminLogin = await request('POST', '/api/auth/login', {
        email: 'admin', password: 'admin123'
    });
    if (adminLogin.status === 200 && adminLogin.body.role === 'admin') {
        adminToken = adminLogin.body.token;
        pass('Admin login successful');
    } else {
        // Try with username field
        const adminLogin2 = await request('POST', '/api/auth/login', {
            username: 'admin', password: 'admin123'
        });
        if (adminLogin2.status === 200 && adminLogin2.body.role === 'admin') {
            adminToken = adminLogin2.body.token;
            pass('Admin login successful (via username)');
        } else {
            fail('Admin login', `Status: ${adminLogin.status}. Try creating admin first: node scripts/seedAdmin.js`);
        }
    }

    if (adminToken) {
        // Admin get all orders
        const allOrders = await request('GET', '/api/orders/admin/all', null, adminToken);
        if (allOrders.status === 200 && Array.isArray(allOrders.body)) {
            pass(`Admin sees ${allOrders.body.length} total order(s)`);
        } else {
            fail('Admin all orders', JSON.stringify(allOrders.body));
        }

        // Admin update status
        const statusUpdate = await request('PUT', `/api/orders/admin/${orderId}/status`, {
            status: 'Processing'
        }, adminToken);
        if (statusUpdate.status === 200 && statusUpdate.body.status === 'Processing') {
            pass('Status updated: Pending → Processing');
        } else {
            fail('Status update', JSON.stringify(statusUpdate.body));
        }

        // Admin invalid status (should be rejected)
        const badStatus = await request('PUT', `/api/orders/admin/${orderId}/status`, {
            status: 'InvalidStatus'
        }, adminToken);
        if (badStatus.status === 400) {
            pass('Invalid status rejected (400)');
        } else {
            fail('Invalid status validation', `Expected 400, got ${badStatus.status}`);
        }

        // Admin get all products (including inactive)
        const adminProducts = await request('GET', '/api/products/admin/all', null, adminToken);
        if (adminProducts.status === 200) {
            pass(`Admin sees ${adminProducts.body.length} products (all)`);
        } else {
            fail('Admin products', JSON.stringify(adminProducts.body));
        }

        // Admin get all chats
        const allChats = await request('GET', '/api/chats/admin/all', null, adminToken);
        if (allChats.status === 200) {
            pass(`Admin sees ${allChats.body.length} chat(s)`);
        } else {
            fail('Admin chats', JSON.stringify(allChats.body));
        }

        // Admin get all reviews
        const allReviews = await request('GET', '/api/reviews', null, adminToken);
        if (allReviews.status === 200) {
            pass(`${allReviews.body.length} review(s) found`);
        } else {
            fail('Reviews', JSON.stringify(allReviews.body));
        }
    }

    // ====== 10. CANCEL ORDER ======
    console.log('\n❌ 10. ORDER CANCEL');
    // First, set it back to Pending so we can test cancel
    if (adminToken) {
        await request('PUT', `/api/orders/admin/${orderId}/status`, { status: 'Pending' }, adminToken);
    }
    const cancel = await request('PUT', `/api/orders/${orderId}/cancel`, null, customerToken);
    if (cancel.status === 200 && cancel.body.status === 'Cancelled') {
        pass('Order cancelled successfully');
    } else {
        fail('Cancel order', JSON.stringify(cancel.body));
    }

    // Try cancel again (should fail - already cancelled)
    const cancelAgain = await request('PUT', `/api/orders/${orderId}/cancel`, null, customerToken);
    if (cancelAgain.status === 400) {
        pass('Double cancel rejected (400)');
    } else {
        fail('Double cancel', `Expected 400, got ${cancelAgain.status}`);
    }

    // ====== 11. CHAT ======
    console.log('\n💬 11. CHAT');
    const chat = await request('POST', '/api/chats', null, customerToken);
    if (chat.status === 200 && chat.body.sessionId) {
        pass(`Chat started: ${chat.body.sessionId}`);

        // Send message
        const msg = await request('POST', `/api/chats/${chat.body.sessionId}/message`, {
            text: 'Hello, I need help with my order!'
        }, customerToken);
        if (msg.status === 200 && msg.body.messages.length > 0) {
            pass('Customer message sent');
        } else {
            fail('Send message', JSON.stringify(msg.body));
        }

        // Admin reply
        if (adminToken) {
            const reply = await request('POST', `/api/chats/${chat.body.sessionId}/message`, {
                text: 'Sure, how can we help?'
            }, adminToken);
            if (reply.status === 200) {
                pass('Admin reply sent');
            } else {
                fail('Admin reply', JSON.stringify(reply.body));
            }
        }
    } else {
        fail('Start chat', JSON.stringify(chat.body));
    }

    // ====== 12. PASSWORD CHANGE ======
    console.log('\n🔐 12. PASSWORD');
    const pwChange = await request('PUT', '/api/users/password', {
        currentPassword: testPassword, newPassword: 'NewPass456'
    }, customerToken);
    if (pwChange.status === 200) {
        pass('Password changed');
        // Verify new password works
        const relogin = await request('POST', '/api/auth/login', {
            email: testEmail, password: 'NewPass456'
        });
        if (relogin.status === 200) {
            pass('Login with new password works');
        } else {
            fail('Login after pw change', `Status: ${relogin.status}`);
        }
    } else {
        fail('Password change', JSON.stringify(pwChange.body));
    }

    // ====== SUMMARY ======
    console.log('\n' + '='.repeat(55));
    console.log('🏁 END-TO-END TEST COMPLETE');
    console.log('='.repeat(55) + '\n');
}

run().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
