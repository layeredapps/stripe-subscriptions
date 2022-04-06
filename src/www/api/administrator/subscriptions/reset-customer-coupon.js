const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.customerid) {
      throw new Error('invalid-customerid')
    }
    const customer = await global.api.administrator.subscriptions.Customer.get(req)
    if (!customer) {
      throw new Error('invalid-customerid')
    }
    if (!customer.stripeObject.discount) {
      throw new Error('invalid-customer')
    }
    const updateInfo = {
      coupon: null
    }
    const customerNow = await stripeCache.execute('customers', 'update', req.query.customerid, updateInfo, req.stripeKey)
    await subscriptions.Storage.Customer.update({
      stripeObject: customerNow
    }, {
      where: {
        customerid: req.query.customerid
      }
    })
    await dashboard.StorageCache.remove(req.query.customerid)
    return global.api.administrator.subscriptions.Customer.get(req)
  }
}
