import React from 'react';
import { Platform } from 'react-native';

const CharacterIcon = ({
  avatarUrl,
  x,
  y,
  size = 64,
  isCurrentUser = false,
  emote = null,
  onClick = null
}) => {
  // If no canvas context available (not web), return null
  if (Platform.OS !== 'web') return null;

  const drawCharacter = (ctx) => {
    // Calculate position (center the icon)
    const drawX = x - size / 2;
    const drawY = y - size / 2;

    // Draw shadow/glow for current user
    if (isCurrentUser) {
      ctx.shadowColor = 'rgba(179, 230, 255, 0.6)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Draw background circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, size / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw dashed border
    ctx.strokeStyle = isCurrentUser ? 'rgba(179, 230, 255, 0.8)' : 'rgba(92, 90, 88, 0.55)';
    ctx.lineWidth = isCurrentUser ? 3 : 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(x, y, size / 2 + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw avatar image if available
    if (avatarUrl) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Image will be drawn by parent component using loadedImages
      // This is just a placeholder circle
      ctx.fillStyle = 'rgba(222, 134, 223, 0.15)';
      ctx.fill();

      ctx.restore();
    }

    // Draw emote if present
    if (emote) {
      // Emote background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(x, y - size / 2 - 20, 18, 0, Math.PI * 2);
      ctx.fill();

      // Emote border
      ctx.strokeStyle = 'rgba(92, 90, 88, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - size / 2 - 20, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Emote text
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(emote, x, y - size / 2 - 20);
    }
  };

  return {
    drawX: x - size / 2,
    drawY: y - size / 2,
    width: size,
    height: size,
    draw: drawCharacter
  };
};

// Helper function to check if a point is inside the character (rounded rectangle)
export const isPointInCharacter = (pointX, pointY, characterX, characterY, size = 64) => {
  const halfSize = size / 2;
  return (
    pointX >= characterX - halfSize &&
    pointX <= characterX + halfSize &&
    pointY >= characterY - halfSize &&
    pointY <= characterY + halfSize
  );
};

export default CharacterIcon;
