// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

require('module-alias/register')
require('dotenv').config()
const DatabaseModel = require('openpaidbsdk')
const fs = require('fs')
const logger = require('@dbc/core/logger')
const { paiVersion, paiCommitVersion } = require('@dbc/package.json')
const k8s = require('@dbc/core/k8s')
const { Snapshot } = require('@dbc/core/framework')

async function updateFromNoDatabaseVersion (databaseModel) {
  // update from 1.0.0 < version < v1.2.0
  await databaseModel.synchronizeSchema()
  // transfer old frameworks from api server to db
  const frameworks = (await k8s.listFramework()).body.items
  for (const framework of frameworks) {
    const snapshot = new Snapshot(framework)
    logger.info(`Transferring framework ${snapshot.getName()} to database.`)
    const record = snapshot.getRecordForLegacyTransfer()
    record.requestSynced = true
    await databaseModel.Framework.upsert(record)
  }
}

// This script should be idempotent.
// If any error happens, it should report the error and exit with a non-zero code.
// If succeed, it should finish with a zero code.
async function main () {
  try {
    const databaseModel = new DatabaseModel(
      process.env.DB_CONNECTION_STR,
      1
    )
    const previousVersion = (await databaseModel.getVersion()).version
    if (!previousVersion) {
      await updateFromNoDatabaseVersion(databaseModel)
    }
    await databaseModel.setVersion(paiVersion, paiCommitVersion)
    logger.info('Database has been successfully initialized.')
    process.exit(0)
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

main()
