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
# From your existing React project root (created in Stage 1)
# Replace src/App.jsx with the provided App.jsx file

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

### Filtering Transactions (Requirement 2)
```
GET /api/transactions?date_from=2024-03-01&date_to=2024-03-31&amount_min=50&amount_max=500&category_id=1&type=expense
```

---

## Demo Checklist (Stage 2 Rubric)

### ✅ Deliverable 1 — Database Design
- Go to the **"DB Design"** page in the app to see all tables, PKs, FKs, and relationships.

### ✅ Deliverable 2a — Insert, Update, Delete
- **Transactions page** → "+ New Transaction" to insert
- Click **Edit** on any row to update
- Click **Delete** to remove
- **Accounts page** → same CRUD operations

### ✅ Deliverable 2b — Filter & Report
- Use the filter bar on the Transactions page
- Filter by: **date range, amount range, category, account, type**
- Report summary (count, income, expenses, net) updates live
- Show a report before and after editing a transaction

### ✅ Deliverable 2c — Dynamic Dropdowns from DB
- In the **New/Edit Transaction modal**, the "Account" and "Category" dropdowns are populated dynamically from the database via:
  - `GET /api/accounts` → populates Account dropdown
  - `GET /api/categories` → populates Category dropdown
- The filter bar dropdowns are also built from DB data
- **Nothing is hardcoded** — adding a new account or category will immediately appear in all dropdowns
