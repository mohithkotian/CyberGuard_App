module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress source map warnings and third-party dynamic require warnings
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/,
        /Critical dependency/,
      ];
      return webpackConfig;
    },
  },
};
