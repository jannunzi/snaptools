/** First Communion prep content — standard US Catholic wording for ~Grade 2. */

export function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function pickFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function pickN<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, Math.min(count, items.length));
}

export type PrayerId =
  | "our-father"
  | "hail-mary"
  | "glory-be"
  | "act-of-contrition";

export type Prayer = {
  id: PrayerId;
  title: string;
  alsoCalled?: string;
  lines: string[];
  blanks: PrayerBlank[];
};

export type PrayerBlank = {
  id: string;
  word: string;
  before: string;
  after: string;
  options: string[];
};

export const PRAYERS: Prayer[] = [
  {
    id: "our-father",
    title: "Our Father",
    alsoCalled: "The Lord’s Prayer",
    lines: [
      "Our Father, who art in heaven, hallowed be thy name;",
      "thy kingdom come; thy will be done on earth as it is in heaven.",
      "Give us this day our daily bread;",
      "and forgive us our trespasses as we forgive those who trespass against us;",
      "and lead us not into temptation, but deliver us from evil.",
      "Amen.",
    ],
    blanks: [
      blank("of-father", "Father", "Our ", ", who art in heaven,", [
        "Father",
        "Brother",
        "Teacher",
        "Neighbor",
      ]),
      blank("of-heaven", "heaven", "Our Father, who art in ", ",", [
        "heaven",
        "town",
        "school",
        "church",
      ]),
      blank("of-hallowed", "hallowed", "", " be thy name;", [
        "hallowed",
        "hidden",
        "hurried",
        "heavy",
      ]),
      blank("of-kingdom", "kingdom", "thy ", " come;", [
        "kingdom",
        "castle",
        "lesson",
        "garden",
      ]),
      blank("of-bread", "bread", "Give us this day our daily ", ";", [
        "bread",
        "games",
        "coins",
        "stories",
      ]),
      blank("of-trespasses", "trespasses", "and forgive us our ", ";", [
        "trespasses",
        "presents",
        "lessons",
        "neighbors",
      ]),
      blank("of-temptation", "temptation", "and lead us not into ", ",", [
        "temptation",
        "recess",
        "silence",
        "winter",
      ]),
      blank("of-evil", "evil", "but deliver us from ", ".", [
        "evil",
        "evening",
        "everyone",
        "everywhere",
      ]),
    ],
  },
  {
    id: "hail-mary",
    title: "Hail Mary",
    lines: [
      "Hail Mary, full of grace, the Lord is with thee;",
      "blessed art thou among women, and blessed is the fruit of thy womb, Jesus.",
      "Holy Mary, Mother of God, pray for us sinners,",
      "now and at the hour of our death. Amen.",
    ],
    blanks: [
      blank("hm-grace", "grace", "Hail Mary, full of ", ",", [
        "grace",
        "gold",
        "glory",
        "grapes",
      ]),
      blank("hm-lord", "Lord", "the ", " is with thee;", [
        "Lord",
        "choir",
        "crowd",
        "letter",
      ]),
      blank("hm-women", "women", "blessed art thou among ", ",", [
        "women",
        "windows",
        "words",
        "worlds",
      ]),
      blank("hm-jesus", "Jesus", "the fruit of thy womb, ", ".", [
        "Jesus",
        "Joseph",
        "John",
        "James",
      ]),
      blank("hm-mother", "Mother", "Holy Mary, ", " of God,", [
        "Mother",
        "Sister",
        "Teacher",
        "Neighbor",
      ]),
      blank("hm-sinners", "sinners", "pray for us ", ",", [
        "sinners",
        "singers",
        "soldiers",
        "students",
      ]),
      blank("hm-death", "death", "now and at the hour of our ", ".", [
        "death",
        "dinner",
        "desk",
        "dream",
      ]),
    ],
  },
  {
    id: "glory-be",
    title: "Glory Be",
    alsoCalled: "The Doxology",
    lines: [
      "Glory be to the Father, and to the Son, and to the Holy Spirit,",
      "as it was in the beginning,",
      "is now, and ever shall be, world without end.",
      "Amen.",
    ],
    blanks: [
      blank("gb-father", "Father", "Glory be to the ", ",", [
        "Father",
        "garden",
        "family",
        "feast",
      ]),
      blank("gb-son", "Son", "and to the ", ",", ["Son", "sun", "song", "sand"]),
      blank("gb-spirit", "Spirit", "and to the Holy ", ",", [
        "Spirit",
        "Story",
        "Season",
        "School",
      ]),
      blank("gb-beginning", "beginning", "as it was in the ", ",", [
        "beginning",
        "building",
        "bedroom",
        "basket",
      ]),
      blank("gb-ever", "ever", "is now, and ", " shall be,", [
        "ever",
        "early",
        "easy",
        "empty",
      ]),
      blank("gb-world", "world", "", " without end.", [
        "world",
        "word",
        "work",
        "week",
      ]),
    ],
  },
  {
    id: "act-of-contrition",
    title: "Act of Contrition",
    alsoCalled: "A prayer of sorrow",
    lines: [
      "My God, I am sorry for my sins with all my heart.",
      "In choosing to do wrong and failing to do good, I have sinned against you whom I should love above all things.",
      "I firmly intend, with your help, to do penance, to sin no more, and to avoid whatever leads me to sin.",
      "Our Savior Jesus Christ suffered and died for us.",
      "In his name, my God, have mercy.",
    ],
    blanks: [
      blank("ac-sorry", "sorry", "My God, I am ", " for my sins", [
        "sorry",
        "sleepy",
        "silent",
        "sunny",
      ]),
      blank("ac-sins", "sins", "I am sorry for my ", " with all my heart.", [
        "sins",
        "songs",
        "shoes",
        "stories",
      ]),
      blank("ac-heart", "heart", "with all my ", ".", [
        "heart",
        "hands",
        "house",
        "homework",
      ]),
      blank("ac-love", "love", "you whom I should ", " above all things.", [
        "love",
        "leave",
        "list",
        "lend",
      ]),
      blank("ac-penance", "penance", "to do ", ", to sin no more,", [
        "penance",
        "puzzles",
        "parties",
        "projects",
      ]),
      blank("ac-savior", "Savior", "Our ", " Jesus Christ suffered and died for us.", [
        "Savior",
        "Soldier",
        "Singer",
        "Scholar",
      ]),
      blank("ac-mercy", "mercy", "In his name, my God, have ", ".", [
        "mercy",
        "music",
        "money",
        "maps",
      ]),
    ],
  },
];

