const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.chargeid) {
      throw new Error('invalid-chargeid')
    }
    let charge = await dashboard.StorageCache.get(req.query.chargeid)
    if (!charge) {
      const chargeInfo = await subscriptions.Storage.Charge.findOne({
        where: {
          chargeid: req.query.chargeid
        }
      })
      if (!chargeInfo) {
        throw new Error('invalid-chargeid')
      }
      charge = {}
      for (const field of chargeInfo._options.attributes) {
        charge[field] = chargeInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.chargeid, charge)
    }
    return charge
  }
}
