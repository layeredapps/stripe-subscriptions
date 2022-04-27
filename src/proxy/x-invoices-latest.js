module.exports = addXInvoicesLatestHeader

async function addXInvoicesLatestHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const subscriptions = await global.api.user.subscriptions.Subscriptions.get(req)
  if (!subscriptions) {
    proxyRequestOptions.headers['x-invoices-latest'] = '[]'
    return
  }
  const invoices = []
  for (const i in subscriptions) {
    subscriptions[i] = subscriptions[i].stripeObject
    if (subscriptions[i].latest_invoice) {
      req.query.invoiceid = subscriptions[i].latest_invoice
      try {
        const invoice = await global.api.user.subscriptions.Invoice.get(req)
        invoices.push(invoice)
      } catch (error) {
      }
    }
  }
  proxyRequestOptions.headers['x-invoices-latest'] = JSON.stringify(invoices)
}
