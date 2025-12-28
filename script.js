const Engine = {
    role: "User",
    ADMIN_KEY: "1234",
    vols: JSON.parse(localStorage.getItem('cpt_vols')) || [],
    incs: JSON.parse(localStorage.getItem('cpt_incs')) || [],

    login() {
        const sel = document.getElementById('userRole').value;
        if (sel === 'Admin' && document.getElementById('adminKey').value !== this.ADMIN_KEY) return alert("Unauthorized");
        this.role = sel;
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('intelPanel').classList.toggle('hidden', this.role !== 'Admin');
        this.showSection('home');
    },

    showSection(id) {
        document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
        document.getElementById(id + 'Section').classList.remove('hidden');
        if (id === 'home') this.renderHeatmap();
        this.updateStats();
    },

    async fetchUSGS() {
        const status = document.getElementById('apiStatus');
        status.innerText = "Scanning Seismic Activity...";
        try {
            const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
            const data = await res.json();
            const quake = data.features[0]; 
            if(quake && quake.properties.mag > 2.0) {
                this.autoDispatch("SEISMIC ACTIVITY", `Magnitude ${quake.properties.mag} - ${quake.properties.place}`, "RES");
            } else { status.innerText = "District Clear: No recent tremors."; }
        } catch(e) { status.innerText = "USGS API Error."; }
    },

    async fetchPurpleAir() {
        const mockAQI = Math.floor(Math.random() * 200);
        if(mockAQI > 110) {
            this.autoDispatch("AIR QUALITY ALERT", `Unhealthy AQI (${mockAQI}) in Chengalpattu District.`, "MED");
        } else { 
            document.getElementById('apiStatus').innerText = `AQI Stable (${mockAQI})`; 
        }
    },

    autoDispatch(type, desc, skill) {
        const alertBox = document.getElementById('apiAlert');
        alertBox.innerHTML = `🚨 DISTRICT ALERT: ${type}. Auto-assigning ${skill} teams.`;
        alertBox.classList.remove('hidden');
        
        const autoInc = {
            id: 'CPT-INTEL-' + Date.now().toString().slice(-4),
            type: type, location: "District Wide", address: desc, skillReq: skill,
            status: 'IN_PROGRESS', responderIds: [], startTime: new Date().toLocaleString()
        };

        this.incs.push(autoInc);
        this.save();
        setTimeout(() => alertBox.classList.add('hidden'), 8000);
    },

    save() {
        localStorage.setItem('cpt_vols', JSON.stringify(this.vols));
        localStorage.setItem('cpt_incs', JSON.stringify(this.incs));
    }
};

// Global function for role toggle
function toggleKey(val) {
    document.getElementById('adminKeyContainer').classList.toggle('hidden', val !== 'Admin');
}
