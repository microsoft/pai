// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const { resolve } = require("path");
const webpack = require("webpack");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

const SRC_PATH = resolve(__dirname, "src");
const OUTPUT_PATH = resolve(__dirname, "dist");
const CSS_MODULES_PATH = [
  SRC_PATH,
  resolve(__dirname, "node_modules/bootstrap"),
];

const configuration = {
  context: SRC_PATH,
  entry: {
    plugin: "./index.ts",
  },
  output: {
    path: OUTPUT_PATH,
    filename: "[name].js",
    chunkFilename: "[id].chunk.js",
    globalObject: "this",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(css|scss)$/,
        include: CSS_MODULES_PATH,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              url: true,
              modules: true,
              sourceMap: true,
              camelCase: true,
              localIdentName: "[name]-[local]--[hash:base64:6]",
            },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.(css|scss)$/,
        exclude: CSS_MODULES_PATH,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(eot|woff2?|svg|ttf)([\?]?.*)$/,
        use: "file-loader",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".json"],
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^esprima$/,
      contextRegExp: /js-yaml/,
    }),
    new MonacoWebpackPlugin({
      languages: ["yaml"],
      features: ["folding"],
    }),
  ],
  devServer: {
    host: "0.0.0.0",
    port: 9290,
    contentBase: false,
    watchOptions: {
      ignored: /node_modules/,
    },
    disableHostCheck: true,
  },
};

module.exports = configuration;
