const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-invoice.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.invoiceid) {
    throw new Error('invalid-invoiceid')
  }
  const invoiceRaw = await global.api.user.subscriptions.Invoice.get(req)
  const invoice = formatStripeObject(invoiceRaw)
  if (req.query.message === 'success') {
    req.data = {
      invoice
    }
    return
  }
  if (invoice.paid) {
    throw new Error('invalid-invoice')
  }
  let subscription
  if (invoice.subscription) {
    req.query.subscriptionid = invoice.subscription || invoice.lines.data[invoice.lines.data.length - 1].subscription
    const subscriptionRaw = await global.api.user.subscriptions.Subscription.get(req)
    subscription = formatStripeObject(subscriptionRaw)
  }
  req.query.customerid = invoice.customer
  const customerRaw = await global.api.user.subscriptions.Customer.get(req)
  const customer = formatStripeObject(customerRaw)
  req.data = { customer, invoice, subscription }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.invoice, 'invoice')

  await navbar.setup(doc, req.data.invoice)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  req.body = req.body || {}
  req.body.paymentmethodid = req.data.customer.invoice_settings.default_payment_method
  try {
    await global.api.user.subscriptions.SetInvoicePaid.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?invoiceid=${req.query.invoiceid}&message=success`
    })
    return res.end()
  }
}
