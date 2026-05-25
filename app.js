let animeData = [
  {
    id: "anime-main",
    title: "Redo of Healer",
    genres: ["Action", "Fantasy"],
    studio: "WebAnime",
    rating: "9.0",
    description: "Streaming anime dari folder video.",
    poster: "./video/network-7862055_1280.jpg",
    episodes: [
      { number: 1, title: "Episode 01", duration: "24m", src: "./video/eps01.mp4" },
      { number: 2, title: "Episode 02", duration: "24m", src: "./video/eps02.mp4" },
      { number: 3, title: "Episode 03", duration: "24m", src: "./video/eps03.mp4" },
      { number: 4, title: "Episode 04", duration: "24m", src: "./video/eps04.mp4" },
      { number: 5, title: "Episode 05", duration: "24m", src: "./video/eps05.mp4" },
      { number: 6, title: "Episode 06", duration: "24m", src: "./video/eps06.mp4" },
      { number: 7, title: "Episode 07", duration: "24m", src: "./video/eps07.mp4" },
      { number: 8, title: "Episode 08", duration: "24m", src: "./video/eps08.mp4" },
      { number: 9, title: "Episode 09", duration: "24m", src: "./video/eps09.mp4" },
      { number: 10, title: "Episode 10", duration: "24m", src: "./video/eps10.mp4" },
      { number: 11, title: "Episode 11", duration: "24m", src: "./video/eps11.mp4" },
      { number: 12, title: "Episode 12", duration: "24m", src: "./video/eps12.mp4" }
    ]
  }
];

const fallbackVideo =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

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

function renderAnimeGrid() {
  const filtered = animeData.filter((anime) => {
    const searchable =
      `${anime.title} ${anime.studio} ${anime.genres.join(" ")}`
        .toLowerCase();

    const matchGenre =
      state.genre === "all" ||
      anime.genres.includes(state.genre);

    return matchGenre && searchable.includes(state.query);
  });

  animeGrid.innerHTML = "";
  resultCount.textContent = `${filtered.length} judul`;

  filtered.forEach((anime) => {
    const card =
      animeCardTemplate.content.firstElementChild.cloneNode(true);

    const button = card.querySelector(".poster-button");
    const image = card.querySelector("img");
    const badge = card.querySelector(".badge");
    const title = card.querySelector("h3");
    const meta = card.querySelector("p");

    image.src = anime.poster;
    image.alt = `Poster ${anime.title}`;

    badge.textContent = anime.rating;
    title.textContent = anime.title;

    meta.textContent =
      `${anime.genres.join(" - ")} - ${anime.episodes.length} episode`;

    button.addEventListener("click", () => {
      selectAnime(anime);
    });

    animeGrid.append(card);
  });
}

function renderEpisodes() {
  episodeList.innerHTML = "";

  episodeCount.textContent =
    `${state.activeAnime.episodes.length} eps`;

  state.activeAnime.episodes.forEach((episode) => {
    const item =
      episodeTemplate.content.firstElementChild.cloneNode(true);

    item.classList.toggle(
      "is-active",
      episode === state.activeEpisode
    );

    item.querySelector(".episode-number").textContent =
      episode.number;

    item.querySelector("strong").textContent =
      episode.title;

    item.querySelector("small").textContent =
      episode.duration;

    item.addEventListener("click", () => {
      selectEpisode(episode);
    });

    episodeList.append(item);
  });
}

function updatePlayer() {
  watchTitle.textContent = state.activeAnime.title;

  watchDescription.textContent =
    state.activeAnime.description;

  currentGenre.textContent =
    state.activeAnime.genres.join(" - ");

  videoPlayer.poster = state.activeAnime.poster;

  videoSource.src =
    state.activeEpisode.src || fallbackVideo;

  videoPlayer.load();

  updateSaveButton();

  videoPlayer.onerror = () => {
    videoSource.src = fallbackVideo;
    videoPlayer.load();
  };
}

function updateSaveButton() {
  const watchlist = JSON.parse(
    localStorage.getItem("webanime-watchlist") || "[]"
  );

  saveButton.textContent =
    watchlist.includes(state.activeAnime.id)
      ? "Tersimpan"
      : "Simpan";
}

function selectAnime(anime) {
  state.activeAnime = anime;
  state.activeEpisode = anime.episodes[0];

  updatePlayer();
  renderEpisodes();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function selectEpisode(episode) {
  state.activeEpisode = episode;

  updatePlayer();
  renderEpisodes();

  videoPlayer.play().catch(() => {});
}

document
  .querySelector("#watchNow")
  .addEventListener("click", () => {
    videoPlayer.play().catch(() => {});
  });

saveButton.addEventListener("click", () => {
  const key = "webanime-watchlist";

  const watchlist = JSON.parse(
    localStorage.getItem(key) || "[]"
  );

  const exists =
    watchlist.includes(state.activeAnime.id);

  const next = exists
    ? watchlist.filter(
        (id) => id !== state.activeAnime.id
      )
    : [...watchlist, state.activeAnime.id];

  localStorage.setItem(
    key,
    JSON.stringify(next)
  );

  updateSaveButton();
});

searchInput.addEventListener("input", (event) => {
  state.query =
    event.target.value.trim().toLowerCase();

  renderAnimeGrid();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document
      .querySelector(".chip.is-active")
      .classList.remove("is-active");

    chip.classList.add("is-active");

    state.genre = chip.dataset.genre;

    renderAnimeGrid();
  });
});

document
  .querySelector("#themeToggle")
  .addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
  });

renderAnimeGrid();
renderEpisodes();
updatePlayer();
