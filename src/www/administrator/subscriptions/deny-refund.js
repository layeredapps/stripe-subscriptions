const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-charge.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.chargeid) {
    req.error = 'invalid-chargeid'
    req.removeContents = true
    req.data = {
      charge: {
        chargeid: '',
        fraud_details: {}
      }
    }
    return
  }
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      charge: {
        chargeid: req.query.chargeid,
        fraud_details: {}
      }
    }
    return
  }
  let chargeRaw
  try {
    chargeRaw = await global.api.administrator.subscriptions.Charge.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      charge: {
        chargeid: '',
        fraud_details: {}
      }
    }
    if (error.message === 'invalid-chargeid' || error.message === 'invalid-charge') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const charge = formatStripeObject(chargeRaw)
  if (!charge.refundRequested) {
    req.error = 'no-refund-request'
    req.removeContents = true
    req.data = {
      charge: {
        chargeid: '',
        fraud_details: {}
      }
    }
    return
  }
  if (charge.refundDenied) {
    req.error = 'already-denied'
    req.removeContents = true
    req.data = {
      charge: {
        chargeid: '',
        fraud_details: {}
      }
    }
    return
  }
  req.query.invoiceid = charge.invoice
  let invoiceRaw
  try {
    invoiceRaw = await global.api.administrator.subscriptions.Invoice.get(req)
  } catch (error) {
    if (error.message === 'invalid-invoiceid' || error.message === 'invalid-invoice') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.removeContents = true
    req.data = {
      charge: {
        chargeid: '',
        fraud_details: {}
      }
    }
    return
  }
  const invoice = formatStripeObject(invoiceRaw)
  req.data = { charge, invoice }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.charge, 'charge')
  navbar.setup(doc, req.data.charge)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  }
  return dashboard.Response.end(req, res, doc.toString())
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.subscriptions.SetRefundRequestDenied.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?chargeid=${req.query.chargeid}&message=success`
    })
    return res.end()
  }
}
