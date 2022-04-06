const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    const where = {
      accountid: req.query.accountid
    }
    let chargeids
    if (req.query.all) {
      chargeids = await subscriptions.Storage.Charge.findAll({
        where,
        attributes: ['chargeid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      chargeids = await subscriptions.Storage.Charge.findAll({
        where,
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
      const charge = await global.api.user.subscriptions.Charge.get(req)
      items.push(charge)
    }
    return items
  }
}
