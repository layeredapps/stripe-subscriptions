const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.setupintentid) {
      throw new Error('invalid-setupintentid')
    }
    let setupIntent = await dashboard.StorageCache.get(req.query.setupintentid)
    if (!setupIntent) {
      const setupIntentInfo = await subscriptions.Storage.SetupIntent.findOne({
        where: {
          setupintentid: req.query.setupintentid,
          appid: req.appid || global.appid
        }
      })
      if (!setupIntentInfo) {
        throw new Error('invalid-setupintentid')
      }
      setupIntent = {}
      for (const field of setupIntentInfo._options.attributes) {
        setupIntent[field] = setupIntentInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.setupintentid, setupIntent)
    }
    return setupIntent
  }
}
