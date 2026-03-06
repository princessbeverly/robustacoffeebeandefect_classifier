const { getDefaultConfig } = require("@react-native/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts, "tflite"]
};

module.exports = config;