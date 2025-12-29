const DB = {
    dbName: "ECTZN_TACTICAL_DB",
    init() {
        return new Promise((resolve) => {
            const req = indexedDB.open(this.dbName, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                db.createObjectStore("vols", { keyPath: "id" });
                db.createObjectStore("inc", { keyPath: "id" });
            };
            req.onsuccess = (e) => { this.db = e.target.result; resolve(); };
        });
    },
    async put(store, data) {
        const tx = this.db.transaction(store, "readwrite");
        tx.objectStore(store).put(data);
    },
    async getAll(store) {
        return new Promise((r) => {
            const tx = this.db.transaction(store, "readonly");
            const req = tx.objectStore(store).getAll();
            req.onsuccess = () => r(req.result);
        });
    }
};

window.Engine = {
    role: '',
    vols: [],
    inc: [],
    map: null,

    async init() {
        await DB.init();
        this.vols = await DB.getAll('vols');
        this.inc = await DB.getAll('inc');
        const saved = localStorage.getItem('ectzn_role');
        if (saved) {
            this.role = saved;
            document.getElementById('loginScreen').classList.add('d-none');
            this.updateUI();
        }
    },

    handleLogin(type) {
        if (type === 'Admin') {
            if (document.getElementById('adminKey').value !== 'chengalpattu2025') return alert("Access Denied");
            this.role = 'Admin';
        } else this.role = 'Volunteer';
        localStorage.setItem('ectzn_role', this.role);
        location.reload();
    },

    updateUI() {
        if (this.role === 'Admin') {
            document.getElementById('adminVerifyCard').classList.remove('d-none');
            document.getElementById('adminDispatchCard').classList.remove('d-none');
            this.renderAdmin();
        }
        this.refreshStats();
        this.showSection('home');
    },
    // Add these functions inside the window.Engine object:

async fetchEarthquakes() {
    const container = document.getElementById('earthquakeData');
    const statusBadge = document.getElementById('quakeStatus');
    
    // Chengalpattu Coordinates
    const lat = 12.6841;
    const lon = 79.9836;
    const radius = 250; // km
    
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=${radius}&orderby=time`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.features || data.features.length === 0) {
            container.innerHTML = `
                <div class="alert alert-light border text-center mb-0">
                    <i class="bi bi-shield-check text-success"></i> No seismic activity detected in the last 30 days.
                </div>`;
            return;
        }

        let html = '<div class="list-group list-group-flush">';
        data.features.slice(0, 3).forEach(feature => {
            const mag = feature.properties.mag;
            const place = feature.properties.place;
            const time = new Date(feature.properties.time).toLocaleString();
            const magClass = mag >= 4 ? 'bg-danger' : 'bg-warning text-dark';
            
            html += `
                <div class="list-group-item px-0 border-0 d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold small">${place}</div>
                        <div class="text-muted" style="font-size:0.7rem">${time}</div>
                    </div>
                    <span class="badge ${magClass} rounded-pill">M ${mag.toFixed(1)}</span>
                </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        statusBadge.innerText = "Offline";
        statusBadge.className = "badge bg-danger";
        container.innerHTML = '<div class="text-danger small text-center">Failed to sync with USGS API sensors.</div>';
    }
},
async downloadARR() {
    // 1. Get all terminated incidents from our state
    const terminated = this.inc.filter(i => i.status === 'Terminated');
    
    if (terminated.length === 0) {
        return alert("No archived data available to export.");
    }

    // 2. Define CSV Headers
    const headers = ["Mission ID", "Type", "Outcome", "Victims", "Location", "Notes", "Timestamp"];
    
    // 3. Map the data to rows
    const rows = terminated.map(t => [
        `"${t.id}"`,
        `"${t.type}"`,
        `"${t.outcome}"`,
        `"${t.victims}"`,
        `"${t.addr.replace(/"/g, '""')}"`, // Escape quotes in addresses
        `"${(t.notes || "").replace(/"/g, '""')}"`, // Escape quotes in notes
        `"${t.terminatedAt}"`
    ]);

    // 4. Join data into a CSV string
    const csvContent = [
        headers.join(","),
        ...rows.map(e => e.join(","))
    ].join("\n");

    // 5. Create a download link and trigger it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `ECTZN_ARR_REPORT_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
},
// Update your existing updateUI() to call the new fetcher:
// Add these functions inside the window.Engine object:

