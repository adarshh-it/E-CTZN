function toggleKey(val){
    document.getElementById('adminKeyContainer')
        .classList.toggle('hidden', val !== 'Admin');
}

window.Engine = {
    role:"User",
    ADMIN_KEY:"1234",
    vols:JSON.parse(localStorage.getItem('cpt_vols')) || [],
    incs:JSON.parse(localStorage.getItem('cpt_incs')) || [],

    login(){
        const role=document.getElementById('userRole').value;
        if(role==='Admin' && document.getElementById('adminKey').value!==this.ADMIN_KEY){
            alert("Unauthorized");
            return;
        }
        this.role=role;
        document.getElementById('loginOverlay').classList.add('hidden');
        this.showSection('home');
    },

    showSection(id){
        document.querySelectorAll('.content-container')
            .forEach(s=>s.classList.add('hidden'));
        document.getElementById(id+'Section')?.classList.remove('hidden');
        this.updateStats();
    },

    toggleDuty(){
        if(!this.vols.length) return alert("Register first");
        const user=this.vols[this.vols.length-1];
        user.isOnDuty=!user.isOnDuty;
        this.save();
        this.updateStats();
    },

    fetchUSGS(){
        document.getElementById('apiStatus').innerText="Scanning seismic feed...";
    },

    fetchPurpleAir(){
        const aqi=Math.floor(Math.random()*200);
        document.getElementById('apiStatus').innerText=`AQI Level: ${aqi}`;
    },

    updateStats(){
        document.getElementById('statVols').innerText=
            this.vols.filter(v=>v.isVerified).length;
        document.getElementById('statIncidents').innerText=
            this.incs.filter(i=>i.status==='IN_PROGRESS').length;
    },

    save(){
        localStorage.setItem('cpt_vols',JSON.stringify(this.vols));
        localStorage.setItem('cpt_incs',JSON.stringify(this.incs));
    }
};

Engine.showSection('home');
