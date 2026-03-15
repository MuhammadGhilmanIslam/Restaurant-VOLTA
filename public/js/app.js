// ===== STATE =====
let DB = {
    menu: [],
    reservations: [],
    orders: [],
    cart: []
};
  
const API_URL = '/api';

// ===== INITIALIZATION =====
window.addEventListener('load', async () => {
    // Set default date for reservation
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const resDateEl = document.getElementById('resDate');
    if (resDateEl) {
        resDateEl.value = tomorrow.toISOString().split('T')[0];
        resDateEl.min = today.toISOString().split('T')[0];
    }

    try {
        await fetchAllData();
        renderFilters();
        renderMenu();
        updateHeroStats();
    } catch (error) {
        showToast('Gagal memuat data dari server', 'error');
        console.error(error);
    }

    // Hide loader
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.style.display = 'none', 400);
        }
    }, 1000);

    // Nav scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (nav) {
            nav.style.boxShadow = window.scrollY > 20 ? '0 4px 24px rgba(0,0,0,0.3)' : 'none';
        }

        // Highlight active nav
        const sections = ['menu','reservasi','pesanan','dashboard','lokasi'];
        const links = document.querySelectorAll('.nav-links a');
        sections.forEach((s, i) => {
            const el = document.getElementById(s);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                links.forEach(l => l.classList.remove('active'));
                if (links[i]) links[i].classList.add('active');
            }
        });
    });
});

async function fetchAllData() {
    try {
        const [menuRes, resRes] = await Promise.all([
            fetch(`${API_URL}/menu`),
            fetch(`${API_URL}/reservations`)
        ]);
        
        if(menuRes.ok) DB.menu = await menuRes.json();
        if(resRes.ok) DB.reservations = await resRes.json();
    } catch (err) {
        console.error(err);
    }
}

function updateHeroStats() {
    // 1. Update Menu Count
    const statMenu = document.getElementById('statMenu');
    if (statMenu) {
        statMenu.textContent = DB.menu.length;
    }

    // 2. Update Capacity (statRes)
    const statRes = document.getElementById('statRes');
    if (statRes) {
        const totalCapacity = 140; // Total defined in UI (120 reg + 20 VIP)
        const today = new Date().toISOString().split('T')[0];
        
        const todayRes = DB.reservations.filter(r => r.date === today && r.status !== 'cancelled');
        const bookedCount = todayRes.reduce((sum, r) => {
            // Extract number from "2 orang", "7-10 orang", etc.
            const guestMatch = r.guests.match(/\d+/);
            const count = guestMatch ? parseInt(guestMatch[0]) : 0;
            return sum + count;
        }, 0);

        const remaining = Math.max(0, totalCapacity - bookedCount);
        statRes.textContent = remaining;
    }
}

// ===== MENU =====
function renderFilters() {
    const cats = ['Semua', ...new Set(DB.menu.map(m => m.cat))];
    const container = document.getElementById('menuFilters');
    if (!container) return;
    container.innerHTML = cats.map((c, i) => `
        <button class="filter-btn ${i === 0 ? 'active' : ''}" data-cat="${c}" onclick="setFilter('${c}')">${c}</button>
    `).join('');
}

function setFilter(cat) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
    renderMenu();
}

function filterMenuUI() {
    renderMenu();
}

function renderMenu() {
    const searchEl = document.getElementById('menuSearch');
    const search = searchEl ? searchEl.value.toLowerCase() : '';
    
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.cat : 'Semua';
    
    const filtered = DB.menu.filter(m => {
        const matchCat = activeFilter === 'Semua' || m.cat === activeFilter;
        // API returns null string from DB occasionally
        const descSafe = m.desc || ""; 
        const matchSearch = m.name.toLowerCase().includes(search) || descSafe.toLowerCase().includes(search);
        return matchCat && matchSearch;
    });

    const grid = document.getElementById('menuGrid');
    if (!grid) return;

    grid.innerHTML = filtered.map(m => `
        <div class="menu-card">
        <div style="position:relative;">
            <img src="${m.image}" alt="${m.name}" class="menu-card-img">
            ${m.badge ? `<div class="menu-card-badge">${m.badge}</div>` : ''}
        </div>
        <div class="menu-card-body">
            <div class="menu-card-cat">${m.cat}</div>
            <div class="menu-card-name">${m.name}</div>
            <div class="menu-card-desc">${m.desc || ''}</div>
            <div class="menu-card-footer">
            <span class="menu-price">Rp ${(m.price / 1000).toFixed(0)}K</span>
            <button class="btn-cart" onclick="addToCart(${m.id})" title="Tambah ke keranjang">+</button>
            </div>
        </div>
        </div>
    `).join('');

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">Tidak ada menu yang cocok 🍽️</div>`;
    }
}


