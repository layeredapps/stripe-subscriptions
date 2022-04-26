const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return subscriptions.Storage.Coupon.count({
      where: {
        appid: req.appid || global.appid
      }
    })
  }
}
