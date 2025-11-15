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
  "Unstoppable",
  "Vibrant",
  "Fearless",
  "Luminous",
  "Majestic",
  "Cheerful",
  "Dazzling",
  "Gracious",
  "Resilient",
  "Optimistic",
  "Enchanting",
  "Mystical",
  "Energetic",
  "Peaceful",
  "Elegant",
  "Bold",
  "Gentle",
  "Fierce",
  "Wise",
  "Swift",
  "Mighty",
  "Serene",
  "Noble",
  "Zealous",
  "Creative",
  "Loyal",
  "Brave",
  "Kind",
  "Strong",
  "Clever",
  "Joyful"
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
  "Playful",
  "Sparkling",
  "Floating",
  "Twinkling",
  "Shimmering",
  "Soaring",
  "Giggling",
  "Spinning",
  "Flowing",
  "Dreaming",
  "Wandering",
  "Gliding",
  "Prancing",
  "Swirling",
  "Hopping",
  "Swooping",
  "Leaping",
  "Drifting",
  "Fluttering",
  "Skipping",
  "Tumbling",
  "Sliding",
  "Rolling",
  "Jumping",
  "Climbing",
  "Swimming",
  "Flying",
  "Running",
  "Crawling",
  "Sneaking",
  "Pouncing"
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
  "Koala",
  "Firefly",
  "Turtle",
  "Owl",
  "Fox",
  "Whale",
  "Tiger",
  "Panda",
  "Hummingbird",
  "Wolf",
  "Seahorse",
  "Eagle",
  "Bear",
  "Lion",
  "Shark",
  "Falcon",
  "Raven",
  "Swan",
  "Deer",
  "Otter",
  "Lynx",
  "Jaguar",
  "Leopard",
  "Cheetah",
  "Panther",
  "Rabbit",
  "Squirrel",
  "Chipmunk",
  "Hedgehog",
  "Flamingo"
];

export const generateUsername = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const adverb = ADVERBS[Math.floor(Math.random() * ADVERBS.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  
  return `${adjective}${adverb}${noun}`;
};

export const getWordArrays = () => ({
  adjectives: ADJECTIVES,
  adverbs: ADVERBS,
  nouns: NOUNS
});

export const createCustomUsername = (adjective, adverb, noun) => {
  return `${adjective}${adverb}${noun}`;
};

export { ADJECTIVES, ADVERBS, NOUNS };