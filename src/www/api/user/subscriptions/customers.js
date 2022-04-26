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
      accountid: req.query.accountid,
      appid: req.appid || global.appid
    }
    let customerids
    if (req.query.all) {
      customerids = await subscriptions.Storage.Customer.findAll({
        where,
        attributes: ['customerid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      customerids = await subscriptions.Storage.Customer.findAll({
        where,
        attributes: ['customerid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!customerids || !customerids.length) {
      return null
    }
    const items = []
    for (const customerInfo of customerids) {
      req.query.customerid = customerInfo.dataValues.customerid
      const customer = await global.api.user.subscriptions.Customer.get(req)
      items.push(customer)
    }
    return items
  }
}
