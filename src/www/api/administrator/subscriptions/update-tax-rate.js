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
    const updateInfo = {}
    const optionalFields = ['active', 'country', 'description', 'jurisdiction', 'state', 'tax_type']
    for (const field of optionalFields) {
      if (req.body[field] !== undefined) {
        updateInfo[field] = req.body[field]
      }
    }
    const taxRateNow = await stripeCache.execute('taxRate', 'update', req.query.taxrateid, updateInfo, req.stripeKey)
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
