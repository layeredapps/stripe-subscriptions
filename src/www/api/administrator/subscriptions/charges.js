const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let chargeids
    if (req.query.all) {
      chargeids = await subscriptions.Storage.Charge.findAll({
        attributes: ['chargeid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      chargeids = await subscriptions.Storage.Charge.findAll({
        attributes: ['chargeid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!chargeids || !chargeids.length) {
      return null
    }
    const items = []
    for (const chargeInfo of chargeids) {
      req.query.chargeid = chargeInfo.dataValues.chargeid
      const charge = await global.api.administrator.subscriptions.Charge.get(req)
      items.push(charge)
    }
    return items
  }
}
