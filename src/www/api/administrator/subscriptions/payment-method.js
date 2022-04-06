const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.paymentmethodid) {
      throw new Error('invalid-paymentmethodid')
    }
    let paymentMethod = await dashboard.StorageCache.get(req.query.paymentmethodid)
    if (!paymentMethod) {
      const paymentMethodInfo = await subscriptions.Storage.PaymentMethod.findOne({
        where: {
          paymentmethodid: req.query.paymentmethodid
        }
      })
      if (!paymentMethodInfo) {
        throw new Error('invalid-paymentmethodid')
      }
      paymentMethod = {}
      for (const field of paymentMethodInfo._options.attributes) {
        paymentMethod[field] = paymentMethodInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.paymentmethodid, paymentMethod)
    }
    return paymentMethod
  }
}
