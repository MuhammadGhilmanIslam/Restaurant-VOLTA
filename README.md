# VOLTA — Modern Restaurant Management System ⚡

Welcome to **VOLTA**, a premium, high-contrast, and responsive restaurant management system designed for speed and visual excellence.

![VOLTA Banner](public/index.html) <!-- Replace with a real screenshot/banner if available -->

## ✨ Features

- 🍽️ **Interactive Menu**: Dynamic menu with category filtering and real-time search.
- 🛒 **Smart Cart System**: Seamless online ordering experience with toast notifications.
- 📅 **Table Reservation**: Advanced booking system with capacity tracking.
- 📊 **Admin Dashboard**: Comprehensive analytics (Revenue, Orders, Reservations).
- ⚡ **Dynamic Stats**: Real-time hero section statistics (Total Menu, Available Capacity).
- 📍 **Map Integration**: Interactive location display with custom styling.
- 🌑 **Premium Dark Mode**: Sleek, high-contrast UI inspired by modern design trends.

## 🚀 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Modern Flexbox/Grid), JavaScript (ES6+).
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (via `sqlite3` driver).
- **Design**: Google Fonts (Bebas Neue, DM Sans, Playfair Display).

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/restaurant-volta.git
   cd restaurant-volta
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize the database**:
   The database will be automatically created (`database.sqlite`) when you run the server for the first time.

4. **Run the application**:
   ```bash
   node server.js
   ```

5. **Access the app**:
   - Client: `http://localhost:3000`
   - Admin: `http://localhost:3000/admin.html`
     
## 🔑 Admin Access
   To access the Admin Dashboard (/admin.html), please use the following credentials:
   - **Password:** `password123`
   (Note: This is a default password for demonstration purposes)

## 📂 Project Structure

```text
├── public/              # Frontend assets
│   ├── js/              # Client & Admin logic
│   ├── css/             # Modern styling
│   ├── admin.html       # Admin Panel
│   └── index.html       # Main Website
├── server.js            # Node.js/Express server
├── database.js          # SQLite configuration & seeding
├── package.json         # Dependencies & scripts
└── README.md            # You are here!
```

---
*Created with ❤️ by [Ghilman]*
