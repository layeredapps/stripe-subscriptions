const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.chargeid) {
      throw new Error('invalid-chargeid')
    }
    if (!req.body || !req.body.reason) {
      throw new Error('invalid-reason')
    }
    if (!req.body.reason.length || req.body.reason.length > 200) {
      throw new Error('invalid-reason-length')
    }
    const charge = await global.api.administrator.subscriptions.Charge.get(req)
    if (!charge.stripeObject.amount || !charge.stripeObject.paid || charge.refunded) {
      throw new Error('invalid-charge')
    }
    if (!charge.refundRequested || charge.refundDenied) {
      throw new Error('invalid-charge')
    }
    await subscriptions.Storage.Charge.update({
      refundDenied: Math.floor(new Date().getTime() / 1000),
      refundDeniedReason: req.body.reason
    }, {
      where: {
        chargeid: req.query.chargeid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.chargeid)
    return global.api.administrator.subscriptions.Charge.get(req)
  }
}
