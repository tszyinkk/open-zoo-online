import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function builtWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return import(workerUrl.href);
}

async function render() {
  const { default: worker } = await builtWorker();
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: {
      fetch: async (request) => {
        const pathname = new URL(request.url).pathname.replace(/^\//, "");
        try {
          const body = await readFile(new URL(`../dist/client/${pathname}`, import.meta.url));
          return new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
        } catch { return new Response("Not found", { status: 404 }); }
      },
    },
  });
}

test("serves the secure Open Zoo application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy") ?? "", /default-src 'self'/);
  const html = await response.text();
  assert.match(html, /Open Zoo Online/i);
  assert.match(html, /id="app"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("ships the complete catalogue and core game surfaces", async () => {
  const [client, worker, catalog] = await Promise.all([
    readFile(new URL("../dist/client/app.js", import.meta.url), "utf8"),
    readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"),
    import(new URL(`../dist/data/catalog.js?${Date.now()}`, import.meta.url)),
  ]);
  assert.equal(catalog.CARDS.length, 296);
  assert.equal(catalog.CARDS.filter((card) => card.type === "animal").length, 160);
  assert.equal(catalog.CARDS.filter((card) => card.type === "sponsor").length, 80);
  assert.match(client, /Marine Worlds/);
  assert.match(client, /confirm-setup/);
  assert.match(client, /data-open-action/);
  assert.match(client, /保育計劃/);
  assert.match(worker, /過去 24 小時已建立 5 個房間/);
  assert.match(worker, /reefCards/);
  assert.match(worker, /wave/);
  assert.match(worker, /finalScores/);
});

test("runs setup, upgrade and a legal build through the server engine", async () => {
  const { __testing } = await builtWorker();
  const players = [{ id: "p1", name: "甲", seat: 0 }, { id: "p2", name: "乙", seat: 1 }];
  const game = __testing.createGame(players, true, "ABC234");
  for (const player of players) {
    __testing.applyGameCommand(game, players, player, { type: "setup", keep: game.playerState[player.id].initialHand.slice(0, 4), mapId: "A" }, true);
  }
  assert.equal(game.phase, "playing");
  const first = game.playerState.p1;
  first.actionOrder = ["cards", "association", "sponsors", "animals", "build"];
  __testing.applyGameCommand(game, players, players[0], { type: "build", structure: "enclosure2", cell: 0, x: 0 }, true);
  assert.equal(first.structures.length, 1);
  assert.equal(first.money, 21);
  assert.equal(game.currentPlayerId, "p2");
});

test("validates Marine Worlds habitats, actions and hidden information", async () => {
  const { __testing } = await builtWorker();
  const players = [{ id: "p1", name: "甲", seat: 0 }, { id: "p2", name: "乙", seat: 1 }];
  const game = __testing.createGame(players, true, "SEA234");
  for (const player of players) {
    __testing.applyGameCommand(game, players, player, { type: "setup", keep: game.playerState[player.id].initialHand.slice(0, 4), mapId: "A" }, true);
  }
  const first = game.playerState.p1;
  first.money = 120;
  first.hand.push("530", "266");
  first.actionUpgrades.push("build", "animals", "association");
  first.workers = 3;

  const takeTurn = (type, command) => {
    game.currentPlayerId = "p1";
    first.actionOrder = ["cards", "association", "sponsors", "animals", "build"].filter((id) => id !== type);
    first.actionOrder.push(type);
    __testing.applyGameCommand(game, players, players[0], { type, x: 0, ...command }, true);
  };

  takeTurn("build", { structure: "aquariumSmall", cell: 3 });
  takeTurn("animals", { cardIds: ["530"] });
  takeTurn("sponsors", { mode: "play", cardId: "266" });
  takeTurn("association", { task: "university", target: "animal:海洋" });

  assert.equal(first.structures[0].type, "aquariumSmall");
  assert.deepEqual(first.playedAnimals, ["530"]);
  assert.deepEqual(first.sponsors, ["266"]);
  assert.ok(first.universities.includes("animal:海洋"));
  const opponentView = __testing.privateState(game, "p2");
  assert.equal(opponentView.playerState.p1.hand.length, 0);
  assert.equal(opponentView.deck.length, 0);
  assert.ok(opponentView.deckCount > 0);
});

test("gives every other player one final turn and calculates a winner", async () => {
  const { __testing } = await builtWorker();
  const players = [{ id: "p1", name: "甲", seat: 0 }, { id: "p2", name: "乙", seat: 1 }];
  const game = __testing.createGame(players, false, "END234");
  for (const player of players) {
    __testing.applyGameCommand(game, players, player, { type: "setup", keep: game.playerState[player.id].initialHand.slice(0, 4), mapId: "A" }, false);
    game.playerState[player.id].actionOrder = ["build", "animals", "sponsors", "association", "cards"];
  }
  game.playerState.p1.appeal = __testing.targetAppeal(0);
  __testing.applyGameCommand(game, players, players[0], { type: "cards", mode: "draw", x: 0 }, false);
  assert.deepEqual(game.finale.remaining, ["p2"]);
  assert.equal(game.currentPlayerId, "p2");
  __testing.applyGameCommand(game, players, players[1], { type: "cards", mode: "draw", x: 0 }, false);
  assert.equal(game.phase, "finished");
  assert.equal(game.currentPlayerId, null);
  assert.ok(game.finalScores.p1);
  assert.ok(game.winnerId);
});
