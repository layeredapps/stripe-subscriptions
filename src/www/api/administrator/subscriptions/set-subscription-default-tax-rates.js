const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    const subscription = await global.api.administrator.subscriptions.Subscription.get(req)
    if (!subscription || (subscription.stripeObject.status !== 'active' && subscription.stripeObject.status !== 'trialing')) {
      throw new Error('invalid-subscription')
    }
    if (!req.body || !req.body.taxrateids) {
      throw new Error('invalid-taxrateids')
    }
    const taxRates = req.body.taxrateids.split(',')
    for (const taxrateid of taxRates) {
      req.query.taxrateid = taxrateid
      const taxRate = await global.api.administrator.subscriptions.TaxRate.get(req)
      if (!taxRate) {
        throw new Error('invalid-taxrateid')
      }
      if (!taxRate.stripeObject.active) {
        throw new Error('invalid-tax-rate')
      }
    }
    const subscriptionNow = await stripeCache.execute('subscriptions', 'update', req.query.subscriptionid, {
      default_tax_rates: taxRates
    }, req.stripeKey)
    await subscriptions.Storage.Subscription.update({
      stripeObject: subscriptionNow
    }, {
      where: {
        subscriptionid: subscriptionNow.id
      }
    })
    await dashboard.StorageCache.remove(subscriptionNow.id)
    return global.api.administrator.subscriptions.Subscription.get(req)
  }
}
