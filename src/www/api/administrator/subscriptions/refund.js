const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.refundid) {
      throw new Error('invalid-refundid')
    }
    let refund = await dashboard.StorageCache.get(req.query.refundid)
    if (!refund) {
      const refundInfo = await subscriptions.Storage.Refund.findOne({
        where: {
          refundid: req.query.refundid
        }
      })
      if (!refundInfo) {
        throw new Error('invalid-refundid')
      }
      refund = {}
      for (const field of refundInfo._options.attributes) {
        refund[field] = refundInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.refundid, refund)
    }
    return refund
  }
}
