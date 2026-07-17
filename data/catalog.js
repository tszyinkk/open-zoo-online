import { ANIMAL_FACTS, ENDGAME_FACTS, PROJECT_FACTS, SPONSOR_FACTS } from "./card-facts.js";

const animals = `
401|Cheetah
402|Lion
403|Leopard
404|Caracal
405|Fennec Fox
406|Siberian Tiger
407|Sumatran Tiger
408|Sloth Bear
409|Sun Bear
410|Yellow-throated Marten
411|Grizzly Bear
412|Jaguar
413|Cougar
414|South American Coati
415|Raccoon
416|Eurasian Brown Bear
417|Wolf
418|Eurasian Lynx
419|European Badger
420|Stoat
421|New Zealand Fur Seal
422|Australian Sea Lion
423|New Zealand Sea Lion
424|Australian Dingo
425|Tasmanian Devil
426|African Bush Elephant
427|White Rhinoceros
428|Giraffe
429|Grevy's Zebra
430|Pygmy Hippopotamus
431|Asian Elephant
432|Indian Rhinoceros
433|Giant Panda
434|Red Panda
435|Malayan Tapir
436|American Bison
437|Muskox
438|Reindeer
439|Llama
440|Mountain Tapir
441|European Bison
442|Moose
443|Red Deer
444|Alpine Ibex
445|Crested Porcupine
446|Dugong
447|Red Kangaroo
448|Koala
449|Platypus
450|Common Wombat
451|Proboscis Monkey
452|Senegal Bushbaby
453|Collared Mangabey
454|Ring-tailed Lemur
455|Mantled Guereza
456|Barbary Macaque
457|Mandrill
458|Japanese Macaque
459|Red-shanked Douc
460|Dusky Leaf Monkey
461|Horsfield's Tarsier
462|Northern Plains Gray Langur
463|Panamanian White-faced Capuchin
464|Brown Spider Monkey
465|Golden Lion Tamarin
466|Bolivian Red Howler
467|Ecuadorian Squirrel Monkey
468|Cotton-top Tamarin
469|Nile Crocodile
470|Western Green Mamba
471|African Spurred Tortoise
472|Rock Monitor
473|Common Agama
474|Indian Rock Python
475|King Cobra
476|Komodo Dragon
477|Veiled Chameleon
478|Chinese Water Dragon
479|American Alligator
480|Broad-snouted Caiman
481|Galapagos Giant Tortoise
482|Anaconda
483|Boa Constrictor
484|European Pond Turtle
485|Common European Adder
486|Common Wall Lizard
487|European Grass Snake
488|Slow Worm
489|Saltwater Crocodile
490|Gould's Monitor
491|Frilled Lizard
492|Inland Taipan
493|Thorny Devil
494|African Ostrich
495|Secretary Bird
496|Marabou
497|Lesser Flamingo
498|Shoebill
499|Cinereous Vulture
500|Long-billed Vulture
501|Indian Peafowl
502|Great Hornbill
503|Snowy Owl
504|Andean Condor
505|Bald Eagle
506|King Vulture
507|Greater Rhea
508|Scarlet Macaw
509|Golden Eagle
510|White Stork
511|Greater Flamingo
512|Eurasian Eagle-owl
513|Barn Owl
514|Emu
515|Australian Pelican
516|Northern Cassowary
517|Laughing Kookaburra
518|Lesser Bird-of-Paradise
519|(Domestic) Goat
520|Sheep
521|Horse
522|Donkey
523|Domestic Rabbit
524|Mangalica
525|Guinea Pig
526|Alpaca
527|Coconut Lorikeet
528|Bennett's Wallaby
529|Magnificent Sea Anemone
530|Orange Clownfish
531|Palette Surgeonfish
532|Zooplankton
533|Blackside Hawkfish
534|Southern Blue-Ringed Octopus
535|Sharknose Goby
536|Longhorn Cowfish
537|Blackbar Triggerfish
538|Devil Firefish
539|American Whitespotted Filefish
540|Guineafowl Puffer
541|Bluespotted Ribbontail Ray
542|Humphead Wrasse
543|Coastal Manta Ray
544|Caribbean Reef Shark
545|Longcomb Sawfish
546|Sand Tiger Shark
547|Mediterranean Rainbow Wrasse
548|Lined Seahorse
549|Common Octopus
550|Compass Jellyfish
551|Loggerhead Sea Turtle
552|Green Sea Turtle
553|Tambaqui
554|African Penguin
555|Golden Snub-Nosed Monkey
556|Wolverine
557|Vietnamese Pot-Bellied Pig
558|Northern Muriqui
559|Coquerel's Sifaka
560|Brahminy Kite`;

