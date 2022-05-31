const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let taxcodeids
    if (req.query.all) {
      taxcodeids = await subscriptions.Storage.TaxCode.findAll({
        attributes: ['taxcodeid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      taxcodeids = await subscriptions.Storage.TaxCode.findAll({
        attributes: ['taxcodeid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!taxcodeids || !taxcodeids.length) {
      return null
    }
    const items = []
    for (const taxCodeInfo of taxcodeids) {
      req.query.taxcodeid = taxCodeInfo.dataValues.taxcodeid
      const taxCode = await global.api.administrator.subscriptions.TaxCode.get(req)
      items.push(taxCode)
    }
    return items
  }
}
