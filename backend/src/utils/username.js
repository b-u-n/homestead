const ADJECTIVES = [
  "Empowering",
  "Successful", 
  "Delighted",
  "Brilliant",
  "Courageous",
  "Inspiring",
  "Radiant",
  "Triumphant",
  "Magnificent",
  "Unstoppable"
];

const ADVERBS = [
  "Cute",
  "Harmonized",
  "Fidgeting",
  "Graceful",
  "Bouncing",
  "Glowing",
  "Dancing",
  "Whimsical",
  "Serene",
  "Playful"
];

const NOUNS = [
  "Narwhal",
  "Bunny",
  "Octopus",
  "Phoenix",
  "Penguin",
  "Dolphin",
  "Unicorn",
  "Butterfly",
  "Dragon",
  "Koala"
];

const generateUsername = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const adverb = ADVERBS[Math.floor(Math.random() * ADVERBS.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  
  return `${adjective}${adverb}${noun}`;
};

const getWordArrays = () => ({
  adjectives: ADJECTIVES,
  adverbs: ADVERBS,
  nouns: NOUNS
});

const createCustomUsername = (adjective, adverb, noun) => {
  return `${adjective}${adverb}${noun}`;
};

module.exports = {
  generateUsername,
  getWordArrays,
  createCustomUsername,
  ADJECTIVES,
  ADVERBS,
  NOUNS
};