const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.taxrateid) {
      throw new Error('invalid-taxrateid')
    }
    const taxRate = await global.api.administrator.subscriptions.TaxRate.get(req)
    if (!taxRate) {
      throw new Error('invalid-taxrateid')
    }
    if (req.body.inclusive !== 'true' && req.body.inclusive !== 'false') {
      throw new Error('invalid-inclusive')
    }
    const updateInfo = {}
    // TODO: stripe docs say state is an optional parameter but
    // the stripe api is throwing an exception saying it cannot
    // be updated:
    // "You cannot change `state` via API once it has been set."
    // https://stripe.com/docs/api/tax_rates/update
    // TODO: stripe docs say tax_type is an optional parameter but
    // the stripe api is throwing an exception saying it cannot
    // be updated:
    // "You cannot change `tax_type` via API once it has been set."
    // https://stripe.com/docs/api/tax_rates/update
    const optionalFields = ['active', 'description', 'jurisdiction']
    for (const field of optionalFields) {
      if (!req.body[field] || !req.body[field].length) {
        throw new Error(`invalid-${field}`)
      }
      updateInfo[field] = req.body[field]
    }
    const taxRateNow = await stripeCache.execute('taxRates', 'update', req.query.taxrateid, updateInfo, req.stripeKey)
    await subscriptions.Storage.TaxRate.update({
      stripeObject: taxRateNow
    }, {
      where: {
        taxrateid: req.query.taxrateid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.taxrateid)
    return global.api.administrator.subscriptions.TaxRate.get(req)
  }
}
