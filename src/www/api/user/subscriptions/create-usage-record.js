const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    const subscription = await global.api.user.subscriptions.Subscription.get(req)
    if (!subscription) {
      throw new Error('invalid-subscriptionid')
    }
    req.query.planid = subscription.planid
    const plan = await global.api.user.subscriptions.PublishedPlan.get(req)
    if (plan.stripeObject.usage_type !== 'metered') {
      throw new Error('invalid-subscription')
    }
    if (!req.body) {
      throw new Error('invalid-quantity')
    }
    try {
      const quantity = parseInt(req.body.quantity, 10)
      if (req.body.quantity !== quantity.toString()) {
        throw new Error('invalid-quantity')
      }
    } catch (s) {
      throw new Error('invalid-quantity')
    }
    if (req.body.quantity < 0) {
      throw new Error('invalid-quantity')
    }
    if (!req.body.action || (req.body.action !== 'increment' && req.body.action !== 'set')) {
      throw new Error('invalid-action')
    }
    if (!req.body.subscriptionitemid || !req.body.subscriptionitemid.length) {
      throw new Error('invalid-subscriptionitemid')
    }
    let found = false
    for (const item of subscription.stripeObject.items.data) {
      found = item.id === req.body.subscriptionitemid
      if (found) {
        break
      }
    }
    if (!found) {
      throw new Error('invalid-subscriptionitemid')
    }
    const usageInfo = {
      action: req.body.action,
      quantity: req.body.quantity
    }
    if (Math.floor(new Date().getTime() / 1000) >= subscription.stripeObject.current_period_start) {
      usageInfo.timestamp = Math.floor(new Date().getTime() / 1000)
    } else {
      usageInfo.timestamp = subscription.stripeObject.current_period_start
    }
    const usageRecord = await stripeCache.execute('subscriptionItems', 'createUsageRecord', req.body.subscriptionitemid, usageInfo, req.stripeKey)
    if (!usageRecord) {
      throw new Error('invalid-usagerecord')
    }
    await subscriptions.Storage.UsageRecord.create({
      appid: req.appid || global.appid,
      usagerecordid: usageRecord.id,
      stripeObject: usageRecord,
      customerid: subscription.stripeObject.customer,
      accountid: req.account.accountid,
      productid: subscription.productid,
      planid: subscription.planid,
      subscriptionid: req.query.subscriptionid,
      subscriptionitemid: req.body.subscriptionitemid
    })
    req.query.usagerecordid = usageRecord.id
    return global.api.user.subscriptions.UsageRecord.get(req)
  }
}
