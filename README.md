# 💰 Fintrack — Personal Finance Tracker
### CS348 Database Systems — Purdue University
### React + Python Flask + SQLite

---

## 🌐 Live Application
| | URL |
|---|---|
| **Frontend (Netlify)** | https://delicate-trifle-2c1747.netlify.app |
| **Backend API (Railway)** | https://YOUR-RAILWAY-URL.up.railway.app |
| **GitHub Repo** | https://github.com/chou162/cs348-fintrack |

---

## 📁 Project Structure

```
cs348-fintrack/
├── client/                  ← React frontend (Vite)
│   ├── src/
│   │   └── App.jsx          ← Full React app (single file)
│   ├── package.json
│   └── vite.config.js
├── backend.py               ← Flask API + SQLite database
├── requirements.txt         ← Python dependencies
├── Procfile                 ← Railway deployment config
└── README.md
```

---

## 🗄️ Database Design

### Tables

| Table | Primary Key | Foreign Keys |
|---|---|---|
| Accounts | account_id (INTEGER, AUTOINCREMENT) | — |
| Categories | category_id (INTEGER, AUTOINCREMENT) | — |
| Transactions | transaction_id (INTEGER, AUTOINCREMENT) | account_id → Accounts, category_id → Categories |

### Indexes

| Index | Column | Supports |
|---|---|---|
| idx_transactions_date | Transactions.date | Date range filter on Transactions report |
| idx_transactions_type | Transactions.type | Dashboard income/expense summary totals |
| idx_transactions_category | Transactions.category_id | Dashboard spending-by-category report |
| idx_transactions_account | Transactions.account_id | Account filter on Transactions report |

### Relationships
- `Transactions.account_id` → `Accounts.account_id` (Many-to-One)
- `Transactions.category_id` → `Categories.category_id` (Many-to-One)

---

## 🔒 Security — SQL Injection Protection

All user-supplied values are bound via `?` parameterized query placeholders.
User input is **never** concatenated into SQL strings directly.

```python
# SAFE — what we do
conn.execute(
    'INSERT INTO Transactions (amount, description) VALUES (?, ?)',
    (data['amount'], data['description'])
)

# DANGEROUS — what we never do
conn.execute(f"INSERT INTO Transactions (description) VALUES ('{data['description']}')")
```

URL parameters use Flask's `<int:tx_id>` type annotation, which rejects
non-integer values before any SQL runs.

---

## 🔄 Transactions & Isolation

- All writes (INSERT, UPDATE, DELETE) are wrapped in explicit `BEGIN / COMMIT / ROLLBACK` blocks
- WAL (Write-Ahead Logging) mode enabled — readers never block writers
- Isolation level: **SERIALIZABLE** (SQLite's only level, enforced via `PRAGMA read_uncommitted=0`)

---

## 🚀 Running Locally

### Backend
```bash
# From repo root
pip install flask flask-cors
py backend.py
```
Backend runs on: **http://localhost:5000**
SQLite database (`finance.db`) is auto-created with seed data on first run.

### Frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs on: **http://localhost:5173**

> For local development, make sure `App.jsx` has `const API = "http://localhost:5000/api"`

---

## 📡 API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | /api/accounts | List all accounts |
| POST | /api/accounts | Create account |
| PUT | /api/accounts/:id | Update account |
| DELETE | /api/accounts/:id | Delete account |
| GET | /api/categories | List all categories |
| POST | /api/categories | Create category |
| GET | /api/transactions | List + filter transactions |
| POST | /api/transactions | Create transaction |
| PUT | /api/transactions/:id | Update transaction |
| DELETE | /api/transactions/:id | Delete transaction |
| GET | /api/summary | Dashboard summary stats |
| GET | /api/explain | EXPLAIN QUERY PLAN (shows index usage) |

### Filter Query Example
```
GET /api/transactions?date_from=2024-03-01&date_to=2024-03-31&amount_min=50&amount_max=500&type=expense
```

### Deployment (Extra Credit)
- Backend hosted on **Railway**
- Frontend hosted on **Netlify**
- Live and accessible between May 1–15, 2026
