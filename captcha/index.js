const items = {}

items['fdys'] = require('./captcha_fdys')

module.exports = function () {
  const name = process.env.ROBOT_CAPTCHA

  const ins = items[name]
  if (!ins) throw new Error(`not supported captcha : [${name}]`)

  return new ins()
}
