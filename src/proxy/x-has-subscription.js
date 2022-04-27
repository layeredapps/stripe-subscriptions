module.exports = xHasSubscriptionHeader

async function xHasSubscriptionHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const subscriptions = await global.api.user.subscriptions.Subscriptions.get(req)
  if (!subscriptions) {
    proxyRequestOptions.headers['x-has-subscription'] = 'false'
    return
  }
  for (const i in subscriptions) {
    subscriptions[i] = subscriptions[i].stripeObject
    if (!subscriptions[i].cancel_at_period_end && subscriptions[i].canceled_at) {
      proxyRequestOptions.headers['x-has-subscription'] = 'true'
      return
    }
  }
  proxyRequestOptions.headers['x-has-subscription'] = 'false'
}
