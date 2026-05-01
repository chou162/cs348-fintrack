import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0f14;
    --surface: #161a23;
    --surface2: #1e2330;
    --border: #2a3045;
    --text: #e8eaf0;
    --muted: #6b7394;
    --accent: #7ee8a2;
    --accent2: #5bcffa;
    --danger: #ff6b6b;
    --income: #7ee8a2;
    --expense: #ff6b6b;
    --radius: 12px;
    --radius-sm: 8px;
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    min-height: 100vh;
  }

  /* layout */
  .app { display: flex; min-height: 100vh; }

  .sidebar {
    width: 220px;
    min-height: 100vh;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 28px 0;
    position: fixed;
    top: 0; left: 0;
  }

  .logo {
    padding: 0 24px 28px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 20px;
  }
  .logo-title {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    color: var(--accent);
    line-height: 1.2;
  }
  .logo-sub { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }

  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 24px;
    cursor: pointer;
    color: var(--muted);
    font-weight: 500;
    font-size: 13px;
    transition: all 0.15s;
    border-left: 3px solid transparent;
  }
  .nav-item:hover { color: var(--text); background: var(--surface2); }
  .nav-item.active { color: var(--accent); border-left-color: var(--accent); background: rgba(126,232,162,0.06); }

  .main { margin-left: 220px; flex: 1; padding: 36px 40px; max-width: 1100px; }

  .page-title {
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    margin-bottom: 6px;
    color: var(--text);
  }
  .page-sub { color: var(--muted); font-size: 13px; margin-bottom: 28px; }

  /* cards */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px 24px;
    margin-bottom: 20px;
  }
  .card-title { font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 14px; }

  /* stat cards */
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px 22px; }
  .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 8px; }
  .stat-value { font-family: 'DM Mono', monospace; font-size: 26px; font-weight: 500; }
  .stat-value.income { color: var(--income); }
  .stat-value.expense { color: var(--expense); }
  .stat-value.net { color: var(--accent2); }

  /* table */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); padding: 10px 14px; border-bottom: 1px solid var(--border); font-weight: 500; }
  td { padding: 13px 14px; border-bottom: 1px solid rgba(42,48,69,0.5); font-size: 13px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(30,35,48,0.5); }

  .badge {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 500; letter-spacing: 0.04em;
  }
  .badge-income { background: rgba(126,232,162,0.12); color: var(--income); }
  .badge-expense { background: rgba(255,107,107,0.12); color: var(--expense); }

  .cat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }

  .amount-income { color: var(--income); font-family: 'DM Mono', monospace; font-weight: 500; }
  .amount-expense { color: var(--expense); font-family: 'DM Mono', monospace; font-weight: 500; }

  /* buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; border: none; transition: all 0.15s;
  }
  .btn-primary { background: var(--accent); color: #0d1a12; }
  .btn-primary:hover { background: #6dd991; }
  .btn-danger { background: rgba(255,107,107,0.12); color: var(--danger); border: 1px solid rgba(255,107,107,0.2); }
  .btn-danger:hover { background: rgba(255,107,107,0.2); }
  .btn-ghost { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-ghost:hover { background: var(--border); }
  .btn-sm { padding: 5px 10px; font-size: 12px; }

  /* filters */
  .filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; align-items: flex-end; }
  .filter-group { display: flex; flex-direction: column; gap: 4px; }
  .filter-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }

  /* form */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  label { font-size: 12px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

  input, select, textarea {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    padding: 9px 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); }
  select option { background: var(--surface2); }

  /* modal */
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; backdrop-filter: blur(4px);
  }
  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px 30px;
    width: 520px;
    max-width: 95vw;
    box-shadow: var(--shadow);
  }
  .modal-title { font-family: 'DM Serif Display', serif; font-size: 20px; margin-bottom: 20px; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; }

  /* toast */
  .toast {
    position: fixed; bottom: 28px; right: 28px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 12px 18px;
    font-size: 13px; z-index: 200;
    animation: slideUp 0.2s ease;
    box-shadow: var(--shadow);
  }
  .toast.success { border-color: var(--accent); color: var(--accent); }
  .toast.error { border-color: var(--danger); color: var(--danger); }
  @keyframes slideUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }

  /* progress bar */
  .progress-bar { height: 6px; background: var(--surface2); border-radius: 4px; overflow: hidden; margin-top: 6px; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }

  .row-actions { display: flex; gap: 6px; }

  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
