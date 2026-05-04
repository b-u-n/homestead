/**
 * Persona definitions for conversational mode.
 * Stored statically; each user has a `currentPersonaId` that selects from this list.
 */
module.exports = [
  {
    id: 'neutral',
    label: 'Neutral',
    description: 'Calm and balanced — neither warm nor brisk.',
    voiceHints: { tone: 'neutral', pacing: 'measured' }
  },
  {
    id: 'warm',
    label: 'Warm',
    description: 'Soft, encouraging, and validating.',
    voiceHints: { tone: 'warm', pacing: 'gentle' }
  },
  {
    id: 'brisk',
    label: 'Brisk',
    description: 'Direct and efficient — gets to the point.',
    voiceHints: { tone: 'brisk', pacing: 'quick' }
  },
  {
    id: 'playful',
    label: 'Playful',
    description: 'Light and curious — brings some levity.',
    voiceHints: { tone: 'playful', pacing: 'lively' }
  },
  {
    id: 'clinical',
    label: 'Clinical',
    description: 'Evidence-focused and precise.',
    voiceHints: { tone: 'clinical', pacing: 'measured' }
  }
];
