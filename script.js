window.Engine = {
    role: "User",
    ADMIN_KEY: "chengalpattu2025", 
    volunteers: JSON.parse(localStorage.getItem('vols_v2')) || [],
    incidents: JSON.parse(localStorage.getItem('incs_v2')) || [],
    loginModal: null,

    init() {
        // Initialize Bootstrap Modal
        this.loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        this.loginModal.show();
        this.refreshStats();
    },

    toggleAdminField(val) { 
        const field = document.getElementById('adminKeyContainer');
        if(val === 'Admin') field.classList.remove('d-none');
        else field.classList.add('d-none');
    },

    login() {
        const selRole = document.getElementById('userRole').value;
        if (selRole === 'Admin' && document.getElementById('adminKey').value !== this.ADMIN_KEY) {
            return alert("Security Breach: Invalid Credentials");
        }
        this.role = selRole;
        this.loginModal.hide();
        this.showSection('home');
    },

    showSection(id) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));
        // Show target section
        document.getElementById(id + 'Section').classList.remove('d-none');
        
        // Update Sidebar Active State
        document.querySelectorAll('.nav-link').forEach(a => {
            a.classList.remove('active');
            a.classList.add('text-white-50');
        });
        const activeLink = document.getElementById('link-' + id);
        activeLink.classList.add('active');
        activeLink.classList.remove('text-white-50');

        if (id === 'task') this.renderReviewQueue();
        if (id === 'volunteer') this.renderVerificationList();
        if (id === 'dashboard') this.renderDashboard();
        this.refreshStats();
    },

    registerVolunteer() {
        const skills = Array.from(document.querySelectorAll('input[name="vskill"]:checked')).map(i => i.value);
        this.volunteers.push({
            name: document.getElementById('volName').value,
            govID: document.getElementById('volGovID').value,
            tier: document.getElementById('volMainSkill').value,
            avail: document.getElementById('volAvail').value,
            skills, 
            location: document.getElementById('volLocation').value,
            isVerified: false 
        });
        this.save();
        alert("Credentials Logged. Verification Pending with District HQ.");
        // Reset form
        document.querySelectorAll('input').forEach(i => i.value = '');
        this.showSection('home');
    },

    createIncident() {
        const reqs = Array.from(document.querySelectorAll('input[name="tskill"]:checked')).map(i => i.value);
        const taskLoc = document.getElementById('taskLocation').value;
        const maxNeeded = parseInt(document.getElementById('taskMaxVolunteers').value) || 1;

        const newInc = {
            id: 'OPS-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
            type: document.getElementById('taskType').value,
            criticality: document.getElementById('taskCriticality').value,
            address: document.getElementById('taskAddress').value,
            victims: document.getElementById('taskVictims').value,
            hazmat: document.getElementById('taskHazmat').value,
            maxNeeded, location: taskLoc, requiredSkills: reqs,
            status: (this.role === 'Admin') ? 'PENDING' : 'UNAUTHORIZED',
            responders: []
        };

        if (this.role === 'Admin') {
            const matches = this.volunteers.filter(v => v.isVerified && v.location === taskLoc && v.skills.some(s => reqs.includes(s))).slice(0, maxNeeded);
            if (matches.length > 0) { 
                newInc.status = 'IN_PROGRESS'; 
                newInc.responders = matches.map(m => m.name); 
            }
        }

        this.incidents.push(newInc);
        this.save();
        this.showSection('dashboard');
    },

    authorizeReport(index) {
        const inc = this.incidents[index];
        const matches = this.volunteers.filter(v => v.isVerified && v.location === inc.location && v.skills.some(s => inc.requiredSkills.includes(s))).slice(0, inc.maxNeeded);
        inc.status = matches.length > 0 ? 'IN_PROGRESS' : 'PENDING';
        inc.responders = matches.map(m => m.name);
        this.save();
        this.renderReviewQueue();
        this.refreshStats();
    },

    renderReviewQueue() {
        const queue = document.getElementById('reviewQueueList');
        const container = document.getElementById('adminReviewSection');
        if (this.role !== 'Admin') { container.classList.add('d-none'); return; }
        
        const pending = this.incidents.filter(i => i.status === 'UNAUTHORIZED');
        if(pending.length === 0) { container.classList.add('d-none'); } else { container.classList.remove('d-none'); }
        
        queue.innerHTML = '';
        
        this.incidents.forEach((inc, idx) => {
            if (inc.status === 'UNAUTHORIZED') {
                const col = document.createElement('div');
                col.className = 'col-md-6';
                col.innerHTML = `
                    <div class="card border-warning h-100">
                        <div class="card-body">
                            <h6 class="card-title fw-bold text-dark">${inc.type}</h6>
                            <p class="card-text mb-1"><i class="small">Location:</i> ${inc.address}</p>
                            <p class="card-text mb-2"><span class="badge bg-danger">Risk: ${inc.hazmat}</span> <span class="badge bg-secondary">Victims: ${inc.victims}</span></p>
                            <button class="btn btn-warning btn-sm w-100 fw-bold" onclick="Engine.authorizeReport(${idx})">VALIDATE & ACTIVATE</button>
                        </div>
                    </div>`;
                queue.appendChild(col);
            }
        });
    },

    renderDashboard() {
        const containers = { 
            PENDING: document.getElementById('list-pending'), 
            IN_PROGRESS: document.getElementById('list-progress'), 
            RESOLVED: document.getElementById('list-resolved') 
        };
        Object.values(containers).forEach(c => c.innerHTML = '');
        
        this.incidents.filter(i => i.status !== 'UNAUTHORIZED').forEach(inc => {
            const card = document.createElement('div');
            // Logic to color border based on criticality
            const borderClass = inc.criticality === 'HIGH' ? 'border-danger border-start border-4' : 'border-secondary';
            
            card.className = `card shadow-sm mb-2 emergency-card ${borderClass}`;
            card.innerHTML = `
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="fw-bold small">${inc.id}</span>
                        <span class="badge ${inc.criticality === 'HIGH' ? 'bg-danger' : 'bg-warning text-dark'}">${inc.criticality}</span>
                    </div>
                    <h6 class="card-title fw-bold mb-1">${inc.type}</h6>
                    <p class="small text-muted mb-2">${inc.address}</p>
                    <div class="progress mb-2" style="height: 6px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${(inc.responders.length/inc.maxNeeded)*100}%"></div>
                    </div>
                    <small class="d-block text-secondary" style="font-size:0.75rem">
                        Personnel: ${inc.responders.join(', ') || '<span class="text-danger">SEARCHING FOR ASSETS...</span>'}
                    </small>
                </div>`;
            containers[inc.status].appendChild(card);
        });
    },

    renderVerificationList() {
        const list = document.getElementById('pendingVolunteerList');
        const container = document.getElementById('verificationAdminCard');
        
        if (this.role !== 'Admin') { container.classList.add('d-none'); return; }
        container.classList.remove('d-none');
        
        list.innerHTML = '';
        this.volunteers.forEach((v, i) => {
            const col = document.createElement('div');
            col.className = 'col-md-6';
            
            const btnHtml = !v.isVerified && this.role === 'Admin' 
                ? `<button class="btn btn-success btn-sm mt-2 w-100" onclick="Engine.authorizeResponder(${i})">APPROVE CREDENTIALS</button>` 
                : '<div class="mt-2 text-success fw-bold text-center"><i class="bi bi-check-circle"></i> Verified Officer</div>';

            col.innerHTML = `
                <div class="card h-100 border-light shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h6 class="fw-bold">${v.name}</h6>
                            <span class="badge bg-secondary">${v.govID}</span>
                        </div>
                        <p class="small text-muted mb-1">${v.tier} | ${v.avail}</p>
                        <p class="small mb-0 text-primary">${v.location}</p>
                        ${btnHtml}
                    </div>
                </div>`;
            list.appendChild(col);
        });
    },

    authorizeResponder(i) { this.volunteers[i].isVerified = true; this.save(); this.renderVerificationList(); },
    
    refreshStats() { 
        document.getElementById('statVols').innerText = this.volunteers.filter(v => v.isVerified).length;
        document.getElementById('statIncidents').innerText = this.incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'UNAUTHORIZED').length;
    },
    
    save() { 
        localStorage.setItem('vols_v2', JSON.stringify(this.volunteers)); 
        localStorage.setItem('incs_v2', JSON.stringify(this.incidents)); 
    }
};

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    Engine.init();
});
