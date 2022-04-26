const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return subscriptions.Storage.Charge.count({
      where: {
        appid: req.appid || global.appid
      }
    })
  }
}
