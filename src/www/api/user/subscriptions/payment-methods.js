const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.customerid) {
      const customer = await global.api.user.subscriptions.Customer.get(req)
      if (!customer) {
        throw new Error('invalid-customer')
      }
      where.customerid = req.query.customerid
    } else {
      const account = await global.api.user.Account.get(req)
      if (!account) {
        throw new Error('invalid-account')
      }
      where.accountid = req.query.accountid
    }
    let paymentmethodids
    if (req.query.all) {
      paymentmethodids = await subscriptions.Storage.PaymentMethod.findAll({
        where,
        attributes: ['paymentmethodid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      paymentmethodids = await subscriptions.Storage.PaymentMethod.findAll({
        where,
        attributes: ['paymentmethodid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!paymentmethodids || !paymentmethodids.length) {
      return null
    }
    const items = []
    for (const paymentmethodInfo of paymentmethodids) {
      req.query.paymentmethodid = paymentmethodInfo.dataValues.paymentmethodid
      const paymentmethod = await global.api.user.subscriptions.PaymentMethod.get(req)
      items.push(paymentmethod)
    }
    return items
  }
}
