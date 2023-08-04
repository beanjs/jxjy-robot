const { default: Pino } = require('pino')
const log = Pino({
  transport: { target: 'pino-pretty' },
  level: 'trace'
})

module.exports = {
  log
}
