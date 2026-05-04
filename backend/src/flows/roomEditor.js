const mongoose = require('mongoose');
const RoomLayoutOverlay = require('../models/RoomLayoutOverlay');
const Account = require('../models/Account');
const { isDeveloper } = require('../middleware/permissions');

const isValidId = (v) => typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

async function accountFromSession(sessionId) {
  if (!sessionId) return null;
  return Account.findOne({ 'activeSessions.sessionId': sessionId });
}

async function requireDeveloper(sessionId) {
  const account = await accountFromSession(sessionId);
  if (!account) return { ok: false, error: 'Not authenticated' };
  if (!isDeveloper(account)) return { ok: false, error: 'Permission denied: requires developer' };
  return { ok: true, account };
}

async function getOrCreateOverlay(locationId) {
  let overlay = await RoomLayoutOverlay.findOne({ locationId });
  if (!overlay) {
    overlay = await RoomLayoutOverlay.create({ locationId, tiles: [] });
  }
  return overlay;
}

function tileToObject(t) {
  return {
    _id: t._id.toString(),
    platformAssetId: t.platformAssetId,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    zIndex: t.zIndex || 0
  };
}

module.exports = {
  name: 'roomEditor',

  handlers: {
    'room-editor:get-overlay': {
      validate: (data) => {
        if (!data.locationId) return { valid: false, error: 'Missing locationId' };
        return { valid: true };
      },
      handler: async (data) => {
        const overlay = await RoomLayoutOverlay.findOne({ locationId: data.locationId }).lean();
        const tiles = overlay ? overlay.tiles.map(t => ({
          _id: t._id.toString(),
          platformAssetId: t.platformAssetId,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          zIndex: t.zIndex || 0
        })) : [];
        const entityOverrides = overlay ? (overlay.entityOverrides || []).map(o => ({
          entityId: o.entityId, x: o.x, y: o.y, width: o.width, height: o.height, zIndex: o.zIndex || 0
        })) : [];
        const hiddenEntityIds = overlay ? (overlay.hiddenEntityIds || []) : [];
        return { success: true, data: { tiles, entityOverrides, hiddenEntityIds } };
      }
    },

    'room-editor:place-tile': {
      validate: (data) => {
        if (!data.locationId) return { valid: false, error: 'Missing locationId' };
        if (!data.platformAssetId) return { valid: false, error: 'Missing platformAssetId' };
        if (typeof data.x !== 'number' || typeof data.y !== 'number') {
          return { valid: false, error: 'Missing x/y' };
        }
        if (typeof data.width !== 'number' || typeof data.height !== 'number') {
          return { valid: false, error: 'Missing width/height' };
        }
        return { valid: true };
      },
      handler: async (data) => {
        const auth = await requireDeveloper(data.sessionId);
        if (!auth.ok) return { success: false, error: auth.error };

        const overlay = await getOrCreateOverlay(data.locationId);
        overlay.tiles.push({
          platformAssetId: data.platformAssetId,
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          zIndex: typeof data.zIndex === 'number' ? data.zIndex : 0
        });
        await overlay.save();
        const created = overlay.tiles[overlay.tiles.length - 1];
        return { success: true, data: { tile: tileToObject(created) } };
      }
    },

    'room-editor:move-tile': {
      validate: (data) => {
        if (!data.locationId) return { valid: false, error: 'Missing locationId' };
        if (!isValidId(data.tileId)) return { valid: false, error: 'Invalid tileId' };
        if (typeof data.x !== 'number' || typeof data.y !== 'number') {
          return { valid: false, error: 'Missing x/y' };
        }
        return { valid: true };
      },
      handler: async (data) => {
        const auth = await requireDeveloper(data.sessionId);
        if (!auth.ok) return { success: false, error: auth.error };

        const overlay = await RoomLayoutOverlay.findOne({ locationId: data.locationId });
        if (!overlay) return { success: false, error: 'Overlay not found' };
        const tile = overlay.tiles.id(data.tileId);
        if (!tile) return { success: false, error: 'Tile not found' };
        tile.x = data.x;
        tile.y = data.y;
        if (typeof data.zIndex === 'number') tile.zIndex = data.zIndex;
        await overlay.save();
        return { success: true, data: { tile: tileToObject(tile) } };
      }
    },

    'room-editor:set-overlay': {
      validate: (data) => {
        if (!data.locationId) return { valid: false, error: 'Missing locationId' };
        if (!Array.isArray(data.tiles)) return { valid: false, error: 'tiles must be an array' };
        return { valid: true };
      },
      handler: async (data) => {
        const auth = await requireDeveloper(data.sessionId);
        if (!auth.ok) return { success: false, error: auth.error };

        const overlay = await getOrCreateOverlay(data.locationId);
        // Replace tiles wholesale; reissue _ids.
        overlay.tiles = data.tiles.map(t => ({
          platformAssetId: t.platformAssetId,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          zIndex: typeof t.zIndex === 'number' ? t.zIndex : 0
        }));
        // Optionally replace overrides + hidden too (used by undo to restore full snapshots).
        if (Array.isArray(data.entityOverrides)) {
          overlay.entityOverrides = data.entityOverrides.map(o => ({
            entityId: o.entityId, x: o.x, y: o.y, width: o.width, height: o.height, zIndex: o.zIndex || 0
          }));
        }
        if (Array.isArray(data.hiddenEntityIds)) {
          overlay.hiddenEntityIds = data.hiddenEntityIds.slice();
        }
        await overlay.save();
        return {
          success: true,
          data: {
            tiles: overlay.tiles.map(tileToObject),
            entityOverrides: (overlay.entityOverrides || []).map(o => ({
              entityId: o.entityId, x: o.x, y: o.y, width: o.width, height: o.height, zIndex: o.zIndex || 0
            })),
            hiddenEntityIds: overlay.hiddenEntityIds || []
          }
        };
      }
    },

    'room-editor:set-entity-override': {
      validate: (data) => {
        if (!data.locationId) return { valid: false, error: 'Missing locationId' };
        if (!data.entityId) return { valid: false, error: 'Missing entityId' };
        if (typeof data.x !== 'number' || typeof data.y !== 'number') return { valid: false, error: 'Missing x/y' };
        if (typeof data.width !== 'number' || typeof data.height !== 'number') return { valid: false, error: 'Missing width/height' };
        return { valid: true };
      },
      handler: async (data) => {
        const auth = await requireDeveloper(data.sessionId);
        if (!auth.ok) return { success: false, error: auth.error };

        const overlay = await getOrCreateOverlay(data.locationId);
        const idx = overlay.entityOverrides.findIndex(o => o.entityId === data.entityId);
        const next = {
          entityId: data.entityId,
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          zIndex: typeof data.zIndex === 'number' ? data.zIndex : 0
        };
        if (idx >= 0) overlay.entityOverrides[idx] = next;
        else overlay.entityOverrides.push(next);
        await overlay.save();
        return { success: true, data: { override: next } };
      }
    },

    'room-editor:hide-entity': {
      validate: (data) => {
        if (!data.locationId) return { valid: false, error: 'Missing locationId' };
        if (!data.entityId) return { valid: false, error: 'Missing entityId' };
        return { valid: true };
      },
      handler: async (data) => {
        const auth = await requireDeveloper(data.sessionId);
        if (!auth.ok) return { success: false, error: auth.error };

        const overlay = await getOrCreateOverlay(data.locationId);
        if (!overlay.hiddenEntityIds.includes(data.entityId)) {
          overlay.hiddenEntityIds.push(data.entityId);
          await overlay.save();
        }
        return { success: true, data: { entityId: data.entityId } };
      }
    },

    'room-editor:unhide-entity': {
      validate: (data) => {
        if (!data.locationId) return { valid: false, error: 'Missing locationId' };
        if (!data.entityId) return { valid: false, error: 'Missing entityId' };
        return { valid: true };
      },
      handler: async (data) => {
        const auth = await requireDeveloper(data.sessionId);
        if (!auth.ok) return { success: false, error: auth.error };

        const overlay = await getOrCreateOverlay(data.locationId);
        overlay.hiddenEntityIds = overlay.hiddenEntityIds.filter(id => id !== data.entityId);
        await overlay.save();
        return { success: true, data: { entityId: data.entityId } };
      }
    },

    'room-editor:delete-tile': {
      validate: (data) => {
        if (!data.locationId) return { valid: false, error: 'Missing locationId' };
        if (!isValidId(data.tileId)) return { valid: false, error: 'Invalid tileId' };
        return { valid: true };
      },
      handler: async (data) => {
        const auth = await requireDeveloper(data.sessionId);
        if (!auth.ok) return { success: false, error: auth.error };

        const overlay = await RoomLayoutOverlay.findOne({ locationId: data.locationId });
        if (!overlay) return { success: false, error: 'Overlay not found' };
        const tile = overlay.tiles.id(data.tileId);
        if (!tile) return { success: false, error: 'Tile not found' };
        tile.deleteOne();
        await overlay.save();
        return { success: true, data: { tileId: data.tileId } };
      }
    }
  }
};
