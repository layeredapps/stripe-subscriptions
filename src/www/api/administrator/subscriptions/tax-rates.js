const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.all) {
      taxrateids = await subscriptions.Storage.TaxRate.findAll({
        where,
        attributes: ['taxrateid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      taxrateids = await subscriptions.Storage.TaxRate.findAll({
        where,
        attributes: ['taxrateid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!taxrateids || !taxrateids.length) {
      return null
    }
    const items = []
    for (const taxRateInfo of taxrateids) {
      req.query.taxrateid = taxRateInfo.dataValues.taxrateid
      const taxRate = await global.api.administrator.subscriptions.TaxRate.get(req)
      items.push(taxRate)
    }
    return items
  }
}