async fetchEarthquakes() {
    const container = document.getElementById('earthquakeData');
    const statusBadge = document.getElementById('quakeStatus');
    
    // Chengalpattu Coordinates
    const lat = 12.6841;
    const lon = 79.9836;
    const radius = 250; // km
    
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=${radius}&orderby=time`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.features || data.features.length === 0) {
            container.innerHTML = `
                <div class="alert alert-light border text-center mb-0">
                    <i class="bi bi-shield-check text-success"></i> No seismic activity detected in the last 30 days.
                </div>`;
            return;
        }

        let html = '<div class="list-group list-group-flush">';
        data.features.slice(0, 3).forEach(feature => {
            const mag = feature.properties.mag;
            const place = feature.properties.place;
            const time = new Date(feature.properties.time).toLocaleString();
            const magClass = mag >= 4 ? 'bg-danger' : 'bg-warning text-dark';
            
            html += `
                <div class="list-group-item px-0 border-0 d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold small">${place}</div>
                        <div class="text-muted" style="font-size:0.7rem">${time}</div>
                    </div>
                    <span class="badge ${magClass} rounded-pill">M ${mag.toFixed(1)}</span>
                </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        statusBadge.innerText = "Offline";
        statusBadge.className = "badge bg-danger";
        container.innerHTML = '<div class="text-danger small text-center">Failed to sync with USGS API sensors.</div>';
    }
},

// Update your existing updateUI() to call the new fetcher:
// Add these functions inside the window.Engine object:

async fetchEarthquakes() {
    const container = document.getElementById('earthquakeData');
    const statusBadge = document.getElementById('quakeStatus');
    
    // Chengalpattu Coordinates
    const lat = 12.6841;
    const lon = 79.9836;
    const radius = 250; // km
    
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=${radius}&orderby=time`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.features || data.features.length === 0) {
            container.innerHTML = `
                <div class="alert alert-light border text-center mb-0">
                    <i class="bi bi-shield-check text-success"></i> No seismic activity detected in the last 30 days.
                </div>`;
            return;
        }

        let html = '<div class="list-group list-group-flush">';
        data.features.slice(0, 3).forEach(feature => {
            const mag = feature.properties.mag;
            const place = feature.properties.place;
            const time = new Date(feature.properties.time).toLocaleString();
            const magClass = mag >= 4 ? 'bg-danger' : 'bg-warning text-dark';
            
            html += `
                <div class="list-group-item px-0 border-0 d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold small">${place}</div>
                        <div class="text-muted" style="font-size:0.7rem">${time}</div>
                    </div>
                    <span class="badge ${magClass} rounded-pill">M ${mag.toFixed(1)}</span>
                </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        statusBadge.innerText = "Offline";
        statusBadge.className = "badge bg-danger";
        container.innerHTML = '<div class="text-danger small text-center">Failed to sync with USGS API sensors.</div>';
    }
},

