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
  { id: "A", name: "地圖 A", note: "入門：完成建造獎勵較寬鬆", water: [2, 9, 19], rock: [6, 14, 22] },
  { id: "0", name: "地圖 0", note: "標準：適合熟習基本流程", water: [3, 12, 21], rock: [7, 16, 25] },
  { id: "1", name: "地圖 1", note: "商業動物園：亭店收入較強", water: [4, 13, 24], rock: [8, 17, 26] },
  { id: "2", name: "地圖 2", note: "科研動物園：大學路線較快", water: [2, 11, 20], rock: [5, 15, 27] },
  { id: "3", name: "地圖 3", note: "銀湖：水邊建築有額外空間", water: [1, 2, 10, 19], rock: [14, 25] },
  { id: "4", name: "地圖 4", note: "好萊塢山：贊助牌有額外回報", water: [5, 14, 23], rock: [3, 12, 21] },
  { id: "5", name: "地圖 5", note: "公園食肆：連接建築收入較高", water: [7, 16, 25], rock: [4, 13, 22] },
  { id: "6", name: "地圖 6", note: "研究院：科研標記推進路線", water: [0, 9, 18], rock: [8, 17, 26] },
  { id: "7", name: "地圖 7", note: "冰淇淋店：小型建築獎勵", water: [6, 15, 24], rock: [2, 11, 20] },
  { id: "8", name: "地圖 8", note: "港口：海洋世界專用優勢", water: [1, 10, 19, 28], rock: [7, 17, 26] },
];

const continents = ["非洲", "亞洲", "美洲", "歐洲", "澳洲"];
const animalKinds = ["肉食", "草食", "靈長", "爬蟲", "鳥類"];
const abilities = ["money", "draw", "appeal", "reputation", "x", "break", "conservation"];

function parse(text) {
  return text.trim().split("\n").map((line) => {
    const [rawId, name] = line.split("|");
    return { rawId, id: Number(rawId), name, zh: zhNames[rawId] ?? zhNames[Number(rawId)] ?? name };
  });
}

function seed(id, salt = 0) {
  let value = (Number(id) * 2654435761 + salt * 2246822519) >>> 0;
  value ^= value >>> 13;
  return value >>> 0;
}

function animalKind(id) {
  if (id >= 529 && id <= 554) return "海洋";
  if (id >= 519 && id <= 528) return "家畜";
  if (id >= 494) return "鳥類";
  if (id >= 469) return "爬蟲";
  if (id >= 451) return "靈長";
  if (id >= 426) return "草食";
  return "肉食";
}

function animalContinent(id) {
  const grouped = [
    [401, 405, "非洲"], [406, 410, "亞洲"], [411, 415, "美洲"], [416, 420, "歐洲"], [421, 425, "澳洲"],
    [426, 430, "非洲"], [431, 435, "亞洲"], [436, 440, "美洲"], [441, 445, "歐洲"], [446, 450, "澳洲"],
    [469, 473, "非洲"], [474, 478, "亞洲"], [479, 483, "美洲"], [484, 488, "歐洲"], [489, 493, "澳洲"],
    [494, 498, "非洲"], [499, 503, "亞洲"], [504, 508, "美洲"], [509, 513, "歐洲"], [514, 518, "澳洲"],
    [519, 526, "歐洲"], [527, 528, "澳洲"],
  ];
  const match = grouped.find(([start, end]) => id >= start && id <= end);
  if (match) return match[2];
  if (id >= 451 && id <= 455) return id === 451 ? "亞洲" : "非洲";
  if (id >= 456 && id <= 457) return "非洲";
  if (id >= 458 && id <= 462) return "亞洲";
  if (id >= 463 && id <= 468) return "美洲";
  if (id >= 529 && id <= 554) return continents[seed(id, 2) % continents.length];
  return continents[seed(id, 2) % continents.length];
}

