document.addEventListener('DOMContentLoaded', () => {
    // Initial Event Listeners
    document.getElementById('userRole').addEventListener('change', (e) => {
        document.getElementById('adminKeyContainer').classList.toggle('hidden', e.target.value !== 'Admin');
    });

    document.getElementById('loginBtn').addEventListener('click', () => Engine.login());
    
    // Auto-load home
    Engine.updateStats();
});

window.Engine = {
    role: "User",
    ADMIN_KEY: "1234",
    vols: JSON.parse(localStorage.getItem('cpt_vols')) || [],
    incs: JSON.parse(localStorage.getItem('cpt_incs')) || [],

    login() {
        const sel = document.getElementById('userRole').value;
        const key = document.getElementById('adminKey').value;
        
        if (sel === 'Admin' && key !== this.ADMIN_KEY) {
            alert("Unauthorized Access Attempt Logged.");
            return;
        }

        this.role = sel;
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('personalStatusCard').classList.toggle('hidden', this.role === 'Admin');
        document.getElementById('intelPanel').classList.toggle('hidden', this.role !== 'Admin');
        this.showSection('home');
    },

    showSection(id) {
        document.querySelectorAll('.content-container').forEach(s => s.classList.add('hidden'));
        document.getElementById(id + 'Section').classList.remove('hidden');
        
        if (id === 'home') this.renderHeatmap();
        if (id === 'volunteer') this.renderVols();
        if (id === 'dashboard') this.renderDashboard();
        this.updateStats();
    },

    registerVolunteer() {
        const v = {
            id: 'V-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            name: document.getElementById('volName').value,
            govID: document.getElementById('volGovID').value,
            skill: document.getElementById('volSkill').value,
            location: document.getElementById('volLocation').value,
            isVerified: false, 
            isOnDuty: false, 
            isBusy: false 
        };

        if (!v.name) return alert("Credentials Required");
        this.vols.push(v);
        this.save();
        alert("Registration Transmitted. Awaiting Admin Audit.");
        this.showSection('home');
    },

    toggleDuty() {
        if (this.vols.length === 0) return alert("Register first.");
        const user = this.vols[this.vols.length - 1];
        user.isOnDuty = !user.isOnDuty;
        this.save();
        this.updateStats();
    },

    renderHeatmap() {
        const area = document.getElementById('heatmapArea');
        const active = this.vols.filter(v => v.isVerified && v.isOnDuty);
        if (active.length === 0) {
            area.innerHTML = "<small>No active units reported.</small>";
            return;
        }
        const heat = {};
        active.forEach(v => heat[v.location] = (heat[v.location] || 0) + 1);
        area.innerHTML = Object.keys(heat).map(loc => 
            `<div class="heat-tag"><strong>${loc}</strong>: ${heat[loc]} Units</div>`
        ).join('');
    },

    updateStats() {
        document.getElementById('statVols').innerText = this.vols.filter(v => v.isVerified).length;
        document.getElementById('statIncidents').innerText = this.incs.filter(i => i.status === 'IN_PROGRESS').length;
        
        const statusText = document.getElementById('currentStatusText');
        if (statusText && this.vols.length > 0) {
            const user = this.vols[this.vols.length - 1];
            statusText.innerText = user.isOnDuty ? "ACTIVE ON-DUTY" : "STANDBY";
            statusText.className = user.isOnDuty ? "status-on" : "status-off";
        }
    },

    resetSystem() {
        if(confirm("Wipe all district data?")) {
            localStorage.clear();
            location.reload();
        }
    },

    save() {
        localStorage.setItem('cpt_vols', JSON.stringify(this.vols));
        localStorage.setItem('cpt_incs', JSON.stringify(this.incs));
    }
};
