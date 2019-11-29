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

// module dependencies
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const markedConfig = require('./marked.config');
const helpers = require('./helpers');

const title = 'Platform for AI';
const version = require('../package.json').version;
const commitVersion = require('../package.json').commitVersion;
const FABRIC_DIR = [
  path.resolve(__dirname, '../src/app/job/job-view/fabric'),
  path.resolve(__dirname, '../src/app/home'),
  path.resolve(__dirname, '../src/app/components'),
  path.resolve(__dirname, '../node_modules/tachyons'),
];

function generateHtml(opt) {
  return new HtmlWebpackPlugin(
    Object.assign(
      {
        title: title,
        version: version,
        commitVersion: commitVersion,
        template: './src/app/layout/layout.component.ejs',
        minify: {
          collapseWhitespace: true,
          html5: true,
          removeComments: true,
          removeEmptyAttributes: true,
          removeTagWhitespace: true,
        },
      },
      opt,
    ),
  );
}

const config = (env, argv) => ({
  entry: {
    index: './src/app/home/index.jsx',
    home: './src/app/home/home.jsx',
    layout: './src/app/layout/layout.component.js',
    userView: './src/app/user/fabric/user-view.jsx',
    batchRegister: './src/app/user/fabric/batch-register.jsx',
    dashboard: './src/app/dashboard/dashboard.component.js',
    submit: './src/app/job-submission/job-submission.jsx',
    submit_v1: './src/app/job/job-submit-v1/job-submit.component.js',
    jobList: './src/app/job/job-view/fabric/job-list.jsx',
    jobDetail: './src/app/job/job-view/fabric/job-detail.jsx',
    jobRetry: './src/app/job/job-view/fabric/job-retry.jsx',
    virtualClusters: './src/app/vc/vc.component.js',
    services: './src/app/cluster-view/services/services.component.js',
    hardware: './src/app/cluster-view/hardware/hardware.component.js',
    hardwareDetail:
      './src/app/cluster-view/hardware/hardware-detail.component.js',
    k8s: './src/app/cluster-view/k8s/k8s.component.js',
    docs: './src/app/job/job-docs/job-docs.component.js',
    userProfile: './src/app/user/fabric/user-profile.jsx',
    plugin: './src/app/plugin/plugin.component.js',
  },
  output: {
    path: helpers.root('dist'),
    filename: 'scripts/[name].[contenthash].js',
    jsonpFunction: 'webportalWebpackJsonp',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [helpers.root('node_modules'), helpers.root('src')],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['lodash', '@babel/plugin-syntax-dynamic-import'],
            presets: [
              '@babel/preset-react',
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'entry',
                  corejs: 3,
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.txt$/,
        loader: 'raw-loader',
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: 'html-loader',
          },
          {
            loader: 'markdown-loader',
            options: {
              pedantic: true,
              renderer: markedConfig.renderer,
            },
          },
        ],
      },
      {
        test: /\.ejs$/,
        loader: 'ejs-loader',
      },
      {
        test: /\.(css|scss)$/,
        include: FABRIC_DIR,
        use: [
          argv.mode === 'production'
            ? MiniCssExtractPlugin.loader
            : {
                loader: 'style-loader',
                options: {
                  sourceMap: true,
                },
              },
          {
            loader: 'css-loader',
            options: {
              url: true,
              sourceMap: true,
              importLoaders: 2,
              modules: true,
              camelCase: true,
              localIdentName: '[name]-[local]--[hash:base64:5]',
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              ident: 'postcss',
              plugins: loader => [
                require('postcss-import')({ root: loader.resourcePath }),
                require('autoprefixer')(),
                require('cssnano')(),
              ],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(css|scss)$/,
        exclude: FABRIC_DIR,
        use: [
          argv.mode === 'production'
            ? MiniCssExtractPlugin.loader
            : {
                loader: 'style-loader',
                options: {
                  sourceMap: true,
                },
              },
          {
            loader: 'css-loader',
            options: {
              url: true,
              sourceMap: true,
              importLoaders: 2,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              ident: 'postcss2',
              plugins: loader => [
                require('postcss-import')({ root: loader.resourcePath }),
                require('autoprefixer')(),
                require('cssnano')(),
              ],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(jpg|png|gif|ico)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              publicPath: '/assets/img/',
              outputPath: 'assets/img/',
            },
          },
        ],
      },
      {
        test: /\.(eot|woff2?|ttf)([?]?.*)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              publicPath: '/assets/font/',
              outputPath: 'assets/font/',
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: [
          '@svgr/webpack',
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              publicPath: '/assets/font/',
              outputPath: 'assets/font/',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.WatchIgnorePlugin([/css\.d\.ts$/]),
    new webpack.IgnorePlugin({
      resourceRegExp: /^moment$/,
      contextRegExp: /chart.js/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^esprima$/,
      contextRegExp: /js-yaml/,
    }),
    new MonacoWebpackPlugin({
      languages: ['json', 'yaml', 'shell'],
      features: ['suggest', 'hover'],
    }),
    new CopyWebpackPlugin([
      { from: 'src/assets', to: 'assets' },
      { from: 'src/assets/img/favicon.ico', to: 'favicon.ico' },
    ]),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].[contenthash].css',
    }),
    // required by ejs loader
    new webpack.ProvidePlugin({
      _: 'lodash',
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
    new webpack.ProvidePlugin({
      cookies: 'js-cookie',
      'window.cookies': 'js-cookie',
    }),
    generateHtml({
      filename: 'index.html',
      chunks: ['index'],
      template: './src/app/home/index.ejs',
    }),
    generateHtml({
      filename: 'home.html',
      chunks: ['layout', 'home'],
    }),
    generateHtml({
      filename: 'user-view.html',
      chunks: ['layout', 'userView'],
    }),
    generateHtml({
      filename: 'batch-register.html',
      chunks: ['layout', 'batchRegister'],
    }),
    generateHtml({
      filename: 'user-profile.html',
      chunks: ['layout', 'userProfile'],
    }),
    generateHtml({
      filename: 'dashboard.html',
      chunks: ['layout', 'dashboard'],
    }),
    generateHtml({
      filename: 'submit.html',
      chunks: ['layout', 'submit'],
    }),
    generateHtml({
      filename: 'submit_v1.html',
      chunks: ['layout', 'submit_v1'],
    }),
    generateHtml({
      filename: 'job-list.html',
      chunks: ['layout', 'jobList'],
    }),
    generateHtml({
      filename: 'job-detail.html',
      chunks: ['layout', 'jobDetail'],
    }),
    generateHtml({
      filename: 'job-retry.html',
      chunks: ['layout', 'jobRetry'],
    }),
    generateHtml({
      filename: 'virtual-clusters.html',
      chunks: ['layout', 'virtualClusters'],
    }),
    generateHtml({
      filename: 'cluster-view/services.html',
      chunks: ['layout', 'services'],
    }),
    generateHtml({
      filename: 'cluster-view/hardware.html',
      chunks: ['layout', 'hardware'],
    }),
    generateHtml({
      filename: 'cluster-view/k8s.html',
      chunks: ['layout', 'k8s'],
    }),
    generateHtml({
      filename: 'cluster-view/hardware/detail.html',
      chunks: ['layout', 'hardwareDetail'],
    }),
    generateHtml({
      filename: 'docs.html',
      chunks: ['layout', 'docs'],
    }),
    generateHtml({
      filename: 'plugin.html',
      chunks: ['layout', 'plugin'],
    }),
  ],
  devServer: {
    contentBase: path.resolve(__dirname, '..', 'dist'),
    port: 9286,
  },
  optimization: {
    moduleIds: 'hashed',
    runtimeChunk: 'single',
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
      }),
    ],
    splitChunks: {
      name: false,
      cacheGroups: {
        vendors: {
          chunks: 'all',
          minSize: 30000,
          minChunks: 2,
          maxAsyncRequests: Infinity,
          maxInitialRequests: Infinity,
        },
      },
    },
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    global: true,
    process: true,
    module: false,
  },
});

module.exports = config;
