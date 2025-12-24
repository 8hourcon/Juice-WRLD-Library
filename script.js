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
        <div class="song-title">${song.title}</div>
        <div class="play-action"><i class="fa-solid fa-play"></i></div>
    `;
    card.onclick = () => playSong(song.index);
    songListContainer.appendChild(card);
  });
}

// =====================
// PLAYER
// =====================
function playSong(index) {
  currentSongIndex = index;
  audio.src = `songs/${songs[index].file}`;
  audio.play();

  currentTitle.innerText = songs[index].title;
  playerBar.classList.add("visible");

  updateActive();
  updatePlayIcon(true);
}

function updateActive() {
  document.querySelectorAll(".song-item").forEach(el => {
    el.classList.remove("active");
    el.querySelector(".play-action i").className = "fa-solid fa-play";
  });
  const active = document.querySelector(`[data-index="${currentSongIndex}"]`);
  if (active) {
    active.classList.add("active");
    active.querySelector(".play-action i").className = "fa-solid fa-pause";
  }
}

// =====================
// PLAY / PAUSE
// =====================
playBtn.onclick = () => {
  if (!audio.src) return;
  audio.paused ? audio.play() : audio.pause();
};

audio.onplay = () => updatePlayIcon(true);
audio.onpause = () => updatePlayIcon(false);

function updatePlayIcon(playing) {
  playBtn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
  const activeIcon = document.querySelector(`.song-item.active .play-action i`);
  if (activeIcon) activeIcon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
}

// =====================
// CONTROLS
// =====================
prevBtn.onclick = () => playSong((currentSongIndex - 1 + songs.length) % songs.length);
nextBtn.onclick = () => playSong(getNextIndex());

shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
};

loopBtn.onclick = () => {
  isLoop = !isLoop;
  loopBtn.classList.toggle("active", isLoop);
};

audio.onended = () => {
  if (isLoop) audio.play();
  else playSong(getNextIndex());
};

function getNextIndex() {
  if (!isShuffle) return (currentSongIndex + 1) % songs.length;
  let r;
  do { r = Math.floor(Math.random() * songs.length); }
  while (r === currentSongIndex && songs.length > 1);
  return r;
}

// =====================
// PROGRESS
// =====================
audio.ontimeupdate = () => {
  if (!audio.duration) return;
  progressBar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
};

progressContainer.onclick = e => {
  if (!audio.duration) return;
  audio.currentTime = (e.offsetX / progressContainer.clientWidth) * audio.duration;
};

// =====================
// VOLUME
// =====================
volumeSlider.oninput = e => { audio.volume = e.target.value; };

// =====================
// SEARCH
// =====================
searchInput.oninput = e => {
  const term = e.target.value.toLowerCase();
  renderSongList(songs.filter(s => s.title.toLowerCase().includes(term)));
};

if (searchIcon) {
  searchIcon.onclick = () => {
    searchIcon.parentElement.classList.toggle("active");
    if (searchIcon.parentElement.classList.contains("active")) searchInput.focus();
  };
}
