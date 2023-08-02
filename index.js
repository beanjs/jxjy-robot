// 加载环境变量
const dotenv = require('dotenv')
dotenv.config()

// 获取挂机平台
const providerFactory = require('./provider')
const provider = providerFactory()
// 启动挂机
provider.run()