function blank(
  id: string,
  word: string,
  before: string,
  after: string,
  options: string[],
): PrayerBlank {
  return { id, word, before, after, options };
}

export function getPrayer(id: PrayerId) {
  return PRAYERS.find((prayer) => prayer.id === id) ?? PRAYERS[0];
}

export type FaithQuestion = {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
};

const MASS_PARTS = [
  "Introductory Rites",
  "Liturgy of the Word",
  "Liturgy of the Eucharist",
  "Concluding Rites",
] as const;

function massQ(
  id: string,
  topic: string,
  prompt: string,
  answer: string,
  extras: string[],
  explain: string,
): FaithQuestion {
  return {
    id,
    topic,
    prompt,
    options: [answer, ...extras],
    answer,
    explain,
  };
}

export const MASS_CHOICE_QUESTIONS: FaithQuestion[] = [
  massQ(
    "mass-first",
    "Order",
    "Which part of Mass comes first?",
    "Introductory Rites",
    ["Liturgy of the Word", "Liturgy of the Eucharist", "Concluding Rites"],
    "We begin by gathering, making the Sign of the Cross, and preparing our hearts.",
  ),
  massQ(
    "mass-second",
    "Order",
    "Which part of Mass comes second?",
    "Liturgy of the Word",
    ["Introductory Rites", "Liturgy of the Eucharist", "Concluding Rites"],
    "After we gather, we listen to God’s Word.",
  ),
  massQ(
    "mass-third",
    "Order",
    "Which part of Mass comes third?",
    "Liturgy of the Eucharist",
    ["Introductory Rites", "Liturgy of the Word", "Concluding Rites"],
    "Then we give thanks. Bread and wine become Jesus, and we may receive Holy Communion.",
  ),
  massQ(
    "mass-last",
    "Order",
    "Which part of Mass comes last?",
    "Concluding Rites",
    ["Introductory Rites", "Liturgy of the Word", "Liturgy of the Eucharist"],
    "We receive a blessing and are sent out to love and serve.",
  ),
  massQ(
    "mass-sign-cross",
    "Introductory Rites",
    "When do we usually make the Sign of the Cross together at the start of Mass?",
    "Introductory Rites",
    ["Liturgy of the Word", "Liturgy of the Eucharist", "Concluding Rites"],
    "Mass begins In the name of the Father, and of the Son, and of the Holy Spirit.",
  ),
  massQ(
    "mass-sorry",
    "Introductory Rites",
    "When do we tell God we are sorry at the beginning of Mass?",
    "Introductory Rites",
    ["Liturgy of the Word", "Liturgy of the Eucharist", "Concluding Rites"],
    "In the Penitential Act we ask God to forgive us so we can celebrate with a clean heart.",
  ),
  massQ(
    "mass-gospel",
    "Liturgy of the Word",
    "When do we stand to hear the Gospel — the good news of Jesus?",
    "Liturgy of the Word",
    ["Introductory Rites", "Liturgy of the Eucharist", "Concluding Rites"],
    "The Gospel is a reading from Matthew, Mark, Luke, or John.",
  ),
  massQ(
    "mass-homily",
    "Liturgy of the Word",
    "What is the Homily?",
    "The priest or deacon explains the readings",
    [
      "The last blessing of Mass",
      "When we bring up the gifts of bread and wine",
      "When we say “Go in peace”",
    ],
    "After the Gospel, the Homily helps us understand God’s Word and live it.",
  ),
  massQ(
    "mass-homily-part",
    "Liturgy of the Word",
    "The Homily belongs to which part of Mass?",
    "Liturgy of the Word",
    ["Introductory Rites", "Liturgy of the Eucharist", "Concluding Rites"],
    "The Homily follows the Gospel, while we are still listening to God’s Word.",
  ),
  massQ(
    "mass-consecration",
    "Liturgy of the Eucharist",
    "When do the bread and wine become the Body and Blood of Jesus?",
    "At the Consecration",
    [
      "During the Homily",
      "At the Sign of Peace",
      "When we leave church",
    ],
    "The priest says the words of Jesus: “This is my Body” and “This is my Blood.”",
  ),
  massQ(
    "mass-consecration-part",
    "Liturgy of the Eucharist",
    "The Consecration belongs to which part of Mass?",
    "Liturgy of the Eucharist",
    ["Introductory Rites", "Liturgy of the Word", "Concluding Rites"],
    "The Consecration is the heart of the Liturgy of the Eucharist.",
  ),
  massQ(
    "mass-peace",
    "Liturgy of the Eucharist",
    "What do we do at the Sign of Peace?",
    "We offer peace to the people near us",
    [
      "We hear the first Bible reading",
      "We make the Sign of the Cross to begin Mass",
      "We are sent out the church doors",
    ],
    "We share Christ’s peace before Holy Communion.",
  ),
  massQ(
    "mass-peace-part",
    "Liturgy of the Eucharist",
    "The Sign of Peace belongs to which part of Mass?",
    "Liturgy of the Eucharist",
    ["Introductory Rites", "Liturgy of the Word", "Concluding Rites"],
    "The Sign of Peace comes before we receive Holy Communion.",
  ),
  massQ(
    "mass-communion",
    "Liturgy of the Eucharist",
    "When do we receive Jesus in Holy Communion?",
    "Liturgy of the Eucharist",
    ["Introductory Rites", "Liturgy of the Word", "Concluding Rites"],
    "After the Consecration, those who are ready may receive the Body of Christ.",
  ),
  massQ(
    "mass-communion-what",
    "Liturgy of the Eucharist",
    "What is Holy Communion?",
    "Receiving Jesus — his Body and Blood",
    [
      "A song at the start of Mass",
      "The Homily about the Gospel",
      "The blessing at the end of Mass",
    ],
    "In Holy Communion we receive Jesus himself, not just bread.",
  ),
  massQ(
    "mass-dismissal",
    "Concluding Rites",
    "What happens at the Dismissal?",
    "We are sent out to love and serve the Lord",
    [
      "We hear the Gospel reading",
      "The bread and wine become Jesus",
      "We say we are sorry at the start",
    ],
    "The priest or deacon sends us forth — often with “Go in peace.”",
  ),
  massQ(
    "mass-blessing",
    "Concluding Rites",
    "When do we receive the final blessing of Mass?",
    "Concluding Rites",
    ["Introductory Rites", "Liturgy of the Word", "Liturgy of the Eucharist"],
    "The priest blesses us, then we are dismissed.",
  ),
  massQ(
    "mass-listen",
    "Liturgy of the Word",
    "What do we do in the Liturgy of the Word?",
    "We listen to readings from the Bible",
    [
      "We receive Holy Communion",
      "We are sent out the doors",
      "We bring up only the collection",
    ],
    "We hear readings, a psalm, the Gospel, and the Homily.",
  ),
  massQ(
    "mass-gifts",
    "Liturgy of the Eucharist",
    "Bread and wine are brought to the altar in which part of Mass?",
    "Liturgy of the Eucharist",
    ["Introductory Rites", "Liturgy of the Word", "Concluding Rites"],
    "These gifts will become the Body and Blood of Christ.",
  ),
];

