// activities-demo-temp — temporary `text` collection for the activities-demo
// page. Stores keyed blobs of copy (intro, instructions). Remove this model
// when the demo is retired.
const mongoose = require('mongoose');

const demoTextSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  content: { type: String, required: true },
  version: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DemoText', demoTextSchema, 'text');
