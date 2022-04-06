const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  auth: false,
  get: async (req) => {
    if (!req.query || !req.query.planid) {
      throw new Error('invalid-planid')
    }
    let plan = await dashboard.StorageCache.get(req.query.planid)
    if (!plan) {
      const planInfo = await subscriptions.Storage.Plan.findOne({
        where: {
          planid: req.query.planid
        }
      })
      if (!planInfo) {
        throw new Error('invalid-planid')
      }
      if (!planInfo.dataValues.publishedAt) {
        throw new Error('invalid-plan')
      }
      plan = {}
      for (const field of planInfo._options.attributes) {
        plan[field] = planInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.planid, plan)
    }
    return plan
  }
}
