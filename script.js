// DATABASE LAYER
const DB = {
    dbName: "ECTZN_DB",
    init() {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                db.createObjectStore("volunteers", { keyPath: "govID" });
                db.createObjectStore("incidents", { keyPath: "id" });
            };
            request.onsuccess = (e) => {
                this.instance = e.target.result;
                resolve();
            };
        });
    },
    async save(storeName, data) {
        const tx = this.instance.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(data);
    },
    async getAll(storeName) {
        return new Promise((resolve) => {
            const tx = this.instance.transaction(storeName, "readonly");
            const request = tx.objectStore(storeName).getAll();
            request.onsuccess = () => resolve(request.result);
        });
    }
};

// ENGINE LAYER
window.Engine = {
    role: "User",
    ADMIN_KEY: "chengalpattu2025",
    volunteers: [],
    incidents: [],

    async init() {
        await DB.init();
        this.volunteers = await DB.getAll('volunteers');
        this.incidents = await DB.getAll('incidents');
        
        const savedRole = localStorage.getItem('userRole');
        if (savedRole) {
            this.role = savedRole;
            this.updateUIForRole();
        } else {
            const modal = new bootstrap.Modal(document.getElementById('loginModal'));
            modal.show();
        }

        this.refreshStats();
        this.showSection('home');
        this.startClock();
    },

    toggleAdminField(val) {
        document.getElementById('adminKeyContainer').classList.toggle('d-none', val !== 'Admin');
    },

    login() {
        const role = document.getElementById('userRole').value;
        const key = document.getElementById('adminKey').value;

        if (role === 'Admin') {
            if (key === this.ADMIN_KEY) {
                localStorage.setItem('userRole', 'Admin');
                location.reload();
            } else {
                alert("Invalid Key");
            }
        } else {
            localStorage.setItem('userRole', 'User');
            location.reload();
        }
    },

    logout() {
        localStorage.removeItem('userRole');
        location.reload();
    },

    updateUIForRole() {
        if (this.role === 'Admin') {
            document.getElementById('logoutBtn')?.classList.remove('d-none');
            document.getElementById('verificationAdminCard')?.classList.remove('d-none');
            document.getElementById('adminReviewSection')?.classList.remove('d-none');
            this.renderAdminLists();
        }
    },

    showSection(id) {
        document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));
        document.getElementById(id + 'Section').classList.remove('d-none');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.add('text-white-50'));
        document.getElementById('link-' + id).classList.remove('text-white-50');
    },

    async registerVolunteer() {
        const newVol = {
            govID: document.getElementById('volGovID').value,
            name: document.getElementById('volName').value,
            location: document.getElementById('volLocation').value,
            skills: [document.getElementById('volMainSkill').value],
            isVerified: false
        };
        await DB.save('volunteers', newVol);
        alert("Enrolled. Pending District Audit.");
        location.reload();
    },

    async createIncident() {
        const newInc = {
            id: 'OPS-' + Date.now().toString().slice(-4),
            type: document.getElementById('taskType').value,
            address: document.getElementById('taskAddress').value,
            location: document.getElementById('taskLocation').value,
            status: (this.role === 'Admin') ? 'PENDING' : 'UNAUTHORIZED'
        };
        await DB.save('incidents', newInc);
        alert("Signal Transmitted.");
        location.reload();
    },

    refreshStats() {
        document.getElementById('statVols').innerText = this.volunteers.filter(v => v.isVerified).length;
        document.getElementById('statIncidents').innerText = this.incidents.filter(i => i.status !== 'UNAUTHORIZED').length;
    },

    startClock() {
        setInterval(() => {
            document.getElementById('liveTime').innerText = new Date().toLocaleTimeString();
        }, 1000);
    },

    renderAdminLists() {
        const vList = document.getElementById('pendingVolunteerList');
        if(vList) {
            vList.innerHTML = this.volunteers.filter(v => !v.isVerified).map(v => `
                <div class="col-12 p-2 border rounded bg-light d-flex justify-content-between">
                    <span>${v.name} (${v.location})</span>
                    <button class="btn btn-sm btn-success" onclick="Engine.verifyVol('${v.govID}')">Verify</button>
                </div>
            `).join('');
        }
    },

    async verifyVol(id) {
        const vol = this.volunteers.find(v => v.govID === id);
        vol.isVerified = true;
        await DB.save('volunteers', vol);
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => Engine.init());
