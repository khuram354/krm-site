# 🛒 KRM-Site - E-Commerce Website

A complete e-commerce website with admin panel.

---

## ✨ Features

**For Users:**

- Sign up / Login
- View products with images
- Search products
- Add to cart
- Place orders
- View order history
- Delete orders (pending/completed)
- Write product reviews

**For Admin:**

- Dashboard with sales charts
- Add/Edit/Delete products
- Upload product images
- Manage orders (update status)
- Manage users
- Inventory management
- Email notifications

---

## 🛠️ Technologies Used

- **Node.js** - Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Bootstrap 5** - Frontend styling
- **JavaScript** - Frontend logic
- **JWT** - Authentication
- **Nodemailer** - Emails
- **Chart.js** - Dashboard charts

---

## 📁 Project Structure

```
krm-site/
├── client/public/          # Frontend files
│   ├── index.html          # Homepage
│   ├── cart.html           # Shopping cart
│   ├── product.html        # Product details
│   ├── orders.html         # My orders
│   └── admin/              # Admin panel
│       ├── dashboard.html
│       ├── products.html
│       ├── orders.html
│       ├── inventory.html
│       └── users.html
├── server/src/             # Backend files
│   ├── config/             # Database & email config
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   └── middleware/         # Auth & upload middleware
├── .env                    # Environment variables
├── server.js               # Main server file
└── package.json            # Dependencies
```

---

## 🔧 How to Run

### 1. Install Dependencies

```bash
npm install
```

### 2. Create `.env` File

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### 3. Start Server

```bash
npm run dev
```

### 4. Open Website

```
http://localhost:5500/client/public/index.html
```

---

## 👤 Default Admin Login

| Email           | Password   |
| --------------- | ---------- |
| `admin@krm.com` | `admin123` |

---

## 🔑 Test User Login

| Email            | Password |
| ---------------- | -------- |
| `test@email.com` | `123456` |

---

## 📸 Screenshots

_(Aap apne project ke screenshots yahan daal sakte hain)_

---

## 🚀 Deployment

- **Frontend:** Netlify / Vercel
- **Backend:** Render / Railway
- **Database:** MongoDB Atlas

---

## 👨‍💻 Developer

**Khuram** - [GitHub](https://github.com/khuram354)

---

## 📝 License

ISC License

---

**Made with ❤️**
