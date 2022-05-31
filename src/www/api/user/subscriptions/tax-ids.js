const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.customerid) {
      throw new Error('invalid-customerid')
    }
    const customer = await global.api.user.subscriptions.Customer.get(req)
    if (!customer) {
      throw new Error('invalid-customerid')
    }
    const where = {
      appid: req.appid || global.appid,
      customerid: req.query.customerid
    }
    let taxids
    if (req.query.all) {
      taxids = await subscriptions.Storage.TaxId.findAll({
        where,
        attributes: ['taxid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      taxids = await subscriptions.Storage.TaxId.findAll({
        where,
        attributes: ['taxid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!taxids || !taxids.length) {
      return null
    }
    const items = []
    for (const taxidInfo of taxids) {
      req.query.taxid = taxidInfo.dataValues.taxid
      const taxid = await global.api.user.subscriptions.TaxId.get(req)
      items.push(taxid)
    }
    return items
  }
}