export const MASS_MATCH_QUESTIONS: FaithQuestion[] = [
  ["The Gospel", "Liturgy of the Word", "We stand to hear the good news of Jesus."],
  ["The Homily", "Liturgy of the Word", "The priest or deacon helps us understand the readings."],
  ["The Consecration", "Liturgy of the Eucharist", "Bread and wine become the Body and Blood of Jesus."],
  ["The Sign of Peace", "Liturgy of the Eucharist", "We offer Christ’s peace before Communion."],
  ["Holy Communion", "Liturgy of the Eucharist", "We receive Jesus with reverence."],
  ["The Dismissal", "Concluding Rites", "We are sent out to love and serve."],
  ["The Sign of the Cross at the start", "Introductory Rites", "Mass begins in the name of the Father, Son, and Holy Spirit."],
  ["“Lord, have mercy” / I confess", "Introductory Rites", "We ask God to forgive us as Mass begins."],
  ["The final blessing", "Concluding Rites", "The priest blesses us before we go."],
  ["The first reading from the Bible", "Liturgy of the Word", "We sit and listen to God’s Word."],
].map(([moment, part, explain], index) => ({
  id: `match-${index + 1}`,
  topic: "Match",
  prompt: `Which part of Mass includes this? ${moment}`,
  options: [...MASS_PARTS],
  answer: part,
  explain,
}));

