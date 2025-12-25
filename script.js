// =====================
// DATA & STATE
// =====================
let songs = [];
let currentIndex = -1;
let isShuffle = false;
let isLoop = false;
const audio = new Audio();

// =====================
// ELEMENTS
// =====================
const els = {
    list: document.getElementById("songList"),
    player: document.getElementById("playerBar"),
    title: document.getElementById("currentTitle"),
    artist: document.getElementById("currentArtist"),
    playBtn: document.getElementById("playBtn"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    shuffleBtn: document.getElementById("shuffleBtn"),
    loopBtn: document.getElementById("loopBtn"),
    progressContainer: document.getElementById("progressContainer"),
    progressBar: document.getElementById("progressBar"),
    currTime: document.getElementById("currTime"),
    durTime: document.getElementById("durTime"),
    volSlider: document.getElementById("volumeSlider"),
    search: document.getElementById("searchInput")
};

// =====================
// INITIALIZATION
// =====================
fetch("songs.json")
    .then(res => res.json())
    .then(data => {
        songs = data.map((s, i) => ({ ...s, index: i }));
        renderList(songs);
    })
    .catch(err => {
        console.error(err);
        els.list.innerHTML = `<div style="color:white; text-align:center; padding-top:20px;">Error loading songs.<br>Make sure 'songs.json' exists.</div>`;
    });

// =====================
// UI RENDER
// =====================
function renderList(data) {
    els.list.innerHTML = "";
    if (data.length === 0) {
        els.list.innerHTML = `<div style="color:#aaa; text-align:center;">No songs found</div>`;
        return;
    }
    
    data.forEach(song => {
        const div = document.createElement("div");
        div.className = `track-card ${song.index === currentIndex ? 'active' : ''}`;
        div.innerHTML = `
            <div class="card-img"><i class="fa-solid fa-music"></i></div>
            <div class="info">
                <div class="card-title">${song.title}</div>
                <div class="card-artist">${song.artist || 'Unknown'}</div>
            </div>
        `;
        div.onclick = () => playSong(song.index);
        els.list.appendChild(div);
    });
}

// =====================
// PLAYBACK LOGIC
// =====================
function playSong(index) {
    currentIndex = index;
    const song = songs[index];
    
    audio.src = `songs/${song.file}`;
    
    // Play with error handling
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => console.log("Auto-play blocked:", e));
    }
    
    // Update UI
    els.title.innerText = song.title;
    els.artist.innerText = song.artist || "999 Library"; // Default text fallback
    els.player.classList.add("visible");
    els.playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    
    // Highlight active
    renderList(songs); // Re-render to show active state
}

function togglePlay() {
    if (!audio.src) {
        if (songs.length) playSong(0);
        return;
    }
    if (audio.paused) {
        audio.play();
        els.playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
        audio.pause();
        els.playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

function nextSong() {
    if (currentIndex === -1) {
        if (songs.length) playSong(0);
        return;
    }
    
    if (isShuffle) {
        if (songs.length <= 1) return;
        let r;
        do { r = Math.floor(Math.random() * songs.length); } while (r === currentIndex);
        playSong(r);
    } else {
        playSong((currentIndex + 1) % songs.length);
    }
}

function prevSong() {
    if (currentIndex === -1) return;
    playSong((currentIndex - 1 + songs.length) % songs.length);
}

// =====================
// EVENTS
// =====================
els.playBtn.onclick = togglePlay;
els.nextBtn.onclick = nextSong;
els.prevBtn.onclick = prevSong;

els.shuffleBtn.onclick = () => {
    isShuffle = !isShuffle;
    els.shuffleBtn.classList.toggle("active");
};

els.loopBtn.onclick = () => {
    isLoop = !isLoop;
    els.loopBtn.classList.toggle("active");
};

audio.onended = () => {
    if (isLoop) {
        audio.currentTime = 0;
        audio.play();
    } else {
        nextSong();
    }
};

// =====================
// PROGRESS & TIME
// =====================
function formatTime(s) {
    if (isNaN(s)) return "0:00";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

audio.ontimeupdate = () => {
    const { currentTime, duration } = audio;
    if (duration) {
        const percent = (currentTime / duration) * 100;
        els.progressBar.style.width = `${percent}%`;
        els.currTime.innerText = formatTime(currentTime);
        els.durTime.innerText = formatTime(duration);
    }
};

els.progressContainer.onclick = (e) => {
    const width = els.progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if (duration) {
        audio.currentTime = (clickX / width) * duration;
    }
};

// =====================
// VOLUME (PC)
// =====================
if (els.volSlider) {
    els.volSlider.oninput = (e) => audio.volume = e.target.value;
}

// =====================
// SEARCH
// =====================
els.search.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = songs.filter(s => s.title.toLowerCase().includes(term));
    
    // We render the filtered list but keep original indices for playback
    els.list.innerHTML = "";
    filtered.forEach(song => {
        const div = document.createElement("div");
        div.className = `track-card ${song.index === currentIndex ? 'active' : ''}`;
        div.innerHTML = `
            <div class="card-img"><i class="fa-solid fa-music"></i></div>
            <div class="info">
                <div class="card-title">${song.title}</div>
                <div class="card-artist">${song.artist || 'Juice WRLD'}</div>
            </div>
        `;
        div.onclick = () => playSong(song.index);
        els.list.appendChild(div);
    });
};