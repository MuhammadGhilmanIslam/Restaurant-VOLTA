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
    // Nav scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (nav) {
            nav.style.boxShadow = window.scrollY > 20 ? '0 4px 24px rgba(0,0,0,0.3)' : 'none';
        }

        // Highlight active nav
        const sections = ['dashboard','reservasi','pesanan'];
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

    // Check token
    const token = localStorage.getItem('volta_admin_token');
    if (token) {
        document.getElementById('loginOverlay').style.display = 'none';
        await fetchAllData();
        hideLoader();
    } else {
        hideLoader();
    }
});

function hideLoader() {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.style.display = 'none', 400);
        }
    }, 500);
}

async function loginAdmin() {
    const pwd = document.getElementById('adminPassword').value;
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('volta_admin_token', data.token);
            document.getElementById('loginOverlay').style.display = 'none';
            await fetchAllData();
            hideLoader();
            showToast('Login berhasil', 'success');
        } else {
            showToast(data.error || 'Login gagal', 'error');
        }
    } catch (err) {
        showToast('Kesalahan sistem lokal', 'error');
    }
}

function logoutAdmin() {
    localStorage.removeItem('volta_admin_token');
    window.location.reload();
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('volta_admin_token')}`
    };
}

async function fetchAllData() {
    try {
        const headers = getAuthHeaders();
        const [menuRes, resRes, orderRes] = await Promise.all([
            fetch(`${API_URL}/menu`),
            fetch(`${API_URL}/reservations`, { headers }),
            fetch(`${API_URL}/orders`, { headers })
        ]);

        if(menuRes.ok) DB.menu = await menuRes.json();
        if(resRes.ok) DB.reservations = await resRes.json();
        if(orderRes.ok) DB.orders = await orderRes.json();
        
        renderReservasi();
        renderOrders();
        fetchDashboard();
    } catch(err) {
        console.error(err);
        showToast('Gagal memuat data dari server', 'error');
    }
}

// ====== MENUS, FILTERS, CART (Removed from admin workspace) ======
// ===== (END OF REMOVED CODE) =====


// ===== RESERVASI =====
async function fetchReservations() {
    try {
        const response = await fetch(`${API_URL}/reservations`, { headers: getAuthHeaders() });
        if (response.ok) {
            DB.reservations = await response.json();
            renderReservasi();
        } else if (response.status === 401) { logoutAdmin(); }
    } catch(err) { console.error(err); }
}

// Form submitter handled by app.js on user view.

async function updateStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/reservations/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            await fetchReservations();
            await fetchDashboard();
            showToast(`Status reservasi ${id} diperbarui`, 'success');
        }
    } catch (err) {
        showToast('Gagal mengubah status', 'error');
    }
}

async function deleteReservasi(id) {
    if(!confirm(`Yakin ingin menghapus data reservasi ${id}?`)) return;
    try {
        const response = await fetch(`${API_URL}/reservations/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            await fetchReservations();
            await fetchDashboard();
            showToast(`Reservasi ${id} dihapus`, 'success');
        }
    } catch (err) {
        showToast('Gagal menghapus reservasi', 'error');
    }
}

function renderReservasi() {
    const tbody = document.getElementById('reservasiTable');
    if (!tbody) return;

    if (DB.reservations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--muted)">Belum ada daftar reservasi.</td></tr>`;
        return;
    }

    tbody.innerHTML = DB.reservations.map(r => `
        <tr>
        <td><strong>${r.id}</strong></td>
        <td>${r.name}</td>
        <td>${r.date} — ${r.time}</td>
        <td>${r.guests}</td>
        <td>${r.table_type}</td>
        <td><span class="status-badge status-${r.status}">${r.status === 'confirmed' ? '✓ Konfirmasi' : r.status === 'pending' ? '⏳ Menunggu' : '✕ Batal'}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
            ${r.status !== 'confirmed' ? `<button class="btn btn-primary" style="padding:4px 10px;font-size:10px;" onclick="updateStatus('${r.id}','confirmed')">Konfirmasi</button>` : ''}
            ${r.status !== 'cancelled' ? `<button class="btn btn-danger" style="padding:4px 10px;font-size:10px;" onclick="updateStatus('${r.id}','cancelled')">Batalkan</button>` : ''}
            <button class="btn btn-outline" style="padding:4px 10px;font-size:10px;" onclick="deleteReservasi('${r.id}')">Hapus</button>
        </td>
        </tr>
    `).join('');
}


