const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.planid) {
      throw new Error('invalid-planid')
    }
    const plan = await global.api.administrator.subscriptions.Plan.get(req)
    if (!plan) {
      throw new Error('invalid-planid')
    }
    if (!plan.publishedAt || plan.unpublishedAt) {
      throw new Error('invalid-plan')
    }
    await subscriptions.Storage.Plan.update({
      unpublishedAt: new Date()
    }, {
      where: {
        planid: req.query.planid
      }
    })
    return global.api.administrator.subscriptions.Plan.get(req)
  }
}
