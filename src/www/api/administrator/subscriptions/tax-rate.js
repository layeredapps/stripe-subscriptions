const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.taxrateid) {
      throw new Error('invalid-taxrateid')
    }
    let taxRate = await dashboard.StorageCache.get(req.query.taxrateid)
    if (!taxRate) {
      const taxRateInfo = await subscriptions.Storage.TaxRate.findOne({
        where: {
          taxrateid: req.query.taxrateid
        }
      })
      if (!taxRateInfo) {
        throw new Error('invalid-taxrateid')
      }
      taxRate = {}
      for (const field of taxRateInfo._options.attributes) {
        taxRate[field] = taxRateInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.taxrateid, taxRate)
    }
    return taxRate
  }
}