`;

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}>{message}</div>;
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function TransactionModal({ tx, accounts, categories, onSave, onClose }) {
  const [form, setForm] = useState(tx || {
    amount: "", date: new Date().toISOString().slice(0, 10),
    description: "", type: "expense", account_id: "", category_id: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = () => {
    if (!form.amount || !form.date || !form.account_id || !form.category_id) return alert("Please fill all required fields.");
    onSave({ ...form, amount: parseFloat(form.amount) });
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{tx ? "Edit Transaction" : "New Transaction"}</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Type *</label>
            <select value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="form-group">
            <label>Amount *</label>
            <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          {/* DYNAMIC DROPDOWN — built from DB data */}
          <div className="form-group">
            <label>Account * (from DB)</label>
            <select value={form.account_id} onChange={e => set("account_id", e.target.value)}>
              <option value="">Select account…</option>
              {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name}</option>)}
            </select>
          </div>
          {/* DYNAMIC DROPDOWN — built from DB data */}
          <div className="form-group">
            <label>Category * (from DB)</label>
            <select value={form.category_id} onChange={e => set("category_id", e.target.value)}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group full">
            <label>Description</label>
            <input placeholder="What was this for?" value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save Transaction</button>
        </div>
      </div>
    </div>
  );
}

// ─── ACCOUNT MODAL ───────────────────────────────────────────────────────────
function AccountModal({ account, onSave, onClose }) {
  const [form, setForm] = useState(account || { name: "", type: "Checking", balance: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{account ? "Edit Account" : "New Account"}</div>
        <div className="form-grid">
          <div className="form-group full">
            <label>Account Name *</label>
            <input placeholder="e.g. Chase Checking" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Type *</label>
            <select value={form.type} onChange={e => set("type", e.target.value)}>
              <option>Checking</option>
              <option>Savings</option>
              <option>Credit</option>
              <option>Investment</option>
            </select>
          </div>
          <div className="form-group">
            <label>Current Balance</label>
            <input type="number" step="0.01" placeholder="0.00" value={form.balance} onChange={e => set("balance", e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave({ ...form, balance: parseFloat(form.balance) || 0 })}>Save Account</button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function Dashboard({ accounts, categories }) {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    fetch(`${API}/summary`).then(r => r.json()).then(setSummary);
    fetch(`${API}/transactions`).then(r => r.json()).then(d => setRecent(d.slice(0, 6)));
  }, []);

  if (!summary) return <div style={{ color: "var(--muted)" }}>Loading…</div>;

  const maxCat = Math.max(...summary.by_category.map(c => c.total), 1);

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Your financial overview at a glance</div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value income">{fmt(summary.total_income)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value expense">{fmt(summary.total_expense)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div className={`stat-value ${summary.net >= 0 ? "income" : "expense"}`}>{fmt(summary.net)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-title">Spending by Category</div>
          {summary.by_category.filter(c => c.total > 0).map(c => (
            <div key={c.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                <span><span className="cat-dot" style={{ background: c.color }} />{c.name}</span>
                <span style={{ fontFamily: "DM Mono", color: "var(--expense)" }}>{fmt(c.total)}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(c.total / maxCat) * 100}%`, background: c.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Accounts</div>
          {accounts.map(a => (
            <div key={a.account_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{a.type}</div>
              </div>
              <div style={{ fontFamily: "DM Mono", color: a.balance >= 0 ? "var(--income)" : "var(--expense)", fontWeight: 500 }}>{fmt(a.balance)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Recent Transactions</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th>Type</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {recent.map(t => (
                <tr key={t.transaction_id}>
                  <td style={{ color: "var(--muted)", fontFamily: "DM Mono", fontSize: 12 }}>{fmtDate(t.date)}</td>
                  <td>{t.description || "—"}</td>
                  <td><span className="cat-dot" style={{ background: t.category_color }} />{t.category_name}</td>
                  <td style={{ color: "var(--muted)" }}>{t.account_name}</td>
                  <td><span className={`badge badge-${t.type}`}>{t.type}</span></td>
                  <td><span className={`amount-${t.type}`}>{t.type === "expense" ? "-" : "+"}{fmt(t.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TRANSACTIONS PAGE ────────────────────────────────────────────────────────
function Transactions({ accounts, categories, toast }) {
  const [txns, setTxns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [filters, setFilters] = useState({
    date_from: "", date_to: "", amount_min: "", amount_max: "",
    category_id: "", account_id: "", type: ""
  });

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const load = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== "") params.append(k, v); });
    fetch(`${API}/transactions?${params}`).then(r => r.json()).then(setTxns);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    const url = editTx ? `${API}/transactions/${editTx.transaction_id}` : `${API}/transactions`;
    const method = editTx ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setShowModal(false); setEditTx(null); load();
    toast(editTx ? "Transaction updated!" : "Transaction added!", "success");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await fetch(`${API}/transactions/${id}`, { method: "DELETE" });
    load(); toast("Transaction deleted.", "success");
  };

  const totalIncome = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="page-title">Transactions</div>
          <div className="page-sub">Insert, edit, delete, and filter your transactions</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTx(null); setShowModal(true); }}>+ New Transaction</button>
      </div>

      {/* FILTER REPORT */}
      <div className="card">
        <div className="card-title">Filter & Report</div>
        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">Date From</span>
            <input type="date" style={{ width: 150 }} value={filters.date_from} onChange={e => setF("date_from", e.target.value)} />
          </div>
          <div className="filter-group">
            <span className="filter-label">Date To</span>
            <input type="date" style={{ width: 150 }} value={filters.date_to} onChange={e => setF("date_to", e.target.value)} />
          </div>
          <div className="filter-group">
            <span className="filter-label">Min Amount</span>
            <input type="number" placeholder="0" style={{ width: 110 }} value={filters.amount_min} onChange={e => setF("amount_min", e.target.value)} />
          </div>
          <div className="filter-group">
            <span className="filter-label">Max Amount</span>
            <input type="number" placeholder="9999" style={{ width: 110 }} value={filters.amount_max} onChange={e => setF("amount_max", e.target.value)} />
          </div>
          {/* DYNAMIC — Category dropdown from DB */}
          <div className="filter-group">
            <span className="filter-label">Category (DB)</span>
            <select style={{ width: 160 }} value={filters.category_id} onChange={e => setF("category_id", e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </div>
          {/* DYNAMIC — Account dropdown from DB */}
          <div className="filter-group">
            <span className="filter-label">Account (DB)</span>
            <select style={{ width: 160 }} value={filters.account_id} onChange={e => setF("account_id", e.target.value)}>
              <option value="">All Accounts</option>
              {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Type</span>
            <select style={{ width: 120 }} value={filters.type} onChange={e => setF("type", e.target.value)}>
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ date_from:"",date_to:"",amount_min:"",amount_max:"",category_id:"",account_id:"",type:"" })}>
            Clear
          </button>
        </div>

        {/* REPORT SUMMARY */}
        <div style={{ display: "flex", gap: 24, padding: "14px 0 4px", borderTop: "1px solid var(--border)" }}>
          <div><span style={{ color: "var(--muted)", fontSize: 12 }}>Results: </span><strong>{txns.length}</strong></div>
          <div><span style={{ color: "var(--muted)", fontSize: 12 }}>Income: </span><span style={{ color: "var(--income)", fontFamily: "DM Mono" }}>{fmt(totalIncome)}</span></div>
          <div><span style={{ color: "var(--muted)", fontSize: 12 }}>Expenses: </span><span style={{ color: "var(--expense)", fontFamily: "DM Mono" }}>{fmt(totalExpense)}</span></div>
          <div><span style={{ color: "var(--muted)", fontSize: 12 }}>Net: </span><span style={{ color: "var(--accent2)", fontFamily: "DM Mono" }}>{fmt(totalIncome - totalExpense)}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th>Type</th><th>Amount</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {txns.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>No transactions match your filters.</td></tr>
              )}
              {txns.map(t => (
                <tr key={t.transaction_id}>
                  <td style={{ color: "var(--muted)", fontFamily: "DM Mono", fontSize: 12 }}>{fmtDate(t.date)}</td>
                  <td>{t.description || "—"}</td>
                  <td><span className="cat-dot" style={{ background: t.category_color }} />{t.category_name}</td>
                  <td style={{ color: "var(--muted)" }}>{t.account_name}</td>
                  <td><span className={`badge badge-${t.type}`}>{t.type}</span></td>
                  <td><span className={`amount-${t.type}`}>{t.type === "expense" ? "-" : "+"}{fmt(t.amount)}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditTx(t); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.transaction_id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <TransactionModal
          tx={editTx} accounts={accounts} categories={categories}
          onSave={handleSave} onClose={() => { setShowModal(false); setEditTx(null); }}
        />
      )}
    </div>
  );
}

// ─── ACCOUNTS PAGE ────────────────────────────────────────────────────────────
function AccountsPage({ accounts, onRefresh, toast }) {
  const [showModal, setShowModal] = useState(false);
  const [editAcc, setEditAcc] = useState(null);

  const handleSave = async (data) => {
    const url = editAcc ? `${API}/accounts/${editAcc.account_id}` : `${API}/accounts`;
    const method = editAcc ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setShowModal(false); setEditAcc(null); onRefresh();
    toast(editAcc ? "Account updated!" : "Account created!", "success");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this account? Associated transactions will be affected.")) return;
    await fetch(`${API}/accounts/${id}`, { method: "DELETE" });
    onRefresh(); toast("Account deleted.", "success");
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="page-title">Accounts</div>
          <div className="page-sub">Manage your bank accounts and credit cards</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditAcc(null); setShowModal(true); }}>+ New Account</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Account Name</th><th>Type</th><th>Balance</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.account_id}>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td><span className="badge badge-income" style={{ background: "rgba(91,207,250,0.12)", color: "var(--accent2)" }}>{a.type}</span></td>
                  <td><span style={{ fontFamily: "DM Mono", color: a.balance >= 0 ? "var(--income)" : "var(--expense)", fontWeight: 500 }}>{fmt(a.balance)}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditAcc(a); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.account_id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <AccountModal account={editAcc} onSave={handleSave} onClose={() => { setShowModal(false); setEditAcc(null); }} />
      )}
    </div>
  );
}

