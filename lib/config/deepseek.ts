/**
 * @fileoverview DeepSeek LLM provider configuration (env-driven).
 * Location: lib/config/deepseek.ts
 */
export const DeepseekConfig = {
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
};