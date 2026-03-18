/**
 * Metro config for Smartpay mobile (Expo).
 * Resolves Node built-ins (e.g. node:buffer) to polyfills for packages that require them.
 * Note: CopilotKit web integration has been removed; this polyfill remains for other dependencies.
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'node:buffer' || moduleName === 'buffer') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'node_modules/buffer/index.js'),
    };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
