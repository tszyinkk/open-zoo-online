import { ACTIONS, CARD_BY_ID, CARDS, MAPS, deckIds, endgameIds, projectIds, projectProgress, publicCatalog } from "../data/catalog.js";

const PLAYER_COLORS = ["#dc604d", "#3188a4", "#d0a72e", "#668a56"];
const ACTION_IDS = ACTIONS.map((action) => action.id);
const BREAK_TARGET = 15;
const MAX_LOG = 40;
let schemaPromise;

function db(env) {
  if (!env.DB) throw new Error("Room database is unavailable");
  return env.DB;
}

function ensureSchema(env) {
  if (schemaPromise) return schemaPromise;
  const database = db(env);
  schemaPromise = database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY NOT NULL, code TEXT NOT NULL UNIQUE, creator_hash TEXT NOT NULL,
      host_player_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'lobby', marine_worlds INTEGER NOT NULL DEFAULT 0,
      game_state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY NOT NULL, room_id TEXT NOT NULL, name TEXT NOT NULL, color TEXT NOT NULL,
      seat INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE, joined_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE, UNIQUE(room_id, seat)
    )`),
    database.prepare("CREATE INDEX IF NOT EXISTS rooms_created_idx ON rooms(creator_hash, created_at)"),
    database.prepare("CREATE INDEX IF NOT EXISTS players_room_idx ON players(room_id, seat)"),
  ]).catch((error) => { schemaPromise = undefined; throw error; });
  return schemaPromise;
}

function json(value, status = 200) {
  return Response.json(value, { status, headers: { "cache-control": "no-store" } });
}

function normalizeName(value) { return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 18) : ""; }
function normalizeCode(value) { return typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) : ""; }
function initialGameState() { return { version: 2, phase: "lobby", log: ["房間已建立，等待其他園長加入。"] }; }
function normalizeGameState(game) {
  if (game?.phase && game.phase !== "lobby") game.breakTarget = BREAK_TARGET;
  return game;
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value) || 0)); }
function intClamp(value, minimum, maximum) { return Math.floor(clamp(value, minimum, maximum)); }

function randomCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) => alphabet[byte % alphabet.length]).join("");
}

function randomToken() { return `${crypto.randomUUID()}-${crypto.randomUUID()}`; }

async function hashText(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

async function loadRoom(env, code) {
  const database = db(env);
  const room = await database.prepare("SELECT * FROM rooms WHERE code = ?").bind(code).first();
  if (!room) return null;
  const result = await database.prepare("SELECT * FROM players WHERE room_id = ? ORDER BY seat").bind(room.id).all();
  return { room, players: result.results ?? [] };
}

async function authenticate(env, roomId, token) {
  if (!token) return null;
  const tokenHash = await hashText(token);
  return db(env).prepare("SELECT * FROM players WHERE room_id = ? AND token_hash = ?").bind(roomId, tokenHash).first();
}

function privateState(game, viewerId) {
  const visible = clone(game);
  if (!visible.playerState) return visible;
  visible.deckCount = visible.deck?.length ?? 0;
  visible.discardCount = visible.discard?.length ?? 0;
  visible.deck = [];
  visible.discard = [];
  delete visible.seed;
  for (const [playerId, player] of Object.entries(visible.playerState)) {
    player.handCount = player.hand?.length ?? 0;
    player.initialHandCount = player.initialHand?.length ?? 0;
    if (playerId !== viewerId && visible.phase !== "finished") {
      player.hand = [];
      player.initialHand = [];
      player.endgames = (player.endgames ?? []).map(() => "hidden");
    }
  }
  return visible;
}

function payload(loaded, viewerId) {
  const { room, players } = loaded;
  const game = normalizeGameState(JSON.parse(room.game_state));
  return {
    room: {
      code: room.code, status: room.status, marineWorlds: Boolean(room.marine_worlds),
      hostPlayerId: room.host_player_id, updatedAt: room.updated_at,
    },
    players: players.map(({ id, name, color, seat }) => ({ id, name, color, seat })),
    viewerId,
    state: privateState(game, viewerId),
  };
}

function hashSeed(text) {
  let value = 2166136261;
  for (const character of text) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function shuffle(values, seedText) {
  const output = [...values];
  let seed = hashSeed(seedText) || 1;
  for (let index = output.length - 1; index > 0; index -= 1) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    const swap = (seed >>> 0) % (index + 1);
    [output[index], output[swap]] = [output[swap], output[index]];
  }
  return output;
}

function drawFromDeck(game) {
  if (!game.deck.length && game.discard.length) {
    game.deck = shuffle(game.discard, `${game.seed}:reshuffle:${game.round}:${game.log.length}`);
    game.discard = [];
  }
  return game.deck.pop() ?? null;
}

function refillMarket(game, ignoreWaves = false) {
  let guard = 0;
  while (game.market.length < 6 && guard < 30) {
    guard += 1;
    const cardId = drawFromDeck(game);
    if (!cardId) break;
    game.market.push(cardId);
    const card = CARD_BY_ID[cardId];
    if (!ignoreWaves && card?.wave && game.market.length > 1) {
      const discarded = game.market.shift();
      if (discarded) game.discard.push(discarded);
      addLog(game, `浪花出現：展列底牌 #${discarded} 被沖走。`);
    }
  }
}

function takeCards(game, amount) {
  const cards = [];
  for (let index = 0; index < amount; index += 1) {
    const card = drawFromDeck(game);
    if (card) cards.push(card);
  }
  return cards;
}

function addLog(game, message) {
  game.log.unshift(message);
  game.log = game.log.slice(0, MAX_LOG);
}

function actionVariants(seedText, seat) {
  const variants = shuffle(ACTION_IDS, `${seedText}:variants:${seat}`).slice(0, 2);
  return Object.fromEntries(variants.map((id, index) => [id, index + 1]));
}

function basePlayer(player, seedText, marineWorlds, deck) {
  const initialHand = deck.splice(-8);
  const endgameDeck = shuffle(endgameIds(marineWorlds), `${seedText}:endgame:${player.seat}`);
  const otherActions = shuffle(ACTION_IDS.filter((id) => id !== "animals"), `${seedText}:actions:${player.seat}`);
  return {
    id: player.id, ready: false, mapId: "A", initialHand, hand: [],
    actionOrder: ["animals", ...otherActions], actionUpgrades: [], variants: marineWorlds ? actionVariants(seedText, player.seat) : {},
    money: 25, appeal: player.seat, conservation: 0, reputation: 1, xTokens: 1,
    workers: 1, usedWorkers: 0, upgradeCredits: 0, milestones: [], handLimit: 3,
    harborUsedTurn: -1,
    structures: [], playedAnimals: [], sponsors: [], tags: {},
    partnerZoos: [], universities: [], supportedProjects: [], endgames: endgameDeck.slice(0, 2),
  };
}