function animalCard(row) {
  const marine = row.id >= 529 && row.id <= 554;
  const promo = row.id >= 555;
  const kind = animalKind(row.id);
  const continent = animalContinent(row.id);
  const size = 1 + (seed(row.id, 1) % 5);
  const aquarium = marine ? 1 + (seed(row.id, 9) % 4) : 0;
  const conservation = seed(row.id, 5) % 5 === 0 ? 1 : 0;
  const ability = abilities[seed(row.id, 6) % abilities.length];
  return {
    ...row, type: "animal", expansion: promo ? "promo" : marine ? "marine" : "base", kind,
    continent, size,
    cost: 6 + (seed(row.id, 3) % 27), appeal: 2 + (seed(row.id, 4) % 11), conservation,
    reputation: seed(row.id, 7) % 10 === 0 ? 6 + (seed(row.id, 8) % 7) : 0,
    aquarium, reef: marine && seed(row.id, 10) % 2 === 0, wave: marine,
    tags: marine ? ["海洋"] : [kind, continent],
    ability, abilityValue: 1 + (seed(row.id, 11) % 3),
  };
}

function sponsorCard(row) {
  const marine = row.id >= 265;
  const ability = abilities[seed(row.id, 15) % abilities.length];
  return {
    ...row, type: "sponsor", expansion: marine ? "marine" : "base", level: 1 + (seed(row.id, 12) % 5),
    income: seed(row.id, 13) % 3, appeal: seed(row.id, 14) % 3, ability,
    abilityValue: 1 + (seed(row.id, 16) % 3), wave: marine && seed(row.id, 17) % 3 === 0,
    tags: marine ? ["贊助", "海洋"] : ["贊助", seed(row.id, 18) % 2 ? "科研" : "建築"],
  };
}

function projectCard(row) {
  const marine = row.id >= 128;
  const key = row.zh;
  return {
    ...row, type: "project", expansion: marine ? "marine" : "base", key,
    thresholds: [2 + (seed(row.id, 20) % 2), 4 + (seed(row.id, 21) % 2), 6 + (seed(row.id, 22) % 2)],
    points: [2, 3, 4], tags: ["保育計劃", key],
  };
}

function endgameCard(row) {
  return { ...row, type: "endgame", expansion: row.id >= 12 ? "marine" : "base", tags: ["終局計分"], max: 4 };
}

export const CARDS = [
  ...parse(animals).map(animalCard),
  ...parse(sponsors).map(sponsorCard),
  ...parse(projects).map(projectCard),
  ...parse(endgames).map(endgameCard),
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((card) => [card.rawId, card]));

export function publicCatalog() {
  return { version: 2, cards: CARDS, actions: ACTIONS, maps: MAPS };
}

export function deckIds(marineWorlds) {
  return CARDS.filter((card) => (card.type === "animal" || card.type === "sponsor") && card.expansion !== "promo" && (marineWorlds || card.expansion === "base")).map((card) => card.rawId);
}

export function projectIds(marineWorlds) {
  return CARDS.filter((card) => card.type === "project" && (marineWorlds || card.expansion === "base")).map((card) => card.rawId);
}

export function endgameIds(marineWorlds) {
  return CARDS.filter((card) => card.type === "endgame" && (marineWorlds || card.expansion === "base")).map((card) => card.rawId);
}

export function projectProgress(card, player) {
  if (!card || card.type !== "project") return 0;
  if (card.rawId === "101") return Object.values(player.tags ?? {}).filter(Boolean).length;
  if (card.rawId === "102") return new Set(player.structures.map((item) => item.type)).size;
  const token = card.zh.replace(/計劃|管理|繁育|動物|類/g, "").trim();
  if (["非洲", "美洲", "澳洲", "亞洲", "歐洲"].includes(token)) return player.tags[token] ?? 0;
  if (token.includes("海洋") || token.includes("水域")) return player.tags["海洋"] ?? 0;
  if (token.includes("科研")) return player.tags["科研"] ?? 0;
  const kind = animalKinds.find((entry) => token.includes(entry));
  return kind ? player.tags[kind] ?? 0 : Math.floor((player.playedAnimals.length + player.sponsors.length) / 2);
}
