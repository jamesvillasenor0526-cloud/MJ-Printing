# Backend Setup Instructions

## Prerequisites
1. **Node.js** - Download from [nodejs.org](https://nodejs.org/) (v18 or higher recommended)
2. **MongoDB** - Either:
   - Install locally: [mongodb.com/download](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (free cloud): [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)

---

## Step 1: Install Dependencies

Open a terminal in the `backend/` folder and run:

```bash
cd c:/Users/James/OneDrive/Desktop/iptGemini/backend
npm install
```

This will install all required packages.

---

## Step 2: Configure Database

### Option A: Local MongoDB
If you installed MongoDB locally, the default connection string in `.env` will work:
```
MONGODB_URI=mongodb://localhost:27017/mjprint
```

### Option B: MongoDB Atlas (Recommended)
1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (Free tier M0)
4. Create a database user (username + password)
5. Get your connection string
6. Update `.env`:
```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/mjprint
```

---

## Step 3: Update JWT Secret

In `.env`, change the JWT_SECRET to a random secure string:
```
JWT_SECRET=your-random-secret-key-here
```

You can generate one using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Start the Server

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

You should see:
```
MongoDB Connected: ...
🚀 Server running in development mode on port 5000
```

---

## Step 5: Test the API

Visit `http://localhost:5000` in your browser or use Postman.

You should see:
```json
{
  "message": "MJ Print Services API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "orders": "/api/orders",
    "reviews": "/api/reviews",
    "chats": "/api/chats"
  }
}
```

---

## Step 6: Create Admin User

You'll need to manually create an admin user in the database or register a user and change their role to 'admin'.

Using MongoDB Compass or Atlas:
1. Find the user document
2. Change `role` from `customer` to `admin`

---

## API Endpoints Reference

### Authentication
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login
- **GET** `/api/auth/me` - Get current user (requires token)

### Users
- **GET** `/api/users/profile` - Get profile
- **PUT** `/api/users/profile` - Update profile
- **PUT** `/api/users/password` - Change password
- **POST** `/api/users/addresses` - Add address
- **PUT** `/api/users/addresses/:id` - Update address
- **DELETE** `/api/users/addresses/:id` - Delete address
- **PUT** `/api/users/notifications` - Update notification settings

### Orders
- **POST** `/api/orders` - Create order (with file upload)
- **GET** `/api/orders` - Get user's orders
- **GET** `/api/orders/:id` - Get order details
- **GET** `/api/orders/track/:referenceId` - Track by reference ID
- **PUT** `/api/orders/:id/cancel` - Cancel order
- **PUT** `/api/orders/:id/confirm` - Confirm received
- **GET** `/api/orders/admin/all` - Get all orders (admin)
- **PUT** `/api/orders/admin/:id/status` - Update status (admin)
- **DELETE** `/api/orders/admin/:id` - Delete order (admin)

### Reviews
- **GET** `/api/reviews` - Get all reviews
- **POST** `/api/reviews` - Create review
- **PUT** `/api/reviews/:id/reply` - Add admin reply (admin)
- **DELETE** `/api/reviews/:id` - Delete review (admin)

### Chats
- **POST** `/api/chats` - Start/get chat
- **GET** `/api/chats/:sessionId` - Get chat history
- **POST** `/api/chats/:sessionId/message` - Send message
- **GET** `/api/chats/admin/all` - Get all chats (admin)
- **PUT** `/api/chats/admin/:sessionId/status` - Update status (admin)

---

## Authentication

Most endpoints require a JWT token. Include it in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

You get the token from `/api/auth/login` or `/api/auth/register`.

---

## Next Steps

Once the backend is running successfully, you'll need to:
1. Update frontend HTML files to use API calls instead of localStorage
2. Create a helper file (`js/api.js`) to handle API requests
3. Update authentication flow to use JWT tokens

Let me know when you're ready to update the frontend!
