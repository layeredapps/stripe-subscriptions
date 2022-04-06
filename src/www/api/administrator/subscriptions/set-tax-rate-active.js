const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.taxrateid) {
      throw new Error('invalid-taxrateid')
    }
    const taxRate = await global.api.administrator.subscriptions.TaxRate.get(req)
    if (!taxRate) {
      throw new Error('invalid-taxrateid')
    }
    if (taxRate.stripeObject.active) {
      throw new Error('invalid-taxrate')
    }
    const taxRateInfo = {
      active: true
    }
    const taxRateNow = await stripeCache.execute('taxRates', 'update', req.query.taxrateid, taxRateInfo, req.stripeKey)
    await subscriptions.Storage.TaxRate.update({
      stripeObject: taxRateNow
    }, {
      where: {
        taxrateid: req.query.taxrateid
      }
    })
    await dashboard.StorageCache.remove(req.query.taxrateid)
    return global.api.administrator.subscriptions.TaxRate.get(req)
  }
}
