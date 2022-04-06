const dashboard = require('@layeredapps/dashboard')
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
  if (!invoice.paid || invoice.created < Math.floor(new Date().getTime() / 1000) - global.subscriptionRefundPeriod) {
    throw new Error('invalid-invoice')
  }
  req.query.chargeid = invoice.charge
  const chargeRaw = await global.api.user.subscriptions.Charge.get(req)
  const charge = formatStripeObject(chargeRaw)
  if (!charge.amount || !charge.paid || charge.refunded ||
    charge.created < Math.floor(new Date().getTime() / 1000) - global.subscriptionRefundPeriod) {
    throw new Error('invalid-charge')
  }
  const amount = charge.amount - (charge.amount_refunded || 0)
  req.data = { invoice, charge, amount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.invoice, 'invoice')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
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
