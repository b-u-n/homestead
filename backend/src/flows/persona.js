const Persona = require('../models/Persona');
const Account = require('../models/Account');
const personasConfig = require('../config/personas');

async function accountFromSession(sessionId) {
  if (!sessionId) return null;
  return Account.findOne({ 'activeSessions.sessionId': sessionId });
}

async function getOrCreatePersona(accountId) {
  let persona = await Persona.findOne({ accountId });
  if (!persona) {
    persona = await Persona.create({ accountId });
  }
  return persona;
}

module.exports = {
  name: 'persona',

  handlers: {
    'persona:get': {
      validate: () => ({ valid: true }),
      handler: async (data) => {
        const { sessionId } = data;
        const account = await accountFromSession(sessionId);
        if (!account) {
          return { success: true, data: { currentPersonaId: 'neutral', availablePersonaIds: personasConfig.map(p => p.id) } };
        }
        const persona = await getOrCreatePersona(account._id);
        return {
          success: true,
          data: {
            currentPersonaId: persona.currentPersonaId,
            availablePersonaIds: persona.availablePersonaIds
          }
        };
      }
    },

    'persona:set': {
      validate: (data) => {
        const { sessionId, personaId } = data;
        if (!sessionId) return { valid: false, error: 'Missing sessionId' };
        if (!personaId) return { valid: false, error: 'Missing personaId' };
        if (!personasConfig.find(p => p.id === personaId)) return { valid: false, error: 'Unknown personaId' };
        return { valid: true };
      },
      handler: async (data) => {
        const { sessionId, personaId } = data;
        const account = await accountFromSession(sessionId);
        if (!account) return { success: false, error: 'No account for session' };

        const persona = await getOrCreatePersona(account._id);
        persona.currentPersonaId = personaId;
        await persona.save();

        return {
          success: true,
          data: {
            currentPersonaId: persona.currentPersonaId,
            availablePersonaIds: persona.availablePersonaIds
          }
        };
      }
    },

    'persona:list': {
      validate: () => ({ valid: true }),
      handler: async () => {
        return { success: true, data: personasConfig };
      }
    }
  }
};
