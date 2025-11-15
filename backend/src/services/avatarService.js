const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AvatarService {
  constructor() {
    this.promptsDir = path.join(__dirname, '../../prompts');
    this.generationCounts = new Map(); // Track generations per user
    this.rateLimits = {
      maxGenerationsPerHour: 10,
      maxGenerationsPerDay: 50,
    };
  }

  async loadPromptTemplate(styleName) {
    try {
      const promptPath = path.join(this.promptsDir, `${styleName}.md`);
      const content = await fs.readFile(promptPath, 'utf8');
      
      // Extract the base prompt from markdown
      const lines = content.split('\n');
      const basePromptIndex = lines.findIndex(line => line === '## Base Prompt');
      
      if (basePromptIndex === -1) {
        throw new Error(`No base prompt found in ${styleName}.md`);
      }
      
      return lines[basePromptIndex + 1].trim();
    } catch (error) {
      console.error(`Error loading prompt template ${styleName}:`, error);
      throw new Error(`Prompt template ${styleName} not found`);
    }
  }

  interpolatePrompt(template, variables) {
    let prompt = template;
    
    // Replace template variables {{variable}} with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return prompt;
  }

  async getAvailableStyles() {
    try {
      const files = await fs.readdir(this.promptsDir);
      return files
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''));
    } catch (error) {
      console.error('Error reading prompts directory:', error);
      return [];
    }
  }

  checkRateLimit(userId) {
    const now = new Date();
    const userGenerations = this.generationCounts.get(userId) || [];
    
    // Filter to last hour and last day
    const lastHour = userGenerations.filter(
      time => now - time < 60 * 60 * 1000
    );
    const lastDay = userGenerations.filter(
      time => now - time < 24 * 60 * 60 * 1000
    );
    
    if (lastHour.length >= this.rateLimits.maxGenerationsPerHour) {
      throw new Error('Rate limit exceeded: Too many generations in the last hour');
    }
    
    if (lastDay.length >= this.rateLimits.maxGenerationsPerDay) {
      throw new Error('Rate limit exceeded: Too many generations in the last day');
    }
    
    return true;
  }

  recordGeneration(userId) {
    const userGenerations = this.generationCounts.get(userId) || [];
    userGenerations.push(new Date());
    
    // Keep only last day's records
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredGenerations = userGenerations.filter(time => time > oneDayAgo);
    
    this.generationCounts.set(userId, filteredGenerations);
  }

  async generateMultipleOptions(userId, adjective, adverb, noun, color = 'blue') {
    try {
      // Check rate limits
      this.checkRateLimit(userId);
      
      // Use the single SNES pixel art prompt with color
      const prompt = `SNES video game pixel art 16 bit Color ${color} ${adjective} ${adverb} ${noun}`;
      
      console.log(`Generating 4 avatars with prompt: ${prompt}`);
      
      // Generate 4 images in one API call using DALL-E 2
      const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: prompt,
        size: "1024x1024",
        n: 4,
      });
      
      // Record generation for rate limiting
      this.recordGeneration(userId);
      
      // Format results
      const results = response.data.map((image, index) => ({
        success: true,
        imageUrl: image.url,
        prompt: prompt,
        style: `snes-pixel-art-${index + 1}`,
        variables: { adjective, adverb, noun, color }
      }));
      
      return results;
      
    } catch (error) {
      console.error('Avatar generation error:', error);
      
      if (error.message.includes('Rate limit exceeded')) {
        throw error;
      }
      
      throw new Error(`Failed to generate avatars: ${error.message}`);
    }
  }
}

module.exports = new AvatarService();