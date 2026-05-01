# 💰 Fintrack — Personal Finance Tracker
### React + Python Flask + SQLite

---

## Project Structure

```
finance-tracker/
├── backend/
│   ├── app.py           ← Flask API (all routes)
│   └── requirements.txt
└── frontend/
    └── src/
        └── App.jsx      ← Full React app (single file)
```

---

## 1. Backend Setup (Python + Flask)

```bash
cd backend

# Install dependencies
pip install flask flask-cors

# Run the server
python app.py
```

Backend runs on: **http://localhost:5000**
SQLite database (`finance.db`) is auto-created with seed data on first run.

---

## 2. Frontend Setup (React)

```bash

npm install    # if not done already
npm run dev    # or npm start
```

Frontend runs on: **http://localhost:5173** (Vite) or **http://localhost:3000** (CRA)

---

## Database Tables

| Table | PK | FKs |
|---|---|---|
| Accounts | account_id | — |
| Categories | category_id | — |
| Transactions | transaction_id | account_id → Accounts, category_id → Categories |

---

## API Endpoints

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

### Filtering Transactions
```
GET /api/transactions?date_from=2024-03-01&date_to=2024-03-31&amount_min=50&amount_max=500&category_id=1&type=expense
```

