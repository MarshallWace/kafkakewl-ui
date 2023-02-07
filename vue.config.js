module.exports = {
  pluginOptions: {
    quasar: {
      theme: "mat"
    }
  },
  transpileDependencies: [/[\\\/]node_modules[\\\/]quasar-framework[\\\/]/],
  devServer: {
    host: '0.0.0.0',
    port: 80,
    https: false,
    hotOnly: false,
  },
  lintOnSave: false,
  assetsDir: "./static"
};
