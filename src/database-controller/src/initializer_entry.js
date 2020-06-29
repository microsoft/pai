require('dotenv').config()
const DatabaseModel = require('openpaidbsdk')
const fs = require('fs').promises
const neverResolved = new Promise((resolve, reject) => {})

async function main () {
  try {
    const databaseModel = new DatabaseModel(
      process.env.DB_CONNECTION_STR,
      1
    )
    await databaseModel.synchronizeSchema()
    await fs.writeFile('/READY', '')
    console.log('Database has been successfully initialized.')
  } catch (err) {
    console.log(err)
  }
  await neverResolved // sleep forever
}

main()
