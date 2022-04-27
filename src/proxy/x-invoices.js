module.exports = addXInvoicesHeader

async function addXInvoicesHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const invoices = await global.api.user.subscriptions.Invoices.get(req)
  if (!invoices) {
    proxyRequestOptions.headers['x-invoices'] = '[]'
    return
  }
  for (const i in invoices) {
    invoices[i] = invoices[i].stripeObject
  }
  proxyRequestOptions.headers['x-invoices'] = JSON.stringify(invoices)
}
