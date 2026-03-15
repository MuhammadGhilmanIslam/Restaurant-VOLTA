const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple Authentication Middleware
const ADMIN_PASSWORD = 'password123'; // Hardcoded for simplicity
const AUTH_TOKEN = 'secret-admin-token-xyz'; // Token sent to client upon success

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${AUTH_TOKEN}`) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
    }
};

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, token: AUTH_TOKEN });
    } else {
        res.status(401).json({ success: false, error: 'Password salah' });
    }
});

// Helper function to query DB
const queryDb = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const getDb = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const runDb = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this); // 'this' contains lastID and changes
        });
    });
};


// --- MENU API ---
app.get('/api/menu', async (req, res) => {
    try {
        const menus = await queryDb('SELECT * FROM menu');
        res.json(menus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- RESERVATIONS API ---
app.get('/api/reservations', async (req, res) => {
    try {
        const reservations = await queryDb('SELECT * FROM reservations ORDER BY id DESC');
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reservations', async (req, res) => {
    try {
        const { name, phone, date, time, guests, table, notes } = req.body;
        
        // Generate ID like RES-001
        const row = await getDb("SELECT COUNT(*) as count FROM reservations");
        const nextIdNum = row.count + 1;
        const id = `RES-${String(nextIdNum).padStart(3, '0')}`;
        
        await runDb(
            `INSERT INTO reservations (id, name, phone, date, time, guests, table_type, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, name, phone, date, time, guests, table, notes]
        );
        res.status(201).json({ id, message: 'Reservation created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/reservations/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        const result = await runDb('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        res.json({ message: 'Reservation status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/reservations/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await runDb('DELETE FROM reservations WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        res.json({ message: 'Reservation deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- ORDERS API ---
app.get('/api/orders', authenticateAdmin, async (req, res) => {
    try {
        const rows = await queryDb('SELECT * FROM orders ORDER BY id DESC');
        // Parse JSON items back to array format
        const orders = rows.map(r => ({
            ...r,
            items: JSON.parse(r.items_json)
        }));
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { items, total, time } = req.body;
        
        // Generate ID like ORD-001
        const row = await getDb("SELECT COUNT(*) as count FROM orders");
        const nextIdNum = row.count + 1;
        const id = `ORD-${String(nextIdNum).padStart(3, '0')}`;
        
        const itemsJson = JSON.stringify(items);
        
        await runDb(
            `INSERT INTO orders (id, items_json, total, time) VALUES (?, ?, ?, ?)`,
            [id, itemsJson, total, time]
        );
        res.status(201).json({ id, message: 'Order created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        const result = await runDb('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- DASHBOARD ANALYTICS API ---
app.get('/api/dashboard', authenticateAdmin, async (req, res) => {
    try {
        // Calculate total revenue from completed orders
        const revenueRow = await getDb("SELECT SUM(total) as revenue FROM orders WHERE status = 'completed'");
        const totalRevenue = revenueRow.revenue || 0;
        
        // Total active orders (not completed)
        const activeOrdersRow = await getDb("SELECT COUNT(*) as count FROM orders WHERE status != 'completed'");
        const completedOrdersRow = await getDb("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'");
        
        // Total confirmed reservations
        const confirmedResRow = await getDb("SELECT COUNT(*) as count FROM reservations WHERE status = 'confirmed'");
        const pendingResRow = await getDb("SELECT COUNT(*) as count FROM reservations WHERE status = 'pending'");
        
        // Total menu count
        const menuCountRow = await getDb("SELECT COUNT(*) as count FROM menu");
        const catCountRow = await getDb("SELECT COUNT(DISTINCT cat) as count FROM menu");

        res.json({
            stats: {
                totalRevenue,
                activeOrders: activeOrdersRow.count,
                completedOrders: completedOrdersRow.count,
                confirmedRes: confirmedResRow.count,
                pendingRes: pendingResRow.count,
                totalMenu: menuCountRow.count,
                totalCategories: catCountRow.count
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
