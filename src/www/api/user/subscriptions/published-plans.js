const subscriptions = require('../../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 1)
    const where = {
      publishedAt: {
        [sequelize.Op.lte]: minDate
      }
    }
    let planids
    if (req.query.all) {
      planids = await subscriptions.Storage.Plan.findAll({
        where,
        attributes: ['planid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      planids = await subscriptions.Storage.Plan.findAll({
        where,
        attributes: ['planid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!planids || !planids.length) {
      return null
    }
    const items = []
    for (const planInfo of planids) {
      req.query.planid = planInfo.dataValues.planid
      const plan = await global.api.user.subscriptions.PublishedPlan.get(req)
      items.push(plan)
    }
    return items
  }
}
