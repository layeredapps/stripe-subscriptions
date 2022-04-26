const subscriptions = require('../../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 1)
    const where = {
      refundRequested: {
        [sequelize.Op.lte]: minDate
      },
      appid: req.appid || global.appid
    }
    let chargeids
    if (req.query.all) {
      chargeids = await subscriptions.Storage.Charge.findAll({
        where,
        attributes: ['chargeid'],
        order: [
          ['refundRequested', 'DESC']
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
          ['refundRequested', 'DESC']
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
