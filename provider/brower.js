const { webkit } = require('playwright')
const { setTimeout: delayMs } = require('timers/promises')

class WebkitBrower {
  constructor (opts) {
    this.options = opts
  }

  async init () {
    this.ins = await webkit.launch({ headless: true })
    this.ctx = await this.ins.newContext()

    const page = await this.ctx.newPage()
    await page.goto(this.options.url)
  }

  async wait (ms) {
    await delayMs(ms)
  }

  async pages () {
    return this.ctx.pages()
  }
}

module.exports = {
  WebkitBrower
}
