const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.paymentintentid) {
    req.error = 'invalid-paymentintentid'
    req.removeContents = true
    req.data = {
      paymentIntent: {
        paymentintentid: ''
      }
    }
    return
  }
  let paymentIntentRaw
  try {
    paymentIntentRaw = await global.api.administrator.subscriptions.PaymentIntent.get(req)
  } catch (error) {
    if (error.message === 'invalid-paymentintentid' || error.message === 'invalid-paymentintent') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.removeContents = true
    req.data = {
      paymentintent: {
        paymentintentid: req.query.paymentintentid
      }
    }
    return
  }
  const paymentIntent = formatStripeObject(paymentIntentRaw)
  req.data = { paymentIntent }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.paymentIntent, 'payment_intent')
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('payment_intents-table')
    }
  } else {
    for (const status of ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded', 'requires_source']) {
      if (req.data.paymentIntent.status !== status) {
        removeElements.push(status)
      }
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
