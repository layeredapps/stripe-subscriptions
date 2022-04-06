module.exports = async (req, proxyRequestOptions) => {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const subscriptions = await global.api.user.subscriptions.Subscriptions.get(req)
  if (!subscriptions) {
    proxyRequestOptions.headers['x-subscriptions'] = '[]'
    return
  }
  for (const i in subscriptions) {
    subscriptions[i] = subscriptions[i].stripeObject
  }
  proxyRequestOptions.headers['x-subscriptions'] = JSON.stringify(subscriptions)
}
