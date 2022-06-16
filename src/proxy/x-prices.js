module.exports = addXPlansHeader

async function addXPlansHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.all = true
  const prices = await global.api.user.subscriptions.ActivePrices.get(req)
  if (!prices) {
    proxyRequestOptions.headers['x-active-prices'] = '[]'
    return
  }
  for (const i in prices) {
    prices[i] = prices[i].stripeObject
  }
  proxyRequestOptions.headers['x-active-prices'] = JSON.stringify(prices)
}
