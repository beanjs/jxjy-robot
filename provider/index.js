const items = {}

items['gzjxjy.gzsrs'] = require('./gzjxjy_gzsrs')

module.exports = function () {
  const name = process.env.ROBOT_PROVIDER

  const ins = items[name]
  if (!ins) throw new Error(`not supported provider : [${name}]`)

  return new ins()
}
