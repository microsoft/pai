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
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const markedConfig = require('./marked.config');
const helpers = require('./helpers');

const title = 'Platform for AI';
const version = require('../package.json').version;


const htmlMinifierOptions = {
  collapseWhitespace: true,
  html5: true,
  minifyCSS: true,
  minifyJS: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeTagWhitespace: true
};

const config = (env, argv) => ({
  entry: {
    index: './src/app/index.js',
    layout: './src/app/layout/layout.component.js',
    register: './src/app/user/user-register/user-register.component.js',
    userView: './src/app/user/user-view/user-view.component.js',
    login: './src/app/user/user-login/user-login.component.js',
    changePassword: './src/app/user/change-password/change-password.component.js',
    dashboard: './src/app/dashboard/dashboard.component.js',
    submit: './src/app/job/job-submit/job-submit.component.js',
    view: './src/app/job/job-view/job-view.component.js',
    virtualClusters: './src/app/vc/vc.component.js',
    services: './src/app/cluster-view/services/services.component.js',
    hardware: './src/app/cluster-view/hardware/hardware.component.js',
    hardwareDetail: './src/app/cluster-view/hardware/hardware-detail.component.js',
    k8s: './src/app/cluster-view/k8s/k8s.component.js',
    docs: './src/app/job/job-docs/job-docs.component.js',
    jobSubmit: './src/app/marketplace/job-submit/job-submit.component.js',
    templateDetail: './src/app/marketplace/template-detail/template-detail.component.js',
    templateView: './src/app/marketplace/template-view/template-view.component.js',
    templateList: './src/app/marketplace/template-list/template-list.component.js',
    changeGitHubPAT: './src/app/user/change-github-pat/change-github-pat.component.js',
    howToConfigGitHubPAT: './src/app/user/how-to-config-github-pat/how-to-config-github-pat.component.js',
    'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker',
    'json.worker': 'monaco-editor/esm/vs/language/json/json.worker',
    'css.worker': 'monaco-editor/esm/vs/language/css/css.worker',
    'html.worker': 'monaco-editor/esm/vs/language/html/html.worker',
    'ts.worker': 'monaco-editor/esm/vs/language/typescript/ts.worker'
  },
  output: {
    path: helpers.root('dist'),
    filename: 'scripts/[name].bundle.js'
  },
  resolve: {
    extensions: ['.js', '.json'],
    modules: [helpers.root('node_modules'), helpers.root('src')],
    alias: {
      deepmerge$: path.resolve(helpers.root('node_modules/deepmerge/dist/umd.js')),
    }
  },
  module: {
    rules: [
      {
        test: /\.txt$/,
        loader: 'raw-loader'
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: 'html-loader'
          },
          {
            loader: 'markdown-loader',
            options: {
              pedantic: true,
              renderer: markedConfig.renderer
            }
          }
        ]
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.ejs$/,
        loader: 'ejs-loader'
      },
      {
        test: /\.(css|scss)$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                url: true,
                minimize: true,
                sourceMap: true
              }
            },
            {
              loader: 'sass-loader',
              options: {
                url: true,
                minimize: true,
                sourceMap: true
              }
            }
          ]
        })
      },
      {
        test: /\.(jpg|png|gif|ico)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              publicPath: '/assets/img/',
              outputPath: 'assets/img/'
            }
          }
        ]
      },
      {
        test: /\.(eot|woff2?|svg|ttf)([\?]?.*)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              publicPath: '/assets/font/',
              outputPath: 'assets/font/'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'src/assets', to: 'assets' }
    ]),
    new ExtractTextPlugin({
      filename: 'styles/[name].bundle.css'
    }),
    new webpack.ProvidePlugin({
      _: 'underscore'
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    new webpack.ProvidePlugin({
      cookies: 'js-cookie',
      'window.cookies': 'js-cookie'
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'index.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'index']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'register.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'register']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'user-view.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'userView']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'login.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'login']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'change-password.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'changePassword']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'dashboard.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'dashboard']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'submit.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'submit']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'view.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'view']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'virtual-clusters.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'virtualClusters']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'cluster-view/services.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'services']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'cluster-view/hardware.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'hardware']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'cluster-view/k8s.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'k8s']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'cluster-view/hardware/detail.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'hardwareDetail']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'docs.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'docs']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'submit-v2.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'jobSubmit']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'template.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'templateDetail']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'marketplace.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'templateView']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'template-list.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'templateList']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'change-github-pat.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'changeGitHubPAT']
    }),
    new HtmlWebpackPlugin({
      title: title,
      version: version,
      filename: 'how-to-config-github-pat.html',
      template: './src/app/layout/layout.component.ejs',
      minify: htmlMinifierOptions,
      cache: true,
      chunks: ['layout', 'howToConfigGitHubPAT']
    })
  ].concat(argv.debug ? [] : [new UglifyJsPlugin({
    cache: true,
    parallel: true,
    sourceMap: true
  })]),
  node: {
    global: true,
    fs: 'empty',
    process: true,
    module: false
  }
});

module.exports = config;
