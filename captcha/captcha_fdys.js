const { default: axios } = require('axios')

// 图灵识别
// http://fdyscloud.com.cn/

class Captcha {
  constructor () {
    this.options = {
      url: 'http://www.fdyscloud.com.cn/tuling/predict',
      user: process.env.ROBOT_CAPTCHA_USER,
      pass: process.env.ROBOT_CAPTCHA_PASS
    }
  }

  async i2t (imgBase64) {
    const { data } = await axios.post(this.options.url, {
      username: this.options.user,
      password: this.options.pass,
      b64: imgBase64,
      ID: '15689512',
      version: '3.1.1'
    })

    return data.data.result
  }
}

module.exports = Captcha
