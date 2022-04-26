const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.planid) {
      throw new Error('invalid-planid')
    }
    const plan = await global.api.administrator.subscriptions.Plan.get(req)
    if (!plan) {
      throw new Error('invalid-planid')
    }
    await stripeCache.execute('plans', 'del', req.query.planid, req.stripeKey)
    await subscriptions.Storage.Plan.destroy({
      where: {
        planid: req.query.planid,
        appid: req.appid || global.appid
      }
    })
    return true
  }
}
