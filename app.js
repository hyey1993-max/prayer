const STORAGE_KEY = "coprayer-state-v1";

const palette = ["#71806d", "#b37960", "#7d7964", "#b99654", "#b46678", "#5f746f"];

const initialState = {
  activeProfileId: "p1",
  view: "profiles",
  sort: "desc",
  profiles: [
    { id: "p1", name: "하은", color: palette[0] },
    { id: "p2", name: "민준", color: palette[1] },
    { id: "p3", name: "서연", color: palette[2] },
  ],
  prayers: [
    {
      id: "r1",
      profileId: "p1",
      title: "이번 주 가족 예배를 위해",
      body: "각자의 일정이 바쁘지만 마음을 모아 예배할 수 있도록 함께 기도해 주세요.",
      createdAt: "2026-05-12T10:20:00.000Z",
      updatedAt: null,
      prayedBy: ["p2"],
      comments: [
        {
          id: "c1",
          profileId: "p2",
          body: "오늘 저녁에 함께 기도할게요.",
          createdAt: "2026-05-12T11:05:00.000Z",
        },
      ],
    },
    {
      id: "r2",
      profileId: "p2",
      title: "새로운 직장 적응",
      body: "업무와 관계 안에서 지혜롭게 배우고 건강한 리듬을 찾도록 기도 부탁해요.",
      createdAt: "2026-05-13T01:30:00.000Z",
      updatedAt: null,
      prayedBy: ["p1", "p3"],
      comments: [],
    },
  ],
};

let state = loadState();

const profileList = document.querySelector("#profileList");
const profileForm = document.querySelector("#profileForm");
const activeProfile = document.querySelector("#activeProfile");
const composerAuthor = document.querySelector("#composerAuthor");
const prayerForm = document.querySelector("#prayerForm");
const prayerBoard = document.querySelector("#prayerBoard");
const sortOrder = document.querySelector("#sortOrder");
const viewProfiles = document.querySelector("#viewProfiles");
const viewTimeline = document.querySelector("#viewTimeline");
const prayerTemplate = document.querySelector("#prayerTemplate");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(initialState);

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.profiles) || !Array.isArray(parsed.prayers)) {
      return structuredClone(initialState);
    }
    return parsed;
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getProfile(profileId) {
  return state.profiles.find((profile) => profile.id === profileId);
}

function getActiveProfile() {
  return getProfile(state.activeProfileId) || state.profiles[0];
}

function getInitials(name) {
  return name.trim().slice(0, 2).toUpperCase();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sortPrayers(prayers) {
  return [...prayers].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return state.sort === "asc" ? diff : -diff;
  });
}

function makeAvatar(profile) {
  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.style.setProperty("--avatar", profile.color);
  avatar.textContent = getInitials(profile.name);
  return avatar;
}

function renderProfiles() {
  profileList.replaceChildren();
  state.profiles.forEach((profile) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `profile-card${profile.id === state.activeProfileId ? " is-active" : ""}`;
    button.append(makeAvatar(profile));

    const label = document.createElement("span");
    label.textContent = profile.name;
    button.append(label);
    button.addEventListener("click", () => {
      state.activeProfileId = profile.id;
      saveState();
      render();
    });
    profileList.append(button);
  });
}

function renderActiveProfile() {
  const profile = getActiveProfile();
  activeProfile.replaceChildren(makeAvatar(profile), document.createTextNode(`${profile.name}으로 참여 중`));
  composerAuthor.textContent = profile.name;
}

function renderBoard() {
  prayerBoard.replaceChildren();
  sortOrder.value = state.sort;
  viewProfiles.classList.toggle("is-active", state.view === "profiles");
  viewTimeline.classList.toggle("is-active", state.view === "timeline");

  if (state.prayers.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "아직 공유된 기도제목이 없습니다.";
    prayerBoard.append(empty);
    return;
  }

  if (state.view === "timeline") {
    const grid = document.createElement("div");
    grid.className = "card-grid";
    sortPrayers(state.prayers).forEach((prayer) => grid.append(renderPrayerCard(prayer)));
    prayerBoard.append(grid);
    return;
  }

  state.profiles.forEach((profile) => {
    const prayers = sortPrayers(state.prayers.filter((prayer) => prayer.profileId === profile.id));
    if (prayers.length === 0) return;

    const section = document.createElement("section");
    section.className = "profile-section";
    const title = document.createElement("h3");
    title.append(makeAvatar(profile), document.createTextNode(`${profile.name}의 기도제목`));

    const grid = document.createElement("div");
    grid.className = "card-grid";
    prayers.forEach((prayer) => grid.append(renderPrayerCard(prayer)));
    section.append(title, grid);
    prayerBoard.append(section);
  });
}

