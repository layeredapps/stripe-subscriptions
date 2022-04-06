const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.paymentintentid) {
      throw new Error('invalid-paymentintentid')
    }
    let paymentIntent = await dashboard.StorageCache.get(req.query.paymentintentid)
    if (!paymentIntent) {
      const paymentIntentInfo = await subscriptions.Storage.PaymentIntent.findOne({
        where: {
          paymentintentid: req.query.paymentintentid
        }
      })
      if (!paymentIntentInfo) {
        throw new Error('invalid-paymentintentid')
      }
      if (paymentIntentInfo.dataValues.accountid !== req.account.accountid) {
        throw new Error('invalid-account')
      }
      paymentIntent = {}
      for (const field of paymentIntentInfo._options.attributes) {
        paymentIntent[field] = paymentIntentInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.paymentintentid, paymentIntent)
    }
    return paymentIntent
  }
}
