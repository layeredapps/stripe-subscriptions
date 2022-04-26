const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    const where = {
      appid: req.appid || global.appid
    }
    req.query = req.query || {}
    if (req.query.customerid) {
      where.customerid = req.query.customerid
    } else if (req.query.subscriptionid) {
      where.subscriptionid = req.query.subscriptionid
    } else if (req.query.accountid) {
      where.accountid = req.query.accountid
    }
    return subscriptions.Storage.UsageRecord.count({
      where
    })
  }
}
