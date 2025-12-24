// =====================
// DATA
// =====================
let songs = [];
const DEFAULT_COVER = "assets/no-cover.png";

// =====================
// DOM ELEMENTS
// =====================
const songListContainer = document.getElementById("songList");
const searchInput = document.getElementById("searchInput");
const searchContainer = document.querySelector(".search-container");
const searchIcon = document.querySelector(".search-container i");
const playerBar = document.getElementById("playerBar");
const audio = new Audio();

// Player controls
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const loopBtn = document.getElementById("loopBtn");
const progressBar = document.getElementById("progressBar");
const progressContainer = document.getElementById("progressContainer");
const currentTitle = document.getElementById("currentTitle");
const currentThumb = document.getElementById("currentThumb");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volumeSlider = document.getElementById("volumeSlider");

// =====================
// STATE
// =====================
let currentSongIndex = -1;
let isShuffle = false;
let isLoop = false;

// =====================
// LOAD SONGS
// =====================
fetch("songs.json")
    .then(res => {
        if (!res.ok) throw new Error("songs.json not found");
        return res.json();
    })
    .then(data => {
        songs = data.map((s, i) => ({
            title: s.title.trim(),
            file: s.file.trim(),
            index: i
        }));
        renderSongList(songs);
    })
    .catch(err => {
        console.error(err);
        songListContainer.innerHTML =
            "<p style='text-align:center;'>Failed to load songs</p>";
    });

// =====================
// RENDER SONGS
// =====================
function renderSongList(list) {
    songListContainer.innerHTML = "";

    list.forEach(song => {
        const card = document.createElement("div");
        card.className = "song-item";
        card.dataset.index = song.index;

        card.innerHTML = `
            <img src="${DEFAULT_COVER}" class="song-img">
            <div class="song-title">${song.title}</div>
            <div class="play-action">
                <i class="fa-solid fa-play"></i>
            </div>
        `;

        card.onclick = () => playSong(song.index);
        songListContainer.appendChild(card);
    });

    updateActiveSong();
}

// =====================
// PLAYER
// =====================
function playSong(index) {
    if (!songs[index]) return;

    currentSongIndex = index;
    audio.src = `songs/${songs[index].file}`;
    audio.play();

    currentTitle.innerText = songs[index].title;
    currentThumb.src = DEFAULT_COVER;
    playerBar.classList.add("visible");

    updatePlayIcon(true);
    updateActiveSong();
}

// =====================
// ACTIVE SONG UI
// =====================
function updateActiveSong() {
    document.querySelectorAll(".song-item").forEach(item => {
        item.classList.remove("active");
        const icon = item.querySelector(".play-action i");
        if (icon) icon.className = "fa-solid fa-play";
    });

    const active = document.querySelector(
        `.song-item[data-index="${currentSongIndex}"]`
    );

    if (active) {
        active.classList.add("active");
        const icon = active.querySelector(".play-action i");
        if (icon) icon.className = "fa-solid fa-pause";
    }
}

// =====================
// PLAY / PAUSE
// =====================
function togglePlay() {
    if (!audio.src) return;

    if (audio.paused) {
        audio.play();
        updatePlayIcon(true);
    } else {
        audio.pause();
        updatePlayIcon(false);
    }

    updateActiveSong();
}

function updatePlayIcon(playing) {
    playBtn.innerHTML = playing
        ? '<i class="fa-solid fa-pause"></i>'
        : '<i class="fa-solid fa-play"></i>';
}

// =====================
// SHUFFLE LOGIC
// =====================
function getNextIndex() {
    if (!isShuffle) {
        return (currentSongIndex + 1) % songs.length;
    }

    let r;
    do {
        r = Math.floor(Math.random() * songs.length);
    } while (r === currentSongIndex && songs.length > 1);

    return r;
}

// =====================
// CONTROLS
// =====================
playBtn.onclick = togglePlay;

prevBtn.onclick = () => {
    if (!songs.length) return;
    playSong((currentSongIndex - 1 + songs.length) % songs.length);
};

nextBtn.onclick = () => {
    if (!songs.length) return;
    playSong(getNextIndex());
};

shuffleBtn.onclick = () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("active", isShuffle);
};

loopBtn.onclick = () => {
    isLoop = !isLoop;
    loopBtn.classList.toggle("active", isLoop);
};

audio.onended = () => {
    if (isLoop) {
        audio.currentTime = 0;
        audio.play();
    } else {
        playSong(getNextIndex());
    }
};

// =====================
// PROGRESS BAR
// =====================
audio.ontimeupdate = () => {
    if (!audio.duration) return;

    progressBar.style.width =
        `${(audio.currentTime / audio.duration) * 100}%`;

    currentTimeEl.innerText = formatTime(audio.currentTime);
    durationEl.innerText = formatTime(audio.duration);
};

progressContainer.onclick = e => {
    if (!audio.duration) return;
    audio.currentTime =
        (e.offsetX / progressContainer.clientWidth) * audio.duration;
};

// =====================
// VOLUME
// =====================
volumeSlider.oninput = e => {
    audio.volume = e.target.value;
};

// =====================
// SEARCH (ICON TOGGLE)
// =====================
searchInput.oninput = e => {
    const term = e.target.value.toLowerCase();
    renderSongList(
        songs.filter(s => s.title.toLowerCase().includes(term))
    );
};

if (searchIcon && searchContainer) {
    searchIcon.onclick = () => {
        searchContainer.classList.toggle("active");

        if (searchContainer.classList.contains("active")) {
            searchInput.focus();
        } else {
            searchInput.value = "";
            renderSongList(songs);
        }
    };
}

// =====================
// UTILS
// =====================
function formatTime(t) {
    if (!t || isNaN(t)) return "0:00";
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
}