function createGame(players, marineWorlds, code) {
  const seedText = `${code}:${players.map((player) => player.id).join(":")}`;
  const deck = shuffle(deckIds(marineWorlds), `${seedText}:zoo`);
  const playerState = {};
  for (const player of players) playerState[player.id] = basePlayer(player, seedText, marineWorlds, deck);
  const shuffledProjects = shuffle(projectIds(marineWorlds), `${seedText}:projects`);
  const game = {
    version: 3, phase: "setup", seed: seedText, round: 1, turn: 0, currentPlayerId: null, firstPlayerId: players[0].id,
    breakProgress: 0, breakTarget: BREAK_TARGET,
    deck, discard: [], market: [],
    projects: shuffledProjects.slice(0, players.length === 4 ? 4 : 3).map((cardId) => ({ cardId, claims: [], base: true })),
    association: { occupied: [], marineUniversityAvailable: marineWorlds },
    playerState, finale: null, finalScores: null,
    log: ["遊戲設定開始：每位園長揀 4 張起手牌及動物園地圖。"],
  };
  refillMarket(game, true);
  return game;
}

function playerName(players, playerId) {
  return players.find((player) => player.id === playerId)?.name ?? "園長";
}

function actionStrength(player, actionId, extraX = 0) {
  const slot = player.actionOrder.indexOf(actionId);
  if (slot < 0) return 0;
  return slot + 1 + intClamp(extraX, 0, player.xTokens);
}

function useActionCard(player, actionId, extraX = 0) {
  const index = player.actionOrder.indexOf(actionId);
  if (index < 0) throw new Error("行動卡狀態有誤");
  const spent = intClamp(extraX, 0, player.xTokens);
  player.xTokens -= spent;
  player.actionOrder.splice(index, 1);
  player.actionOrder.unshift(actionId);
}

function moveActionCard(player, actionId, slot) {
  const index = player.actionOrder.indexOf(actionId);
  if (index < 0) return;
  player.actionOrder.splice(index, 1);
  player.actionOrder.splice(Math.max(0, Math.min(4, slot - 1)), 0, actionId);
}

function keywordValue(ability, fallback = 1) {
  return Number.isFinite(Number(ability?.value)) && String(ability?.value) !== "" ? Number(ability.value) : fallback;
}

function applyKeyword(game, player, ability, multiplier = 1) {
  const value = keywordValue(ability) * multiplier;
  switch (ability?.key) {
    case "SPRINT": player.hand.push(...takeCards(game, value)); break;
    case "HUNTER": {
      const revealed = takeCards(game, value);
      const keptIndex = revealed.findIndex((id) => CARD_BY_ID[id]?.type === "animal");
      if (keptIndex >= 0) player.hand.push(revealed.splice(keptIndex, 1)[0]);
      game.discard.push(...revealed);
      break;
    }
    case "PACK": player.appeal += player.tags["肉食"] ?? 0; break;
    case "JUMPING": game.breakProgress += value; player.money += value; break;
    case "INVENTIVE": player.xTokens = Math.min(5, player.xTokens + value); break;
    case "INVENTIVE_BEAR": player.xTokens = Math.min(5, player.xTokens + Math.min(3, player.tags["熊"] ?? 0)); break;
    case "INVENTIVE_PRIMARY": player.xTokens = Math.min(5, player.xTokens + Math.min(3, Math.ceil((player.tags["靈長"] ?? 0) / 2))); break;
    case "FULL_THROATED": player.workers = Math.min(4, player.workers + 1); break;
    case "PERCEPTION_2": player.hand.push(...takeCards(game, 1)); break;
    case "PERCEPTION_4": player.hand.push(...takeCards(game, 2)); break;
    case "REPUTATION": player.reputation = Math.min(15, player.reputation + value); break;
    case "CONSERVATION_POINT": player.conservation += value; break;
    case "APPEAL": player.appeal += value; break;
    case "REEF_MONEY": player.money += value; break;
    case "BOOST_ASSOCIATION": moveActionCard(player, "association", 5); break;
    case "BOOST_BUILDING": moveActionCard(player, "build", 5); break;
    case "BOOST_CARD": moveActionCard(player, "cards", 5); break;
    case "BOOST_SPONSORS": moveActionCard(player, "sponsors", 5); break;
    case "BOOST_ANIMAL": moveActionCard(player, "animals", 5); break;
    case "CLEVER": moveActionCard(player, player.actionOrder[0], 1); break;
    default: break;
  }
}

function applyCardAbilities(game, player, card, multiplier = 1, reefOnly = false) {
  const abilities = reefOnly ? card.reefEffects ?? [] : card.abilities ?? [];
  for (const ability of abilities) applyKeyword(game, player, ability, multiplier);
}

function addTags(player, card) {
  for (const tag of card.tags ?? []) player.tags[tag] = (player.tags[tag] ?? 0) + 1;
}

function syncMilestones(player) {
  const award = (key, effect) => {
    if (player.milestones.includes(key)) return;
    player.milestones.push(key); effect();
  };
  if (player.conservation >= 2) award("c2", () => { player.workers = Math.min(4, player.workers + 1); });
  if (player.conservation >= 5) award("c5", () => { player.upgradeCredits += 1; });
  if (player.conservation >= 8) award("c8", () => { player.upgradeCredits += 1; });
  if (player.conservation >= 10) award("c10", () => {
    player.upgradeCredits += 1;
    if (player.endgames.length > 1) player.endgames = [player.endgames[0]];
  });
  if (player.reputation >= 5) award("r5", () => { player.handLimit = Math.max(player.handLimit, 5); });
}

