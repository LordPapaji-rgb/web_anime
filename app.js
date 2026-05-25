let animeData = [

  {
    id: "kumo",
    title: "Kumo Kitchen",
    genres: ["Comedy", "Fantasy"],
    studio: "Tamago Lab",
    rating: "8.1",
    description: "Koki magang membuka kedai ramen untuk para petualang dari dunia lain.",
    poster: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
    episodes: [
      { number: 1, title: "Kaldu Bulan", duration: "21m", src: "video/kumo-episode-1.mp4" },
      { number: 2, title: "Pesanan Naga", duration: "21m", src: "video/kumo-episode-2.mp4" }
    ]
  }
];

const fallbackVideo = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const placeholderPoster = "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80";

const state = {
  activeAnime: animeData[0],
  activeEpisode: animeData[0].episodes[0],
  genre: "all",
  query: ""
};

const animeGrid = document.querySelector("#animeGrid");
const episodeList = document.querySelector("#episodeList");
const animeCardTemplate = document.querySelector("#animeCardTemplate");
const episodeTemplate = document.querySelector("#episodeTemplate");
const videoPlayer = document.querySelector("#videoPlayer");
const videoSource = document.querySelector("#videoSource");
const watchTitle = document.querySelector("#watchTitle");
const watchDescription = document.querySelector("#watchDescription");
const currentGenre = document.querySelector("#currentGenre");
const episodeCount = document.querySelector("#episodeCount");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#searchInput");
const saveButton = document.querySelector("#saveButton");
const folderInput = document.querySelector("#folderInput");

function renderAnimeGrid() {
  const filtered = animeData.filter((anime) => {
    const searchable = `${anime.title} ${anime.studio} ${anime.genres.join(" ")}`.toLowerCase();
    const matchGenre = state.genre === "all" || anime.genres.includes(state.genre);
    return matchGenre && searchable.includes(state.query);
  });

  animeGrid.innerHTML = "";
  resultCount.textContent = `${filtered.length} judul`;

  filtered.forEach((anime) => {
    const card = animeCardTemplate.content.firstElementChild.cloneNode(true);
    const button = card.querySelector(".poster-button");
    const image = card.querySelector("img");
    const badge = card.querySelector(".badge");
    const title = card.querySelector("h3");
    const meta = card.querySelector("p");

    image.src = anime.poster;
    image.alt = `Poster ${anime.title}`;
    badge.textContent = anime.rating;
    title.textContent = anime.title;
    meta.textContent = `${anime.genres.join(" - ")} - ${anime.episodes.length} episode`;

    button.addEventListener("click", () => selectAnime(anime));
    animeGrid.append(card);
  });
}

function renderEpisodes() {
  episodeList.innerHTML = "";
  episodeCount.textContent = `${state.activeAnime.episodes.length} eps`;

  state.activeAnime.episodes.forEach((episode) => {
    const item = episodeTemplate.content.firstElementChild.cloneNode(true);
    item.classList.toggle("is-active", episode === state.activeEpisode);
    item.querySelector(".episode-number").textContent = episode.number;
    item.querySelector("strong").textContent = episode.title;
    item.querySelector("small").textContent = episode.duration;
    item.addEventListener("click", () => selectEpisode(episode));
    episodeList.append(item);
  });
}

function updatePlayer() {
  watchTitle.textContent = state.activeAnime.title;
  watchDescription.textContent = state.activeAnime.description;
  currentGenre.textContent = state.activeAnime.genres.join(" - ");
  videoPlayer.poster = state.activeAnime.poster;
  videoSource.src = state.activeEpisode.src || fallbackVideo;
  videoPlayer.load();
  updateSaveButton();

  videoPlayer.addEventListener("error", useFallbackVideo, { once: true });
}

function makeLocalAnime(video) {
  return {
    id: video.id,
    title: video.title,
    genres: ["Lokal"],
    studio: "Folder Video",
    rating: "Local",
    description: "Video ini dibaca otomatis dari folder video.",
    poster: placeholderPoster,
    episodes: [
      {
        number: 1,
        title: video.title,
        duration: video.duration || "Video lokal",
        src: video.src
      }
    ]
  };
}