const sponsors = `
201|Science Lab
202|Spokesperson
203|Veterinarian
204|Science Museum
205|Gorilla Field Research
206|Medical Breakthrough
207|Basic Research
208|Science Library
209|Technology Institute
210|Expert on the Americas
211|Expert on Europe
212|Expert on Australia
213|Expert on Asia
214|Expert on Africa
215|Breeding Cooperation
216|Talented Communicator
217|Engineer
218|Breeding Program
219|Diversity Researcher
220|Federal Grants
221|Archaeologist
222|Release of Patents
223|Science Institute
224|Migration Recording
225|Quarantine Lab
226|Foreign Institute
227|WAZA Special Assignment
228|WAZA Small Animals Program
229|Expert in Small Animals
230|Expert in Large Animals
231|Sponsorship: Primates
232|Sponsorship: Reptiles
233|Sponsorship: Vultures
234|Sponsorship: Lions
235|Sponsorship: Elephants
236|Primatologist
237|Herpetologist
238|Ornithologist
239|Expert in Predators
240|Expert in Herbivores
241|Hydrologist
242|Geologist
243|Meerkat Den
244|Penguin Pool
245|Aquarium
246|Cable Car
247|Baboon Rock
248|Rhesus Monkey Park
249|Barred Owl Hut
250|Sea Turtle Tank
251|Polar Bear Exhibit
252|Spotted Hyena Compound
253|Okapi Stable
254|Zoo School
255|Adventure Playground
256|Water Playground
257|Side Entrance
258|Native Seabirds
259|Native Lizards
260|Native Farm Animals
261|Guided School Tours
262|Explorer
263|WAZA Large Animal Program
264|Free-range New World Monkeys
265|Franchise Business
266|Marine Biologist
267|Farm Cat
268|Conference on Europe
269|Conference on Australia
270|Marine Research Expedition
271|Excavation Site
272|Expansion Area
273|Publications
274|Mascot Statue
275|Horse Whisperer
276|Landscape Gardener
277|Field Research Type D Orcas
278|Amazon House
279|Underwater Tunnel
280|Reconstruction`;

const projects = `
101|Species Diversity
102|Habitat Diversity
103|Africa
104|Americas
105|Australia
106|Asia
107|Europe
108|Primates
109|Reptiles
110|Predators
111|Herbivores
112|Birds
113|Bavarian Forest National Park
114|Yosemite National Park
115|Angthong National Park
116|Serengeti National Park
117|Blue Mountains National Park
118|Savanna
119|Low Mountain Range
120|Bamboo Forest
121|Sea Cave
122|Jungle
123|Bird Breeding Program
124|Predator Breeding Program
125|Reptile Breeding Program
126|Herbivore Breeding Program
127|Primate Breeding Program
128|Aquatic
129|Geological
130|Small Animals
131|Large Animals
132|Research
133|Sea Animals
134|Predator Management Plan
135|Bird Management Plan
136|Reptile Management Plan
137|Herbivore Management Plan
138|Sea Animal Management Plan
139|Primate Management Plan`;

const endgames = `
001|Large Animal Zoo
002|Small Animal Zoo
003|Research Zoo
004|Architectural Zoo
005|Conservation Zoo
006|Naturalists' Zoo
007|Favorite Zoo
008|Sponsored Zoo
009|Diverse Species Zoo
010|Climbing Park
011|Aquatic Park
012|Designer Zoo
013|Specialized Habitat Zoo
014|Specialized Species Zoo
015|Catered Picnic Areas
016|Accessible Zoo
017|International Zoo`;

