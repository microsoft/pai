require('module-alias/register')
require('dotenv').config()
const k8s = require('@dbc/core/k8s')
const logger = require('@dbc/core/logger')

async function main () {
  let res
  res = await k8s.createSecret(
    'test',
    { 'test-key': Buffer.from('test-value').toString('base64') }
  )
  logger.info(res)
  res = await k8s.patchSecretOwnerToFramework(
    'test',
    'e76bcfa99de735b3e16c2470f5e7ca2b',
    '865fc53f-50f8-4c25-9a62-18bab47063aa'
  )
  logger.info(res)
  res = await k8s.deleteSecret('test')
  logger.info(res)
}

main()
