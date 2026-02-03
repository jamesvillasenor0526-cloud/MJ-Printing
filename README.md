# MJ Print Advertisement Website

A modern, fast, and responsive static website for a printing business.

## Features

### Client Side
-   **Product Catalog**: Documents, Large Format, Merchandise, Photo Printing.
-   **User Authentication**: Simulated Login/Register (Guest vs Member experience).
-   **Shopping Cart**: Add to cart, view cart, and simulated checkout.
-   **Live Chat**: Floating widget for simulated customer support.
-   **Search**: Functional keyword search for products.
-   **Information Pages**: About Us, FAQ, File Guide, Portfolio, Reviews, Track Order.

### Admin Side
-   **Dashboard**: `admin-login.html` & `admin-dashboard.html`
-   **Order Management**: View, Filter, and Update status of orders.
-   **Analytics**: Revenue and Order count simulation.
-   **Secure-ish Access**: Requires simulated login (`admin`/`admin123`).

## Tech Stack
-   **HTML5 & CSS3**: Semantic markup.
-   **Tailwind CSS**: Utility-first styling (via CDN).
-   **Alpine.js**: Lightweight JavaScript framework for interactivity (modals, tabs, state).
-   **LocalStorage**: Used to persist user sessions, cart data, and mock orders without a real backend database.

## How to Run
Since this is a static site with no build step required (Tailwind is CDN-based), you can run it directly:

1.  **Open locally**: Double-click `index.html`.
2.  **Live Server**: Use VS Code's "Live Server" extension for the best experience.

## Deployment
This site is ready for deployment on any static host:
-   **GitHub Pages**: Push repo and enable Pages.
-   **Netlify/Vercel**: Drag and drop the folder.

## Credentials
### Admin
-   **Username**: `admin`
-   **Password**: `admin123`

### Mock Users
-   You can register a new user normally via `register.html`.
