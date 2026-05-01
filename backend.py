"""
Fintrack Personal Finance Tracker — Backend API
================================================
Stack : Python 3.x · Flask · SQLite3
Author: CS348 Stage 3

Security  : All user-supplied values are passed through parameterized queries
            (? placeholders) — never interpolated into SQL strings.
Indexes   : See init_db() for index definitions and justifications.
Isolation : SQLite default is SERIALIZABLE; explicit BEGIN / COMMIT blocks are
            used for multi-statement writes so that concurrent readers always
            see a consistent snapshot.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'finance.db')

# ─── DB CONNECTION ────────────────────────────────────────────────────────────

def get_db():
    """
    Open a SQLite connection with row_factory so rows behave like dicts.

    ISOLATION LEVEL NOTE:
    Passing isolation_level=None enables autocommit mode at the sqlite3 driver
    level, which lets us issue our own BEGIN / COMMIT / ROLLBACK statements
    explicitly — giving us full control over transaction boundaries and avoiding
    the driver's implicit transaction wrapping.
    """
    conn = sqlite3.connect(DB_PATH, isolation_level=None)
    conn.row_factory = sqlite3.Row
    # WAL mode: readers never block writers and writers never block readers.
    # Critical for concurrent multi-user access.
    conn.execute("PRAGMA journal_mode=WAL;")
    # Enforce SERIALIZABLE isolation (SQLite's only and default level).
    # Every transaction sees a consistent committed snapshot.
    conn.execute("PRAGMA read_uncommitted=0;")
    return conn

# ─── SCHEMA + INDEXES ─────────────────────────────────────────────────────────

def init_db():
    conn = get_db()

    # executescript() handles its own transaction internally —
    # do NOT wrap it in BEGIN/COMMIT
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS Accounts (
            account_id  INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            type        TEXT    NOT NULL,
            balance     REAL    DEFAULT 0.0
        );

        CREATE TABLE IF NOT EXISTS Categories (
            category_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            color       TEXT    DEFAULT "#6366f1"
        );

        CREATE TABLE IF NOT EXISTS Transactions (
            transaction_id  INTEGER PRIMARY KEY AUTOINCREMENT,
            amount          REAL    NOT NULL,
            date            TEXT    NOT NULL,
            description     TEXT,
            type            TEXT    NOT NULL
                            CHECK(type IN ("income","expense")),
            account_id      INTEGER NOT NULL
                            REFERENCES Accounts(account_id),
            category_id     INTEGER NOT NULL
                            REFERENCES Categories(category_id)
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_date
            ON Transactions(date);

        CREATE INDEX IF NOT EXISTS idx_transactions_account
            ON Transactions(account_id);

        CREATE INDEX IF NOT EXISTS idx_transactions_category
            ON Transactions(category_id);

        CREATE INDEX IF NOT EXISTS idx_transactions_type
            ON Transactions(type);
    ''')

    row = conn.execute("SELECT COUNT(*) FROM Accounts").fetchone()[0]
    if row == 0:
        conn.executescript('''
            INSERT INTO Accounts (name, type, balance) VALUES
                ("Chase Checking",     "Checking",  3200.00),
                ("Wells Fargo Savings","Savings",   8500.00),
                ("Citi Credit Card",   "Credit",    -450.00);

            INSERT INTO Categories (name, color) VALUES
                ("Food & Dining",   "#f97316"),
                ("Housing & Rent",  "#8b5cf6"),
                ("Transportation",  "#06b6d4"),
                ("Entertainment",   "#ec4899"),
                ("Healthcare",      "#10b981"),
                ("Shopping",        "#f59e0b"),
                ("Utilities",       "#64748b"),
                ("Income / Salary", "#22c55e");

            INSERT INTO Transactions
                (amount, date, description, type, account_id, category_id)
            VALUES
                (2800.00,"2024-03-01","Monthly Salary",       "income", 1,8),
                (1200.00,"2024-03-03","Rent Payment",         "expense",1,2),
                (68.50,  "2024-03-05","Grocery Run - Kroger", "expense",1,1),
                (45.00,  "2024-03-07","Netflix + Spotify",    "expense",3,4),
                (120.00, "2024-03-09","Electric Bill",        "expense",1,7),
                (32.00,  "2024-03-10","Dinner with Friends",  "expense",3,1),
                (500.00, "2024-03-12","Freelance Project",    "income", 1,8),
                (55.00,  "2024-03-14","Gas & Parking",        "expense",1,3),
                (89.99,  "2024-03-16","Amazon Order",         "expense",3,6),
                (200.00, "2024-03-18","Doctor Visit",         "expense",1,5),
                (2800.00,"2024-04-01","Monthly Salary",       "income", 1,8),
                (1200.00,"2024-04-03","Rent Payment",         "expense",1,2),
                (74.20,  "2024-04-06","Whole Foods",          "expense",1,1),
                (29.99,  "2024-04-08","Gym Membership",       "expense",3,4),
                (110.00, "2024-04-11","Electric Bill",        "expense",1,7),
                (180.00, "2024-04-15","Flight Tickets",       "expense",3,3),
                (300.00, "2024-04-20","Side Project Payment", "income", 1,8),
                (62.00,  "2024-04-22","Restaurant Outing",    "expense",1,1);
        ''')

    conn.close()

# ─── ACCOUNTS ─────────────────────────────────────────────────────────────────

@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    conn = get_db()
    rows = conn.execute('SELECT * FROM Accounts ORDER BY name').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/accounts', methods=['POST'])
def create_account():
    """
    SQL INJECTION PROTECTION
    ─────────────────────────
    data['name'], data['type'], and data['balance'] come directly from the
    HTTP request body (user input). They are NEVER concatenated into the SQL
    string. Instead they are passed as a tuple bound to ? placeholders by
    the sqlite3 driver — making injection impossible regardless of input.
    """
    data = request.json
    conn = get_db()
    conn.execute("BEGIN")
    try:
        cur = conn.execute(
            'INSERT INTO Accounts (name, type, balance) VALUES (?, ?, ?)',
            (data['name'], data['type'], data.get('balance', 0.0))
        )
        account_id = cur.lastrowid
        conn.execute("COMMIT")
        row = conn.execute('SELECT * FROM Accounts WHERE account_id=?',
                           (account_id,)).fetchone()
        conn.close()
        return jsonify(dict(row)), 201
    except Exception as e:
        conn.execute("ROLLBACK")
        conn.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/accounts/<int:account_id>', methods=['PUT'])
def update_account(account_id):
    data = request.json
    conn = get_db()
    conn.execute("BEGIN")
    try:
        conn.execute(
            'UPDATE Accounts SET name=?, type=?, balance=? WHERE account_id=?',
            (data['name'], data['type'], data['balance'], account_id)
        )
        conn.execute("COMMIT")
        row = conn.execute('SELECT * FROM Accounts WHERE account_id=?',
                           (account_id,)).fetchone()
        conn.close()
        return jsonify(dict(row))
    except Exception as e:
        conn.execute("ROLLBACK")
        conn.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/accounts/<int:account_id>', methods=['DELETE'])
def delete_account(account_id):
    conn = get_db()
    conn.execute("BEGIN")
    try:
        conn.execute('DELETE FROM Accounts WHERE account_id=?', (account_id,))
        conn.execute("COMMIT")
        conn.close()
        return jsonify({'message': 'Account deleted'})
    except Exception as e:
        conn.execute("ROLLBACK")
        conn.close()
        return jsonify({'error': str(e)}), 500

# ─── CATEGORIES ───────────────────────────────────────────────────────────────

@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db()
    rows = conn.execute('SELECT * FROM Categories ORDER BY name').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/categories', methods=['POST'])
def create_category():
    data = request.json
    conn = get_db()
    conn.execute("BEGIN")
    try:
        cur = conn.execute(
            'INSERT INTO Categories (name, color) VALUES (?, ?)',
            (data['name'], data.get('color', '#6366f1'))
        )
        cat_id = cur.lastrowid
        conn.execute("COMMIT")
        row = conn.execute('SELECT * FROM Categories WHERE category_id=?',
                           (cat_id,)).fetchone()
        conn.close()
        return jsonify(dict(row)), 201
    except Exception as e:
        conn.execute("ROLLBACK")
        conn.close()
        return jsonify({'error': str(e)}), 500

# ─── TRANSACTIONS ──────────────────────────────────────────────────────────────

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """
    DYNAMIC FILTER QUERY
    ─────────────────────
    Each filter appends one ? to the query AND one value to params — always
    as a pair. sqlite3 binds them left-to-right. User values never enter
    the SQL string, so no injection is possible regardless of input content.

    INDEXES USED
    ─────────────
    · idx_transactions_date     — WHERE date >= ? AND date <= ?
    · idx_transactions_account  — WHERE account_id = ?
    · idx_transactions_category — WHERE category_id = ?
    · idx_transactions_type     — WHERE type = ?
    """
    conn = get_db()

    date_from  = request.args.get('date_from')
    date_to    = request.args.get('date_to')
    amount_min = request.args.get('amount_min', type=float)
    amount_max = request.args.get('amount_max', type=float)
    category   = request.args.get('category_id', type=int)
    account    = request.args.get('account_id',  type=int)
    tx_type    = request.args.get('type')

    query = '''
        SELECT t.*,
               a.name  AS account_name,
               c.name  AS category_name,
               c.color AS category_color
        FROM   Transactions t
        JOIN   Accounts    a ON t.account_id  = a.account_id
        JOIN   Categories  c ON t.category_id = c.category_id
        WHERE  1=1
    '''
    params = []

    if date_from:
        query += ' AND t.date >= ?';        params.append(date_from)
    if date_to:
        query += ' AND t.date <= ?';        params.append(date_to)
    if amount_min is not None:
        query += ' AND t.amount >= ?';      params.append(amount_min)
    if amount_max is not None:
        query += ' AND t.amount <= ?';      params.append(amount_max)
    if category:
        query += ' AND t.category_id = ?';  params.append(category)
    if account:
        query += ' AND t.account_id = ?';   params.append(account)
    if tx_type:
        query += ' AND t.type = ?';         params.append(tx_type)

    query += ' ORDER BY t.date DESC'

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    """
    TRANSACTION BLOCK
    ──────────────────
    Wrapped in BEGIN / COMMIT so the INSERT is atomic. If the server crashes
    mid-write the partial row is never committed and is automatically rolled
    back — the database stays consistent.

    SQL INJECTION PROTECTION
    ─────────────────────────
    All six user-supplied values are bound via ? placeholders.
    """
    data = request.json
    conn = get_db()
    conn.execute("BEGIN")
    try:
        cur = conn.execute(
            '''INSERT INTO Transactions
               (amount, date, description, type, account_id, category_id)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (data['amount'], data['date'], data.get('description', ''),
             data['type'], data['account_id'], data['category_id'])
        )
        tx_id = cur.lastrowid
        conn.execute("COMMIT")
        row = conn.execute('''
            SELECT t.*, a.name AS account_name,
                   c.name AS category_name, c.color AS category_color
            FROM   Transactions t
            JOIN   Accounts   a ON t.account_id  = a.account_id
            JOIN   Categories c ON t.category_id = c.category_id
            WHERE  t.transaction_id = ?
        ''', (tx_id,)).fetchone()
        conn.close()
        return jsonify(dict(row)), 201
    except Exception as e:
        conn.execute("ROLLBACK")
        conn.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactions/<int:tx_id>', methods=['PUT'])
def update_transaction(tx_id):
    """
    TRANSACTION BLOCK: UPDATE + re-fetch are atomic.
    tx_id is typed as int by Flask from the URL — cannot carry SQL payloads.
    """
    data = request.json
    conn = get_db()
    conn.execute("BEGIN")
    try:
        conn.execute(
            '''UPDATE Transactions
               SET amount=?, date=?, description=?, type=?,
                   account_id=?, category_id=?
               WHERE transaction_id=?''',
            (data['amount'], data['date'], data.get('description', ''),
             data['type'], data['account_id'], data['category_id'], tx_id)
        )
        conn.execute("COMMIT")
        row = conn.execute('''
            SELECT t.*, a.name AS account_name,
                   c.name AS category_name, c.color AS category_color
            FROM   Transactions t
            JOIN   Accounts   a ON t.account_id  = a.account_id
            JOIN   Categories c ON t.category_id = c.category_id
            WHERE  t.transaction_id = ?
        ''', (tx_id,)).fetchone()
        conn.close()
        return jsonify(dict(row))
    except Exception as e:
        conn.execute("ROLLBACK")
        conn.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactions/<int:tx_id>', methods=['DELETE'])
def delete_transaction(tx_id):
    conn = get_db()
    conn.execute("BEGIN")
    try:
        conn.execute('DELETE FROM Transactions WHERE transaction_id=?', (tx_id,))
        conn.execute("COMMIT")
        conn.close()
        return jsonify({'message': 'Transaction deleted'})
    except Exception as e:
        conn.execute("ROLLBACK")
        conn.close()
        return jsonify({'error': str(e)}), 500

# ─── SUMMARY (Dashboard) ──────────────────────────────────────────────────────

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """
    INDEXES USED
    ─────────────
    · idx_transactions_type     — WHERE type = 'income' / 'expense'
    · idx_transactions_category — GROUP BY category_id (avoids full sort)

    ISOLATION: Read-only endpoint. SQLite SERIALIZABLE + WAL ensures this
    SELECT sees a consistent committed snapshot even during concurrent writes.
    """
    conn = get_db()
    income  = conn.execute(
        "SELECT COALESCE(SUM(amount),0) FROM Transactions WHERE type='income'"
    ).fetchone()[0]
    expense = conn.execute(
        "SELECT COALESCE(SUM(amount),0) FROM Transactions WHERE type='expense'"
    ).fetchone()[0]
    by_cat = conn.execute('''
        SELECT   c.name, c.color,
                 COALESCE(SUM(t.amount), 0) AS total
        FROM     Categories  c
        LEFT JOIN Transactions t
               ON c.category_id = t.category_id AND t.type = "expense"
        GROUP BY c.category_id
        ORDER BY total DESC
    ''').fetchall()
    conn.close()
    return jsonify({
        'total_income':  income,
        'total_expense': expense,
        'net':           income - expense,
        'by_category':   [dict(r) for r in by_cat]
    })

# ─── EXPLAIN endpoint (demo tool — proves index usage) ───────────────────────

@app.route('/api/explain', methods=['GET'])
def explain_query():
    """
    Returns SQLite EXPLAIN QUERY PLAN for the main filter query.
    Use during the demo to show the professor that indexes are being used.
    Example: GET /api/explain?date_from=2024-03-01&date_to=2024-03-31&type=expense
    """
    conn = get_db()
    date_from = request.args.get('date_from', '2024-01-01')
    date_to   = request.args.get('date_to',   '2024-12-31')
    tx_type   = request.args.get('type',      'expense')
    plan = conn.execute('''
        EXPLAIN QUERY PLAN
        SELECT t.*, a.name AS account_name, c.name AS category_name
        FROM   Transactions t
        JOIN   Accounts   a ON t.account_id  = a.account_id
        JOIN   Categories c ON t.category_id = c.category_id
        WHERE  t.date >= ? AND t.date <= ? AND t.type = ?
        ORDER BY t.date DESC
    ''', (date_from, date_to, tx_type)).fetchall()
    conn.close()
    return jsonify([{'detail': r['detail']} for r in plan])

# ─── ENTRY POINT ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)