// ─── DATABASE DESIGN PAGE ─────────────────────────────────────────────────────
function DbDesign() {
  return (
    <div>
      <div className="page-title">Database Design</div>
      <div className="page-sub">Tables, primary keys, and foreign keys — Stage 2 Deliverable 1</div>

      {[
        {
          name: "Accounts", color: "#5bcffa",
          desc: "Stores bank accounts and credit cards",
          cols: [
            { name: "account_id", type: "INTEGER", key: "PK", note: "Auto-increment primary key" },
            { name: "name", type: "TEXT", key: "", note: "Account display name" },
            { name: "type", type: "TEXT", key: "", note: "Checking / Savings / Credit / Investment" },
            { name: "balance", type: "REAL", key: "", note: "Current balance" },
          ]
        },
        {
          name: "Categories", color: "#f97316",
          desc: "Spending and income categories",
          cols: [
            { name: "category_id", type: "INTEGER", key: "PK", note: "Auto-increment primary key" },
            { name: "name", type: "TEXT", key: "", note: "Category label (e.g. Food, Rent)" },
            { name: "color", type: "TEXT", key: "", note: "Hex color for UI display" },
          ]
        },
        {
          name: "Transactions", color: "#7ee8a2",
          desc: "All financial transactions — references Accounts and Categories",
          cols: [
            { name: "transaction_id", type: "INTEGER", key: "PK", note: "Auto-increment primary key" },
            { name: "amount", type: "REAL", key: "", note: "Dollar amount" },
            { name: "date", type: "TEXT", key: "", note: "ISO date string (YYYY-MM-DD)" },
            { name: "description", type: "TEXT", key: "", note: "Optional note" },
            { name: "type", type: "TEXT", key: "", note: "'income' or 'expense'" },
            { name: "account_id", type: "INTEGER", key: "FK", note: "→ Accounts.account_id" },
            { name: "category_id", type: "INTEGER", key: "FK", note: "→ Categories.category_id" },
          ]
        }
      ].map(table => (
        <div className="card" key={table.name}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: table.color, display: "inline-block" }} />
            <span style={{ fontFamily: "DM Mono", fontWeight: 500, color: table.color, fontSize: 15 }}>{table.name}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>{table.desc}</div>
          <table>
            <thead>
              <tr><th>Column</th><th>Type</th><th>Key</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {table.cols.map(c => (
                <tr key={c.name}>
                  <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>{c.name}</td>
                  <td style={{ color: "var(--accent2)", fontFamily: "DM Mono", fontSize: 12 }}>{c.type}</td>
                  <td>
                    {c.key === "PK" && <span className="badge" style={{ background: "rgba(126,232,162,0.12)", color: "var(--income)" }}>PK</span>}
                    {c.key === "FK" && <span className="badge" style={{ background: "rgba(249,115,22,0.12)", color: "#f97316" }}>FK</span>}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="card">
        <div className="card-title">Relationships</div>
        <div style={{ fontFamily: "DM Mono", fontSize: 13, lineHeight: 2, color: "var(--muted)" }}>
          <div><span style={{ color: "#7ee8a2" }}>Transactions</span>.account_id &nbsp;→&nbsp; <span style={{ color: "#5bcffa" }}>Accounts</span>.account_id &nbsp;<span style={{ color: "var(--border)" }}>(Many-to-One)</span></div>
          <div><span style={{ color: "#7ee8a2" }}>Transactions</span>.category_id →&nbsp; <span style={{ color: "#f97316" }}>Categories</span>.category_id <span style={{ color: "var(--border)" }}>(Many-to-One)</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "transactions", label: "Transactions", icon: "⇄" },
  { id: "accounts", label: "Accounts", icon: "◻" },
  { id: "db", label: "DB Design", icon: "⬡" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState(null);

  const loadAccounts = () => fetch(`${API}/accounts`).then(r => r.json()).then(setAccounts);
  const loadCategories = () => fetch(`${API}/categories`).then(r => r.json()).then(setCategories);

  useEffect(() => { loadAccounts(); loadCategories(); }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <nav className="sidebar">
          <div className="logo">
            <div className="logo-title">Fintrack</div>
            <div className="logo-sub">Personal Finance</div>
          </div>
          {NAV.map(n => (
            <div key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
            </div>
          ))}
        </nav>

        <main className="main">
          {page === "dashboard" && <Dashboard accounts={accounts} categories={categories} />}
          {page === "transactions" && <Transactions accounts={accounts} categories={categories} toast={showToast} />}
          {page === "accounts" && <AccountsPage accounts={accounts} onRefresh={loadAccounts} toast={showToast} />}
          {page === "db" && <DbDesign />}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
