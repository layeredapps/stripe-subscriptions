const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.subscriptionitemid) {
      throw new Error('invalid-subscriptionitemid')
    }
    if (!req.body || !req.body.taxrateid) {
      throw new Error('invalid-taxrateid')
    }
    req.query.taxrateid = req.body.taxrateid
    const taxRate = await global.api.administrator.subscriptions.TaxRate.get(req)
    if (!taxRate.stripeObject.active) {
      throw new Error('invalid-tax-rate')
    }
    const subscriptionItem = await stripeCache.execute('subscriptionItems', 'update', req.query.subscriptionitemid, { 
      tax_rates: [req.body.taxrateid]
    }, req.stripeKey)
    const subscriptionNow = await stripeCache.execute('subscriptions', 'retrieve', subscriptionItem.subscription, req.stripeKey)
    await subscriptions.Storage.Subscription.update({
      stripeObject: subscriptionNow
    }, {
      where: {
        subscriptionid: subscriptionNow.id
      }
    })
    await dashboard.StorageCache.remove(subscriptionNow.id)
    req.query.subscriptionid = subscriptionNow.id
    return global.api.administrator.subscriptions.Subscription.get(req)
  }
}
