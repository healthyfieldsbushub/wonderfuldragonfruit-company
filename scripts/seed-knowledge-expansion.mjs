/**
 * World Knowledge Base expansion — rounds out DRACO's coverage with the
 * topics growers ask about that were not yet present: value-added processing,
 * pollination technique, organic certification, SA regulatory registration,
 * cold-chain/export packing, nutrition marketing, flower-drop troubleshooting,
 * and seasonal rainfall/winter management.
 *
 * Run: node scripts/seed-knowledge-expansion.mjs   (idempotent by title)
 */
import crypto from "crypto";
import mysql from "mysql2/promise";

const entries = [
  {
    title: "Value-added products: processing dragon fruit beyond fresh market",
    category: "Business",
    tags: "processing,value-added,second-grade fruit,powder,juice",
    content: `Second-grade and undersized fruit need not be a loss. Viable value-added routes: frozen pulp and puree (blast-freeze at -35C, stores 18-24 months), freeze-dried powder (retains colour and betalains, premium product), dried fruit slices (60C for 8-10 hours to hold colour), juice blends and concentrates, and preserves or chutneys. Skin and peel residues can be composted or explored as natural food colourant. Minimum viable volumes: 1-3 tons/season supports a small processing line; partner with existing SA fruit processors before investing. Food safety: processing requires a Certificate of Acceptability under R638 and HACCP documentation for retail/export buyers.`,
  },
  {
    title: "Hand and bee pollination technique for self-sterile cultivars",
    category: "Flowering & Fruit",
    tags: "pollination,hand-pollination,bees,self-sterile,technique",
    content: `Self-sterile cultivars need cross-pollination every night they flower. Hand pollination: flowers open at dusk (approx 19:00-21:00); collect pollen with a soft brush from a freshly-opened flower of a compatible cultivar, dab onto the stigma of the receiving flower, and repeat to each open bloom - one polliniser flower serves roughly 10-15 recipient flowers. Honeybees contribute meaningful transfer in the first 2 hours after opening; place 2-4 hives per hectare near the rows, though bees alone cannot reliably pollinate self-sterile types. Mark polliniser rows clearly. Fruit set from good cross-pollination shows uniform shape and full scales; partial pollination yields misshapen light fruit.`,
  },
  {
    title: "Organic certification in South Africa: SAOSO, EU and US routes",
    category: "Business",
    tags: "organic,certification,SAOSO,EU,documentation",
    content: `To sell as certified organic in South Africa, register with SAOSO (South African Organic Sector Organisation) for local claims; export routes require certification by an accredited body such as Ecocert, Control Union or SGS against EU 2018/848, US NOP or Japanese JAS standards. Expect a 12-36 month transition period from last prohibited input, with full records of every spray, fertiliser and purchase. Permitted inputs include EM-based programmes, composted manures, rock minerals and plant-protection products on the relevant organic annex; copper and sulphur have restrictions. Certification costs roughly R15,000-40,000 per year depending on size and scope, plus inspection travel. Dragon fruit suits organic production well because disease pressure is managed largely by canopy hygiene and drainage.`,
  },
  {
    title: "Regulatory registration and compliance for South African growers",
    category: "Business",
    tags: "registration,compliance,FBO,DALRRD,phytosanitary",
    content: `New growers should register as a food business operator with the local municipality (Certificate of Acceptability under Regulation R638) if producing for retail. Registration with DALRRD as a producer, and with FSA/PGS channels for traceability, is required to access export channels. Any plant material moving between provinces or exported needs phytosanitary inspection by NPPO; keep planting material sourced from registered nurseries. Land claims, water-use licensing (Water Use Licence under the National Water Act where irrigation is from a scheme or borehole above threshold) and municipal zoning for pack-house structures should be confirmed before capital investment. Keep records of spray programmes and input purchases: buyers and inspectors audit them.`,
  },
  {
    title: "Cold chain and export packing protocol for dragon fruit",
    category: "Flowering & Fruit",
    tags: "cold-chain,packing,export,post-harvest,shelf-life",
    content: `Dragon fruit is chill-sensitive: the safe window is 10-13C storage for 2-4 weeks, with 85-90% relative humidity. Packing for export: pick at colour-break to full colour (target brix 16-18), trim stem flush with the shoulder, clean with a soft dry brush (never wash for export unless drying facilities exist), grade by size and blemish class, then pack single or double layers in ventilated cartons with liners. Forced-air pre-cooling to 12C within 4-6 hours of harvest is the single biggest shelf-life lever. Sea freight requires refrigerated containers set at 12C; airfreight tolerates 13-15C. A broken cold chain shows as lenticel spotting, dull scales and soft shoulders within days.`,
  },
  {
    title: "Dragon fruit nutrition and evidence-based marketing claims",
    category: "Business",
    tags: "nutrition,marketing,health claims,regulation",
    content: `Dragon fruit is low in fat and a source of dietary fibre, vitamin C, magnesium and betalain antioxidants; the seeds contribute omega-3 and omega-6 fatty acids. Per 100g fresh flesh it supplies roughly 50-60 kcal. For marketing, stay within what regulations allow: do not claim treatment or prevention of disease (that is prohibited under food-labelling law in South Africa - R146 on foodstuffs and the Medicines Act). Safe claim language: natural source of vitamin C, source of dietary fibre, naturally rich in antioxidant pigments, no added sugar. Highlight hydration and low energy density for the health-conscious market. Keep any nutrition panel based on representative lab analysis, not copied values from other origins.`,
  },
  {
    title: "Troubleshooting flower drop and poor fruit set",
    category: "Flowering & Fruit",
    tags: "flower drop,troubleshooting,fruit set,diagnosis",
    content: `Common causes of flower drop and poor set: self-sterile cultivar without a compatible polliniser (check that a polliniser row is flowering on the same nights); heat above 35C during anthesis desiccates pollen - shade cloth and evening misting help; water stress in the 10 days before flowering; night temperatures below 10C slow pollen tube growth; excess nitrogen pushing vegetative growth at the expense of flowering; and boron deficiency causing premature bud abscission. Distinguish bud drop (early, usually stress or nutrition) from post-anthesis drop (pollination failure). Record the nights flowers opened, weather, and whether a polliniser cultivar was flowering simultaneously - that single data point resolves most cases.`,
  },
  {
    title: "Winter and rainfall-season management in South Africa",
    category: "Establishing",
    tags: "winter,rainfall,dormancy,frost protection,drainage",
    content: `Dragon fruit in South Africa experiences slowed growth below 15C and stops flowering in winter. Reduce irrigation by 40-60% from May to August; the plant needs enough water to avoid bract desiccation but wet cold soil invites stem rot. This is the window for trellis maintenance, re-tying stems, pruning, compost application and light mulching. Frost protection: young plants are most vulnerable; use frost cloth on the first nights after planting, avoid low-lying frost pockets when siting, and do not prune heavily going into winter. Summer rainfall regions must prioritise drainage - raise planting beds 30-40cm, install surface channels, and never allow standing water around the stem base for more than a few hours.`,
  },
];

const c = await mysql.createConnection(process.env.DATABASE_URL);
let inserted = 0, skipped = 0;
try {
  for (const e of entries) {
    const [dupe] = await c.query("SELECT id FROM knowledge_base WHERE title = ? LIMIT 1", [e.title]);
    if (dupe.length) { skipped++; console.log(`skip: ${e.title} (exists)`); continue; }
    await c.query(
      "INSERT INTO knowledge_base (id, title, content, category, tags, is_active, priority) VALUES (?, ?, ?, ?, ?, 1, 80)",
      [crypto.randomUUID(), e.title, e.content, e.category, JSON.stringify(e.tags.split(",").map(t => t.trim()))],
    );
    inserted++;
    console.log(`added: [${e.category}] ${e.title}`);
  }
  const [total] = await c.query("SELECT COUNT(*) n FROM knowledge_base");
  console.log(`\ndone: ${inserted} added, ${skipped} skipped, total ${total[0].n} entries`);
} finally { await c.end(); }
