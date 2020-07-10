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

require('module-alias/register')
require('dotenv').config()
const DatabaseModel = require('openpaidbsdk')
const fs = require('fs')
const logger = require('@dbc/core/logger')
const neverResolved = new Promise((resolve, reject) => {})

async function main () {
  try {
    const databaseModel = new DatabaseModel(
      process.env.DB_CONNECTION_STR,
      1
    )
    /* ...... */
    await databaseModel.synchronizeSchema()
    await new Promise((resolve, reject) => {
      fs.writeFile('/READY', '', (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
    logger.info('Database has been successfully initialized.')
  } catch (err) {
    logger.error(err)
  }
  await neverResolved // sleep forever
}

main()