export const MASS_PART_ORDER = [...MASS_PARTS];

function eucharistQ(
  id: string,
  topic: string,
  prompt: string,
  answer: string,
  extras: string[],
  explain: string,
): FaithQuestion {
  return {
    id,
    topic,
    prompt,
    options: [answer, ...extras],
    answer,
    explain,
  };
}

export const EUCHARIST_QUESTIONS: FaithQuestion[] = [
  eucharistQ(
    "eu-what",
    "The Eucharist",
    "What is the Eucharist?",
    "The Body and Blood of Jesus Christ",
    [
      "Only a picture of bread",
      "A song we sing at Mass",
      "The collection basket",
    ],
    "The Eucharist is Jesus himself — truly present, Body and Blood.",
  ),
  eucharistQ(
    "eu-gifts",
    "Bread and wine",
    "What gifts become Jesus at Mass?",
    "Bread and wine",
    ["Water and oil", "Flowers and candles", "Coins and books"],
    "The priest offers bread and wine. By the Holy Spirit they become Christ’s Body and Blood.",
  ),
  eucharistQ(
    "eu-when",
    "Consecration",
    "When do the bread and wine become the Body and Blood of Jesus?",
    "At the Consecration",
    [
      "When we enter the church",
      "During the first song",
      "After we go home",
    ],
    "The priest says the words of Jesus: “This is my Body” and “This is my Blood.”",
  ),
  eucharistQ(
    "eu-words",
    "Consecration",
    "Which words does the priest say over the bread, as Jesus said?",
    "This is my Body",
    [
      "This is only bread",
      "This is a story",
      "This is my classroom",
    ],
    "Jesus said these words at the Last Supper. The Church says them at every Mass.",
  ),
  eucharistQ(
    "eu-real",
    "Real Presence",
    "After the Consecration, is the Host still only bread?",
    "No. Jesus is truly there.",
    [
      "Yes. It is only a symbol.",
      "Yes. It is only a snack.",
      "It is only a picture of Jesus.",
    ],
    "Catholics believe Jesus is really present — not just a reminder.",
  ),
  eucharistQ(
    "eu-receive",
    "Holy Communion",
    "What are we doing when we receive Holy Communion?",
    "Receiving Jesus",
    [
      "Getting a prize for sitting still",
      "Taking a snack for later",
      "Collecting the hymnals",
    ],
    "Holy Communion is receiving Jesus with love and reverence.",
  ),
  eucharistQ(
    "eu-amen",
    "Reverence",
    "What do we say when the minister says, “The Body of Christ”?",
    "Amen",
    ["Hello", "Thank you later", "Goodbye"],
    "Amen means “Yes, I believe.” We say it with care.",
  ),
  eucharistQ(
    "eu-baptized",
    "Who may receive",
    "What sacrament do we receive before First Communion?",
    "Baptism",
    ["Matrimony", "Holy Orders", "Anointing of the Sick"],
    "We are baptized first. Then we prepare to receive Jesus in the Eucharist.",
  ),
  eucharistQ(
    "eu-who",
    "Who may receive",
    "Who is First Communion for?",
    "Baptized Catholics who have prepared",
    [
      "Anyone walking past the church",
      "Only the priest’s family",
      "Only grown-ups",
    ],
    "Children who are baptized and have learned what the Eucharist is may receive when they are ready.",
  ),
  eucharistQ(
    "eu-grace",
    "State of grace",
    "If I have done something very serious and wrong on purpose, what should I do before Communion?",
    "Go to Confession first",
    [
      "Hide in the pew",
      "Eat a bigger breakfast",
      "Skip saying Amen",
    ],
    "We should be friends with God. Confession heals a serious break so we can receive Jesus well.",
  ),
  eucharistQ(
    "eu-fast",
    "Fasting",
    "How do we keep the Communion fast in a simple way?",
    "No food or drink for about one hour, except water and medicine",
    [
      "No water all day",
      "Skip dinner the night before",
      "Eat extra candy in the car",
    ],
    "The Church asks about one hour. Water and medicine are okay. A parent can help you remember.",
  ),
  eucharistQ(
    "eu-reverence",
    "Reverence",
    "How should we come up to receive Jesus?",
    "Quietly, with a bow, and our hands ready",
    [
      "Running and talking loudly",
      "Playing a game on the way",
      "Chewing gum",
    ],
    "We treat Jesus with love: walk calmly, bow, say Amen, and receive carefully.",
  ),
  eucharistQ(
    "eu-after",
    "Reverence",
    "What should we do after we receive Holy Communion?",
    "Return to the pew and thank Jesus quietly",
    [
      "Leave church right away to talk",
      "Wave the Host like a toy",
      "Ask for a second snack",
    ],
    "This is a special time to talk to Jesus in our hearts.",
  ),
  eucharistQ(
    "eu-why",
    "Love of Jesus",
    "Why do we receive the Eucharist?",
    "To receive Jesus and grow closer to him",
    [
      "To finish Mass faster",
      "To show we can stand in line",
      "To collect pretty cards",
    ],
    "Jesus gives himself to us so we can love God and other people more.",
  ),
  eucharistQ(
    "eu-first",
    "First Communion",
    "What is First Holy Communion?",
    "The first time we receive Jesus in the Eucharist",
    [
      "The first time we go to any church",
      "The first Bible we own",
      "The first time we sing a hymn",
    ],
    "After we prepare, we receive Jesus for the first time with our parish family.",
  ),
  eucharistQ(
    "eu-priest",
    "The priest",
    "Who consecrates the bread and wine at Mass?",
    "The priest, by the power of the Holy Spirit",
    [
      "The choir director",
      "The ushers",
      "Anyone who brings a gift",
    ],
    "Jesus works through the priest. The Holy Spirit makes Christ present.",
  ),
  eucharistQ(
    "eu-host",
    "Reverence",
    "If the Host is offered in the hand, what do we do?",
    "Make a throne with our hands, then receive and consume it at once",
    [
      "Put it in a pocket for later",
      "Break it to share with a friend",
      "Set it on the pew",
    ],
    "We receive Jesus, then eat the Host right away. We never take it away from church.",
  ),
  eucharistQ(
    "eu-sacrament",
    "The Eucharist",
    "The Eucharist is which kind of gift of the Church?",
    "A sacrament — Jesus giving himself to us",
    [
      "A classroom rule",
      "A parish fundraiser",
      "A holiday decoration",
    ],
    "The Eucharist is a sacrament of Jesus’ love. He is really with us.",
  ),
];

export function nextQuestion(
  pool: readonly FaithQuestion[],
  lastId?: string,
): FaithQuestion {
  const choices = pool.length > 1 ? pool.filter((item) => item.id !== lastId) : pool;
  const pick = pickFrom(choices);
  return { ...pick, options: shuffle(pick.options) };
}

export function dealQuestions(
  pool: readonly FaithQuestion[],
  count: number,
): FaithQuestion[] {
  return pickN(pool, count).map((item) => ({
    ...item,
    options: shuffle(item.options),
  }));
}
