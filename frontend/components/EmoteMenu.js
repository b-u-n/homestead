import React from 'react';

// Standard emote list (12 emotes in a circle)
const EMOTES = [
  '😊', '😂', '😍', '😎',
  '🤔', '😢', '😠', '🎉',
  '👍', '👋', '❤️', '🔥'
];

const EmoteMenu = ({ centerX, centerY, radius = 160, onEmoteSelect, onClose }) => {
  const drawEmoteMenu = (ctx) => {
    const numEmotes = EMOTES.length;
    const angleStep = (Math.PI * 2) / numEmotes;

    // Draw semi-transparent background circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw separator lines between emotes (not going to center)
    ctx.strokeStyle = 'rgba(92, 90, 88, 0.2)';
    ctx.lineWidth = 1;
    EMOTES.forEach((_, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const startX = centerX + Math.cos(angle) * 80;
      const startY = centerY + Math.sin(angle) * 80;
      const endX = centerX + Math.cos(angle) * (radius + 20);
      const endY = centerY + Math.sin(angle) * (radius + 20);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });

    // Draw each emote (offset by half angle step to be between lines)
    EMOTES.forEach((emote, index) => {
      const angle = angleStep * index + angleStep / 2 - Math.PI / 2; // Offset by half step
      const emoteX = centerX + Math.cos(angle) * radius;
      const emoteY = centerY + Math.sin(angle) * radius;

      // Draw emote text (no background)
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(emote, emoteX, emoteY);
    });
  };

  return {
    draw: drawEmoteMenu,
    centerX,
    centerY,
    radius
  };
};

// Helper function to check which emote was clicked
export const getClickedEmote = (clickX, clickY, centerX, centerY, radius = 160) => {
  const numEmotes = EMOTES.length;
  const angleStep = (Math.PI * 2) / numEmotes;

  // Check each emote (larger hit area since no bubbles)
  for (let i = 0; i < numEmotes; i++) {
    const angle = angleStep * i + angleStep / 2 - Math.PI / 2; // Offset by half step to match rendering
    const emoteX = centerX + Math.cos(angle) * radius;
    const emoteY = centerY + Math.sin(angle) * radius;

    const distToEmote = Math.sqrt(
      Math.pow(clickX - emoteX, 2) + Math.pow(clickY - emoteY, 2)
    );

    if (distToEmote <= 30) {
      return { type: 'emote', emote: EMOTES[i] };
    }
  }

  // Check if clicked in center area (close the menu)
  const distToCenter = Math.sqrt(
    Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2)
  );

  if (distToCenter <= 60) {
    return { type: 'close' };
  }

  // Clicked outside
  return { type: 'outside' };
};

export default EmoteMenu;
export { EMOTES };
