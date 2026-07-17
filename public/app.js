const app = document.querySelector("#app");
const state = {
  name: "", joinCode: "", marineWorlds: true, activeCode: "", token: "",
  room: null, catalog: null, cardMap: {}, busy: "", error: "", copied: false, timer: null,
  setupKeep: new Set(), setupMap: "A", modal: null, detailCard: null, logOpen: false, inviteMode: false,
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options.headers ?? {}) } });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error ?? "請稍後再試");
    error.status = response.status;
    throw error;
  }
  return data;
}

function roomCodeFromInput(value) {
  const text = String(value ?? "").trim();
  try {
    const room = new URL(text, location.origin).searchParams.get("room");
    if (room) return room.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  } catch {}
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

async function loadCatalog() {
  if (state.catalog) return;
  const catalog = await api("/api/catalog");
  state.catalog = catalog;
  state.cardMap = Object.fromEntries(catalog.cards.map((card) => [card.rawId, card]));
}

function actionInfo(id) { return state.catalog?.actions.find((action) => action.id === id) ?? { id, name: id, glyph: "•", color: "#777" }; }
function mapInfo(id) { return state.catalog?.maps.find((map) => map.id === id) ?? state.catalog?.maps[0]; }
function cardInfo(id) { return state.cardMap[id] ?? null; }
function viewerState() { return state.room?.state?.playerState?.[state.room.viewerId] ?? null; }
function viewer() { return state.room?.players.find((player) => player.id === state.room.viewerId) ?? null; }
function playerName(id) { return state.room?.players.find((player) => player.id === id)?.name ?? "園長"; }

function typeName(card) {
  return { animal: "動物", sponsor: "贊助人", project: "保育計劃", endgame: "終局計分" }[card?.type] ?? "卡牌";
}

function abilityText(card) {
  if (!card) return "";
  if (card.type === "project") return `門檻 ${card.thresholds.join(" / ")} · 獎勵 ${card.points.join(" / ")} 保育分`;
  if (card.type === "endgame") return "終局按你嘅動物園發展計算，最多 4 保育分。";
  const value = card.abilityValue ?? 1;
  const text = {
    money: `即時取得 $${value * 2}`,
    draw: `即時抽 ${value} 張牌`,
    appeal: `額外取得 ${value} 魅力`,
    reputation: `聲譽提升 ${value}`,
    x: `取得 ${value} 個 X 標記`,
    break: `休息軌推進 ${value} 格`,
    conservation: `取得 ${Math.min(2, value)} 保育分`,
  }[card.ability] ?? "提供持續動物園效果";
  if (card.reef) return `珊瑚礁：${text}；每次打出礁居者會再觸發全園礁效果。`;
  return text;
}

function cardMarkup(card, options = {}) {
  if (!card) return "";
  const selected = Boolean(options.selected);
  const classes = [`zoo-card`, `type-${card.type}`, card.expansion === "marine" ? "is-marine" : "", selected ? "selected" : "", options.compact ? "compact" : ""].filter(Boolean).join(" ");
  const buttonAttrs = options.pick
    ? `role="button" tabindex="0" data-pick-card="${esc(card.rawId)}" aria-pressed="${selected}"`
    : `role="button" tabindex="0" data-card-detail="${esc(card.rawId)}"`;
  const cost = card.type === "animal" ? `$${card.cost}` : card.type === "sponsor" ? `強度 ${card.level}` : `#${card.rawId}`;
  const score = card.type === "animal" ? `魅力 ${card.appeal}` : card.type === "sponsor" ? `收入 ${card.income}` : card.type === "project" ? "保育" : "終局";
  return `<article class="${classes}" ${buttonAttrs}>
    <div class="card-topline"><span>${typeName(card)}</span><b>#${esc(card.rawId)}</b></div>
    <div class="card-art" aria-hidden="true"><span>${card.type === "animal" ? animalGlyph(card.kind) : card.type === "sponsor" ? "◆" : card.type === "project" ? "♟" : "◎"}</span>${card.wave ? "<i>〰</i>" : ""}</div>
    <div class="card-body"><h3>${esc(card.zh)}</h3>${card.zh !== card.name ? `<small>${esc(card.name)}</small>` : ""}<div class="tag-row">${(card.tags ?? []).slice(0, 2).map((tag) => `<span>${esc(tag)}</span>`).join("")}</div><p>${esc(abilityText(card))}</p></div>
    <div class="card-footer"><strong>${esc(cost)}</strong><span>${esc(score)}</span>${card.type === "animal" ? `<b>格 ${card.aquarium || card.size}</b>` : ""}</div>
  </article>`;
}

function animalGlyph(kind) {
  return { 肉食: "◢", 草食: "◒", 靈長: "◉", 爬蟲: "⌁", 鳥類: "⌃", 家畜: "◇", 海洋: "≋" }[kind] ?? "●";
}

function renderLanding() {
  const invited = state.inviteMode && state.joinCode.length === 6;
  const entryPanel = invited ? `<div class="entry-panel invite-panel"><div class="panel-label"><span></span> 加入私人房間</div>
        <div class="invite-code-card"><small>朋友邀請你加入</small><strong>${esc(state.joinCode)}</strong><p>輸入你嘅園長名稱，就會加入現有房間。</p></div>
        <form id="join-form"><label for="host-name">你嘅園長名稱</label><input id="host-name" maxlength="18" placeholder="例如：Leo" autocomplete="nickname" value="${esc(state.name)}">
          <button class="primary-button" ${state.busy || !state.name.trim() ? "disabled" : ""}>${state.busy === "join" ? "加入緊房間…" : `加入房間 ${esc(state.joinCode)}`}<span>→</span></button></form>
        ${state.error ? `<p class="form-error" role="alert">${esc(state.error)}</p>` : ""}
        <button class="invite-cancel text-button" id="cancel-invite" type="button">唔加入，返回首頁</button>
        <p class="privacy-note">毋須註冊；加入朋友房間唔計每日建房上限。</p></div>` : `<div class="entry-panel"><div class="panel-label"><span></span> 建立遊戲</div>
        <form id="create-form"><label for="host-name">你嘅園長名稱</label><input id="host-name" maxlength="18" placeholder="例如：Leo" autocomplete="nickname" value="${esc(state.name)}">
          <label class="switch-row"><span><strong>加入 Marine Worlds</strong><small>水族館、礁居者、浪花、新大學、變體行動卡</small></span><input id="marine-toggle" type="checkbox" ${state.marineWorlds ? "checked" : ""}></label>
          <button class="primary-button" ${state.busy || !state.name.trim() ? "disabled" : ""}>${state.busy === "create" ? "建立緊房間…" : "建立私人房間"}<span>→</span></button></form>
        <div class="or-divider"><span>或者加入朋友</span></div><form class="join-form" id="join-form"><input id="join-code" aria-label="六位房間代碼或邀請連結" placeholder="房間代碼／邀請連結" value="${esc(state.joinCode)}"><button class="secondary-button" ${state.busy || !state.name.trim() || state.joinCode.length < 6 ? "disabled" : ""}>${state.busy === "join" ? "加入緊…" : "加入"}</button></form>
        ${state.error ? `<p class="form-error" role="alert">${esc(state.error)}</p>` : ""}<p class="privacy-note">毋須註冊。每個網絡每日最多開 5 間房；加入朋友房間不限。</p></div>`;
  app.innerHTML = `<main class="landing-shell">
    <header class="topbar"><a class="brand" href="#top"><span class="brand-mark">OZ</span><span>OPEN ZOO <small>ONLINE</small></span></a><span class="build-badge">完整遊戲流程 · v1.0</span></header>
    <section class="hero" id="top">
      <div class="hero-copy"><p class="eyebrow">免費 · 開源 · 2–4 人即時連線</p><h1>一張連結，<br>開一間動物園。</h1><p class="hero-lede">繁體中文、基本版連 Marine Worlds。由揀起手牌、建造、動物、協會、贊助、休息收入，到兩條計分軌相遇，都喺瀏覽器完成。</p><div class="promise-row"><span><b>4</b> 位園長</span><span><b>296</b> 張牌索引</span><span><b>0</b> 蚊月費</span></div></div>
      ${entryPanel}
    </section>
    <section class="feature-deck"><article><span>01</span><h2>完整一局</h2><p>私人手牌、行動強度、圍欄容量、收入、保育計劃、最後一輪及終局排名。</p></article><article><span>02</span><h2>海洋世界</h2><p>大小水族館、海洋動物容量、礁居者連鎖、浪花展列及專科大學。</p></article><article><span>03</span><h2>伺服器判定</h2><p>每一步由伺服器驗證同保存；關頁後用同一部裝置及邀請連結重新入房。</p></article></section>
    <section class="disclaimer"><strong>非官方開源愛好者版本</strong><p>介面及圖形全部重新設計，冇使用原版卡圖或商標。卡名只作辨認；能力資料採用可調校規則模型，方便之後逐張校正。</p></section>
    <footer><span>OPEN ZOO ONLINE</span><p>為朋友之間免費連線而製作</p></footer>
  </main>`;
  const name = document.querySelector("#host-name");
  const code = document.querySelector("#join-code");
  name.addEventListener("input", (event) => { state.name = event.target.value; updateEntryButtons(); });
  code?.addEventListener("input", (event) => { event.target.value = roomCodeFromInput(event.target.value); state.joinCode = event.target.value; updateEntryButtons(); });
  document.querySelector("#marine-toggle")?.addEventListener("change", (event) => { state.marineWorlds = event.target.checked; });
  document.querySelector("#create-form")?.addEventListener("submit", createRoom);
  document.querySelector("#join-form").addEventListener("submit", joinRoom);
  document.querySelector("#cancel-invite")?.addEventListener("click", () => {
    history.replaceState({}, "", "/");
    Object.assign(state, { inviteMode: false, joinCode: "", error: "", busy: "" });
    renderLanding();
  });
}

function updateEntryButtons() {
  const create = document.querySelector("#create-form button");
  const join = document.querySelector("#join-form button");
  if (create) create.disabled = Boolean(state.busy) || !state.name.trim();
  if (join) join.disabled = Boolean(state.busy) || !state.name.trim() || state.joinCode.length < 6;
}

async function createRoom(event) {
  event.preventDefault(); state.busy = "create"; state.error = ""; renderLanding();
  try {
    const result = await api("/api/rooms", { method: "POST", body: JSON.stringify({ name: state.name, marineWorlds: state.marineWorlds }) });
    enterRoom(result.code, result.playerToken);
  } catch (error) { state.busy = ""; state.error = error.message; renderLanding(); }
}

async function joinRoom(event) {
  event.preventDefault(); state.busy = "join"; state.error = ""; renderLanding();
  try {
    const code = roomCodeFromInput(state.joinCode);
    if (code.length !== 6) throw new Error("請輸入六位房間代碼或完整邀請連結");
    const result = await api(`/api/rooms/${code}/join`, { method: "POST", body: JSON.stringify({ name: state.name }) });
    enterRoom(result.code, result.playerToken);
  } catch (error) { state.busy = ""; state.error = error.message; renderLanding(); }
}

function enterRoom(code, token) {
  localStorage.setItem(`open-zoo:${code}`, token);
  history.replaceState({}, "", `/?room=${code}`);
  Object.assign(state, { activeCode: code, token, room: null, busy: "", error: "", modal: null, detailCard: null, inviteMode: false });
  renderRoom(); refreshRoom();
  clearInterval(state.timer); state.timer = setInterval(() => refreshRoom(true), 2800);
}

async function refreshRoom(silent = false) {
  if (!state.activeCode || !state.token) return;
  try {
    await loadCatalog();
    const next = await api(`/api/rooms/${state.activeCode}?token=${encodeURIComponent(state.token)}`);
    const changed = state.room?.room.updatedAt !== next.room.updatedAt;
    state.room = next;
    if (!silent) state.error = "";
    if (!silent || changed) renderRoom();
  } catch (error) {
    if (error.status === 401) {
      const code = state.activeCode;
      localStorage.removeItem(`open-zoo:${code}`);
      clearInterval(state.timer);
      history.replaceState({}, "", `/?room=${code}`);
      Object.assign(state, { activeCode: "", token: "", room: null, joinCode: code, inviteMode: true, busy: "", error: "連線資料已失效，請輸入名稱重新加入。" });
      renderLanding();
      return;
    }
    if (!silent) { state.error = error.message; renderRoom(); }
  }
}

function renderRoom() {
  const room = state.room;
  app.innerHTML = `<main class="game-shell">
    <header class="game-topbar"><button class="mini-brand" id="leave-room"><span>OZ</span><b>OPEN ZOO</b></button><div class="room-code"><small>私人房間</small><strong>${esc(state.activeCode)}</strong><button id="copy-room">${state.copied ? "已複製 ✓" : "邀請朋友"}</button></div><div class="top-actions"><button class="text-button" id="toggle-log">紀錄</button><button class="text-button" id="leave-room-2">離開</button></div></header>
    ${state.error ? `<div class="game-error" role="alert"><span>${esc(state.error)}</span><button id="refresh-room">重新整理</button></div>` : ""}
    ${!room || !state.catalog ? loadingMarkup() : room.room.status === "lobby" ? lobbyMarkup(room) : room.state.phase === "setup" ? setupMarkup(room) : room.state.phase === "finished" ? finishedMarkup(room) : tableMarkup(room)}
    ${room && state.logOpen ? logDrawer(room) : ""}${state.modal ? actionModal(room) : ""}${state.detailCard ? detailModal() : ""}
  </main>`;
  bindRoomEvents();
}

function bindRoomEvents() {
  document.querySelector("#leave-room")?.addEventListener("click", leaveRoom);
  document.querySelector("#leave-room-2")?.addEventListener("click", leaveRoom);
  document.querySelector("#copy-room")?.addEventListener("click", copyRoom);
  document.querySelector("#copy-room-2")?.addEventListener("click", copyRoom);
  document.querySelector("#refresh-room")?.addEventListener("click", () => refreshRoom());
  document.querySelector("#start-game")?.addEventListener("click", startGame);
  document.querySelector("#toggle-log")?.addEventListener("click", () => { state.logOpen = !state.logOpen; renderRoom(); });
  document.querySelector("#close-log")?.addEventListener("click", () => { state.logOpen = false; renderRoom(); });
  document.querySelectorAll("[data-card-detail]").forEach((item) => item.addEventListener("click", () => { state.detailCard = item.dataset.cardDetail; renderRoom(); }));
  document.querySelectorAll("[data-setup-card]").forEach((item) => item.addEventListener("click", () => toggleSetupCard(item.dataset.setupCard)));
  document.querySelectorAll("[data-map]").forEach((item) => item.addEventListener("click", () => { state.setupMap = item.dataset.map; renderRoom(); }));
  document.querySelector("#confirm-setup")?.addEventListener("click", confirmSetup);
  document.querySelectorAll("[data-open-action]").forEach((item) => item.addEventListener("click", () => openAction(item.dataset.openAction)));
  document.querySelectorAll("[data-upgrade]").forEach((item) => item.addEventListener("click", () => sendCommand({ type: "upgrade", actionId: item.dataset.upgrade })));
  document.querySelector("#modal-close")?.addEventListener("click", closeModal);
  document.querySelector("#detail-close")?.addEventListener("click", () => { state.detailCard = null; renderRoom(); });
  document.querySelectorAll("[data-modal-mode]").forEach((item) => item.addEventListener("click", () => updateModal({ mode: item.dataset.modalMode })));
  document.querySelectorAll("[data-modal-task]").forEach((item) => item.addEventListener("click", () => updateModal({ task: item.dataset.modalTask })));
  document.querySelectorAll("[data-modal-target]").forEach((item) => item.addEventListener("click", () => updateModal({ target: item.dataset.modalTarget })));
  document.querySelectorAll("[data-market-index]").forEach((item) => item.addEventListener("click", () => updateModal({ marketIndex: Number(item.dataset.marketIndex), mode: "snap" })));
  document.querySelectorAll("[data-structure]").forEach((item) => item.addEventListener("click", () => updateModal({ structure: item.dataset.structure })));
  document.querySelectorAll("[data-build-cell]").forEach((item) => item.addEventListener("click", () => updateModal({ cell: Number(item.dataset.buildCell) })));
  document.querySelectorAll("[data-pick-card]").forEach((item) => item.addEventListener("click", () => pickModalCard(item.dataset.pickCard)));
  document.querySelector("#x-spend")?.addEventListener("input", (event) => updateModal({ x: Number(event.target.value) }, false));
  document.querySelector("#submit-action")?.addEventListener("click", submitAction);
}

function loadingMarkup() { return `<div class="room-loading"><span class="leaf-loader"></span><h1>準備遊戲桌…</h1><p>讀取房間 ${esc(state.activeCode)}</p></div>`; }

function lobbyMarkup(data) {
  const isHost = data.room.hostPlayerId === data.viewerId;
  const seats = [0, 1, 2, 3].map((seat) => {
    const player = data.players.find((candidate) => candidate.seat === seat);
    return player ? `<div class="seat occupied-seat"><i style="--player:${player.color}">${esc(player.name.slice(0, 1).toUpperCase())}</i><span><strong>${esc(player.name)}${player.id === data.viewerId ? "（你）" : ""}</strong><small>${player.id === data.room.hostPlayerId ? "房主 · 可開始" : "已連線"}</small></span><b>✓</b></div>` : `<div class="seat empty-seat"><i>${seat + 1}</i><span><strong>等待園長</strong><small>分享六位代碼或邀請連結</small></span></div>`;
  }).join("");
  const button = isHost ? `<button class="start-button" id="start-game" ${data.players.length < 2 || state.busy ? "disabled" : ""}>${state.busy === "start" ? "洗牌同準備地圖…" : data.players.length < 2 ? "最少需要兩位園長" : "開始遊戲"}<span>→</span></button>` : `<p class="waiting-host"><i></i> 等待房主開始遊戲…</p>`;
  return `<section class="lobby-shell"><div class="lobby-heading"><p>私人遊戲大堂</p><h1>等齊園長，<br>就正式開園。</h1><div class="edition-pill">${data.room.marineWorlds ? "基本版 + Marine Worlds" : "基本版"}</div><ul><li>2–4 人，所有狀態自動保存</li><li>每人私密起手牌及終局牌</li><li>${data.room.marineWorlds ? "已啟用水族館、礁居者、浪花及變體行動卡" : "標準五大行動及保育計劃"}</li></ul></div><div class="lobby-card"><div class="lobby-code"><small>房間代碼</small><strong>${esc(data.room.code)}</strong><button id="copy-room-2">複製邀請連結</button></div><div class="seat-grid">${seats}</div>${button}<p class="lobby-note">開始後不能再加入。遊戲由房主座位開始；每人先揀 4/8 起手牌及一張地圖。</p></div></section>`;
}

function setupMarkup(data) {
  const me = data.state.playerState[data.viewerId];
  if (!me) return loadingMarkup();
  if (me.ready) {
    const rows = data.players.map((player) => `<div class="ready-row ${data.state.playerState[player.id].ready ? "done" : ""}"><i style="--player:${player.color}">${esc(player.name[0])}</i><span><strong>${esc(player.name)}</strong><small>${data.state.playerState[player.id].ready ? "設定完成" : "揀緊起手牌…"}</small></span><b>${data.state.playerState[player.id].ready ? "✓" : "…"}</b></div>`).join("");
    return `<section class="setup-wait"><div class="wait-illustration"><span>⬡</span><i></i></div><p class="eyebrow">你已經準備好</p><h1>等待其他園長揀牌</h1><div class="ready-list">${rows}</div><p>全部人確認後會自動開始，唔使再撳掣。</p></section>`;
  }
  const hand = me.initialHand.map(cardInfo).filter(Boolean);
  if (!state.setupKeep.size) hand.slice(0, 4).forEach((card) => state.setupKeep.add(card.rawId));
  const maps = state.catalog.maps.map((map) => `<button class="map-choice ${state.setupMap === map.id ? "selected" : ""}" data-map="${map.id}"><span>${esc(map.id)}</span><strong>${esc(map.name)}</strong><small>${esc(map.note)}</small></button>`).join("");
  const cards = hand.map((card) => `<div class="setup-card-wrap ${state.setupKeep.has(card.rawId) ? "selected" : ""}" data-setup-card="${card.rawId}"><span class="keep-mark">${state.setupKeep.has(card.rawId) ? "保留 ✓" : "棄掉"}</span>${cardMarkup(card, { compact: true })}</div>`).join("");
  return `<section class="setup-shell"><header><p class="eyebrow">個人設定 · 只有你睇到</p><h1>揀 4 張起手牌</h1><p>已揀 <strong>${state.setupKeep.size}/4</strong>。再揀一張動物園地圖；確認後就會等待其他玩家。</p></header><div class="setup-cards">${cards}</div><div class="map-picker"><div><p class="eyebrow">動物園地圖</p><h2>今局發展方向</h2></div><div class="map-options">${maps}</div></div><div class="setup-submit"><span>${esc(mapInfo(state.setupMap)?.name)} · 保留 ${state.setupKeep.size} 張牌</span><button id="confirm-setup" ${state.setupKeep.size !== 4 || state.busy ? "disabled" : ""}>${state.busy === "setup" ? "保存設定…" : "確認並準備好"}<b>→</b></button></div></section>`;
}

function tableMarkup(data) {
  const game = data.state;
  const me = game.playerState[data.viewerId];
  const current = data.players.find((player) => player.id === game.currentPlayerId);
  const myTurn = game.currentPlayerId === data.viewerId;
  const market = game.market.map((id, index) => `<div class="market-slot"><span class="folder">${index + 1}</span>${cardMarkup(cardInfo(id), { compact: true })}</div>`).join("");
  const players = data.players.map((player) => playerSummary(player, game.playerState[player.id], game.currentPlayerId === player.id, data.viewerId === player.id)).join("");
  const actions = me.actionOrder.map((id, index) => actionCardMarkup(id, index + 1, me, myTurn)).join("");
  const hand = me.hand.length ? me.hand.map((id) => cardMarkup(cardInfo(id), { compact: true })).join("") : `<div class="empty-hand"><span>▤</span><p>手上暫時冇牌</p></div>`;
  const target = Math.max(-20, 112 - me.conservation * 7);
  return `<section class="turn-banner ${myTurn ? "your-turn" : ""}"><div><small>第 ${game.round} 個休息週期</small><strong>${myTurn ? "到你行動" : `等待 ${esc(current?.name ?? "下一位園長")}`}</strong>${game.finale ? `<span class="finale-chip">最後一輪 · 尚餘 ${game.finale.remaining.length} 手</span>` : ""}</div><div class="break-meter"><span>休息軌</span><div><i style="width:${Math.min(100, game.breakProgress / game.breakTarget * 100)}%"></i></div><b>${game.breakProgress}/${game.breakTarget}</b></div><span class="edition-chip">${data.room.marineWorlds ? "Marine Worlds" : "基本版"}</span></section>
    <section class="score-table">${players}</section>
    <section class="central-board"><div class="display-panel"><div class="section-title"><div><small>共用展列</small><h2>卡牌市場</h2></div><span>你嘅聲譽：${me.reputation}</span></div><div class="card-market">${market}</div></div>
      <div class="association-panel"><div class="section-title"><div><small>共用版圖</small><h2>保育計劃</h2></div><span>${me.workers - me.usedWorkers}/${me.workers} 人員可用</span></div><div class="project-row">${game.projects.map(projectMarkup).join("")}</div><div class="association-spaces"><span><b>2</b> 聲譽</span><span><b>3</b> 合作動物園</span><span><b>4</b> 大學</span><span><b>5</b> 保育計劃</span></div></div></section>
    <section class="personal-area"><div class="zoo-panel"><div class="section-title"><div><small>${esc(mapInfo(me.mapId)?.name)}</small><h2>${esc(viewer()?.name)}嘅動物園</h2></div><span>${me.structures.length} 座設施 · ${me.playedAnimals.length} 隻動物</span></div>${zooMapMarkup(me)}<div class="resource-ribbon"><span><small>金錢</small><b>$${me.money}</b></span><span><small>魅力</small><b>${me.appeal}</b></span><span><small>保育</small><b>${me.conservation}</b></span><span><small>聲譽</small><b>${me.reputation}</b></span><span><small>X 標記</small><b>${me.xTokens}/5</b></span><span><small>終局目標</small><b>${target}</b></span></div></div>
      <div class="collection-panel"><div class="mini-section"><h3>合作</h3><div class="chip-list">${[...me.partnerZoos, ...me.universities].length ? [...me.partnerZoos, ...me.universities].map((item) => `<span>${esc(item.replace("animal:", "專科："))}</span>`).join("") : "<small>尚未有合作單位</small>"}</div></div><div class="mini-section"><h3>已打出</h3><p><b>${me.playedAnimals.length}</b> 動物 · <b>${me.sponsors.length}</b> 贊助 · <b>${me.supportedProjects.length}</b> 支持</p><div class="tag-cloud">${Object.entries(me.tags).filter(([, count]) => count).slice(0, 9).map(([tag, count]) => `<span>${esc(tag)} ${count}</span>`).join("")}</div></div><div class="mini-section private-goals"><h3>私人終局牌</h3>${me.endgames.map((id) => `<button data-card-detail="${id}">#${id} ${esc(cardInfo(id)?.zh ?? id)}</button>`).join("")}</div></div></section>
    ${me.upgradeCredits > 0 ? upgradePanel(me) : ""}
    <section class="hand-section"><div class="section-title"><div><small>私人區域 · ${me.hand.length}/${me.handLimit} 張</small><h2>你嘅手牌</h2></div><span>休息時會自動棄至手牌上限</span></div><div class="hand-scroll">${hand}</div></section>
    <section class="action-dock"><div class="dock-heading"><div><small>行動卡由左至右：強度 1–5</small><h2>${myTurn ? "揀一張行動卡" : `未到你，等待 ${esc(current?.name ?? "下一位園長")}`}</h2></div><span>用完會移到最左邊強度 1</span></div><div class="action-cards">${actions}</div></section>`;
}

function playerSummary(player, stats, active, mine) {
  return `<article class="score-player ${active ? "active" : ""} ${mine ? "mine" : ""}" style="--player:${player.color}"><i>${esc(player.name[0])}</i><div><strong>${esc(player.name)}${mine ? "（你）" : ""}</strong><small>${active ? "行動中" : `${stats.handCount} 張手牌`}</small></div><span><small>魅力</small><b>${stats.appeal}</b></span><span><small>保育</small><b>${stats.conservation}</b></span><span><small>聲譽</small><b>${stats.reputation}</b></span></article>`;
}

function projectMarkup(entry) {
  const card = cardInfo(entry.cardId);
  return `<button class="project-card" data-card-detail="${entry.cardId}"><span>#${entry.cardId}</span><strong>${esc(card?.zh ?? entry.cardId)}</strong><small>${esc(abilityText(card))}</small><div>${entry.claims.map((claim) => `<i title="${esc(playerName(claim.playerId))}">${esc(playerName(claim.playerId)[0])}${claim.points}</i>`).join("") || "尚未有人支持"}</div></button>`;
}

function zooMapMarkup(me, selectable = false) {
  const map = mapInfo(me.mapId);
  const structuresByCell = {};
  me.structures.forEach((structure) => structure.cells.forEach((cell, index) => { structuresByCell[cell] = { ...structure, anchor: index === 0 }; }));
  const cells = Array.from({ length: 33 }, (_, cell) => {
    const structure = structuresByCell[cell];
    const terrain = map?.water.includes(cell) ? "water" : map?.rock.includes(cell) ? "rock" : "";
    const selected = selectable && state.modal?.cell === cell ? "selected" : "";
    const content = structure?.anchor ? `<b>${esc(structure.label.replace("圍欄", "圍"))}</b><small>${structure.occupied || structure.used ? "使用中" : "空置"}</small>` : structure ? "" : terrain === "water" ? "≋" : terrain === "rock" ? "▲" : "";
    return `<button class="hex ${terrain} ${structure ? `built build-${structure.type}` : ""} ${selected}" ${selectable && !structure ? `data-build-cell="${cell}"` : "disabled"}><span>${content}</span></button>`;
  }).join("");
  return `<div class="hex-map">${cells}</div>`;
}

function actionCardMarkup(id, strength, me, enabled) {
  const action = actionInfo(id);
  const upgraded = me.actionUpgrades.includes(id);
  const variant = me.variants[id];
  return `<button class="action-card action-${id} ${upgraded ? "upgraded" : ""}" style="--action:${action.color}" data-open-action="${id}" ${!enabled || state.busy ? "disabled" : ""}><span class="strength">${strength}</span><i>${action.glyph}</i><div><strong>${esc(action.name)}</strong><small>${upgraded ? "II · 已升級" : "I · 標準"}${variant ? ` · 變體 ${variant}` : ""}</small></div><b>→</b></button>`;
}

function upgradePanel(me) {
  return `<section class="upgrade-panel"><div><span>升級機會</span><strong>揀一張行動卡翻到 II 面</strong><small>尚餘 ${me.upgradeCredits} 次；升級唔會消耗你今手行動。</small></div><div>${me.actionOrder.filter((id) => !me.actionUpgrades.includes(id)).map((id) => `<button data-upgrade="${id}">${actionInfo(id).glyph} ${esc(actionInfo(id).name)}</button>`).join("")}</div></section>`;
}

function finishedMarkup(data) {
  const scores = Object.entries(data.state.finalScores ?? {}).sort(([, a], [, b]) => b.total - a.total);
  const rows = scores.map(([playerId, score], index) => {
    const player = data.players.find((entry) => entry.id === playerId);
    return `<article class="result-row ${index === 0 ? "winner" : ""}" style="--player:${player?.color}"><span>${index + 1}</span><i>${esc(player?.name?.[0] ?? "?")}</i><div><strong>${esc(player?.name ?? "園長")}${playerId === data.viewerId ? "（你）" : ""}</strong><small>魅力 ${score.appeal} − 目標 ${score.target} + 終局 ${score.endgamePoints * 5}</small></div><b>${score.total}<small> VP</small></b></article>`;
  }).join("");
  return `<section class="finished-shell"><div class="winner-mark">◎</div><p class="eyebrow">遊戲完結</p><h1>${esc(playerName(data.state.winnerId))}<br>建立咗最佳動物園。</h1><p>兩條計分軌已經結算；同分時由支持較多保育計劃嘅園長勝出。</p><div class="results">${rows}</div><div class="finish-actions"><button id="copy-room-2">複製戰績房間連結</button><button id="leave-room-2">返回首頁</button></div></section>`;
}

function logDrawer(data) {
  return `<aside class="log-drawer"><header><div><small>自動保存</small><h2>遊戲紀錄</h2></div><button id="close-log">×</button></header><div>${data.state.log.map((entry, index) => `<p><span>${String(data.state.log.length - index).padStart(2, "0")}</span>${esc(entry)}</p>`).join("")}</div></aside><button class="drawer-scrim" id="close-log" aria-label="關閉紀錄"></button>`;
}

function openAction(actionId) {
  const me = viewerState();
  if (!me || state.room.state.currentPlayerId !== state.room.viewerId) return;
  const firstFree = Array.from({ length: 33 }, (_, index) => index).find((cell) => !me.structures.some((structure) => structure.cells.includes(cell))) ?? 0;
  const defaults = {
    cards: { mode: "draw", marketIndex: 0 }, build: { structure: "enclosure1", cell: firstFree },
    animals: { selected: [] }, sponsors: { mode: "break", selected: [] }, association: { task: "reputation", target: "非洲" },
  }[actionId] ?? {};
  state.modal = { actionId, x: 0, ...defaults };
  renderRoom();
}

function closeModal() { state.modal = null; renderRoom(); }
function updateModal(patch, rerender = true) { Object.assign(state.modal, patch); if (rerender) renderRoom(); }

function pickModalCard(cardId) {
  if (!state.modal) return;
  if (state.modal.actionId === "animals") {
    const selected = new Set(state.modal.selected ?? []);
    selected.has(cardId) ? selected.delete(cardId) : selected.add(cardId);
    state.modal.selected = [...selected].slice(-2);
  } else {
    state.modal.selected = [cardId];
    state.modal.mode = "play";
  }
  renderRoom();
}

function actionModal() {
  const modal = state.modal;
  const me = viewerState();
  if (!modal || !me) return "";
  const action = actionInfo(modal.actionId);
  const baseStrength = me.actionOrder.indexOf(modal.actionId) + 1;
  const strength = baseStrength + (modal.x ?? 0);
  let body = "";
  if (modal.actionId === "cards") body = cardsModal(me, strength);
  if (modal.actionId === "build") body = buildModal(me, strength);
  if (modal.actionId === "animals") body = animalsModal(me, strength);
  if (modal.actionId === "sponsors") body = sponsorsModal(me, strength);
  if (modal.actionId === "association") body = associationModal(me, strength);
  return `<div class="modal-scrim"><section class="action-modal" style="--action:${action.color}"><header><div class="modal-action-icon">${action.glyph}</div><div><small>行動強度 ${strength}</small><h2>${esc(action.name)}行動</h2></div><button id="modal-close">×</button></header><div class="x-control"><span>X 標記加強</span><input id="x-spend" type="range" min="0" max="${Math.min(5, me.xTokens)}" value="${modal.x ?? 0}"><b>+${modal.x ?? 0}</b><small>你有 ${me.xTokens} 個</small></div><div class="modal-content">${body}</div><footer><button class="modal-cancel" id="modal-close">取消</button><button class="modal-submit" id="submit-action" ${state.busy ? "disabled" : ""}>${state.busy === "command" ? "伺服器處理中…" : `執行${action.name}`}<span>→</span></button></footer></section></div>`;
}

function choiceButton(value, current, label, description, attr = "data-modal-mode") {
  return `<button class="choice-button ${value === current ? "selected" : ""}" ${attr}="${esc(value)}"><strong>${esc(label)}</strong><small>${esc(description)}</small></button>`;
}

function cardsModal(me, strength) {
  const upgraded = me.actionUpgrades.includes("cards");
  const table = upgraded ? [1, 1, 2, 3, 4] : [1, 1, 2, 2, 3];
  const draw = table[Math.min(4, Math.max(0, strength - 1))];
  const market = state.room.state.market.map((id, index) => `<div class="modal-market-card ${state.modal.marketIndex === index && state.modal.mode === "snap" ? "selected" : ""}" data-market-index="${index}"><span>位置 ${index + 1}</span>${cardMarkup(cardInfo(id), { compact: true })}</div>`).join("");
  return `<div class="choice-grid">${choiceButton("draw", state.modal.mode, `牌庫抽 ${draw} 張`, "休息軌推進 2 格")}${choiceButton("snap", state.modal.mode, "直接攞展列", upgraded ? "按強度揀聲譽範圍內嘅牌" : "I 面需要總強度 5")}</div>${state.modal.mode === "snap" ? `<p class="modal-hint">揀一張你可以觸及嘅展列牌：</p><div class="modal-card-grid">${market}</div>` : `<div class="rule-callout"><b>今次會抽 ${draw} 張</b><p>牌會直接加入手牌；去到休息階段先檢查手牌上限。</p></div>`}`;
}

function buildModal(me, strength) {
  const options = [
    ["enclosure1", "1 格圍欄", 1, 2], ["enclosure2", "2 格圍欄", 2, 4], ["enclosure3", "3 格圍欄", 3, 6],
    ["enclosure4", "4 格圍欄", 4, 8], ["enclosure5", "5 格圍欄", 5, 10], ["kiosk", "亭店", 1, 2], ["pavilion", "涼亭", 1, 2],
    ...(state.room.room.marineWorlds ? [["aquariumSmall", "小型水族館", 2, 4], ["aquariumLarge", "大型水族館", 5, 10]] : []),
    ...(me.actionUpgrades.includes("build") ? [["petting", "親親動物園", 3, 6], ["reptile", "爬蟲館", 5, 10], ["aviary", "大型鳥舍", 5, 10]] : []),
  ];
  return `<p class="modal-hint">揀設施，再喺地圖揀起點。設施需要嘅格數不可高過強度 ${strength}${me.variants.build ? "（變體額外 +1）" : ""}。</p><div class="structure-grid">${options.map(([id, label, size, cost]) => `<button class="structure-choice ${state.modal.structure === id ? "selected" : ""}" data-structure="${id}"><i>⬡</i><strong>${label}</strong><small>${size} 格 · $${cost}</small></button>`).join("")}</div><div class="modal-map"><span>揀建造起點：第 ${(state.modal.cell ?? 0) + 1} 格</span>${zooMapMarkup(me, true)}</div>`;
}

function animalsModal(me, strength) {
  const cards = me.hand.map(cardInfo).filter((card) => card?.type === "animal");
  const maximum = strength >= 5 || me.actionUpgrades.includes("animals") && strength >= 4 ? 2 : strength >= 2 ? 1 : 0;
  return `<div class="rule-callout"><b>今次最多引入 ${maximum} 隻動物</b><p>費用會自動計合作動物園折扣；伺服器會檢查聲譽、圍欄／水族館空位。</p></div>${cards.length ? `<div class="modal-card-grid">${cards.map((card) => cardMarkup(card, { compact: true, pick: true, selected: state.modal.selected.includes(card.rawId) })).join("")}</div>` : `<div class="modal-empty"><span>●</span><p>手上冇動物牌。先用卡牌行動抽牌。</p></div>`}`;
}

function sponsorsModal(me, strength) {
  const cards = me.hand.map(cardInfo).filter((card) => card?.type === "sponsor");
  return `<div class="choice-grid">${choiceButton("break", state.modal.mode, `推進休息 ${strength} 格`, `同時取得 $${strength}`)}${choiceButton("play", state.modal.mode, "打出贊助牌", `可打強度 ${strength} 或以下`)}</div>${state.modal.mode === "play" ? cards.length ? `<div class="modal-card-grid">${cards.map((card) => cardMarkup(card, { compact: true, pick: true, selected: state.modal.selected.includes(card.rawId) })).join("")}</div>` : `<div class="modal-empty"><span>◆</span><p>手上冇贊助牌。</p></div>` : `<div class="rule-callout"><b>資金同時間之間嘅交換</b><p>休息軌到終點會即時結算全體收入，再輪到下一位。</p></div>`}`;
}

function associationModal(me, strength) {
  const task = state.modal.task;
  const tasks = [["reputation", "提升聲譽", "強度 2"], ["partnerZoo", "合作動物園", "強度 3"], ["university", "合作大學", "強度 4"], ["project", "保育計劃", "強度 5"], ...(me.actionUpgrades.includes("association") ? [["donation", "保育捐款", "強度 5"]] : [])];
  let choices = "";
  if (task === "partnerZoo") choices = targetChoices(["非洲", "亞洲", "美洲", "歐洲", "澳洲"]);
  if (task === "university") choices = targetChoices(["hand", "research", "reputation", ...(state.room.room.marineWorlds ? ["animal:肉食", "animal:草食", "animal:靈長", "animal:爬蟲", "animal:鳥類", "animal:海洋"] : [])], { hand: "手牌上限 5", research: "2 科研標記", reputation: "聲譽 +2" });
  if (task === "project") choices = `<div class="target-grid">${state.room.state.projects.map((entry) => { const card = cardInfo(entry.cardId); return `<button class="target-choice ${state.modal.target === entry.cardId ? "selected" : ""}" data-modal-target="${entry.cardId}"><strong>${esc(card?.zh)}</strong><small>${esc(abilityText(card))}</small></button>`; }).join("")}</div>`;
  if (task === "donation") choices = `<div class="rule-callout"><b>捐款換取 1 保育分</b><p>費用由 $2 起，每次你再捐款就增加 $2，上限 $12。</p></div>`;
  return `<div class="task-grid">${tasks.map(([id, label, note]) => `<button class="task-choice ${task === id ? "selected" : ""}" data-modal-task="${id}"><span>${note}</span><strong>${label}</strong></button>`).join("")}</div>${choices}<p class="modal-hint">可用協會人員：${me.workers - me.usedWorkers}/${me.workers}。同一項工作每個休息週期只可做一次。</p>`;
}

function targetChoices(values, labels = {}) {
  return `<div class="target-grid">${values.map((value) => `<button class="target-choice ${state.modal.target === value ? "selected" : ""}" data-modal-target="${esc(value)}"><strong>${esc(labels[value] ?? value.replace("animal:", "專科："))}</strong></button>`).join("")}</div>`;
}

function detailModal() {
  const card = cardInfo(state.detailCard);
  if (!card) return "";
  const facts = card.type === "animal" ? `<li><span>費用</span><b>$${card.cost}</b></li><li><span>圍欄</span><b>${card.aquarium ? `水族館 ${card.aquarium}` : `${card.size} 格`}</b></li><li><span>魅力</span><b>${card.appeal}</b></li><li><span>保育</span><b>${card.conservation}</b></li>` : card.type === "sponsor" ? `<li><span>強度</span><b>${card.level}</b></li><li><span>收入</span><b>${card.income}</b></li><li><span>魅力</span><b>${card.appeal}</b></li>` : "";
  return `<div class="modal-scrim detail-scrim"><section class="detail-modal"><button id="detail-close">×</button><div class="detail-card-stage">${cardMarkup(card)}</div><div class="detail-copy"><p class="eyebrow">${typeName(card)} · #${card.rawId}</p><h2>${esc(card.zh)}</h2><small>${esc(card.name)}</small><ul>${facts}</ul><div class="detail-effect"><strong>能力摘要</strong><p>${esc(abilityText(card))}</p></div>${card.expansion === "marine" ? `<span class="marine-label">〰 Marine Worlds</span>` : ""}<p class="data-note">此版本使用重新設計圖形及可調校能力資料；不含原版卡圖。</p></div></section></div>`;
}

function toggleSetupCard(cardId) {
  if (state.setupKeep.has(cardId)) state.setupKeep.delete(cardId);
  else if (state.setupKeep.size < 4) state.setupKeep.add(cardId);
  renderRoom();
}

async function confirmSetup() {
  if (state.setupKeep.size !== 4) return;
  state.busy = "setup"; renderRoom();
  try { await sendCommand({ type: "setup", keep: [...state.setupKeep], mapId: state.setupMap }, false); state.setupKeep.clear(); }
  catch { /* handled by sendCommand */ }
}

async function startGame() {
  state.busy = "start"; state.error = ""; renderRoom();
  try { await api(`/api/rooms/${state.activeCode}/start`, { method: "POST", body: JSON.stringify({ playerToken: state.token }) }); state.busy = ""; await refreshRoom(); }
  catch (error) { state.busy = ""; state.error = error.message; renderRoom(); }
}

function submitAction() {
  const modal = state.modal;
  if (!modal) return;
  const command = { type: modal.actionId, x: modal.x ?? 0 };
  if (modal.actionId === "cards") Object.assign(command, { mode: modal.mode, marketIndex: modal.marketIndex ?? 0 });
  if (modal.actionId === "build") Object.assign(command, { structure: modal.structure, cell: modal.cell });
  if (modal.actionId === "animals") command.cardIds = modal.selected;
  if (modal.actionId === "sponsors") Object.assign(command, { mode: modal.mode, cardId: modal.selected?.[0] });
  if (modal.actionId === "association") Object.assign(command, { task: modal.task, target: modal.target, projectId: modal.target });
  sendCommand(command);
}

async function sendCommand(command, close = true) {
  state.busy = "command"; state.error = ""; renderRoom();
  try {
    await api(`/api/rooms/${state.activeCode}/command`, { method: "POST", body: JSON.stringify({ ...command, playerToken: state.token }) });
    state.busy = ""; if (close) state.modal = null; await refreshRoom();
  } catch (error) { state.busy = ""; state.error = error.message; renderRoom(); throw error; }
}

async function copyRoom() {
  const link = `${location.origin}/?room=${state.activeCode}`;
  try { await navigator.clipboard.writeText(link); }
  catch { const input = document.createElement("textarea"); input.value = link; document.body.append(input); input.select(); document.execCommand("copy"); input.remove(); }
  state.copied = true; renderRoom(); setTimeout(() => { state.copied = false; renderRoom(); }, 1600);
}

function leaveRoom() {
  clearInterval(state.timer); history.replaceState({}, "", "/");
  Object.assign(state, { activeCode: "", token: "", room: null, busy: "", error: "", modal: null, detailCard: null, logOpen: false, inviteMode: false, joinCode: "" });
  renderLanding();
}

async function init() {
  try { await loadCatalog(); } catch { state.error = "卡庫暫時未能載入，請重新整理。"; }
  const code = new URLSearchParams(location.search).get("room")?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) ?? "";
  if (code) {
    state.joinCode = code;
    const token = localStorage.getItem(`open-zoo:${code}`) ?? "";
    if (token) { enterRoom(code, token); return; }
    state.inviteMode = true;
  }
  renderLanding();
}

init();
