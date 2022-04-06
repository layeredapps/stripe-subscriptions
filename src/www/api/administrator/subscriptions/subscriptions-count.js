const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    let where
    req.query = req.query || {}
    if (req.query.customerid) {
      where = {
        customerid: req.query.customerid
      }
    } else if (req.query.accountid) {
      where = {
        accountid: req.query.accountid
      }
    }
    return subscriptions.Storage.Subscription.count(where)
  }
}
