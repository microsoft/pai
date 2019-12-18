const { createLogger, format, transports } = require('winston')

const logger = createLogger({
  level: 'info',

  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(
      info => `[${info.timestamp}] [${info.level}] : ${info.message}` + (info.splat !== undefined ? `${info.splat}` : ' ')
    )
  ),
  transports: [
    new transports.Console()
  ]
})

module.exports = logger
