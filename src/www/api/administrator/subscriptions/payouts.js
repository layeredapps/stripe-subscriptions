const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let payoutids
    if (req.query.all) {
      payoutids = await subscriptions.Storage.Payout.findAll({
        attributes: ['payoutid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      payoutids = await subscriptions.Storage.Payout.findAll({
        attributes: ['payoutid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!payoutids || !payoutids.length) {
      return null
    }
    const items = []
    for (const payoutInfo of payoutids) {
      req.query.payoutid = payoutInfo.dataValues.payoutid
      const payout = await global.api.administrator.subscriptions.Payout.get(req)
      items.push(payout)
    }
    return items
  }
}