const zhNames = {
  401: "獵豹", 402: "獅子", 406: "西伯利亞虎", 407: "蘇門答臘虎", 411: "灰熊", 417: "狼",
  426: "非洲草原象", 428: "長頸鹿", 433: "大熊貓", 434: "小熊貓", 447: "紅大袋鼠", 448: "樹熊",
  454: "環尾狐猴", 457: "山魈", 469: "尼羅鱷", 475: "眼鏡王蛇", 476: "科莫多巨蜥", 482: "森蚺",
  494: "非洲鴕鳥", 503: "雪鴞", 505: "白頭海鵰", 508: "緋紅金剛鸚鵡", 513: "倉鴞", 517: "笑翠鳥",
  529: "華麗海葵", 530: "橙色小丑魚", 531: "藍倒吊", 534: "南方藍環章魚", 543: "沿岸蝠鱝",
  544: "加勒比礁鯊", 546: "沙虎鯊", 548: "線紋海馬", 549: "普通章魚", 551: "赤蠵龜", 552: "綠蠵龜", 554: "非洲企鵝",
  201: "科學實驗室", 203: "獸醫", 204: "科學博物館", 217: "工程師", 245: "水族館", 254: "動物園學校",
  266: "海洋生物學家", 270: "海洋研究遠征", 279: "海底隧道",
  101: "物種多樣性", 102: "棲息地多樣性", 103: "非洲", 104: "美洲", 105: "澳洲", 106: "亞洲", 107: "歐洲",
  108: "靈長類", 109: "爬蟲類", 110: "肉食類", 111: "草食類", 112: "鳥類", 128: "水域", 132: "科研", 133: "海洋動物",
  "001": "大型動物園", "002": "小型動物園", "003": "科研動物園", "004": "建築動物園", "005": "保育動物園",
  "006": "自然學家動物園", "007": "最愛動物園", "008": "贊助動物園", "009": "多樣物種動物園", "010": "攀爬公園",
  "011": "水上公園", "012": "設計師動物園", "013": "專門棲息地動物園", "014": "專門物種動物園", "015": "野餐服務區",
  "016": "無障礙動物園", "017": "國際動物園",
};

export const ACTIONS = [
  { id: "cards", name: "卡牌", glyph: "▤", color: "#247a94" },
  { id: "association", name: "協會", glyph: "♟", color: "#508a58" },
  { id: "sponsors", name: "贊助", glyph: "◆", color: "#b46b3b" },
  { id: "animals", name: "動物", glyph: "●", color: "#9a4675" },
  { id: "build", name: "建造", glyph: "⬡", color: "#b39a34" },
];

