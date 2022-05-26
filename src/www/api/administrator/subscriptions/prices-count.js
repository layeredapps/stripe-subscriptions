const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return subscriptions.Storage.Price.count({
      where: {
        appid: req.appid || global.appid
      }
    })
  }
}