function structureDefinition(type) {
  const entries = {
    enclosure1: { type: "enclosure", label: "1 格圍欄", size: 1, cost: 2, capacity: 1 },
    enclosure2: { type: "enclosure", label: "2 格圍欄", size: 2, cost: 4, capacity: 2 },
    enclosure3: { type: "enclosure", label: "3 格圍欄", size: 3, cost: 6, capacity: 3 },
    enclosure4: { type: "enclosure", label: "4 格圍欄", size: 4, cost: 8, capacity: 4 },
    enclosure5: { type: "enclosure", label: "5 格圍欄", size: 5, cost: 10, capacity: 5 },
    kiosk: { type: "kiosk", label: "亭店", size: 1, cost: 2, capacity: 0 },
    pavilion: { type: "pavilion", label: "涼亭", size: 1, cost: 2, capacity: 0 },
    petting: { type: "petting", label: "親親動物園", size: 3, cost: 6, capacity: 3, upgraded: true },
    reptile: { type: "reptile", label: "爬蟲館", size: 5, cost: 10, capacity: 5, upgraded: true },
    aviary: { type: "aviary", label: "大型鳥舍", size: 5, cost: 10, capacity: 5, upgraded: true },
    aquariumSmall: { type: "aquariumSmall", label: "小型水族館", size: 2, cost: 4, capacity: 2, marine: true, unique: true },
    aquariumLarge: { type: "aquariumLarge", label: "大型水族館", size: 5, cost: 10, capacity: 5, marine: true, unique: true },
  };
  return entries[type] ?? null;
}

const MAP_ROW_LENGTHS = [9, 10, 9, 10, 9, 10, 9, 10, 9, 10];
const MAP_CELLS = MAP_ROW_LENGTHS.flatMap((amount, row) => {
  const offset = 10 - amount;
  return Array.from({ length: amount }, (_, column) => ({ row, x: offset + column * 2 }));
});

function cellNeighbors(cell) {
  const origin = MAP_CELLS[cell];
  if (!origin) return [];
  return MAP_CELLS.flatMap((candidate, index) => {
    const sameRow = candidate.row === origin.row && Math.abs(candidate.x - origin.x) === 2;
    const nextRow = Math.abs(candidate.row - origin.row) === 1 && Math.abs(candidate.x - origin.x) === 1;
    return sameRow || nextRow ? [index] : [];
  });
}

function footprint(cell, size, blocked = new Set()) {
  const start = intClamp(cell, 0, MAP_CELLS.length - 1);
  if (blocked.has(start)) return [];
  const chosen = [];
  const queue = [start];
  const seen = new Set(queue);
  while (queue.length && chosen.length < size) {
    const current = queue.shift();
    if (!blocked.has(current)) chosen.push(current);
    for (const neighbor of cellNeighbors(current)) {
      if (!seen.has(neighbor)) { seen.add(neighbor); queue.push(neighbor); }
    }
  }
  return chosen;
}

function occupiedCells(player) {
  return new Set(player.structures.flatMap((structure) => structure.cells));
}

function mapFor(player) { return MAPS.find((entry) => entry.id === player.mapId) ?? MAPS[0]; }

function mapFeatureConnected(player, map = mapFor(player)) {
  const cell = map.ability?.cell;
  return Number.isInteger(cell) && cellNeighbors(cell).some((neighbor) => occupiedCells(player).has(neighbor));
}

function touchesRequiredTerrain(player, structure, card) {
  const map = MAPS.find((entry) => entry.id === player.mapId) ?? MAPS[0];
  const adjacent = new Set(structure.cells.flatMap(cellNeighbors));
  const water = map.water.filter((cell) => adjacent.has(cell)).length;
  const rock = map.rock.filter((cell) => adjacent.has(cell)).length;
  return water >= (card.water ?? 0) && rock >= (card.rock ?? 0);
}

function specialCapacity(card, type, fallback) {
  return card.specialEnclosures?.find((entry) => entry.type === type)?.capacity ?? fallback;
}

function findHabitat(player, card) {
  if (card.aquarium) {
    return player.structures.find((structure) => ["aquariumSmall", "aquariumLarge"].includes(structure.type) && structure.capacity - structure.used >= card.aquarium && touchesRequiredTerrain(player, structure, card));
  }
  if (card.kind === "萌寵" || card.kind === "家畜") {
    const needed = specialCapacity(card, "PettingZoo", 1);
    const petting = player.structures.find((structure) => structure.type === "petting" && structure.capacity - structure.used >= needed && touchesRequiredTerrain(player, structure, card));
    if (petting) return petting;
  }
  if (card.kind === "爬蟲") {
    const needed = specialCapacity(card, "ReptileHouse", Math.min(card.size, 3));
    const reptile = player.structures.find((structure) => structure.type === "reptile" && structure.capacity - structure.used >= needed && touchesRequiredTerrain(player, structure, card));
    if (reptile) return reptile;
  }
  if (card.kind === "鳥類") {
    const needed = specialCapacity(card, "LargeBirdAviary", Math.min(card.size, 3));
    const aviary = player.structures.find((structure) => structure.type === "aviary" && structure.capacity - structure.used >= needed && touchesRequiredTerrain(player, structure, card));
    if (aviary) return aviary;
  }
  if (card.standardEnclosure === false) return null;
  const map = mapFor(player);
  return player.structures.find((structure) => {
    if (structure.type !== "enclosure" || structure.occupied || !touchesRequiredTerrain(player, structure, card)) return false;
    const outdoorBonus = map.ability?.key === "OUTDOOR_AREAS" && structure.cells.some((cell) => cellNeighbors(cell).includes(map.ability.cell)) ? 2 : 0;
    return structure.capacity + outdoorBonus >= card.size;
  });
}

function occupyHabitat(structure, card) {
  if (structure.type === "enclosure") structure.occupied = true;
  else if (["aquariumSmall", "aquariumLarge"].includes(structure.type)) structure.used += card.aquarium;
  else if (structure.type === "petting") structure.used += specialCapacity(card, "PettingZoo", 1);
  else if (structure.type === "reptile") structure.used += specialCapacity(card, "ReptileHouse", Math.min(card.size, 3));
  else if (structure.type === "aviary") structure.used += specialCapacity(card, "LargeBirdAviary", Math.min(card.size, 3));
}

