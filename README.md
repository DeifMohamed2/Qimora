# Qimora

> Next-generation infrastructure platform — Build Once. Scale Fast.

A professional landing page built with **Node.js**, **Express**, **EJS**, and **MongoDB**, following the **MVC architecture**.

## Project Structure

```
qimora/
├── server.js                  # Entry point
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── homeController.js      # Landing page controller
│   └── contactController.js   # Contact & subscribe API
├── models/
│   ├── Contact.js             # Contact form model
│   └── Subscriber.js          # Email subscriber model
├── routes/
│   ├── index.js               # Page routes
│   └── api/
│       └── contact.js         # API routes
├── views/
│   ├── layout.ejs             # Main layout
│   ├── index.ejs              # Home page
│   ├── 404.ejs                # Not found page
│   ├── 500.ejs                # Server error page
│   └── partials/
│       ├── navbar.ejs
│       ├── hero.ejs
│       ├── logo-banner.ejs
│       ├── features.ejs
│       ├── how-it-works.ejs
│       ├── benefits.ejs
│       ├── testimonials.ejs
│       ├── team.ejs
│       ├── cta.ejs
│       └── footer.ejs
├── public/
│   ├── css/
│   │   └── style.css          # All styles
│   ├── js/
│   │   └── main.js            # All animations & interactions
│   └── images/
│       └── logo.png
├── .env
├── .gitignore
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (optional — the app works without it; the contact form requires it)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server runs at **http://localhost:3000** by default.

### Environment Variables

Create a `.env` file:

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/qimora
SESSION_SECRET=your-long-random-string
# Session cookie Secure follows the request (HTTPS, or trust proxy + X-Forwarded-Proto).
# Set TRUST_PROXY=1 when TLS terminates at a reverse proxy. Only if you need non-Secure
# cookies even on HTTPS (rare): SESSION_COOKIE_SECURE=false
```

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **View Engine:** EJS with express-ejs-layouts
- **Database:** MongoDB with Mongoose
- **Security:** Helmet
- **Logging:** Morgan
- **Icons:** Lucide (CDN)
- **Font:** Manrope (Google Fonts)
