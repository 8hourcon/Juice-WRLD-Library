// =====================
// DATA
// =====================
let songs = [];

// =====================
// DOM ELEMENTS
// =====================
const songListContainer = document.getElementById("songList");
const searchInput = document.getElementById("searchInput");
const searchIcon = document.querySelector(".search-container i");
const playerBar = document.getElementById("playerBar");
const audio = new Audio();

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const loopBtn = document.getElementById("loopBtn");
const progressBar = document.getElementById("progressBar");
const progressContainer = document.getElementById("progressContainer");
const currentTitle = document.getElementById("currentTitle");
const volumeSlider = document.getElementById("volumeSlider");

// Inject Time Elements Dynamically
// This creates the time stamps below the progress bar
const timeDiv = document.createElement("div");
timeDiv.className = "time-marker";
timeDiv.innerHTML = '<span id="currTime">0:00</span><span id="durTime">0:00</span>';
// Insert timeDiv after progress container
progressContainer.parentNode.insertBefore(timeDiv, progressContainer.nextSibling);

const currTimeEl = document.getElementById("currTime");
const durTimeEl = document.getElementById("durTime");

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
  .then(res => res.json())
  .then(data => {
    songs = data.map((s, i) => ({
      title: s.title.trim(),
      file: s.file.trim(),
      index: i
    }));
    renderSongList(songs);
  })
  .catch(err => console.error("Error loading songs:", err));

// =====================
// RENDER SONGS
// =====================
function renderSongList(list) {
  songListContainer.innerHTML = "";
  if(list.length === 0) {
      songListContainer.innerHTML = "<div style='color:var(--text-secondary); text-align:center; grid-column: 1/-1;'>No songs found</div>";
      return;
  }
  
  list.forEach(song => {
    const card = document.createElement("div");
    card.className = "song-item";
    card.dataset.index = song.index;
    if(song.index === currentSongIndex) card.classList.add("active");

    card.innerHTML = `
        <div class="song-title">${song.title}</div>
        <div class="play-action">
            <i class="fa-solid ${song.index === currentSongIndex && !audio.paused ? 'fa-pause' : 'fa-play'}"></i>
        </div>
    `;
    
    card.onclick = () => {
        if(currentSongIndex === song.index) {
            audio.paused ? audio.play() : audio.pause();
        } else {
            playSong(song.index);
        }
    };
    songListContainer.appendChild(card);
  });
}

// =====================
// PLAYER LOGIC
// =====================
function playSong(index) {
  currentSongIndex = index;
  audio.src = `songs/${songs[index].file}`;
  
  const playPromise = audio.play();
  if (playPromise !== undefined) {
      playPromise.catch(error => console.log("Playback prevented:", error));
  }

  currentTitle.innerText = songs[index].title;
  playerBar.classList.add("visible");
  updateActiveUI();
}

function updateActiveUI() {
  document.querySelectorAll(".song-item").forEach(el => {
    el.classList.remove("active");
    const icon = el.querySelector(".play-action i");
    if(icon) icon.className = "fa-solid fa-play";
  });

  const activeCard = document.querySelector(`.song-item[data-index="${currentSongIndex}"]`);
  if (activeCard) {
    activeCard.classList.add("active");
    const icon = activeCard.querySelector(".play-action i");
    if(icon) icon.className = audio.paused ? "fa-solid fa-play" : "fa-solid fa-pause";
  }
  
  playBtn.innerHTML = audio.paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
}

// =====================
// CONTROLS
// =====================
playBtn.onclick = () => {
  if (!audio.src && songs.length > 0) {
      playSong(0);
      return;
  }
  if (!audio.src) return;
  audio.paused ? audio.play() : audio.pause();
};

audio.onplay = () => updateActiveUI();
audio.onpause = () => updateActiveUI();

prevBtn.onclick = () => {
    if(currentSongIndex === -1) return;
    let newIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(newIndex);
};

nextBtn.onclick = () => {
    if(currentSongIndex === -1 && songs.length > 0) {
        playSong(0);
        return;
    }
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

function getNextIndex() {
  if (!isShuffle) return (currentSongIndex + 1) % songs.length;
  if(songs.length <= 1) return 0;
  let r;
  do { r = Math.floor(Math.random() * songs.length); }
  while (r === currentSongIndex);
  return r;
}

// =====================
// TIME & PROGRESS
// =====================
function formatTime(s) {
    if(isNaN(s)) return "0:00";
    const minutes = Math.floor(s / 60);
    const seconds = Math.floor(s % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

audio.ontimeupdate = () => {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progressBar.style.width = `${percent}%`;
  
  if(currTimeEl) currTimeEl.innerText = formatTime(audio.currentTime);
  if(durTimeEl) durTimeEl.innerText = formatTime(audio.duration);
};

audio.onloadedmetadata = () => {
    if(durTimeEl) durTimeEl.innerText = formatTime(audio.duration);
};

// Make progress clickable
progressContainer.onclick = e => {
  if (!audio.duration) return;
  const rect = progressContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  audio.currentTime = (clickX / width) * audio.duration;
};

// =====================
// VOLUME (PC ONLY)
// =====================
if(volumeSlider) {
    volumeSlider.oninput = e => { audio.volume = e.target.value; };
}

// =====================
// SEARCH
// =====================
searchInput.oninput = e => {
  const term = e.target.value.toLowerCase();
  const filtered = songs.filter(s => s.title.toLowerCase().includes(term));
  renderSongList(filtered);
};

if (searchIcon) {
  searchIcon.onclick = () => {
    const container = document.querySelector(".search-container");
    container.classList.toggle("active");
    if (container.classList.contains("active")) searchInput.focus();
  };
}