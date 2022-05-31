const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.taxid) {
      throw new Error('invalid-taxid')
    }
    const taxid = await global.api.user.subscriptions.TaxId.get(req)
    if (!taxid) {
      throw new Error('invalid-taxid')
    }
    await stripeCache.execute('customers', 'deleteTaxId', taxid.customerid, req.query.taxid, req.stripeKey)
    await subscriptions.Storage.TaxId.destroy({
      where: {
        taxid: req.query.taxid,
        appid: req.appid || global.appid
      }
    })
    return true
  }
}