function validateCardRequirements(player, card, ignored = 0) {
  const counts = {};
  for (const requirement of card.requirements ?? []) counts[requirement] = (counts[requirement] ?? 0) + 1;
  const actionRequirements = { "動物 I": "animals", "動物 II": "animals", "建造 I": "build", "建造 II": "build", "卡牌 I": "cards", "卡牌 II": "cards", "贊助 I": "sponsors", "贊助 II": "sponsors", "協會 I": "association", "協會 II": "association" };
  for (const [requirement, amount] of Object.entries(counts)) {
    if (actionRequirements[requirement]) {
      const needsUpgrade = requirement.endsWith("II");
      if (needsUpgrade && !player.actionUpgrades.includes(actionRequirements[requirement])) {
        if (ignored > 0) { ignored -= 1; continue; }
        throw new Error(`需要已升級嘅${requirement.replace(" II", "")}行動卡`);
      }
      continue;
    }
    if (requirement === "合作動物園" && player.partnerZoos.length < amount) {
      if (ignored > 0) { ignored -= 1; continue; }
      throw new Error(`需要 ${amount} 個合作動物園`);
    }
    if (requirement === "大學" && player.universities.length < amount) {
      if (ignored > 0) { ignored -= 1; continue; }
      throw new Error(`需要 ${amount} 間合作大學`);
    }
    if (["水域", "岩石", "聲譽", "魅力"].includes(requirement)) continue;
    if ((player.tags[requirement] ?? 0) < amount) {
      if (ignored > 0) { ignored -= 1; continue; }
      throw new Error(`需要 ${amount} 個「${requirement}」圖標`);
    }
  }
}

function playAnimal(game, player, cardId, discount = 0) {
  const card = CARD_BY_ID[cardId];
  if (!card || card.type !== "animal" || !player.hand.includes(cardId)) throw new Error("手上冇呢張動物牌");
  if (card.reputation > player.reputation) throw new Error(`需要聲譽 ${card.reputation}`);
  const map = mapFor(player);
  validateCardRequirements(player, card, map.ability?.key === "RESEARCH_INSTITUTE" && mapFeatureConnected(player, map) ? 1 : 0);
  const habitat = findHabitat(player, card);
  if (!habitat) throw new Error(card.aquarium ? "要先建造有足夠空位嘅水族館" : "冇合適嘅空圍欄");
  const partnerDiscount = player.partnerZoos.includes(card.continent) ? 3 : 0;
  const cost = Math.max(0, card.cost - partnerDiscount - discount);
  if (player.money < cost) throw new Error(`需要 $${cost}，目前只有 $${player.money}`);
  player.money -= cost;
  player.hand.splice(player.hand.indexOf(cardId), 1);
  player.playedAnimals.push(cardId);
  player.appeal += card.appeal;
  player.conservation += card.conservation;
  occupyHabitat(habitat, card);
  if (map.ability?.key === "OBSERVATION_TOWER" && habitat.type === "enclosure" && habitat.cells.some((cell) => cellNeighbors(cell).includes(map.ability.cell))) player.appeal += 2;
  addTags(player, card);
  if (!card.reef) applyCardAbilities(game, player, card);
  if (card.reef) {
    const reefCards = player.playedAnimals.map((id) => CARD_BY_ID[id]).filter((entry) => entry?.reef);
    for (const reef of reefCards) applyCardAbilities(game, player, reef, 1, true);
  }
  syncMilestones(player);
  return card;
}

function cardsAction(game, player, command, strength) {
  const upgraded = player.actionUpgrades.includes("cards");
  if (command.mode === "snap") {
    const index = intClamp(command.marketIndex, 0, 5);
    const required = upgraded ? Math.max(2, index + 1) : 5;
    if (strength < required || !game.market[index]) throw new Error("卡牌強度或聲譽範圍不足以攞呢張牌");
    const [cardId] = game.market.splice(index, 1);
    player.hand.push(cardId);
    refillMarket(game);
    return `從展列直接取走 #${cardId}`;
  }
  const table = upgraded ? [1, 1, 2, 3, 4] : [1, 1, 2, 2, 3];
  const amount = table[Math.min(4, strength - 1)] ?? 1;
  const cards = takeCards(game, amount);
  player.hand.push(...cards);
  game.breakProgress += 2;
  if (player.variants.cards && player.money >= 2) {
    player.money -= 2;
    player.xTokens = Math.min(5, player.xTokens + 1);
  }
  return `抽咗 ${cards.length} 張牌`;
}

function takeFirstCardOfType(game, type) {
  const revealed = [];
  while (game.deck.length) {
    const cardId = drawFromDeck(game);
    if (!cardId) break;
    if (CARD_BY_ID[cardId]?.type === type) {
      game.discard.push(...revealed);
      return cardId;
    }
    revealed.push(cardId);
  }
  game.discard.push(...revealed);
  return null;
}

function applyPlacementBonus(game, player, bonus) {
  const money = /^\$(\d+)$/.exec(bonus ?? "");
  if (money) { player.money += Number(money[1]); return bonus; }
  if (bonus === "X") { player.xTokens = Math.min(5, player.xTokens + 1); return "X 標記"; }
  if (bonus === "聲譽") { player.reputation = Math.min(15, player.reputation + 1); return "1 聲譽"; }
  if (bonus === "保育") { player.conservation += 1; return "1 保育分"; }
  if (bonus === "抽牌") { const cardId = drawFromDeck(game); if (cardId) player.hand.push(cardId); return "1 張牌"; }
  if (bonus === "協會員") { player.workers = Math.min(4, player.workers + 1); return "1 名協會員"; }
  if (bonus?.endsWith(" II")) {
    const action = { "建造 II": "build", "卡牌 II": "cards", "動物 II": "animals", "贊助 II": "sponsors", "協會 II": "association" }[bonus];
    if (action && !player.actionUpgrades.includes(action)) player.actionUpgrades.push(action);
    return bonus;
  }
  if (bonus === "H") {
    const cardId = takeFirstCardOfType(game, "sponsor");
    if (cardId) player.hand.push(cardId);
    return "1 張贊助牌";
  }
  return "";
}