function renderPrayerCard(prayer) {
  const profile = getProfile(prayer.profileId);
  const active = getActiveProfile();
  const node = prayerTemplate.content.firstElementChild.cloneNode(true);
  const isAuthor = prayer.profileId === active.id;
  const hasPrayed = prayer.prayedBy.includes(active.id);

  node.querySelector(".author-block .avatar").replaceWith(makeAvatar(profile));
  node.querySelector(".author-name").textContent = profile.name;
  node.querySelector(".created-at").textContent = `등록일 ${formatDate(prayer.createdAt)}`;
  node.querySelector(".created-at").dateTime = prayer.createdAt;
  node.querySelector(".prayer-copy h4").textContent = prayer.title;
  node.querySelector(".prayer-copy p").textContent = prayer.body;

  const editButton = node.querySelector(".edit-button");
  editButton.hidden = !isAuthor;
  bindEditing(node, prayer);

  const prayButton = node.querySelector(".pray-button");
  prayButton.classList.toggle("is-active", hasPrayed);
  prayButton.textContent = hasPrayed ? "중보 완료" : "중보 체크";
  prayButton.addEventListener("click", () => togglePrayerReaction(prayer.id));
  node.querySelector(".reaction-summary").textContent = makeReactionSummary(prayer);

  renderComments(node, prayer);
  bindCommentForm(node, prayer.id);

  return node;
}

function makeReactionSummary(prayer) {
  if (prayer.prayedBy.length === 0) return "아직 중보 체크가 없습니다.";
  const names = prayer.prayedBy.map((profileId) => getProfile(profileId)?.name).filter(Boolean);
  return `${names.join(", ")}님이 중보했어요.`;
}

function bindEditing(node, prayer) {
  const copy = node.querySelector(".prayer-copy");
  const editButton = node.querySelector(".edit-button");
  const form = node.querySelector(".edit-form");
  const titleInput = node.querySelector(".edit-title");
  const bodyInput = node.querySelector(".edit-body");

  editButton.addEventListener("click", () => {
    titleInput.value = prayer.title;
    bodyInput.value = prayer.body;
    copy.hidden = true;
    form.hidden = false;
  });

  node.querySelector(".cancel-edit").addEventListener("click", () => {
    copy.hidden = false;
    form.hidden = true;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    if (!title || !body) return;

    state.prayers = state.prayers.map((item) =>
      item.id === prayer.id ? { ...item, title, body, updatedAt: new Date().toISOString() } : item,
    );
    saveState();
    render();
  });
}

function renderComments(node, prayer) {
  const list = node.querySelector(".comment-list");
  list.replaceChildren();

  if (prayer.comments.length === 0) {
    const empty = document.createElement("div");
    empty.className = "comment";
    empty.textContent = "아직 댓글이 없습니다.";
    list.append(empty);
    return;
  }

  prayer.comments
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .forEach((comment) => {
      const author = getProfile(comment.profileId);
      const item = document.createElement("article");
      item.className = "comment";

      const meta = document.createElement("div");
      meta.className = "comment-meta";
      meta.textContent = `${author?.name || "알 수 없음"} · ${formatDate(comment.createdAt)}`;

      const body = document.createElement("p");
      body.textContent = comment.body;
      item.append(meta, body);
      list.append(item);
    });
}

function bindCommentForm(node, prayerId) {
  const form = node.querySelector(".comment-form");
  const input = form.querySelector("input");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const body = input.value.trim();
    if (!body) return;

    state.prayers = state.prayers.map((prayer) => {
      if (prayer.id !== prayerId) return prayer;
      return {
        ...prayer,
        comments: [
          ...prayer.comments,
          {
            id: createId("c"),
            profileId: getActiveProfile().id,
            body,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
    saveState();
    render();
  });
}

function togglePrayerReaction(prayerId) {
  const activeId = getActiveProfile().id;
  state.prayers = state.prayers.map((prayer) => {
    if (prayer.id !== prayerId) return prayer;
    const prayedBy = prayer.prayedBy.includes(activeId)
      ? prayer.prayedBy.filter((profileId) => profileId !== activeId)
      : [...prayer.prayedBy, activeId];
    return { ...prayer, prayedBy };
  });
  saveState();
  render();
}

function render() {
  renderProfiles();
  renderActiveProfile();
  renderBoard();
}

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = profileForm.elements.profileName;
  const name = input.value.trim();
  if (!name) return;

  const profile = {
    id: createId("p"),
    name,
    color: palette[state.profiles.length % palette.length],
  };
  state.profiles = [...state.profiles, profile];
  state.activeProfileId = profile.id;
  input.value = "";
  saveState();
  render();
});

prayerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = prayerForm.elements.prayerTitle.value.trim();
  const body = prayerForm.elements.prayerBody.value.trim();
  if (!title || !body) return;

  state.prayers = [
    {
      id: createId("r"),
      profileId: getActiveProfile().id,
      title,
      body,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      prayedBy: [],
      comments: [],
    },
    ...state.prayers,
  ];
  prayerForm.reset();
  saveState();
  render();
});

sortOrder.addEventListener("change", () => {
  state.sort = sortOrder.value;
  saveState();
  renderBoard();
});

viewProfiles.addEventListener("click", () => {
  state.view = "profiles";
  saveState();
  renderBoard();
});

viewTimeline.addEventListener("click", () => {
  state.view = "timeline";
  saveState();
  renderBoard();
});

render();
