const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return subscriptions.Storage.Payout.count({
      where: {
        appid: req.appid || global.appid
      }
    })
  }
}
