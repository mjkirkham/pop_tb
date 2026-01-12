const path = require('path');

module.exports = (env) => {
  const browser = env.browser || 'chrome';
  
  return {
    entry: {
      popup: './src/ui/popup.js',
      content: './src/content/content.js',
      background: './src/background/background.js'
    },
    output: {
      path: path.resolve(__dirname, `dist/${browser}`),
      filename: '[name].js',
      clean: true
    },
    mode: env.mode || 'production',
    devtool: env.mode === 'development' ? 'inline-source-map' : false,
    optimization: {
      minimize: env.mode !== 'development'
    }
  };
};