function buildAction(game, player, command, strength, marineWorlds) {
  const definition = structureDefinition(command.structure);
  if (!definition) throw new Error("請揀要建造嘅設施");
  if (definition.marine && !marineWorlds) throw new Error("要開啟 Marine Worlds 先可以建水族館");
  if (definition.upgraded && !player.actionUpgrades.includes("build")) throw new Error("要先升級建造行動卡");
  if (definition.unique && player.structures.some((structure) => structure.type === definition.type)) throw new Error("每種水族館最多建一個");
  const bonus = player.variants.build ? 1 : 0;
  if (definition.size > strength + bonus) throw new Error(`呢個設施需要建造強度 ${definition.size}`);
  if (player.money < definition.cost) throw new Error(`需要 $${definition.cost}`);
  const map = mapFor(player);
  const terrain = new Set([...map.water, ...map.rock, ...Object.keys(map.features ?? {}).map(Number)]);
  const blocked = new Set([...occupiedCells(player), ...terrain]);
  const cells = footprint(command.cell, definition.size, blocked);
  if (cells.length !== definition.size) throw new Error("呢個位置放唔落設施");
  if (definition.marine) {
    const adjacent = cells.some((cell) => cellNeighbors(cell).some((neighbor) => map.water.includes(neighbor)));
    if (!adjacent) throw new Error("水族館必須建喺至少一格水域旁邊");
  }
  player.money -= definition.cost;
  player.structures.push({ id: crypto.randomUUID(), ...definition, cells, used: 0, occupied: false });
  if (definition.type === "pavilion") player.appeal += 1;
  const rewards = cells.map((cell) => applyPlacementBonus(game, player, map.bonuses?.[cell])).filter(Boolean);
  return `建造咗${definition.label}${rewards.length ? `，取得${rewards.join("、")}` : ""}`;
}

function animalsAction(game, player, command, strength) {
  const selected = Array.isArray(command.cardIds) ? [...new Set(command.cardIds.filter((id) => typeof id === "string"))] : [];
  const upgraded = player.actionUpgrades.includes("animals");
  const maximum = strength >= 5 || upgraded && strength >= 4 ? 2 : strength >= 2 ? 1 : 0;
  if (!selected.length || selected.length > maximum) throw new Error(maximum ? `今次最多可以引入 ${maximum} 隻動物` : "動物行動強度至少要 2");
  const played = selected.map((cardId, index) => playAnimal(game, player, cardId, player.variants.animals && index === 0 ? 2 : 0));
  return `引入咗 ${played.map((card) => card.zh).join("、")}`;
}

function sponsorsAction(game, player, command, strength) {
  if (command.mode === "break") {
    game.breakProgress += strength;
    player.money += strength;
    return `推進休息 ${strength} 格並取得 $${strength}`;
  }
  const card = CARD_BY_ID[command.cardId];
  if (!card || card.type !== "sponsor" || !player.hand.includes(command.cardId)) throw new Error("手上冇呢張贊助牌");
  const map = mapFor(player);
  const hollywoodReady = map.ability?.key === "HOLLYWOOD_HILLS" && map.ability.cells.every((cell) => occupiedCells(player).has(cell));
  const requiredStrength = Math.max(1, card.level - (hollywoodReady ? 1 : 0));
  if (requiredStrength > strength) throw new Error(`呢張牌需要贊助強度 ${requiredStrength}`);
  validateCardRequirements(player, card);
  player.hand.splice(player.hand.indexOf(command.cardId), 1);
  player.sponsors.push(command.cardId);
  player.appeal += card.appeal;
  if (player.variants.sponsors) player.money += 1;
  addTags(player, card);
  // Sponsor cards are driven by their individual immediate/income/passive timing windows.
  // Unimplemented sponsor text is never replaced with a random generic reward.
  syncMilestones(player);
  return `打出贊助牌「${card.zh}」`;
}

function associationAction(game, player, command, strength, marineWorlds) {
  if (player.usedWorkers >= player.workers) throw new Error("今個休息週期已經冇可用協會人員");
  const task = command.task;
  const requirements = { reputation: 2, partnerZoo: 3, university: 4, project: 5, donation: 5 };
  if (!requirements[task] || strength < requirements[task]) throw new Error("協會行動強度不足");
  const occupiedKey = `${player.id}:${task}`;
  if (game.association.occupied.includes(occupiedKey)) throw new Error("你今個休息週期已做過呢項工作");
  let summary = "完成協會工作";
  if (task === "reputation") {
    player.reputation = Math.min(15, player.reputation + (player.variants.association ? 3 : 2));
    summary = "提升聲譽";
  }
  if (task === "partnerZoo") {
    const continent = ["非洲", "亞洲", "美洲", "歐洲", "澳洲"].includes(command.target) ? command.target : "";
    if (!continent || player.partnerZoos.includes(continent)) throw new Error("請揀一個未合作嘅地區動物園");
    player.partnerZoos.push(continent); summary = `取得${continent}合作動物園`;
  }
  if (task === "university") {
    const target = typeof command.target === "string" ? command.target : "hand";
    if (target.startsWith("animal:")) {
      if (!marineWorlds || !game.association.marineUniversityAvailable || player.universities.some((entry) => entry.startsWith("animal:"))) throw new Error("新大學今次不可用");
      const kind = target.slice(7);
      if (!["肉食", "草食", "靈長", "爬蟲", "鳥類", "海洋"].includes(kind)) throw new Error("請揀動物類別");
      player.universities.push(target); player.tags[kind] = (player.tags[kind] ?? 0) + 1; player.tags["科研"] = (player.tags["科研"] ?? 0) + 1;
      const matchIndex = game.deck.findLastIndex((id) => CARD_BY_ID[id]?.tags?.includes(kind));
      if (matchIndex >= 0) player.hand.push(game.deck.splice(matchIndex, 1)[0]);
      game.association.marineUniversityAvailable = false; summary = `取得${kind}專科大學`;
    } else {
      if (player.universities.includes(target)) throw new Error("你已經有呢間大學");
      player.universities.push(target);
      if (target === "hand") player.handLimit = 5;
      if (target === "research") player.tags["科研"] = (player.tags["科研"] ?? 0) + 2;
      if (target === "reputation") player.reputation = Math.min(15, player.reputation + 2);
      summary = "取得合作大學";
    }
  }
  if (task === "project") {
    let project = game.projects.find((entry) => entry.cardId === command.projectId);
    if (!project) {
      const handIndex = player.hand.indexOf(command.projectId);
      const handCard = CARD_BY_ID[command.projectId];
      if (handIndex < 0 || !handCard || handCard.type !== "project" || !handCard.thresholds?.length) throw new Error("手上冇可立即支持嘅保育計劃");
      player.hand.splice(handIndex, 1);
      project = { cardId: handCard.rawId, claims: [], base: false };
      const maximum = Object.keys(game.playerState).length;
      const placed = game.projects.filter((entry) => entry.base === false);
      if (placed.length >= maximum) {
        const oldestIndex = game.projects.findIndex((entry) => entry.base === false);
        const [discarded] = game.projects.splice(oldestIndex, 1);
        if (discarded) game.discard.push(discarded.cardId);
      }
      game.projects.push(project);
    }
    if (project.claims.some((claim) => claim.playerId === player.id)) throw new Error("呢個保育計劃不可再支持");
    const card = CARD_BY_ID[project.cardId];
    const progress = projectProgress(card, player);
    let level = -1;
    card.thresholds.forEach((threshold, index) => { if (progress >= threshold) level = index; });
    if (level < 0) throw new Error(`進度 ${progress}，未達最低門檻 ${card.thresholds[0]}`);
    const points = card.points[level];
    project.claims.push({ playerId: player.id, level, points });
    player.supportedProjects.push({ cardId: card.rawId, level, points });
    player.conservation += points; syncMilestones(player); summary = `支持「${card.zh}」並取得 ${points} 保育分`;
  }
  if (task === "donation") {
    if (!player.actionUpgrades.includes("association")) throw new Error("要先升級協會行動卡先可以捐款");
    const previous = player.supportedProjects.filter((entry) => entry.cardId === "donation").length;
    const cost = Math.min(12, 2 + previous * 2);
    if (player.money < cost) throw new Error(`今次捐款需要 $${cost}`);
    player.money -= cost; player.conservation += 1; player.supportedProjects.push({ cardId: "donation", points: 1 }); syncMilestones(player); summary = `捐款 $${cost}`;
  }
  player.usedWorkers += 1;
  game.association.occupied.push(occupiedKey);
  return summary;
}

