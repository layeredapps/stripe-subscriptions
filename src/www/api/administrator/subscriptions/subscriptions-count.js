const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.customerid) {
      where.customerid = req.query.customerid
    } else if (req.query.accountid) {
      where.accountid = req.query.accountid
    }
    return subscriptions.Storage.Subscription.count({
      where
    })
  }
}
