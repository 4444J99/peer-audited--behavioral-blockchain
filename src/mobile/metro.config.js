const { getDefaultConfig } = require('expo/metro-config');

// Expo owns the SDK's transformer, asset handling, and monorepo resolution.
// Do not replace this with React Native's non-Expo Metro defaults.
module.exports = getDefaultConfig(__dirname);
