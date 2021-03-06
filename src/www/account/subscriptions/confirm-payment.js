const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')
const stripeContentSecurityPolicy = "img-src 'self' data:; font-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://*.stripe.com; script-src 'unsafe-inline' https://*.stripe.com; frame-src https://*.stripe.com https://*.stripe.network; connect-src https://*.stripe.com;"

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.invoiceid) {
    req.error = 'invalid-invoiceid'
    req.removeContents = true
    req.data = {
      paymentIntent: {
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
      paymentIntent: {
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
  if (!invoiceRaw) {
    req.error = 'invalid-invoiceid'
    return
  }
  const invoice = formatStripeObject(invoiceRaw)
  if (invoice.paid || !invoice.amount_due || invoice.status !== 'open') {
    req.error = 'invalid-invoice'
    return
  }
  req.query.paymentintentid = invoice.payment_intent
  let paymentIntentRaw
  try {
    paymentIntentRaw = await global.api.user.subscriptions.PaymentIntent.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      paymentIntent: {
        invoiceid: ''
      }
    }
    if (error.message === 'invalid-paymentintentid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const paymentIntent = formatStripeObject(paymentIntentRaw)
  paymentIntent.stripePublishableKey = global.stripePublishableKey
  if (!paymentIntent) {
    req.error = 'invalid-invoice'
    return
  }
  req.data = { paymentIntent }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.paymentIntent, 'payment_intent')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const stripeJavaScript = doc.getElementById('stripe-v3')
      stripeJavaScript.parentNode.removeChild(stripeJavaScript)
      const javascriptRedirect = doc.getElementById('javascript')
      javascriptRedirect.parentNode.removeChild(javascriptRedirect)
      return dashboard.Response.end(req, res, doc)
    }
  } else {
    req.contentSecurityPolicy = req.contentSecurityPolicy || global.contentSecurityPolicy || stripeContentSecurityPolicy
  }
  return dashboard.Response.end(req, res, doc)
}
