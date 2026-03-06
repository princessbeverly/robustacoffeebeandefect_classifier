const { getDefaultConfig } = require("@react-native/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts, "tflite"],
  // Avoid Metro watching native C++/Android paths that may be missing or symlinked
  blockList: [
    ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
    /node_modules[\\/]react-native-fast-tflite[\\/]android[\\/].*/,
  ],
};

module.exports = config;