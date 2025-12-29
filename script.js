window.Engine = {
    role: "User",
    ADMIN_KEY: "chengalpattu2025",
    WAQI_API_KEY: "demo", 
    volunteers: [],
    incidents: [],

    // 1. ASYNC INIT: Must wait for DB to open
    async init() {
        await DB.init(); 
        
        // Fetch data from DB tables
        this.volunteers = await DB.getAll('volunteers');
        this.incidents = await DB.getAll('incidents');
        
        const savedRole = localStorage.getItem('userRole');
        if (savedRole) this.role = savedRole;

        this.refreshStats();
        this.automation.startMonitoring();
        
        // Initial view setup
        this.showSection('home'); 
    },

    // 2. ADMIN AUTHENTICATION LOGIC
    login() {
        const key = prompt("Enter District Admin Key:");
        if (key === this.ADMIN_KEY) {
            this.role = "Admin";
            localStorage.setItem('userRole', 'Admin');
            alert("District Access Granted.");
            location.reload(); // Refresh to update UI visibility
        } else {
            alert("Access Denied.");
        }
    },

    logout() {
        localStorage.removeItem('userRole');
        this.role = "User";
        location.reload();
    },

    // --- GEOLOCATION ---
    getGPS() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) resolve("GPS Unsupported");
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
                () => resolve("Location Restricted"),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        });
    },

    // --- UPDATED CORE ACTIONS ---
    async registerVolunteer() {
        const skills = Array.from(document.querySelectorAll('input[name="vskill"]:checked')).map(i => i.value);
        const geoTag = await this.getGPS();

        const newVol = {
            govID: document.getElementById('volGovID').value || "N/A",
            name: document.getElementById('volName').value || "Anonymous",
            tier: document.getElementById('volMainSkill').value,
            avail: document.getElementById('volAvail').value,
            skills, 
            location: document.getElementById('volLocation').value,
            gps: geoTag,
            isVerified: false 
        };

        // Save to DB Table instead of localStorage
        await DB.save('volunteers', newVol);
        this.volunteers.push(newVol);
        
        alert(`Credentials Logged. Verification Pending for ${newVol.name}`);
        this.showSection('home');
    },

    async createIncident() {
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

        await DB.save('incidents', newInc);
        this.incidents.push(newInc);
        this.showSection('dashboard');
    },

    async authorizeReport(index) {
        const inc = this.incidents[index];
        // Automatic Matching Logic
        const matches = this.volunteers.filter(v => 
            v.isVerified && 
            v.location === inc.location && 
            v.skills.some(s => inc.requiredSkills.includes(s))
        ).slice(0, inc.maxNeeded);
        
        inc.status = matches.length > 0 ? 'IN_PROGRESS' : 'PENDING';
        inc.responders = matches.map(m => m.name);
        
        await DB.save('incidents', inc); // Update in DB
        this.renderReviewQueue();
        this.refreshStats();
    },

    async authorizeResponder(i) { 
        this.volunteers[i].isVerified = true; 
        await DB.save('volunteers', this.volunteers[i]); // Update in DB
        this.renderVerificationList(); 
        this.refreshStats();
    },

    // --- REFRESH LOGIC ---
    refreshStats() { 
        const vCount = document.getElementById('statVols');
        const iCount = document.getElementById('statIncidents');
        if(vCount) vCount.innerText = this.volunteers.filter(v => v.isVerified).length;
        if(iCount) iCount.innerText = this.incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'UNAUTHORIZED').length;
    }
};

// Start the engine
document.addEventListener('DOMContentLoaded', () => Engine.init());
