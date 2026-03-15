const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Create Menu table
    db.run(`CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cat TEXT NOT NULL,
        price INTEGER NOT NULL,
        desc TEXT,
        image TEXT,
        badge TEXT
    )`, (err) => {
        if (!err) {
            // Check if menu is empty, insert default data
            db.get("SELECT COUNT(*) as count FROM menu", (err, row) => {
                if (row.count === 0) {
                    const insertMenu = db.prepare("INSERT INTO menu (name, cat, price, desc, image, badge) VALUES (?, ?, ?, ?, ?, ?)");
                    const defaultMenu = [
                        ['Wagyu Burger', 'Burger', 125000, 'Daging wagyu grade A, keju cheddar premium, saus truffle, lettuce renyah', 'images/wagyu_burger_1773507825186.png', 'Best Seller'],
                        ['Crispy Chicken Wings', 'Appetizer', 89000, 'Sayap ayam crispy dengan 3 pilihan saus: BBQ, Buffalo, Honey Mustard', 'images/chicken_wings_1773507845698.png', 'Favorit'],
                        ['Margherita Pizza', 'Pizza', 115000, 'Tomat San Marzano, mozzarella buffalo, daun basil segar, olive oil', 'images/margherita_pizza_1773507867604.png', null],
                        ['Salmon Teriyaki', 'Main Course', 145000, 'Salmon Atlantik panggang, saus teriyaki homemade, nasi putih atau quinoa', 'images/salmon_teriyaki_1773507890256.png', 'New'],
                        ['Caesar Salad', 'Salad', 65000, 'Romaine crispy, parmesan serut, crouton sourdough, dressing caesar klasik', 'images/caesar_salad_1773507918408.png', null],
                        ['Pasta Carbonara', 'Pasta', 98000, 'Spaghetti de cecco, guanciale, telur kampung, pecorino romano, black pepper', 'images/pasta_carbonara_1773507938693.png', null],
                        ['Matcha Latte', 'Minuman', 45000, 'Matcha premium grade ceremonial, susu oat, gula aren organik', 'images/matcha_latte_1773507959854.png', null],
                        ['Ribeye Steak 300g', 'Main Course', 285000, 'Ribeye USDA Choice, dimasak medium-rare, kentang truffle, saus béarnaise', 'images/ribeye_steak_1773507979261.png', 'Premium'],
                        ['Tiramisu', 'Dessert', 75000, 'Resep otentik Italia, mascarpone artisanal, ladyfinger, espresso', 'images/tiramisu_1773508008186.png', null],
                        ['Tom Yum Seafood', 'Soup', 95000, 'Udang, cumi, kerang, jamur, serai, daun jeruk, cabai merah', 'images/tom_yum_seafood_1773508029782.png', 'Spicy'],
                        ['Nasi Goreng Volta', 'Main Course', 85000, 'Nasi goreng signature dengan ayam bakar, kerupuk udang, acar', 'images/nasi_goreng_volta_1773508053219.png', 'Lokal Favorit'],
                        ['Mojito Segar', 'Minuman', 55000, 'Mint segar, lime, gula tebu, soda water, es batu', 'images/mojito_segar_1773508075574.png', null]
                    ];
                    
                    defaultMenu.forEach(item => {
                        insertMenu.run(item);
                    });
                    insertMenu.finalize();
                    console.log('Default menu items populated.');
                }
            });
        }
    });

    // Create Reservations table
    // status: 'pending', 'confirmed', 'cancelled'
    db.run(`CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        guests TEXT NOT NULL,
        table_type TEXT NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'pending'
    )`);

    // Create Orders table
    // status: 'pending', 'processing', 'completed'
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        items_json TEXT NOT NULL,
        total INTEGER NOT NULL,
        time TEXT NOT NULL,
        status TEXT DEFAULT 'pending'
    )`);
}

module.exports = db;