function discardMarketBottom(game, amount) {
  for (let index = 0; index < amount; index += 1) {
    const card = game.market.shift();
    if (card) game.discard.push(card);
  }
  refillMarket(game);
}

function incomeFor(player) {
  const appealIncome = 5 + Math.floor(player.appeal / 5) * 2;
  const kiosks = player.structures.filter((structure) => structure.type === "kiosk").length;
  const map = mapFor(player);
  const covered = occupiedCells(player);
  const restaurantIncome = map.ability?.key === "PARK_RESTAURANT" ? cellNeighbors(map.ability.cell).filter((cell) => covered.has(cell)).length : 0;
  const iceCreamIncome = map.ability?.key === "ICE_CREAM_PARLORS" && map.ability.cells.every((cell) => covered.has(cell)) ? kiosks : 0;
  const kioskIncome = kiosks * 2 + restaurantIncome + iceCreamIncome;
  const sponsorIncome = player.sponsors.reduce((total, id) => total + (CARD_BY_ID[id]?.income ?? 0), 0);
  return appealIncome + kioskIncome + sponsorIncome;
}

function resolveBreak(game, players) {
  for (const player of Object.values(game.playerState)) {
    if (player.hand.length > player.handLimit) {
      const excess = player.hand.splice(0, player.hand.length - player.handLimit);
      game.discard.push(...excess);
    }
    player.usedWorkers = 0;
    const income = incomeFor(player);
    player.money += income;
    player.xTokens = Math.min(5, player.xTokens + 1);
  }
  game.association.occupied = [];
  game.association.marineUniversityAvailable = true;
  discardMarketBottom(game, 2);
  game.breakProgress = 0;
  game.round += 1;
  addLog(game, `第 ${game.round - 1} 次休息完成：收回人員、更新展列並派發收入。`);
  const trigger = Object.values(game.playerState).find((player) => tracksMeet(player));
  if (trigger && !game.finale) triggerFinale(game, trigger.id, players, true);
}

function targetAppeal(conservation) {
  return Math.max(-20, 112 - conservation * 7);
}

function tracksMeet(player) {
  return player.appeal >= targetAppeal(player.conservation);
}

function endgameBonus(player, cardId) {
  const numeric = Number(cardId);
  const metrics = [
    player.playedAnimals.filter((id) => (CARD_BY_ID[id]?.size ?? 0) >= 4).length,
    player.playedAnimals.filter((id) => (CARD_BY_ID[id]?.size ?? 0) <= 2).length,
    player.tags["科研"] ?? 0,
    new Set(player.structures.map((entry) => entry.type)).size,
    player.supportedProjects.length,
    player.structures.filter((entry) => ["aquariumSmall", "aquariumLarge"].includes(entry.type)).length,
    player.partnerZoos.length,
    player.sponsors.length,
    Object.keys(player.tags).filter((tag) => player.tags[tag] > 0).length,
  ];
  return Math.min(4, Math.floor((metrics[(numeric - 1) % metrics.length] ?? 0) / 2));
}

function finalScore(player) {
  const endgamePoints = Math.max(0, ...player.endgames.map((id) => endgameBonus(player, id)));
  const cardPoints = player.sponsors.reduce((total, id) => total + (CARD_BY_ID[id]?.ability === "conservation" ? 1 : 0), 0);
  return {
    appeal: player.appeal, conservation: player.conservation, target: targetAppeal(player.conservation),
    endgamePoints, projectCount: player.supportedProjects.length,
    total: player.appeal - targetAppeal(player.conservation) + endgamePoints * 5 + cardPoints,
  };
}

function finishGame(game, players) {
  game.phase = "finished";
  game.currentPlayerId = null;
  game.finalScores = Object.fromEntries(players.map((player) => [player.id, finalScore(game.playerState[player.id])]));
  const ranking = [...players].sort((a, b) => {
    const scoreDifference = game.finalScores[b.id].total - game.finalScores[a.id].total;
    return scoreDifference || game.finalScores[b.id].projectCount - game.finalScores[a.id].projectCount;
  });
  game.winnerId = ranking[0]?.id ?? null;
  addLog(game, `${playerName(players, game.winnerId)} 贏出今場遊戲！`);
}

function triggerFinale(game, triggerPlayerId, players, duringBreak = false) {
  game.finale = {
    triggeredBy: triggerPlayerId,
    remaining: players.filter((player) => duringBreak || player.id !== triggerPlayerId).map((player) => player.id),
  };
  addLog(game, `${playerName(players, triggerPlayerId)} 令兩條計分軌相遇，進入最後一輪！`);
}

