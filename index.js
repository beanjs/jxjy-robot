const { log } = require('./logger')

// 加载环境变量
const dotenv = require('dotenv')
dotenv.config()

// 获取挂机平台
const providerFactory = require('./provider')
const provider = providerFactory()

async function init () {
  log.warn('开始挂机..')
  await provider.run()
  log.warn('挂机结束....')
}

// 启动挂机
init()
