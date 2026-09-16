/** Official U.S. states, capitals, and postal abbreviations. Public-domain facts. */

export type CensusRegion = "northeast" | "midwest" | "south" | "west";

export type USState = {
  name: string;
  capital: string;
  abbr: string;
  region: CensusRegion;
  /** Extra accepted capital spellings after normalizeGuess(). */
  capitalAlts?: string[];
};

export const CENSUS_REGIONS: { id: CensusRegion | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "northeast", label: "Northeast" },
  { id: "south", label: "South" },
  { id: "midwest", label: "Midwest" },
  { id: "west", label: "West" },
];

/** US Census Bureau regions (50 states; DC is not included). */
export const US_STATES: USState[] = [
  { name: "Alabama", capital: "Montgomery", abbr: "AL", region: "south" },
  { name: "Alaska", capital: "Juneau", abbr: "AK", region: "west" },
  { name: "Arizona", capital: "Phoenix", abbr: "AZ", region: "west" },
  { name: "Arkansas", capital: "Little Rock", abbr: "AR", region: "south" },
  { name: "California", capital: "Sacramento", abbr: "CA", region: "west" },
  { name: "Colorado", capital: "Denver", abbr: "CO", region: "west" },
  { name: "Connecticut", capital: "Hartford", abbr: "CT", region: "northeast" },
  { name: "Delaware", capital: "Dover", abbr: "DE", region: "south" },
  { name: "Florida", capital: "Tallahassee", abbr: "FL", region: "south" },
  { name: "Georgia", capital: "Atlanta", abbr: "GA", region: "south" },
  { name: "Hawaii", capital: "Honolulu", abbr: "HI", region: "west" },
  { name: "Idaho", capital: "Boise", abbr: "ID", region: "west" },
  { name: "Illinois", capital: "Springfield", abbr: "IL", region: "midwest" },
  { name: "Indiana", capital: "Indianapolis", abbr: "IN", region: "midwest" },
  { name: "Iowa", capital: "Des Moines", abbr: "IA", region: "midwest" },
  { name: "Kansas", capital: "Topeka", abbr: "KS", region: "midwest" },
  { name: "Kentucky", capital: "Frankfort", abbr: "KY", region: "south" },
  { name: "Louisiana", capital: "Baton Rouge", abbr: "LA", region: "south" },
  { name: "Maine", capital: "Augusta", abbr: "ME", region: "northeast" },
  { name: "Maryland", capital: "Annapolis", abbr: "MD", region: "south" },
  { name: "Massachusetts", capital: "Boston", abbr: "MA", region: "northeast" },
  { name: "Michigan", capital: "Lansing", abbr: "MI", region: "midwest" },
  {
    name: "Minnesota",
    capital: "Saint Paul",
    abbr: "MN",
    region: "midwest",
    capitalAlts: ["St. Paul", "St Paul"],
  },
  { name: "Mississippi", capital: "Jackson", abbr: "MS", region: "south" },
  { name: "Missouri", capital: "Jefferson City", abbr: "MO", region: "midwest" },
  { name: "Montana", capital: "Helena", abbr: "MT", region: "west" },
  { name: "Nebraska", capital: "Lincoln", abbr: "NE", region: "midwest" },
  { name: "Nevada", capital: "Carson City", abbr: "NV", region: "west" },
  { name: "New Hampshire", capital: "Concord", abbr: "NH", region: "northeast" },
  { name: "New Jersey", capital: "Trenton", abbr: "NJ", region: "northeast" },
  { name: "New Mexico", capital: "Santa Fe", abbr: "NM", region: "west" },
  { name: "New York", capital: "Albany", abbr: "NY", region: "northeast" },
  { name: "North Carolina", capital: "Raleigh", abbr: "NC", region: "south" },
  { name: "North Dakota", capital: "Bismarck", abbr: "ND", region: "midwest" },
  { name: "Ohio", capital: "Columbus", abbr: "OH", region: "midwest" },
  { name: "Oklahoma", capital: "Oklahoma City", abbr: "OK", region: "south" },
  { name: "Oregon", capital: "Salem", abbr: "OR", region: "west" },
  { name: "Pennsylvania", capital: "Harrisburg", abbr: "PA", region: "northeast" },
  { name: "Rhode Island", capital: "Providence", abbr: "RI", region: "northeast" },
  { name: "South Carolina", capital: "Columbia", abbr: "SC", region: "south" },
  { name: "South Dakota", capital: "Pierre", abbr: "SD", region: "midwest" },
  { name: "Tennessee", capital: "Nashville", abbr: "TN", region: "south" },
  { name: "Texas", capital: "Austin", abbr: "TX", region: "south" },
  { name: "Utah", capital: "Salt Lake City", abbr: "UT", region: "west", capitalAlts: ["Salt Lake"] },
  { name: "Vermont", capital: "Montpelier", abbr: "VT", region: "northeast" },
  { name: "Virginia", capital: "Richmond", abbr: "VA", region: "south" },
  { name: "Washington", capital: "Olympia", abbr: "WA", region: "west" },
  { name: "West Virginia", capital: "Charleston", abbr: "WV", region: "south" },
  { name: "Wisconsin", capital: "Madison", abbr: "WI", region: "midwest" },
  { name: "Wyoming", capital: "Cheyenne", abbr: "WY", region: "west" },
];

export type QuizDirection = "capital" | "state";
export type RegionFilter = CensusRegion | "all";

export function statesInRegion(region: RegionFilter): USState[] {
  if (region === "all") return US_STATES;
  return US_STATES.filter((state) => state.region === region);
}

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function normalizeGuess(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(the|city of|state of)\s+/, "")
    .replace(/\s+state$/, "");
}

function compactGuess(value: string): string {
  return normalizeGuess(value).replace(/\s+/g, "");
}

export function acceptedAnswers(
  state: USState,
  direction: QuizDirection,
): string[] {
  if (direction === "capital") {
    return [state.capital, ...(state.capitalAlts ?? [])];
  }
  return [state.name, state.abbr];
}

export function guessMatches(guess: string, accepted: string[]): boolean {
  const folded = normalizeGuess(guess);
  const compact = compactGuess(guess);
  if (!folded) return false;
  return accepted.some((item) => {
    const other = normalizeGuess(item);
    return other === folded || compactGuess(item) === compact;
  });
}

export function pickOptions(
  correct: USState,
  pool: USState[],
  direction: QuizDirection,
  count = 4,
): string[] {
  const label = (state: USState) =>
    direction === "capital" ? state.capital : state.name;
  const source = pool.length >= count ? pool : US_STATES;
  const sameRegion = source.filter(
    (state) => state.abbr !== correct.abbr && state.region === correct.region,
  );
  const otherRegion = source.filter(
    (state) => state.abbr !== correct.abbr && state.region !== correct.region,
  );
  const fillers = [...shuffle(sameRegion), ...shuffle(otherRegion)].slice(
    0,
    count - 1,
  );
  return shuffle([correct, ...fillers].map(label));
}
