const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return subscriptions.Storage.SetupIntent.count({
      where: {
        appid: req.appid || global.appid
      }
    })
  }
}
