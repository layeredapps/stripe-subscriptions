const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.customerid) {
      throw new Error('invalid-customerid')
    }
    const customer = await global.api.user.subscriptions.Customer.get(req)
    if (!customer) {
      throw new Error('invalid-customerid')
    }
    await stripeCache.execute('customers', 'del', req.query.customerid, req.stripeKey)
    await subscriptions.Storage.Customer.destroy({
      where: {
        customerid: req.query.customerid,
        appid: req.appid || global.appid
      }
    })
    return true
  }
}
