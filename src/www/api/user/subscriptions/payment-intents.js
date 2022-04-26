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
    let paymentintentids
    if (req.query.all) {
      paymentintentids = await subscriptions.Storage.PaymentIntent.findAll({
        where,
        attributes: ['paymentintentid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      paymentintentids = await subscriptions.Storage.PaymentIntent.findAll({
        where,
        attributes: ['paymentintentid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!paymentintentids || !paymentintentids.length) {
      return null
    }
    const items = []
    for (const paymentintentInfo of paymentintentids) {
      req.query.paymentintentid = paymentintentInfo.dataValues.paymentintentid
      const paymentintent = await global.api.user.subscriptions.PaymentIntent.get(req)
      items.push(paymentintent)
    }
    return items
  }
}
