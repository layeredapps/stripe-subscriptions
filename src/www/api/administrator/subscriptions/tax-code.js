const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.taxcodeid) {
      throw new Error('invalid-taxcodeid')
    }
    let taxRate = await dashboard.StorageCache.get(req.query.taxcodeid)
    if (!taxRate) {
      const taxRateInfo = await subscriptions.Storage.TaxCode.findOne({
        where: {
          taxcodeid: req.query.taxcodeid
        }
      })
      if (!taxRateInfo) {
        throw new Error('invalid-taxcodeid')
      }
      taxRate = {}
      for (const field of taxRateInfo._options.attributes) {
        taxRate[field] = taxRateInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.taxcodeid, taxRate)
    }
    return taxRate
  }
}
