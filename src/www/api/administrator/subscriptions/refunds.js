const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let refundids
    if (req.query.all) {
      refundids = await subscriptions.Storage.Refund.findAll({
        attributes: ['refundid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      refundids = await subscriptions.Storage.Refund.findAll({
        attributes: ['refundid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!refundids || !refundids.length) {
      return null
    }
    const items = []
    for (const refundInfo of refundids) {
      req.query.refundid = refundInfo.dataValues.refundid
      const refund = await global.api.administrator.subscriptions.Refund.get(req)
      items.push(refund)
    }
    return items
  }
}
