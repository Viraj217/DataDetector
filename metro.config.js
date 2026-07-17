const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [
      // Exclude native CMake build cache dirs that cause ENOENT crashes on Windows
      /node_modules[\/\\].*[\/\\]android[\/\\]\.cxx[\/\\].*/,
      /node_modules[\/\\].*[\/\\]\.cxx[\/\\].*/,
      // Exclude android build outputs
      /android[\/\\]app[\/\\]build[\/\\].*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
