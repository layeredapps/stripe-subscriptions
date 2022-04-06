const subscriptions = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.chargeid) {
      throw new Error('invalid-chargeid')
    }
    if (!req.body || !req.body.reason) {
      throw new Error('invalid-reason')
    }
    if (!req.body.reason.length || req.body.reason.length > 200) {
      throw new Error('invalid-reason-length')
    }
    const charge = await global.api.user.subscriptions.Charge.get(req)
    if (!charge.stripeObject.amount || !charge.stripeObject.paid || charge.stripeObject.refunded) {
      throw new Error('invalid-charge')
    }
    if (charge.refundRequested) {
      throw new Error('invalid-charge')
    }
    await subscriptions.Storage.Charge.update({
      refundRequested: new Date(),
      refundReason: req.body.reason
    }, {
      where: {
        chargeid: req.query.chargeid
      }
    })
    return global.api.user.subscriptions.Charge.get(req)
  }
}
