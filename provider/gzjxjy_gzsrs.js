const { WebkitBrower } = require('./brower')
const { log } = require('../logger')
const captchaFactory = require('../captcha')

class Brower extends WebkitBrower {
  constructor (opts) {
    super(opts)
  }

  async pageMain () {
    const page = this.ctx.pages().filter(p => {
      const url = p.url()
      return url.includes(this.options.url) && !url.includes('learning')
    })[0]

    if (!page) throw new Error('page main not fount')

    await page.setDefaultTimeout(5000)
    return page
  }

  async pageVideo () {
    const page = this.ctx.pages().filter(p => {
      const url = p.url()
      return url.includes(this.options.url) && url.includes('learning')
    })[0]

    if (!page) throw new Error('page video not fount')

    await page.setDefaultTimeout(5000)
    return page
  }
}

class Provider {
  constructor () {
    this.options = {
      url: 'https://www.gzjxjy.gzsrs.cn/',
      user: process.env.ROBOT_USERNAME,
      pass: process.env.ROBOT_PASSWORD
    }

    this.brower = new Brower(this.options)
    this.captcha = captchaFactory()
  }

  async login () {
    const page = await this.brower.pageMain()

    log.debug('进入【学习中心】')
    await page.locator('#userCenterName').click()
    await this.brower.wait(1000)

    log.debug('填写用户名和密码')
    await page
      .locator('input[placeholder="请输入身份证号"]')
      .fill(this.options.user)
    await page
      .locator('input[placeholder="请输入登录密码"]')
      .fill(this.options.pass)

    const capEle = await page.locator('input[placeholder="请输入图形验证码"]')
    log.info('识别验证码并触发登陆')
    while (true) {
      try {
        await this.brower.wait(2000)
        const capImg = await page.$eval(
          '.captcha',
          e => e.getAttribute('src').split(',')[1]
        )

        const capTxt = await this.captcha.i2t(capImg)
        await capEle.fill(capTxt)

        await page
          .locator('button[class="el-button el-button--primary is-round"]')
          .click()

        const check = await page.getByText(/欢迎您~/i).innerText()
        if (check) {
          break
        }
      } catch (e) {
        log.error(e)
        await capEle.click()
      }
    }
  }

  // 网络课程
  async _netCourse () {
    const netCrs = []
    const page = await this.brower.pageMain()

    await page
      .locator('li[role="menuitem"]')
      .filter({ hasText: '在线学习' })
      .locator('li[role="menuitem"]')
      .filter({ hasText: '网络课程' })
      .click()
    await this.brower.wait(1000)

    const yearTabs = await page
      .locator('div[class="yearTabs el-tabs el-tabs--card el-tabs--top"]')
      .getByRole('tab')
      .all()

    for (const yearTab of yearTabs) {
      await yearTab.click()
      await this.brower.wait(2000)

      const items = await page.locator('div[class="course-item"]').all()
      for (const item of items) {
        netCrs.push({
          text: await item.locator('p').innerText(),
          tab: await yearTab.innerText()
        })
      }
    }

    return netCrs
  }

  // 我的课程
  async _finCourse () {
    return []
  }

  async _selCourse (cr) {
    const page = await this.brower.pageMain()

    await page
      .locator('li[role="menuitem"]')
      .filter({ hasText: '在线学习' })
      .locator('li[role="menuitem"]')
      .filter({ hasText: '网络课程' })
      .click()
    await this.brower.wait(1000)

    const yearTabs = await page
      .locator('div[class="yearTabs el-tabs el-tabs--card el-tabs--top"]')
      .getByRole('tab')
      .all()

    for (const yearTab of yearTabs) {
      await yearTab.click()
      await this.brower.wait(2000)

      const items = await page.locator('div[class="course-item"]').all()

      for (const item of items) {
        const text = await item.locator('p').innerText()
        const tab = await yearTab.innerText()

        if (cr.text == text && cr.tab == tab) {
          await item.click()
          return
        }
      }
    }
  }

  async _playCourse (cr) {
    const main = await this.brower.pageMain()

    await main
      .locator('button[class="el-button btn el-button--primary"]')
      .click()

    await this.brower.wait(2000)

    const video = await this.brower.pageVideo()
    const list = await video
      .locator('div[class="el-steps el-steps--vertical"] > div')
      .filter({ hasNot: video.locator('span[class="status-tip"]') })
      .all()

    await this._playVideos(cr, list)
    await video.close()
  }

  async _playVideos (cr, ls) {
    if (ls.length == 0) {
      return
    }

    const v = ls.shift()
    const vn = await v.locator('span[class="step-title"]').innerText()
    log.info(`播放视频:${cr.tab}-${cr.text}-${vn}`)
    await v.click()
    await this.brower.wait(1000)

    const page = await this.brower.pageVideo()
    await page.locator('button[class="vjs-big-play-button"]').click()
    await this.brower.wait(1000)
    await page.locator('button[title="Mute"]').click()
    await this.brower.wait(1000)

    log.info(`视频快进:秘密科技`)
    const ele = await page.locator(
      'div[class="vjs-progress-control vjs-control"]'
    )
    const bound = await ele.boundingBox()
    const x = bound.x + bound.width - 40
    const y = bound.y + bound.height / 2
    await page.mouse.click(x, y, { button: 'left' })

    // 等待视频结束
    await this._waitVideo(cr, vn)
    // 播放下一个视频
    await this._playVideos(cr, ls)
  }

  _waitVideo (cr, vn) {
    return new Promise((resolve, reject) => {
      const waitTimer = async () => {
        const page = await this.brower.pageVideo()

        try {
          // 点击防挂机按钮
          const puase = await page
            .locator('button[class="el-button el-button--primary"]')
            .click()
            .then(() => true)
            .catch(() => false)
          if (puase) {
            log.info('播放异常:处理[防挂机暂停]')
          }

          const curTime = await page
            .locator('span[class="vjs-current-time-display"]')
            .innerHTML()
          const durTime = await page
            .locator('span[class="vjs-duration-display"]')
            .innerText()

          log.debug(
            `播放进度(${curTime}/${durTime}):${cr.tab}-${cr.text}-${vn}`
          )
          if (curTime == durTime) {
            return resolve()
          }
        } catch (e) {
          reject(e)
        }

        setTimeout(waitTimer, 5000)
      }

      setTimeout(waitTimer, 5000)
    })
  }

  async course () {
    const netCrs = await this._netCourse()
    const finCrs = await this._finCourse()

    return netCrs.filter(
      n => !finCrs.find(f => f.text == n.text && f.tab == n.tab)
    )
  }

  async learn (crs) {
    if (crs.length == 0) {
      return
    }

    const cr = crs.shift()
    log.info(`开始学习:${cr.tab}-${cr.text}`)
    await this._selCourse(cr)
    await this._playCourse(cr)

    // 进入下一个课程
    await this.learn(crs)
  }

  async run () {
    log.info('进入【贵州省专业技术人员继续教育平台】')
    await this.brower.init()
    log.info('登陆平台')
    await this.login()

    log.info('登陆成功,获取课程')

    const crs = await this.course()
    log.warn(`发现 ${crs.length} 课程需要学习`)
    if (crs.length > 0) {
      await this.learn(crs)
    }

    log.warn(`视频课程观看结束,即将开始考试答题`)
  }
}

module.exports = Provider