function makeLocalSeries(videos, sourceLabel) {
  const sortedVideos = [...videos].sort((a, b) => a.title.localeCompare(b.title, "id", { numeric: true }));

  return {
    id: `local-series-${sourceLabel.toLowerCase().replace(/\s+/g, "-")}`,
    title: "Video Lokal",
    genres: ["Lokal"],
    studio: sourceLabel,
    rating: "Local",
    description: "Semua video dari folder digabung menjadi satu film dengan episode berurutan.",
    poster: placeholderPoster,
    episodes: sortedVideos.map((video, index) => ({
      number: index + 1,
      title: `Episode ${index + 1} - ${video.title}`,
      duration: video.duration,
      src: video.src
    }))
  };
}

function loadSelectedVideos(files) {
  const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-m4v"];
  const videos = [...files]
    .filter((file) => allowedTypes.includes(file.type) || /\.(mp4|webm|ogg|mov|m4v)$/i.test(file.name))
    .map((file) => {
      const cleanName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      return {
        id: `local-${file.name}-${file.size}-${file.lastModified}`,
        title: cleanName.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        src: URL.createObjectURL(file),
        duration: "Video lokal"
      };
    });

  if (videos.length === 0) {
    return;
  }

  const localSeries = makeLocalSeries(videos, "Folder Pilihan");
  animeData = [localSeries, ...animeData.filter((anime) => !anime.id.startsWith("local-series-"))];
  state.activeAnime = localSeries;
  state.activeEpisode = localSeries.episodes[0];
  renderAnimeGrid();
  renderEpisodes();
  updatePlayer();
}

async function loadVideosFromFolder() {
  try {
    const response = await fetch("video/", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const html = await response.text();
    const page = new DOMParser().parseFromString(html, "text/html");
    const links = [...page.querySelectorAll("a")]
      .map((link) => link.getAttribute("href"))
      .filter(Boolean)
      .map((href) => decodeURIComponent(href.split("?")[0]))
      .filter((href) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(href))
      .filter((href) => !href.includes("/") && !href.includes("\\"));

    if (links.length === 0) {
      return;
    }

    const videos = links.map((fileName) => {
      const cleanName = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      return {
        id: `folder-${fileName}`,
        title: cleanName.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        src: `video/${encodeURIComponent(fileName)}`,
        duration: "Video folder"
      };
    });

    const localSeries = makeLocalSeries(videos, "Folder Video");
    animeData = [localSeries, ...animeData.filter((anime) => !anime.id.startsWith("local-series-"))];
    state.activeAnime = localSeries;
    state.activeEpisode = localSeries.episodes[0];
    renderAnimeGrid();
    renderEpisodes();
    updatePlayer();
  } catch (error) {
    console.warn("Folder video tidak bisa dibaca otomatis.", error);
  }
}

function updateSaveButton() {
  const watchlist = JSON.parse(localStorage.getItem("webanime-watchlist") || "[]");
  saveButton.textContent = watchlist.includes(state.activeAnime.id) ? "Tersimpan" : "Simpan";
}

function useFallbackVideo() {
  videoSource.src = fallbackVideo;
  videoPlayer.load();
}

function selectAnime(anime) {
  state.activeAnime = anime;
  state.activeEpisode = anime.episodes[0];
  updatePlayer();
  renderEpisodes();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectEpisode(episode) {
  state.activeEpisode = episode;
  updatePlayer();
  renderEpisodes();
  videoPlayer.play().catch(() => {});
}

document.querySelector("#watchNow").addEventListener("click", () => {
  videoPlayer.play().catch(() => {});
});

saveButton.addEventListener("click", () => {
  const key = "webanime-watchlist";
  const watchlist = JSON.parse(localStorage.getItem(key) || "[]");
  const exists = watchlist.includes(state.activeAnime.id);
  const next = exists
    ? watchlist.filter((id) => id !== state.activeAnime.id)
    : [...watchlist, state.activeAnime.id];

  localStorage.setItem(key, JSON.stringify(next));
  updateSaveButton();
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value.trim().toLowerCase();
  renderAnimeGrid();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelector(".chip.is-active").classList.remove("is-active");
    chip.classList.add("is-active");
    state.genre = chip.dataset.genre;
    renderAnimeGrid();
  });
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  document.documentElement.classList.toggle("light");
});

folderInput.addEventListener("change", (event) => {
  loadSelectedVideos(event.target.files);
});

renderAnimeGrid();
renderEpisodes();
updatePlayer();
loadVideosFromFolder();
