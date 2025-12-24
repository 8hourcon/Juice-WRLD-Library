// --- CONFIGURATION ---
// IMPORTANT: You must list your MP3 filenames here exactly as they appear in your 'songs' folder.
// The code cannot automatically scan the folder.
const songs = [
    // Copy this line for every song you have:
    { title: "My Song Title", file: "my_song_filename.mp3" },
    
    // Example (Remove or replace these when you add your own):
    // { title: "Lucid Dreams", file: "lucid_dreams.mp3" },
    // { title: "All Girls Are The Same", file: "all_girls.mp3" },
];

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

// --- INITIALIZATION ---
function init() {
    renderSongList(songs);
}

// --- RENDER FUNCTIONS ---
function renderSongList(songArray) {
    songListContainer.innerHTML = '';
    
    if (songArray.length === 0) {
        songListContainer.innerHTML = '<p style="color:white; text-align:center;">No songs found. Please add them to the "songs" array in script.js</p>';
        return;
    }

    songArray.forEach((song) => {
        const originalIndex = songs.indexOf(song);

        const card = document.createElement('div');
        card.classList.add('song-item');
        card.setAttribute('data-index', originalIndex);
        
        card.innerHTML = `
            <img src="${DEFAULT_COVER}" class="song-img" id="img-${originalIndex}" alt="Cover">
            <div class="song-info">
                <div class="song-title">${song.title}</div>
            </div>
            <div class="play-action">
                <i class="fa-solid fa-play"></i>
            </div>
        `;

        card.addEventListener('click', () => {
            playSong(originalIndex);
        });

        songListContainer.appendChild(card);
        fetchCoverArt(song.file, originalIndex);
    });
}

function fetchCoverArt(filename, index) {
    const filePath = `songs/${filename}`;
    
    jsmediatags.read(filePath, {
        onSuccess: function(tag) {
            const picture = tag.tags.picture;
            if (picture) {
                let base64String = "";
                for (let i = 0; i < picture.data.length; i++) {
                    base64String += String.fromCharCode(picture.data[i]);
                }
                const base64 = "data:" + picture.format + ";base64," + window.btoa(base64String);
                
                const listImg = document.getElementById(`img-${index}`);
                if (listImg) listImg.src = base64;
                songs[index].cover = base64;
            }
        },
        onError: function(error) {
            // console.log("No cover found for", filename);
        }
    });
}

// --- PLAYER LOGIC ---

function playSong(index) {
    if (index < 0 || index >= songs.length) return;

    currentSongIndex = index;
    const song = songs[index];
    
    audio.src = `songs/${song.file}`;
    currentTitle.innerText = song.title;
    currentThumb.src = song.cover ? song.cover : DEFAULT_COVER;

    playerBar.classList.add('visible');
    
    document.querySelectorAll('.song-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.play-action').forEach(i => i.innerHTML = '<i class="fa-solid fa-play"></i>');
    
    const activeCard = document.querySelector(`[data-index="${index}"]`);
    if(activeCard) {
        activeCard.classList.add('active');
        activeCard.querySelector('.play-action').innerHTML = '<i class="fa-solid fa-pause"></i>';
    }

    audio.play();
    updatePlayIcon(true);
}

function togglePlay() {
    if (songs.length === 0) return;
    if (audio.paused) {
        audio.play();
        updatePlayIcon(true);
    } else {
        audio.pause();
        updatePlayIcon(false);
    }
}

function updatePlayIcon(playing) {
    playBtn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    
    if (currentSongIndex !== -1) {
        const activeCard = document.querySelector(`[data-index="${currentSongIndex}"]`);
        if(activeCard) {
            const icon = activeCard.querySelector('.play-action');
            icon.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
        }
    }
}

// --- CONTROLS ---

prevBtn.addEventListener('click', () => {
    if (audio.currentTime > 5) {
        audio.currentTime = 0;
        audio.play();
    } else {
        let prevIndex = currentSongIndex - 1;
        if (prevIndex < 0) prevIndex = songs.length - 1;
        playSong(prevIndex);
    }
});

nextBtn.addEventListener('click', nextSong);

function nextSong() {
    if (songs.length === 0) return;
    if (isShuffle) {
        let randIndex;
        do {
            randIndex = Math.floor(Math.random() * songs.length);
        } while (randIndex === currentSongIndex && songs.length > 1);
        playSong(randIndex);
    } else {
        let nextIndex = currentSongIndex + 1;
        if (nextIndex >= songs.length) nextIndex = 0;
        playSong(nextIndex);
    }
}

loopBtn.addEventListener('click', () => {
    isLoop = !isLoop;
    loopBtn.classList.toggle('active', isLoop);
});

shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
});

audio.addEventListener('ended', () => {
    if (isLoop) {
        audio.currentTime = 0;
        audio.play();
    } else {
        nextSong();
    }
});

audio.addEventListener('timeupdate', (e) => {
    const { duration, currentTime } = e.srcElement;
    if(duration) {
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        currentTimeEl.innerText = formatTime(currentTime);
        durationEl.innerText = formatTime(duration);
    }
});

progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
});

function formatTime(time) {
    if(isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
});

playBtn.addEventListener('click', togglePlay);

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = songs.filter(song => song.title.toLowerCase().includes(term));
    renderSongList(filtered);
});

init();