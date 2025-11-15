// Initialize homestead database with initial collections and indexes

db = db.getSiblingDB('homestead');

// Create collections
db.createCollection('users');
db.createCollection('rooms'); 
db.createCollection('actions');

// Create indexes for better performance
db.users.createIndex({ "googleId": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

db.rooms.createIndex({ "type": 1 });
db.rooms.createIndex({ "owner": 1 });
db.rooms.createIndex({ "isActive": 1 });

db.actions.createIndex({ "actor": 1, "createdAt": -1 });
db.actions.createIndex({ "target": 1, "createdAt": -1 });
db.actions.createIndex({ "type": 1, "createdAt": -1 });

// Insert initial town room
db.rooms.insertOne({
  name: "Town Square",
  description: "The central gathering place for all residents",
  type: "town",
  editors: [],
  moderators: [],
  isLocked: false,
  mapData: {
    items: [
      { id: "welcome-sign", name: "Welcome Sign", x: 200, y: 150, type: "sign" },
      { id: "fountain", name: "Town Fountain", x: 300, y: 200, type: "decoration" },
      { id: "bulletin-board", name: "Community Board", x: 100, y: 100, type: "board" }
    ]
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("Database initialized successfully!");