// ===== CART =====
function addToCart(id) {
    const item = DB.menu.find(m => m.id === id);
    if(!item) return;
    
    const existing = DB.cart.find(c => c.id === id);
    if (existing) {
        existing.qty++;
    } else {
        DB.cart.push({ ...item, qty: 1 });
    }
    
    updateCartUI();
    showToast(`${item.name} ditambahkan ke keranjang`, 'success');
}

function updateCartQty(id, delta) {
    const idx = DB.cart.findIndex(c => c.id === id);
    if (idx === -1) return;
    DB.cart[idx].qty += delta;
    if (DB.cart[idx].qty <= 0) DB.cart.splice(idx, 1);
    updateCartUI();
}

function updateCartUI() {
    const total = DB.cart.reduce((s, c) => s + c.price * c.qty, 0);
    const count = DB.cart.reduce((s, c) => s + c.qty, 0);
    const container = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotalDisplay');
    const trigger = document.getElementById('cartTrigger');

    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = 'Rp ' + total.toLocaleString('id-ID');
    if (trigger) trigger.classList.toggle('hidden', count === 0);

    if (DB.cart.length === 0) {
        if(container) container.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p>Keranjang Anda kosong</p></div>`;
        if(footer) footer.style.display = 'none';
        return;
    }

    if(footer) footer.style.display = 'block';
    
    if(container) {
        container.innerHTML = DB.cart.map(item => `
            <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" style="width:48px; height:48px; border-radius:6px; object-fit:cover; flex-shrink:0;">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">Rp ${item.price.toLocaleString('id-ID')}</div>
            </div>
            <div class="cart-qty-controls">
                <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">−</button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
            </div>
            </div>
        `).join('');
    }
}

function openCart() {
    const cp = document.getElementById('cartPanel');
    const ov = document.getElementById('overlay');
    if(cp) cp.classList.add('open');
    if(ov) ov.classList.add('show');
}

function closeCart() {
    const cp = document.getElementById('cartPanel');
    const ov = document.getElementById('overlay');
    if(cp) cp.classList.remove('open');
    if(ov) ov.classList.remove('show');
}

async function checkout() {
    if (DB.cart.length === 0) return;
    const total = DB.cart.reduce((s, c) => s + c.price * c.qty, 0);
    
    // Prepare items for DB
    const items = DB.cart.map(c => ({ name: c.name, qty: c.qty, price: c.price }));
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, total, time })
        });

        if (response.ok) {
            const data = await response.json();
            DB.cart = [];
            updateCartUI();
            closeCart();
            showToast(`✅ Pesanan ${data.id} berhasil dibuat!`, 'success');
        } else {
            throw new Error('Gagal checkout');
        }
    } catch (err) {
        showToast('Terjadi kesalahan saat checkout', 'error');
        console.error(err);
    }
}


// ===== RESERVASI =====
async function fetchReservations() {
    try {
        const response = await fetch(`${API_URL}/reservations`);
        if (response.ok) {
            DB.reservations = await response.json();
            renderReservasi();
        }
    } catch(err) {
        console.error(err);
    }
}

async function submitReservasi() {
    const name = document.getElementById('resName').value.trim();
    const phone = document.getElementById('resPhone').value.trim();
    const date = document.getElementById('resDate').value;
    const time = document.getElementById('resTime').value;
    const guests = document.getElementById('resGuests').value;
    const table = document.getElementById('resTable').value;
    const notes = document.getElementById('resNotes').value;

    if (!name || !phone || !date) {
        showToast('⚠️ Mohon lengkapi nama, telepon, dan tanggal', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, date, time, guests, table, notes })
        });

        if (response.ok) {
            const data = await response.json();
            showToast(`🎉 Reservasi ${data.id} berhasil! Kami akan menghubungi Anda segera.`, 'success');
            
            document.getElementById('resName').value = '';
            document.getElementById('resPhone').value = '';
            // Reset to default date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('resDate').value = tomorrow.toISOString().split('T')[0];
            document.getElementById('resNotes').value = '';
        } else {
            throw new Error('Gagal reservasi');
        }
    } catch (err) {
        showToast('Terjadi kesalahan saat reservasi', 'error');
        console.error(err);
    }
}

// ====== ADMIN FUNCTIONS REMOVED IN THIS FILE ======


// ===== TOAST =====
function showToast(msg, type = '') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ===== UTILITY =====
function scrollToSection(id) {
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({ behavior: 'smooth' });
}
