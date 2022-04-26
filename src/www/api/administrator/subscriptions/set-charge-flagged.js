const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.chargeid) {
      throw new Error('invalid-chargeid')
    }
    const charge = await global.api.administrator.subscriptions.Charge.get(req)
    if (!charge) {
      throw new Error('invalid-chargeid')
    }
    if (charge.stripeObject.fraud_details.user_report) {
      throw new Error('invalid-charge')
    }
    const chargeInfo = {
      fraud_details: {
        user_report: 'fraudulent'
      }
    }
    const chargeNow = await stripeCache.execute('charges', 'update', req.query.chargeid, chargeInfo, req.stripeKey)
    await subscriptions.Storage.Charge.update({
      stripeObject: chargeNow
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
