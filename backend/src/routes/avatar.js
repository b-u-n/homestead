const express = require('express');
const router = express.Router();
const avatarService = require('../services/avatarService');

// Get available avatar styles
router.get('/styles', async (req, res) => {
  try {
    const styles = await avatarService.getAvailableStyles();
    res.json({
      success: true,
      styles: styles
    });
  } catch (error) {
    console.error('Error fetching avatar styles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch avatar styles'
    });
  }
});

// Generate single avatar
router.post('/generate', async (req, res) => {
  try {
    const { userId, style, adjective, adverb, noun } = req.body;
    
    if (!userId || !style || !adjective || !adverb || !noun) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, style, adjective, adverb, noun'
      });
    }
    
    const result = await avatarService.generateAvatar(
      userId, 
      style, 
      adjective, 
      adverb, 
      noun
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Avatar generation error:', error);
    
    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate multiple avatar options (4 different styles)
router.post('/generate-options', async (req, res) => {
  try {
    const { userId, adjective, adverb, noun, color, colorText, styles } = req.body;

    if (!adjective || !adverb || !noun) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: adjective, adverb, noun'
      });
    }

    // Get client IP for rate limiting (use userId if provided, otherwise hash IP)
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket?.remoteAddress ||
                     'unknown';
    const rateLimitId = userId && userId !== 'anonymous'
      ? userId
      : avatarService.hashIpToId(clientIp);

    // Build base URL for local avatar storage
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const results = await avatarService.generateMultipleOptions(
      rateLimitId,
      adjective,
      adverb,
      noun,
      color,
      colorText,
      baseUrl
    );
    
    res.json({
      success: true,
      options: results,
      username: `${adjective}${adverb}${noun}`
    });
    
  } catch (error) {
    console.error('Multiple avatar generation error:', error);
    
    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;