const { resolve } = require('path')
const config = require('./webpack.config')

module.exports = Object.assign(config, {
  mode: 'development',
  output: {
    path: resolve(__dirname, '..', '..', 'src', 'webportal', 'dist', 'scripts', 'plugins'),
    filename: 'submit-simple-job.js'
  },
  watch: true
})
