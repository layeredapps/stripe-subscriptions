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
  if (!invoice.paid) {
    throw new Error('invalid-invoice')
  }
  req.query.chargeid = invoice.charge
  const chargeRaw = await global.api.user.subscriptions.Charge.get(req)
  const charge = formatStripeObject(chargeRaw)
  if (req.query.message === 'success') {
    req.data = { invoice, charge }
    return
  } if (!charge.amount || !charge.paid || (charge.refunded && req.query.messageTemplate !== 'success')) {
    throw new Error('invalid-charge')
  }
  req.data = { invoice, charge }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.invoice, 'invoice')
  if (req.data.charge.refundRequested && messageTemplate !== 'success') {
    messageTemplate = 'refund-requested'
    if (req.data.charge.refundDenied) {
      messageTemplate = 'refund-denied'
    }
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    const submitForm = doc.getElementById('submit-form')
    submitForm.parentNode.removeChild(submitForm)
    return dashboard.Response.end(req, res, doc)
  }
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
  if (!req.body) {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (!req.body.reason || !req.body.reason.length) {
    return renderPage(req, res, 'invalid-reason')
  }
  if (req.body.reason.length > 200) {
    return renderPage(req, res, 'invalid-reason-length')
  }
  req.query.chargeid = req.data.charge.id
  req.body.chargeid = req.data.charge.id
  try {
    await global.api.user.subscriptions.CreateRefundRequest.post(req)
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