// Update your existing updateUI() to call the new fetcher:
    updateUI() {
        if (this.role === 'Admin') {
            document.getElementById('adminVerifyCard').classList.remove('d-none');
            document.getElementById('adminDispatchCard').classList.remove('d-none');
            this.renderAdmin();
        }
        this.refreshStats();
        this.fetchEarthquakes(); // <--- ADD THIS LINE
        this.showSection('home');
        
        // Auto-refresh quakes every 15 minutes
        setInterval(() => this.fetchEarthquakes(), 900000);
    },

    getLoc(id) {
        navigator.geolocation.getCurrentPosition(p => {
            document.getElementById(id).value = `${p.coords.latitude},${p.coords.longitude}`;
            alert("GPS Synced!");
        }, () => alert("GPS Required for Tactical Mapping"));
    },

    async regVol() {
        const skills = Array.from(document.querySelectorAll('input[name="vSkill"]:checked')).map(el => el.value);
        const v = {
            id: document.getElementById('vID').value,
            name: document.getElementById('vName').value,
            phone: document.getElementById('vPhone').value,
            blood: document.getElementById('vBlood').value,
            vehicle: document.getElementById('vVehicle').value,
            coords: document.getElementById('vCoords').value,
            skills: skills,
            status: 'Pending'
        };
        if(!v.id || !v.coords) return alert("Fill ID & Sync GPS");
        await DB.put('vols', v);
        alert("Enrolled. Command will contact you for verification.");
        location.reload();
    },

    async regSOS() {
        const hazards = Array.from(document.querySelectorAll('input[name="tHaz"]:checked')).map(el => el.value);
        const s = {
            id: 'SOS-' + Date.now(),
            type: document.getElementById('tType').value,
            addr: document.getElementById('tAddr').value,
            victims: document.getElementById('tVictims').value,
            vulnerable: document.getElementById('tVulnerable').value,
            hazards: hazards,
            coords: document.getElementById('tCoords').value,
            status: 'Pending'
        };
        if(!s.coords) return alert("GPS Sync Mandatory for Rescue Dispatch");
        await DB.put('inc', s);
        alert("SOS Broadcast Sent.");
        location.reload();
    },

    renderAdmin() {
        const pVols = document.getElementById('pendingVols');
        pVols.innerHTML = this.vols.filter(v => v.status === 'Pending').map(v => `
            <div class="p-3 border rounded bg-white mb-2 d-flex justify-content-between align-items-center">
                <div>
                    <span class="badge bg-secondary mb-1">Blood: ${v.blood}</span>
                    <h6 class="mb-0 fw-bold">${v.name}</h6>
                    <small>Vehicle: ${v.vehicle} | Skills: ${v.skills.join(', ')}</small>
                </div>
                <button onclick="Engine.approveVol('${v.id}')" class="btn btn-success btn-sm">VERIFY</button>
            </div>
        `).join('') || 'No new responders';

        const pSOS = document.getElementById('pendingSOS');
        pSOS.innerHTML = this.inc.filter(i => i.status === 'Pending').map(i => `
            <div class="card p-3 mb-2 shadow-sm border-danger">
                <div class="d-flex justify-content-between">
                    <h6 class="text-danger fw-bold">${i.type}</h6>
                    <span class="badge bg-danger">Trapped: ${i.victims}</span>
                </div>
                <small class="d-block mb-2">${i.addr}</small>
                <div class="mb-2">${i.hazards.map(h => `<span class="badge-hazard me-1">${h}</span>`).join('')}</div>
                <button onclick="Engine.approveSOS('${i.id}')" class="btn btn-danger w-100 btn-sm">DISPATCH AUTHORIZATION</button>
            </div>
        `).join('') || 'No pending SOS signals';
    },

    async approveVol(id) { 
        const v = this.vols.find(x => x.id === id); v.status = 'Verified'; 
        await DB.put('vols', v); location.reload(); 
    },

    async approveSOS(id) { 
        const i = this.inc.find(x => x.id === id); i.status = 'Active'; 
        await DB.put('inc', i); location.reload(); 
    },

    showSection(id) {
        document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById(id + 'Section').classList.remove('d-none');
        document.getElementById('link-' + id).classList.add('active');
        if (id === 'dashboard') { setTimeout(() => this.initMap(), 100); }
    },

    initMap() {
        if (this.map) return;
        this.map = L.map('map').setView([12.6841, 79.9836], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        
        this.vols.filter(v => v.status === 'Verified' && v.coords).forEach(v => {
            L.circle(v.coords.split(','), { color: 'green', radius: 400 }).addTo(this.map).bindPopup(`<b>${v.name}</b><br>Vehicle: ${v.vehicle}`);
        });
        
        this.inc.filter(i => i.status === 'Active' && i.coords).forEach(i => {
            L.marker(i.coords.split(',')).addTo(this.map).bindPopup(`<b class="text-danger">${i.type}</b><br>Victims: ${i.victims}`);
        });
        this.renderLiveList();
    },

    // Add these functions inside the window.Engine object

    // 1. TERMINATE FUNCTION
    async terminateSOS(id) {
        if(!confirm("Are you sure you want to terminate this mission?")) return;
        
        const incident = this.inc.find(x => x.id === id);
        if (incident) {
            incident.status = 'Terminated';
            incident.terminatedAt = new Date().toLocaleString(); // Timestamp for ARR
            
            // Save to DB
            await DB.put('inc', incident);
            
            // Refresh local data and UI
            this.inc = await DB.getAll('inc');
            this.renderLiveList();
            this.refreshStats();
            
            alert(`Mission ${id} has been terminated and archived.`);
        }
    },

    // 2. UPDATED LIVE LIST RENDER (With Terminate Button)
    renderLiveList() {
        const activeMissions = this.inc.filter(i => i.status === 'Active');
        
        document.getElementById('activeList').innerHTML = activeMissions.map(i => `
            <div class="card p-3 mb-3 border-start border-4 border-danger shadow-sm">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="fw-bold mb-1">${i.type}</h6>
                        <span class="badge bg-danger mb-2">LIVE MISSION</span>
                    </div>
                    <button onclick="Engine.terminateSOS('${i.id}')" class="btn btn-sm btn-outline-secondary">
                        <i class="bi bi-x-circle"></i> TERMINATE
                    </button>
                </div>
                <p class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ${i.addr}</p>
                <div class="mb-3">
                    <span class="badge bg-light text-dark border me-1">Victims: ${i.victims}</span>
                    <span class="badge bg-warning text-dark border">Priority: ${i.vulnerable}</span>
                </div>
                <div class="d-grid gap-2">
                    <a href="https://www.google.com/maps?q=${i.coords}" target="_blank" class="btn btn-primary btn-sm">
                        <i class="bi bi-cursor"></i> START NAVIGATION
                    </a>
                </div>
            </div>
        `).join('') || '<p class="text-center text-muted">No active missions currently.</p>';
        
        // Optional: Render Terminated Missions as a simple ARR Log
        this.renderARRLog();
    },

    // 3. GENERATE ARR (After Action Report) LOG
    renderARRLog() {
        const terminated = this.inc.filter(i => i.status === 'Terminated');
        if (terminated.length === 0) return;

        // You can add a div with id="arrLog" in your HTML to see this
        const logHtml = `
            <div class="mt-4">
                <h6 class="fw-bold text-muted"><i class="bi bi-archive"></i> RECENT MISSION LOGS (ARR)</h6>
                <table class="table table-sm small bg-white border">
                    <thead>
                        <tr class="table-light">
                            <th>ID</th>
                            <th>Type</th>
                            <th>Result</th>
                            <th>Closed At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${terminated.map(t => `
                            <tr>
                                <td>${t.id.split('-')[1]}</td>
                                <td>${t.type}</td>
                                <td><span class="text-success">COMPLETED</span></td>
                                <td>${t.terminatedAt || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Append to the bottom of activeList or a dedicated area
        document.getElementById('activeList').innerHTML += logHtml;
    },

    refreshStats() {
        document.getElementById('statVols').innerText = this.vols.filter(v => v.status === 'Verified').length;
        document.getElementById('statIncidents').innerText = this.inc.filter(i => i.status === 'Active').length;
    },

    logout() { localStorage.clear(); location.reload(); }
};

window.onload = () => Engine.init();
