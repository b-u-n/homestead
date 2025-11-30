/**
 * Seed script for initial layers
 * Run with: node src/seeds/layers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Layer = require('../models/Layer');

const layers = [
  {
    name: 'Hopeful',
    description: 'A bright and optimistic layer for positive vibes',
    order: 1,
    isDefault: true,
    isActive: true,
    maxPlayers: 0 // Unlimited
  },
  {
    name: 'Quiet',
    description: 'A peaceful layer for those who prefer solitude',
    order: 2,
    isDefault: false,
    isActive: true,
    maxPlayers: 0 // Unlimited
  }
];

async function seedLayers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const layerData of layers) {
      const existing = await Layer.findOne({ name: layerData.name });
      if (existing) {
        console.log(`Layer "${layerData.name}" already exists, skipping...`);
      } else {
        const layer = new Layer(layerData);
        await layer.save();
        console.log(`Created layer: ${layerData.name}`);
      }
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding layers:', error);
    process.exit(1);
  }
}

seedLayers();
