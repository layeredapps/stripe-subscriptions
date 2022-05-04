const dashboard = require('@layeredapps/dashboard')
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
  if (!invoice.paid || invoice.created < Math.floor(new Date().getTime() / 1000) - global.subscriptionRefundPeriod) {
    req.error = 'invalid-invoice'
    return
  }
  req.query.chargeid = invoice.charge
  let chargeRaw
  try {
    chargeRaw = await global.api.user.subscriptions.Charge.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      invoice: {
        invoiceid: ''
      }
    }
    if (error.message === 'invalid-chargeid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const charge = formatStripeObject(chargeRaw)
  if (!charge.amount || !charge.paid || charge.refunded ||
    charge.created < Math.floor(new Date().getTime() / 1000) - global.subscriptionRefundPeriod) {
    req.error = 'not-paid'
    return
  }
  const amount = charge.amount - (charge.amount_refunded || 0)
  req.data = { invoice, charge, amount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.invoice, 'invoice')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  dashboard.HTML.renderTemplate(doc, req.data.charge, 'refund-template', 'refund-now')
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  req.query.chargeid = req.data.charge.id
  req.body = req.body || {}
  req.body.chargeid = req.data.charge.id
  try {
    await global.api.user.subscriptions.CreateRefund.post(req)
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
