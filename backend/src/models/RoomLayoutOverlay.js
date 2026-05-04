const mongoose = require('mongoose');

/**
 * Dev-placed overlay tiles for a specific location.
 * One document per location. Tiles are rendered additively on top of the
 * hardcoded layout in frontend/locations/.
 */
const overlayTileSchema = new mongoose.Schema({
  platformAssetId: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  zIndex: { type: Number, default: 0 }
}, { _id: true });

// Position override for a hardcoded entity defined in frontend/locations/*.
// We only override the positional fields — flow/navigateTo/sounds stay attached
// to the original entity, so clicks in normal mode still trigger its action.
const entityOverrideSchema = new mongoose.Schema({
  entityId: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  zIndex: { type: Number, default: 0 }
}, { _id: false });

const roomLayoutOverlaySchema = new mongoose.Schema({
  locationId: { type: String, required: true, unique: true, index: true },
  tiles: { type: [overlayTileSchema], default: [] },
  entityOverrides: { type: [entityOverrideSchema], default: [] },
  hiddenEntityIds: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('RoomLayoutOverlay', roomLayoutOverlaySchema);