function nextPlayer(game, players, justActedId) {
  const currentIndex = players.findIndex((player) => player.id === justActedId);
  for (let offset = 1; offset <= players.length; offset += 1) {
    const candidate = players[(currentIndex + offset) % players.length].id;
    if (!game.finale || game.finale.remaining.includes(candidate)) return candidate;
  }
  return null;
}

function completeTurn(game, players, viewerId) {
  const actingPlayer = game.playerState[viewerId];
  syncMilestones(actingPlayer);
  if (!game.finale && tracksMeet(actingPlayer)) triggerFinale(game, viewerId, players, false);
  else if (game.finale && game.finale.remaining.includes(viewerId)) game.finale.remaining = game.finale.remaining.filter((id) => id !== viewerId);

  if (game.breakProgress >= game.breakTarget) resolveBreak(game, players);
  if (game.finale && game.finale.remaining.length === 0) {
    finishGame(game, players);
    return;
  }
  game.turn = (game.turn ?? 0) + 1;
  game.currentPlayerId = nextPlayer(game, players, viewerId);
}

function applySetup(game, players, viewer, command) {
  const player = game.playerState[viewer.id];
  if (!player || player.ready) throw new Error("你已完成設定");
  const keep = Array.isArray(command.keep) ? [...new Set(command.keep.filter((id) => typeof id === "string"))] : [];
  if (keep.length !== 4 || keep.some((id) => !player.initialHand.includes(id))) throw new Error("請由 8 張起手牌揀 4 張");
  const mapId = MAPS.some((map) => map.id === command.mapId) ? command.mapId : "A";
  player.hand = keep;
  game.discard.push(...player.initialHand.filter((id) => !keep.includes(id)));
  player.initialHand = [];
  player.mapId = mapId;
  if (mapId === "A" && !player.structures.length) {
    const definition = structureDefinition("enclosure3");
    player.structures.push({ id: crypto.randomUUID(), ...definition, cells: [76, 85, 86], used: 0, occupied: false, starting: true });
  }
  player.ready = true;
  addLog(game, `${viewer.name} 已經揀好地圖同起手牌。`);
  if (players.every((entry) => game.playerState[entry.id].ready)) {
    game.phase = "playing";
    game.currentPlayerId = game.firstPlayerId;
    addLog(game, `${playerName(players, game.firstPlayerId)} 先行，動物園正式開幕。`);
  }
}

function applyUpgrade(game, viewer, command) {
  const player = game.playerState[viewer.id];
  if (player.upgradeCredits < 1) throw new Error("未有可用嘅行動卡升級");
  if (!ACTION_IDS.includes(command.actionId) || player.actionUpgrades.includes(command.actionId)) throw new Error("請揀一張未升級嘅行動卡");
  player.upgradeCredits -= 1;
  player.actionUpgrades.push(command.actionId);
  addLog(game, `${viewer.name} 升級咗${ACTIONS.find((entry) => entry.id === command.actionId)?.name}行動卡。`);
}

function applyMapAbility(game, viewer, command) {
  const player = game.playerState[viewer.id];
  const map = mapFor(player);
  if (map.ability?.key !== "COMMERCIAL_HARBOR" || !mapFeatureConnected(player, map)) throw new Error("商業港口尚未連接");
  if (player.harborUsedTurn === (game.turn ?? 0)) throw new Error("今個回合已經用過商業港口");
  if (!player.hand.includes(command.cardId)) throw new Error("請揀一張手牌棄除");
  player.hand.splice(player.hand.indexOf(command.cardId), 1);
  game.discard.push(command.cardId);
  player.money += 3;
  player.harborUsedTurn = game.turn ?? 0;
  addLog(game, `${viewer.name} 使用商業港口，棄除 1 張手牌並取得 $3。`);
}

function applyGameCommand(game, players, viewer, command, marineWorlds) {
  if (command.type === "setup") {
    if (game.phase !== "setup") throw new Error("而家唔係設定階段");
    applySetup(game, players, viewer, command);
    return;
  }
  if (command.type === "upgrade") {
    if (game.phase !== "playing") throw new Error("遊戲未開始");
    applyUpgrade(game, viewer, command);
    return;
  }
  if (game.phase !== "playing") throw new Error(game.phase === "finished" ? "遊戲已完結" : "遊戲未開始");
  if (game.currentPlayerId !== viewer.id) throw new Error("未到你行動");
  if (command.type === "mapAbility") {
    applyMapAbility(game, viewer, command);
    return;
  }
  if (!ACTION_IDS.includes(command.type)) throw new Error("無效行動");
  const player = game.playerState[viewer.id];
  const extraX = intClamp(command.x, 0, player.xTokens);
  const strength = actionStrength(player, command.type, extraX);
  let summary;
  if (command.type === "cards") summary = cardsAction(game, player, command, strength);
  if (command.type === "build") summary = buildAction(game, player, command, strength, marineWorlds);
  if (command.type === "animals") summary = animalsAction(game, player, command, strength);
  if (command.type === "sponsors") summary = sponsorsAction(game, player, command, strength);
  if (command.type === "association") summary = associationAction(game, player, command, strength, marineWorlds);
  useActionCard(player, command.type, extraX);
  addLog(game, `${viewer.name}${summary}（強度 ${strength}）。`);
  completeTurn(game, players, viewer.id);
}

async function createRoom(request, env) {
  const input = await body(request);
  const name = normalizeName(input.name);
  if (!name) return json({ error: "請輸入園長名稱" }, 400);
  const database = db(env);
  const source = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const creatorHash = await hashText(source);
  const cutoff = new Date(Date.now() - 86400000).toISOString();
  const quota = await database.prepare("SELECT COUNT(*) AS total FROM rooms WHERE creator_hash = ? AND created_at > ?").bind(creatorHash, cutoff).first();
  if ((quota?.total ?? 0) >= 5) return json({ error: "你過去 24 小時已建立 5 個房間，請加入現有房間或稍後再試" }, 429);

  let code = randomCode();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!await database.prepare("SELECT id FROM rooms WHERE code = ?").bind(code).first()) break;
    code = randomCode();
  }
  const now = new Date().toISOString();
  const roomId = crypto.randomUUID();
  const playerId = crypto.randomUUID();
  const playerToken = randomToken();
  const stale = new Date(Date.now() - 14 * 86400000).toISOString();
  await database.batch([
    database.prepare("DELETE FROM rooms WHERE updated_at < ?").bind(stale),
    database.prepare(`INSERT INTO rooms
      (id, code, creator_hash, host_player_id, status, marine_worlds, game_state, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'lobby', ?, ?, ?, ?)`)
      .bind(roomId, code, creatorHash, playerId, input.marineWorlds ? 1 : 0, JSON.stringify(initialGameState()), now, now),
    database.prepare(`INSERT INTO players (id, room_id, name, color, seat, token_hash, joined_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)`)
      .bind(playerId, roomId, name, PLAYER_COLORS[0], await hashText(playerToken), now),
  ]);
  return json({ code, playerToken }, 201);
}