export const MAPS = [
  { id: "A", name: "地圖 A · 入門", note: "入門面：開局已有一個空置 3 格標準圍欄", water: [13, 14, 23, 24, 61, 62, 71, 72], rock: [2, 3, 20, 28, 57, 66, 83, 93], bonuses: { 10: "$5", 26: "X", 40: "聲譽", 52: "抽牌", 64: "$5", 80: "X" }, features: {} },
  { id: "0", name: "地圖 0 · 標準", note: "標準面：較多放置獎勵，冇額外地圖能力", water: [16, 17, 25, 35, 59, 60, 69, 79], rock: [1, 11, 30, 38, 55, 74, 84, 92], bonuses: { 8: "$5", 21: "X", 33: "聲譽", 45: "抽牌", 58: "$5", 70: "協會員", 87: "保育" }, features: {} },
  { id: "1", name: "地圖 1 · 觀測塔", note: "觀測塔旁嘅標準圍欄翻到已佔用面時，取得 2 魅力", water: [43, 44, 52, 53, 54, 61, 62, 70, 71, 79, 88], rock: [2, 3, 12, 13, 21, 22, 58, 67, 77, 78, 89], bonuses: { 10: "X", 26: "抽牌", 49: "$5", 64: "建造 II", 73: "$5", 81: "X", 91: "X" }, features: { 40: "觀測塔" }, ability: { key: "OBSERVATION_TOWER", cell: 40 } },
  { id: "2", name: "地圖 2 · 戶外區域", note: "與入口相鄰嘅每個標準圍欄，容量增加 2", water: [6, 15, 25, 26, 55, 65, 74, 75], rock: [1, 10, 19, 37, 47, 66, 84, 93], bonuses: { 12: "$5", 29: "X", 43: "聲譽", 59: "抽牌", 72: "$5", 88: "保育" }, features: { 77: "戶外入口" }, ability: { key: "OUTDOOR_AREAS", cell: 77 } },
  { id: "3", name: "地圖 3 · 銀湖", note: "銀湖四周設有較高價值嘅放置獎勵", water: [31, 32, 40, 41, 42, 49, 50, 51, 52, 59, 60, 61], rock: [3, 13, 22, 70, 79, 89], bonuses: { 10: "$5", 26: "$5", 37: "X", 46: "$5", 57: "聲譽", 66: "$5", 74: "抽牌", 86: "保育" }, features: {} },
  { id: "4", name: "地圖 4 · 商業港口", note: "連接港口後，每回合一次可棄 1 張手牌換取 $3", water: [7, 16, 17, 26, 35, 44, 53, 62, 71], rock: [2, 11, 29, 47, 65, 83, 92], bonuses: { 14: "$5", 24: "X", 39: "聲譽", 56: "抽牌", 68: "$5", 80: "保育" }, features: { 48: "商業港口" }, ability: { key: "COMMERCIAL_HARBOR", cell: 48 } },
  { id: "5", name: "地圖 5 · 公園餐廳", note: "收入：餐廳每個相鄰而且已覆蓋嘅格取得 $1", water: [5, 14, 24, 33, 63, 72, 82, 91], rock: [1, 20, 29, 46, 57, 75, 84], bonuses: { 11: "$5", 27: "X", 39: "聲譽", 55: "抽牌", 69: "$5", 87: "保育" }, features: { 50: "公園餐廳" }, ability: { key: "PARK_RESTAURANT", cell: 50 } },
  { id: "6", name: "地圖 6 · 研究院", note: "連接研究院後，每次打出動物可忽略 1 個條件", water: [8, 17, 27, 36, 58, 67, 77, 86], rock: [3, 12, 21, 39, 56, 65, 83, 93], bonuses: { 10: "$5", 25: "X", 42: "聲譽", 52: "抽牌", 72: "$5", 89: "保育" }, features: { 48: "研究院" }, ability: { key: "RESEARCH_INSTITUTE", cell: 48 } },
  { id: "7", name: "地圖 7 · 雪糕店", note: "覆蓋全部雪糕店後，每間亭店額外提供 $1 收入", water: [4, 13, 23, 32, 62, 71, 81, 90], rock: [8, 17, 36, 47, 57, 74, 84], bonuses: { 11: "$5", 28: "雪糕", 41: "X", 54: "雪糕", 68: "聲譽", 79: "雪糕", 88: "保育" }, features: {}, ability: { key: "ICE_CREAM_PARLORS", cells: [28, 54, 79] } },
  { id: "8", name: "地圖 8 · 荷里活山", note: "覆蓋 H 可抽 1 張贊助牌；全部覆蓋後贊助牌強度減 1", water: [6, 15, 25, 34, 64, 73, 83, 92], rock: [2, 11, 30, 38, 56, 75, 85], bonuses: { 13: "H", 27: "$5", 43: "H", 59: "X", 70: "H", 82: "聲譽", 89: "保育" }, features: {}, ability: { key: "HOLLYWOOD_HILLS", cells: [13, 43, 70] } },
];

const animalKinds = ["肉食", "草食", "靈長", "爬蟲", "鳥類"];

function parse(text) {
  return text.trim().split("\n").map((line) => {
    const [rawId, name] = line.split("|");
    return { rawId, id: Number(rawId), name, zh: zhNames[rawId] ?? zhNames[Number(rawId)] ?? name };
  });
}

const kindTags = ["肉食", "草食", "靈長", "爬蟲", "鳥類", "萌寵", "海洋"];
const continentTags = ["非洲", "亞洲", "美洲", "歐洲", "澳洲"];
const projectRows = Object.fromEntries(parse(projects).map((row) => [row.rawId, row]));

function animalCard(fact) {
  const aquarium = fact.specialEnclosures.find((entry) => entry.type === "Aquarium")?.capacity ?? 0;
  return {
    rawId: fact.id, id: Number(fact.id), name: fact.name, zh: fact.zh, latinName: fact.latinName,
    type: "animal", expansion: fact.source, kind: fact.tags.find((tag) => kindTags.includes(tag)) ?? "動物",
    continent: fact.tags.find((tag) => continentTags.includes(tag)) ?? "",
    size: fact.size, cost: fact.cost, appeal: fact.appeal, conservation: fact.conservation,
    reputation: fact.reputation, rock: fact.rock, water: fact.water, aquarium,
    reef: fact.reefEffects.length > 0, wave: fact.wave, tags: fact.tags, requirements: fact.requirements,
    abilities: fact.abilities, reefEffects: fact.reefEffects, specialEnclosures: fact.specialEnclosures,
    standardEnclosure: fact.standardEnclosure, verified: true,
  };
}