// ===== ORDERS =====
async function fetchOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`, { headers: getAuthHeaders() });
        if(response.ok) {
            DB.orders = await response.json();
            renderOrders();
        } else if (response.status === 401) { logoutAdmin(); }
    } catch(err) {
        console.error(err);
    }
}

function renderOrders() {
    const grid = document.getElementById('ordersGrid');
    if (!grid) return;

    if (DB.orders.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding: 40px; color: var(--muted); background: var(--card); border: 1px solid var(--border); border-radius: 8px;">Belum ada riwayat pesanan hari ini.</div>`;
        return;
    }

    const statusLabel = { completed: 'Selesai', processing: 'Diproses', pending: 'Menunggu' };
    const statusClass = { completed: 'status-confirmed', processing: 'status-pending', pending: 'status-pending' };

    grid.innerHTML = DB.orders.map(o => `
        <div class="order-card">
        <div class="order-card-header">
            <div class="order-id">${o.id}</div>
            <span class="status-badge ${statusClass[o.status] || ''}">${statusLabel[o.status] || o.status}</span>
        </div>
        <div style="font-size:12px;color:var(--muted)">${o.time}</div>
        <div class="order-items-list">
            ${o.items.map(i => `<div class="order-item-row"><span>${i.qty}× ${i.name}</span><span>Rp ${(i.price*i.qty).toLocaleString('id-ID')}</span></div>`).join('')}
            <div class="order-total-row"><span>Total</span><span>Rp ${o.total.toLocaleString('id-ID')}</span></div>
        </div>
        ${o.status === 'pending' ? `<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:12px;padding:8px;" onclick="processOrder('${o.id}', 'processing')">Proses Pesanan</button>` : ''}
        ${o.status === 'processing' ? `<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:12px;padding:8px;background:#4ade80;" onclick="processOrder('${o.id}', 'completed')">Selesaikan Pesanan</button>` : ''}
        </div>
    `).join('');
}

async function processOrder(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            await fetchOrders();
            await fetchDashboard();
            showToast(`Pesanan ${id} diperbarui`, 'success');
        }
    } catch (err) {
        showToast('Gagal merubah status pesanan', 'error');
    }
}

// ===== DASHBOARD =====
async function fetchDashboard() {
    try {
        const response = await fetch(`${API_URL}/dashboard`, { headers: getAuthHeaders() });
        if (response.ok) {
            const data = await response.json();
            renderDashboardStats(data.stats);
        } else if (response.status === 401) { logoutAdmin(); }
    } catch(err){
        console.error(err);
    }
}

function renderDashboardStats(apiStats = null) {
    if (!apiStats) return; // Wait for fetchDashboard

    const stats = [
        { label:'Pendapatan Hari Ini', value:`Rp ${(apiStats.totalRevenue/1000).toFixed(0)}K`, sub:'Total Pesanan Selesai' },
        { label:'Pesanan Aktif', value:apiStats.activeOrders, sub:`${apiStats.completedOrders} selesai` },
        { label:'Reservasi Konfirmasi', value:apiStats.confirmedRes, sub:`${apiStats.pendingRes} menunggu` },
        { label:'Total Menu', value:apiStats.totalMenu, sub:`${apiStats.totalCategories} kategori utama` },
    ];

    const dashGrid = document.getElementById('dashGrid');
    if (dashGrid) {
        dashGrid.innerHTML = stats.map(s => `
        <div class="dash-card">
            <div class="dash-card-label">${s.label}</div>
            <div class="dash-card-value">${s.value}</div>
            <div class="dash-card-sub">${s.sub}</div>
        </div>
        `).join('');
    }

    // Top Items randomized for demo (realworld would use GROUP BY orders table)
    const topItems = [...DB.menu].sort(() => Math.random() - 0.5).slice(0, 5);
    const topMenuTable = document.getElementById('topMenuTable');
    if (topMenuTable) {
        if (topItems.length === 0) {
            topMenuTable.innerHTML = `<tr><td colspan="3" style="text-align:center; color: var(--muted)">Belum ada data menu</td></tr>`;
        } else {
            topMenuTable.innerHTML = topItems.map((m, i) => `
                <tr>
                <td><div style="display:flex; align-items:center; gap:8px;">
                    <img src="${m.image}" alt="${m.name}" style="width:32px; height:32px; border-radius:4px; object-fit:cover;">
                    <span>${i+1}. ${m.name}</span>
                </div></td>
                <td style="color:var(--muted)">${m.cat}</td>
                <td style="color:var(--accent)">Rp ${m.price.toLocaleString('id-ID')}</td>
                </tr>
            `).join('');
        }
    }

    const activities = [
        ...DB.orders.slice(0,3).map(o=>`${o.id} — Pesanan ${o.status}`),
        ...DB.reservations.slice(0,2).map(r=>`${r.id} — Reservasi ${r.name}`),
    ].slice(0,5);

    const activityTable = document.getElementById('activityTable');
    if (activityTable) {
        if (activities.length === 0) {
            activityTable.innerHTML = `<tr><td style="text-align:center; color:var(--muted)">Belum ada aktivitas</td></tr>`;
        } else {
            activityTable.innerHTML = activities.map(a => `
                <tr><td style="font-size:12px;">${a}</td></tr>
            `).join('');
        }
    }

    // Update hero stats
    const statMenu = document.getElementById('statMenu');
    const statRes = document.getElementById('statRes');
    if(statMenu) statMenu.textContent = apiStats.totalMenu;
    if(statRes) statRes.textContent = 140 - apiStats.confirmedRes*4; // approximate cap minus used reservations 
}


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
