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
    req.error = 'invalid-invoiceid'
    req.removeContents = true
    req.data = {
      invoice: {
        invoiceid: ''
      }
    }
    return
  }
  let invoiceRaw
  try {
    invoiceRaw = await global.api.user.subscriptions.Invoice.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      invoice: {
        invoiceid: ''
      }
    }
    if (error.message === 'invalid-invoiceid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const invoice = formatStripeObject(invoiceRaw)
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      invoice
    }
    return
  }
  if (invoice.paid) {
    req.removeContents = true
    req.error = 'invoice-paid'
    req.data = {
      invoice: {
        invoiceid: ''
      }
    }
    return
  }
  let subscription
  if (invoice.subscription) {
    req.query.subscriptionid = invoice.subscription || invoice.lines.data[invoice.lines.data.length - 1].subscription
    let subscriptionRaw
    try {
      subscriptionRaw = await global.api.user.subscriptions.Subscription.get(req)
    } catch (error) {
      req.removeContents = true
      if (error.message === 'invalid-subscriptionid' || error.message === 'invalid-account') {
        req.error = error.message
      } else {
        req.error = 'unknown-error'
      }
      req.data = {
        subscription: {
          subscriptionid: req.query.subscriptionid
        }
      }
      return
    }
    subscription = formatStripeObject(subscriptionRaw)
  }
  req.query.customerid = invoice.customer
  let customerRaw
  try {
    customerRaw = await global.api.user.subscriptions.Customer.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      invoice: {
        invoiceid: req.query.invoiceid
      },
      customer: {
        customerid: ''
      }
    }
    if (error.message === 'invalid-customerid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const customer = formatStripeObject(customerRaw)
  req.data = { customer, invoice, subscription }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.invoice, 'invoice')
  await navbar.setup(doc, req.data.invoice)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
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
