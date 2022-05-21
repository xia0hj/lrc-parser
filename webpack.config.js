const ph = require('path')

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    path: ph.resolve("./dist"),
    filename: "bundle.js",
    library: "LrcParser",
    libraryTarget: "umd"
  }
}