async function getRoom(request, env, code) {
  const loaded = await loadRoom(env, code);
  if (!loaded) return json({ error: "搵唔到呢個房間" }, 404);
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const viewer = await authenticate(env, loaded.room.id, token);
  if (!viewer) return json({ error: "請重新加入房間" }, 401);
  return json(payload(loaded, viewer.id));
}

async function joinRoom(request, env, code) {
  const input = await body(request);
  const name = normalizeName(input.name);
  if (!name) return json({ error: "請輸入園長名稱" }, 400);
  const loaded = await loadRoom(env, code);
  if (!loaded) return json({ error: "搵唔到呢個房間" }, 404);
  if (loaded.room.status !== "lobby") return json({ error: "遊戲已經開始" }, 409);
  if (loaded.players.length >= 4) return json({ error: "房間已滿" }, 409);
  if (loaded.players.some((player) => player.name.toLowerCase() === name.toLowerCase())) return json({ error: "房內已經有人使用呢個名稱" }, 409);
  const used = new Set(loaded.players.map((player) => player.seat));
  const seat = [0, 1, 2, 3].find((candidate) => !used.has(candidate));
  if (seat === undefined) return json({ error: "房間已滿" }, 409);
  const playerId = crypto.randomUUID();
  const playerToken = randomToken();
  const now = new Date().toISOString();
  await db(env).prepare(`INSERT INTO players (id, room_id, name, color, seat, token_hash, joined_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(playerId, loaded.room.id, name, PLAYER_COLORS[seat], seat, await hashText(playerToken), now).run();
  return json({ code, playerToken }, 201);
}

async function startGame(request, env, code) {
  const input = await body(request);
  const loaded = await loadRoom(env, code);
  if (!loaded) return json({ error: "搵唔到呢個房間" }, 404);
  const viewer = await authenticate(env, loaded.room.id, typeof input.playerToken === "string" ? input.playerToken : "");
  if (!viewer || viewer.id !== loaded.room.host_player_id) return json({ error: "只有房主可以開始遊戲" }, 403);
  if (loaded.players.length < 2) return json({ error: "最少要有 2 位園長" }, 409);
  if (loaded.room.status !== "lobby") return json({ error: "遊戲已經開始" }, 409);
  const game = createGame(loaded.players, Boolean(loaded.room.marine_worlds), code);
  await db(env).prepare("UPDATE rooms SET status = 'setup', game_state = ?, updated_at = ? WHERE id = ?")
    .bind(JSON.stringify(game), new Date().toISOString(), loaded.room.id).run();
  return json({ ok: true });
}

async function commandRoom(request, env, code) {
  const input = await body(request);
  const loaded = await loadRoom(env, code);
  if (!loaded) return json({ error: "搵唔到呢個房間" }, 404);
  const viewer = await authenticate(env, loaded.room.id, typeof input.playerToken === "string" ? input.playerToken : "");
  if (!viewer) return json({ error: "請重新加入房間" }, 401);
  const game = normalizeGameState(JSON.parse(loaded.room.game_state));
  try { applyGameCommand(game, loaded.players, viewer, input, Boolean(loaded.room.marine_worlds)); }
  catch (error) { return json({ error: error.message || "行動無法完成" }, 409); }
  const status = game.phase === "setup" ? "setup" : game.phase === "finished" ? "finished" : "playing";
  const result = await db(env).prepare("UPDATE rooms SET status = ?, game_state = ?, updated_at = ? WHERE id = ? AND updated_at = ?")
    .bind(status, JSON.stringify(game), new Date().toISOString(), loaded.room.id, loaded.room.updated_at).run();
  if ((result.meta?.changes ?? 0) === 0) return json({ error: "房間剛有更新，請再試一次" }, 409);
  return json({ ok: true });
}

async function apiRequest(request, env, pathname) {
  if (pathname === "/api/catalog" && request.method === "GET") return json(publicCatalog());
  await ensureSchema(env);
  if (pathname === "/api/rooms" && request.method === "POST") return createRoom(request, env);
  const match = pathname.match(/^\/api\/rooms\/([A-Z0-9]{6})(?:\/(join|start|command))?$/i);
  if (!match) return json({ error: "API route not found" }, 404);
  const code = normalizeCode(match[1]);
  if (!match[2] && request.method === "GET") return getRoom(request, env, code);
  if (match[2] === "join" && request.method === "POST") return joinRoom(request, env, code);
  if (match[2] === "start" && request.method === "POST") return startGame(request, env, code);
  if (match[2] === "command" && request.method === "POST") return commandRoom(request, env, code);
  return json({ error: "Method not allowed" }, 405);
}

async function staticRequest(request, env, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname === "/" ? "/index.html" : pathname;
  let response = await env.ASSETS.fetch(new Request(url, request));
  if (response.status === 404 && !pathname.includes(".")) {
    url.pathname = "/index.html";
    response = await env.ASSETS.fetch(new Request(url, request));
  }
  const outgoing = new Response(response.body, response);
  outgoing.headers.set("x-content-type-options", "nosniff");
  outgoing.headers.set("referrer-policy", "same-origin");
  outgoing.headers.set("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
  const revalidate = pathname === "/" || pathname.endsWith(".html") || pathname === "/app.js" || pathname === "/styles.css";
  outgoing.headers.set("cache-control", revalidate ? "no-cache" : "public, max-age=3600");
  return outgoing;
}

export const __testing = { createGame, applyGameCommand, privateState, targetAppeal, structureDefinition };

export default {
  async fetch(request, env) {
    try {
      const pathname = new URL(request.url).pathname;
      if (pathname.startsWith("/api/")) return apiRequest(request, env, pathname);
      return staticRequest(request, env, pathname);
    } catch (error) {
      console.error(error);
      return json({ error: "暫時未能處理，請再試一次" }, 500);
    }
  },
};
