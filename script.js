// --- DATA ---
let songs = [];

// Placeholder image if the MP3 has no cover art
const DEFAULT_COVER = "https://via.placeholder.com/300/1a1a1a/ff4500?text=JUICE";

// --- DOM ELEMENTS ---
const songListContainer = document.getElementById('songList');
const searchInput = document.getElementById('searchInput');
const playerBar = document.getElementById('playerBar');
const audio = new Audio();
const jsmediatags = window.jsmediatags;

// Player Controls
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const loopBtn = document.getElementById('loopBtn');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const currentTitle = document.getElementById('currentTitle');
const currentThumb = document.getElementById('currentThumb');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volumeSlider');

// --- STATE ---
let currentSongIndex = -1;
let isShuffle = false;
let isLoop = false;

// --- LOAD SONGS FROM JSON ---
fetch("songs.json")
    .then(res => res.json())
    .then(data => {
        songs = data;
        init();
    })
    .catch(err => {
        console.error("Failed to load songs.json", err);
        songListContainer.innerHTML = "<p style='color:white;text-align:center;'>Failed to load songs</p>";
    });

// --- INITIALIZATION ---
function init() {
    renderSongList(songs);
}

// --- RENDER FUNCTIONS ---
function renderSongList(songArray) {
    songListContainer.innerHTML = '';

    if (songArray.length === 0) {
        songListContainer.innerHTML = '<p style="color:white;text-align:center;">No songs found</p>';
        return;
    }

    songArray.forEach((song) => {
        const originalIndex = songs.indexOf(song);

        const card = document.createElement('div');
        card.classList.add('song-item');
        card.dataset.index = originalIndex;

        card.innerHTML = `
            <img src="${DEFAULT_COVER}" class="song-img" id="img-${originalIndex}">
            <div class="song-info">
                <div class="song-title">${song.title}</div>
            </div>
            <div class="play-action"><i class="fa-solid fa-play"></i></div>
        `;

        card.addEventListener('click', () => playSong(originalIndex));

        songListContainer.appendChild(card);
        fetchCoverArt(song.file, originalIndex);
    });
}

function fetchCoverArt(filename, index) {
    jsmediatags.read(`songs/${filename}`, {
        onSuccess: tag => {
            const pic = tag.tags.picture;
            if (!pic) return;

            let base64 = "";
            pic.data.forEach(byte => base64 += String.fromCharCode(byte));

            const src = `data:${pic.format};base64,${btoa(base64)}`;
            document.getElementById(`img-${index}`).src = src;
            songs[index].cover = src;
        }
    });
}

// --- PLAYER ---
function playSong(index) {
    currentSongIndex = index;
    const song = songs[index];

    audio.src = `songs/${song.file}`;
    audio.play();

    currentTitle.innerText = song.title;
    currentThumb.src = song.cover || DEFAULT_COVER;
    playerBar.classList.add('visible');

    updatePlayIcon(true);
}

function togglePlay() {
    audio.paused ? audio.play() : audio.pause();
    updatePlayIcon(!audio.paused);
}

function updatePlayIcon(playing) {
    playBtn.innerHTML = playing
        ? '<i class="fa-solid fa-pause"></i>'
        : '<i class="fa-solid fa-play"></i>';
}

// --- CONTROLS ---
prevBtn.onclick = () => playSong((currentSongIndex - 1 + songs.length) % songs.length);
nextBtn.onclick = () => playSong((currentSongIndex + 1) % songs.length);

shuffleBtn.onclick = () => shuffleBtn.classList.toggle('active', isShuffle = !isShuffle);
loopBtn.onclick = () => loopBtn.classList.toggle('active', isLoop = !isLoop);

audio.onended = () => isLoop ? audio.play() : nextBtn.click();

audio.ontimeupdate = () => {
    progressBar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    currentTimeEl.innerText = formatTime(audio.currentTime);
    durationEl.innerText = formatTime(audio.duration);
};

progressContainer.onclick = e =>
    audio.currentTime = (e.offsetX / progressContainer.clientWidth) * audio.duration;

volumeSlider.oninput = e => audio.volume = e.target.value;

playBtn.onclick = togglePlay;

searchInput.oninput = e =>
    renderSongList(songs.filter(s => s.title.toLowerCase().includes(e.target.value.toLowerCase())));

function formatTime(t) {
    if (!t) return "0:00";
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
}
