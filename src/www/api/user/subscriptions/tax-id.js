const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.taxid) {
      throw new Error('invalid-taxid')
    }
    let taxid = await dashboard.StorageCache.get(req.query.taxid)
    if (!taxid) {
      const taxidInfo = await subscriptions.Storage.TaxId.findOne({
        where: {
          taxid: req.query.taxid,
          appid: req.appid || global.appid
        }
      })
      if (!taxidInfo) {
        throw new Error('invalid-taxid')
      }
      if (taxidInfo.dataValues.accountid !== req.account.accountid) {
        throw new Error('invalid-account')
      }
      taxid = {}
      for (const field of taxidInfo._options.attributes) {
        taxid[field] = taxidInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.taxid, taxid)
    }
    return taxid
  }
}
