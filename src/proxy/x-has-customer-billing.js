module.exports = addXHasCustomerBillingHeader

async function addXHasCustomerBillingHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const customers = await global.api.user.subscriptions.Customers.get(req)
  if (!customers) {
    proxyRequestOptions.headers['x-has-customer-billing'] = 'false'
    return
  }
  for (const i in customers) {
    if (customers[i].stripeObject.default_source) {
      proxyRequestOptions.headers['x-has-customer-billing'] = 'true'
      return
    }
    if (customers[i].stripeObject.invoice_settings && customers[i].stripeObject.invoice_settings.default_payment_method) {
      proxyRequestOptions.headers['x-has-customer-billing'] = 'true'
      return
    }
  }
  proxyRequestOptions.headers['x-has-customer-billing'] = 'false'
}