function sponsorCard(fact) {
  return {
    rawId: fact.id, id: Number(fact.id), name: fact.name, zh: fact.zh,
    type: "sponsor", expansion: fact.source, level: fact.level, income: 0,
    appeal: fact.appeal, conservation: fact.conservation, reputation: fact.reputation,
    rock: fact.rock, water: fact.water, tags: ["贊助", ...fact.tags], requirements: fact.requirements,
    effects: fact.effects, human: fact.human, wave: false, verified: true,
  };
}

function projectCard(fact) {
  const row = projectRows[fact.id] ?? { rawId: fact.id, id: Number(fact.id), name: fact.name, zh: fact.zh };
  return { ...row, name: fact.name, zh: fact.zh, type: "project", expansion: fact.source,
    key: fact.tag || fact.zh, thresholds: fact.thresholds, points: fact.points,
    tags: ["保育計劃", fact.tag || fact.zh], verified: true };
}

function unresolvedProjectCard(row) {
  return { ...row, type: "project", expansion: "marine", key: row.zh,
    thresholds: [], points: [], tags: ["保育計劃", row.zh], verified: false };
}

function endgameCard(fact) {
  return { rawId: fact.id, id: Number(fact.id), name: fact.name, zh: fact.zh,
    type: "endgame", expansion: fact.source, tags: ["終局計分"], scores: fact.scores, max: 4, verified: true };
}

const unresolvedProjects = parse(projects).filter((row) => !PROJECT_FACTS.some((fact) => fact.id === row.rawId));

export const CARDS = [
  ...ANIMAL_FACTS.filter((fact) => Number(fact.id) >= 401).map(animalCard),
  ...SPONSOR_FACTS.filter((fact) => Number(fact.id) >= 201 && Number(fact.id) <= 280).map(sponsorCard),
  ...PROJECT_FACTS.map(projectCard),
  ...unresolvedProjects.map(unresolvedProjectCard),
  ...ENDGAME_FACTS.map(endgameCard),
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((card) => [card.rawId, card]));

export function publicCatalog() {
  return { version: 3, cards: CARDS, actions: ACTIONS, maps: MAPS };
}

export function deckIds(marineWorlds) {
  return CARDS.filter((card) => {
    const zooCard = card.type === "animal" || card.type === "sponsor" || card.type === "project" && card.category === "normal";
    return zooCard && card.expansion !== "promo" && card.verified !== false && (marineWorlds || card.expansion === "base");
  }).map((card) => card.rawId);
}

export function projectIds(marineWorlds) {
  return CARDS.filter((card) => card.type === "project" && card.category === "base" && card.verified && (marineWorlds || card.expansion === "base")).map((card) => card.rawId);
}

export function endgameIds(marineWorlds) {
  return CARDS.filter((card) => card.type === "endgame" && (marineWorlds || card.expansion === "base")).map((card) => card.rawId);
}

export function projectProgress(card, player) {
  if (!card || card.type !== "project") return 0;
  if (card.rawId === "101") return ["肉食", "草食", "靈長", "爬蟲", "鳥類"].filter((tag) => (player.tags[tag] ?? 0) > 0).length;
  if (card.rawId === "102") return ["非洲", "美洲", "澳洲", "亞洲", "歐洲"].filter((tag) => (player.tags[tag] ?? 0) > 0).length;
  if (card.rawId === "130") return player.playedAnimals.filter((id) => (CARD_BY_ID[id]?.size ?? 99) <= 2).length;
  if (card.rawId === "131") return player.playedAnimals.filter((id) => (CARD_BY_ID[id]?.size ?? 0) >= 4).length;
  const token = card.key || card.zh.replace(/計劃|管理|繁育|動物|類/g, "").trim();
  if (["非洲", "美洲", "澳洲", "亞洲", "歐洲"].includes(token)) return player.tags[token] ?? 0;
  if (token.includes("海洋") || token.includes("水域")) return player.tags["海洋"] ?? 0;
  if (token.includes("科研")) return player.tags["科研"] ?? 0;
  const kind = animalKinds.find((entry) => token.includes(entry));
  return kind ? player.tags[kind] ?? 0 : Math.floor((player.playedAnimals.length + player.sponsors.length) / 2);
}
