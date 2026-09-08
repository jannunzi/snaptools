export type SpellingLang = "en" | "es" | "fr";
export type SpellingLevel = "easy" | "medium";

export type SpellingWord = {
  word: string;
  speak: string;
};

export const spellingLanguages: {
  id: SpellingLang;
  label: string;
  locale: string;
}[] = [
  { id: "en", label: "English", locale: "en-US" },
  { id: "es", label: "Spanish", locale: "es-ES" },
  { id: "fr", label: "French", locale: "fr-FR" },
];

export const spellingLists: Record<
  SpellingLang,
  Record<SpellingLevel, SpellingWord[]>
> = {
  en: {
    easy: [
      { word: "cat", speak: "cat" },
      { word: "dog", speak: "dog" },
      { word: "sun", speak: "sun" },
      { word: "book", speak: "book" },
      { word: "fish", speak: "fish" },
      { word: "tree", speak: "tree" },
      { word: "house", speak: "house" },
      { word: "water", speak: "water" },
      { word: "friend", speak: "friend" },
      { word: "school", speak: "school" },
      { word: "happy", speak: "happy" },
      { word: "apple", speak: "apple" },
      { word: "green", speak: "green" },
      { word: "bird", speak: "bird" },
      { word: "play", speak: "play" },
      { word: "rain", speak: "rain" },
      { word: "moon", speak: "moon" },
      { word: "star", speak: "star" },
    ],
    medium: [
      { word: "because", speak: "because" },
      { word: "together", speak: "together" },
      { word: "beautiful", speak: "beautiful" },
      { word: "favorite", speak: "favorite" },
      { word: "important", speak: "important" },
      { word: "yesterday", speak: "yesterday" },
      { word: "animal", speak: "animal" },
      { word: "family", speak: "family" },
      { word: "mountain", speak: "mountain" },
      { word: "weather", speak: "weather" },
      { word: "practice", speak: "practice" },
      { word: "listen", speak: "listen" },
      { word: "garden", speak: "garden" },
      { word: "orange", speak: "orange" },
      { word: "number", speak: "number" },
      { word: "question", speak: "question" },
      { word: "enough", speak: "enough" },
      { word: "through", speak: "through" },
    ],
  },
  es: {
    easy: [
      { word: "casa", speak: "casa" },
      { word: "gato", speak: "gato" },
      { word: "perro", speak: "perro" },
      { word: "sol", speak: "sol" },
      { word: "libro", speak: "libro" },
      { word: "agua", speak: "agua" },
      { word: "amigo", speak: "amigo" },
      { word: "mesa", speak: "mesa" },
      { word: "flor", speak: "flor" },
      { word: "pan", speak: "pan" },
      { word: "leche", speak: "leche" },
      { word: "mano", speak: "mano" },
      { word: "ojo", speak: "ojo" },
      { word: "día", speak: "día" },
      { word: "luna", speak: "luna" },
      { word: "niño", speak: "niño" },
      { word: "rojo", speak: "rojo" },
      { word: "azul", speak: "azul" },
    ],
    medium: [
      { word: "porque", speak: "porque" },
      { word: "también", speak: "también" },
      { word: "familia", speak: "familia" },
      { word: "animal", speak: "animal" },
      { word: "hermoso", speak: "hermoso" },
      { word: "importante", speak: "importante" },
      { word: "tiempo", speak: "tiempo" },
      { word: "montaña", speak: "montaña" },
      { word: "siempre", speak: "siempre" },
      { word: "trabajo", speak: "trabajo" },
      { word: "comida", speak: "comida" },
      { word: "ciudad", speak: "ciudad" },
      { word: "música", speak: "música" },
      { word: "escuela", speak: "escuela" },
      { word: "después", speak: "después" },
      { word: "corazón", speak: "corazón" },
      { word: "árbol", speak: "árbol" },
      { word: "pequeño", speak: "pequeño" },
    ],
  },
  fr: {
    easy: [
      { word: "chat", speak: "chat" },
      { word: "chien", speak: "chien" },
      { word: "soleil", speak: "soleil" },
      { word: "livre", speak: "livre" },
      { word: "eau", speak: "eau" },
      { word: "ami", speak: "ami" },
      { word: "maison", speak: "maison" },
      { word: "pain", speak: "pain" },
      { word: "fleur", speak: "fleur" },
      { word: "main", speak: "main" },
      { word: "jour", speak: "jour" },
      { word: "nuit", speak: "nuit" },
      { word: "mer", speak: "mer" },
      { word: "pomme", speak: "pomme" },
      { word: "lune", speak: "lune" },
      { word: "école", speak: "école" },
      { word: "bleu", speak: "bleu" },
      { word: "rouge", speak: "rouge" },
    ],
    medium: [
      { word: "famille", speak: "famille" },
      { word: "animal", speak: "animal" },
      { word: "toujours", speak: "toujours" },
      { word: "montagne", speak: "montagne" },
      { word: "important", speak: "important" },
      { word: "musique", speak: "musique" },
      { word: "couleur", speak: "couleur" },
      { word: "jardin", speak: "jardin" },
      { word: "travail", speak: "travail" },
      { word: "ville", speak: "ville" },
      { word: "temps", speak: "temps" },
      { word: "beaucoup", speak: "beaucoup" },
      { word: "parce que", speak: "parce que" },
      { word: "encore", speak: "encore" },
      { word: "bonjour", speak: "bonjour" },
      { word: "merci", speak: "merci" },
      { word: "oiseau", speak: "oiseau" },
      { word: "fenêtre", speak: "fenêtre" },
    ],
  },
};

export function normalizeSpelling(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z]/gi, "")
    .toLowerCase();
}
