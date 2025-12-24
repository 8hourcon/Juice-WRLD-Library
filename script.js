// =====================
// DATA
// =====================
let songs = [];

// Local fallback cover (YOU provide this file)
const DEFAULT_COVER = "assets/no-cover.png";

// =====================
// DOM ELEMENTS
// =====================
const songListContainer = document.getElementById("songList");
const searchInput = document.getElementById("searchInput");
const playerBar = document.getElementById("playerBar");
const audio = new Audio();
const jsmediatags = window.jsmediatags;

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
// LOAD SONGS FROM JSON
// =====================
fetch("songs.json")
    .then(res => {
        if (!res.ok) throw new Error("songs.json not found");
        return res.json();
    })
    .then(data => {
        // Attach stable indexes
        songs = data.map((s, i) => ({
            title: s.title.trim(),
            file: s.file.trim(),
            index: i,
            cover: null
        }));
        init();
    })
    .catch(err => {
        console.error("Failed to load songs.json", err);
        songListContainer.innerHTML =
            "<p style='color:white;text-align:center;'>Failed to load songs</p>";
    });

// =====================
// INIT
// =====================
function init() {
    renderSongList(songs);
}

// =====================
// RENDER SONG LIST
// =====================
function renderSongList(songArray) {
    songListContainer.innerHTML = "";

    if (!songArray.length) {
        songListContainer.innerHTML =
            "<p style='color:white;text-align:center;'>No songs found</p>";
        return;
    }

    songArray.forEach(song => {
        const card = document.createElement("div");
        card.className = "song-item";
        card.dataset.index = song.index;

        card.innerHTML = `
            <img src="${DEFAULT_COVER}" class="song-img" id="img-${song.index}">
            <div class="song-info">
                <div class="song-title">${song.title}</div>
            </div>
            <div class="play-action">
                <i class="fa-solid fa-play"></i>
            </div>
        `;

        card.onclick = () => playSong(song.index);

        songListContainer.appendChild(card);
        fetchCoverArt(song.file, song.index);
    });
}

// =====================
// COVER ART HANDLING
// =====================
function fetchCoverArt(filename, index) {
    fetch(`songs/${filename}`)
        .then(res => res.arrayBuffer())
        .then(buffer => {
            jsmediatags.read(buffer, {
                onSuccess: tag => {
                    const pic = tag.tags.picture;
                    if (!pic) {
                        useFallbackCover(index);
                        return;
                    }

                    let binary = "";
                    for (let i = 0; i < pic.data.length; i++) {
                        binary += String.fromCharCode(pic.data[i]);
                    }

                    const coverUrl =
                        `data:${pic.format};base64,${btoa(binary)}`;

                    applyCover(index, coverUrl);
                },
                onError: () => useFallbackCover(index)
            });
        })
        .catch(() => useFallbackCover(index));
}

function applyCover(index, url) {
    const img = document.getElementById(`img-${index}`);
    if (img) img.src = url;

    songs[index].cover = url;

    if (index === currentSongIndex) {
        currentThumb.src = url;
    }
}

function useFallbackCover(index) {
    applyCover(index, DEFAULT_COVER);
}

// =====================
// PLAYER
// =====================
function playSong(index) {
    if (!songs[index]) return;

    currentSongIndex = index;
    const song = songs[index];

    audio.src = `songs/${song.file}`;
    audio.play();

    currentTitle.innerText = song.title;
    currentThumb.src = song.cover || DEFAULT_COVER;
    playerBar.classList.add("visible");

    updatePlayIcon(true);
}

// =====================
// PLAY / PAUSE
// =====================
function togglePlay() {
    if (audio.paused) {
        audio.play();
        updatePlayIcon(true);
    } else {
        audio.pause();
        updatePlayIcon(false);
    }
}

function updatePlayIcon(playing) {
    playBtn.innerHTML = playing
        ? '<i class="fa-solid fa-pause"></i>'
        : '<i class="fa-solid fa-play"></i>';
}

// =====================
// CONTROLS
// =====================
prevBtn.onclick = () => {
    if (!songs.length) return;
    playSong((currentSongIndex - 1 + songs.length) % songs.length);
};

nextBtn.onclick = () => {
    if (!songs.length) return;
    playSong((currentSongIndex + 1) % songs.length);
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
    } else if (isShuffle) {
        let r;
        do {
            r = Math.floor(Math.random() * songs.length);
        } while (r === currentSongIndex && songs.length > 1);
        playSong(r);
    } else {
        nextBtn.click();
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
// SEARCH
// =====================
searchInput.oninput = e => {
    const term = e.target.value.toLowerCase();
    renderSongList(
        songs.filter(s => s.title.toLowerCase().includes(term))
    );
};

// =====================
// UTILS
// =====================
function formatTime(t) {
    if (!t || isNaN(t)) return "0:00";
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
}
