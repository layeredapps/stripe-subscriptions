const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.customerid) {
      const customer = await global.api.user.subscriptions.Customer.get(req)
      if (!customer) {
        throw new Error('invalid-customer')
      }
      where.customerid = req.query.customerid
    } else if (req.query.accountid) {
      const account = await global.api.user.Account.get(req)
      if (!account) {
        throw new Error('invalid-account')
      }
      where.accountid = req.query.accountid
    }
    return subscriptions.Storage.Subscription.count({
      where
    })
  }
}
