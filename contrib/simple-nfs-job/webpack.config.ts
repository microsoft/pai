// tslint:disable:object-literal-sort-keys

import { resolve } from "path";
import { Configuration } from "webpack";

const configuration: Configuration = {
  context: resolve(__dirname, "src"),
  entry: "./index.ts",
  output: {
    path: resolve(__dirname, "dist"),
    filename: "plugin.js",
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: "ts-loader",
      exclude: /node_modules/,
    }],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".json"],
  },
  devServer: {
    contentBase: false,
    watchOptions: {
      ignored: /node_modules/,
    },
  },
};

export default configuration;
