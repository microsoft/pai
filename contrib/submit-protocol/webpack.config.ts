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

import { resolve } from "path";
import { Configuration } from "webpack";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

const configuration: Configuration = {
  context: resolve(__dirname, "src"),
  entry: {
    "plugin": "./index.ts",
    "editor.worker": "monaco-editor/esm/vs/editor/editor.worker.js",
  },
  output: {
    path: resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
    globalObject: "self",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".json"],
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ["yaml"],
      features: [],
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

export default configuration;
