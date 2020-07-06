require('module-alias/register')
require('dotenv').config()
const k8s = require('@dbc/core/k8s')
const logger = require('@dbc/core/logger')

async function main() {
  // const res = await k8s.createPriorityClass('1234-priority', -99999)
  // logger.info(res)
  await k8s.createSecret('test',
    {'test-key': Buffer.from('test-value').toString('base64')}
  )
  const res = await k8s.patchSecretOwnerToFramework('test', '33a44dfb905f06e9fa12dc786b57783c', 'dc74ee7e-b977-4f27-bfe9-ca3a611294ac')
  logger.info(res)
}

main()
