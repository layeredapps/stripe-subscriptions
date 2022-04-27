module.exports = addXInvoicesOpenHeader

async function addXInvoicesOpenHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const invoices = await global.api.user.subscriptions.Invoices.get(req)
  if (!invoices) {
    proxyRequestOptions.headers['x-invoices-open'] = '[]'
    return
  }
  const due = []
  for (const i in invoices) {
    invoices[i] = invoices[i].stripeObject
    if (invoices[i].status === 'open') {
      due.push(invoices)
    }
  }
  proxyRequestOptions.headers['x-invoices-open'] = JSON.stringify(invoices)
}
