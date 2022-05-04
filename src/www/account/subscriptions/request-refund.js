const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.invoiceid) {
    req.removeContents = true
    req.data = {
      invoice: {
        invoiceid: ''
      }
    }
    req.error = 'invalid-invoiceid'
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
  if (!invoice.paid) {
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
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = { invoice, charge }
    return
  } if (!charge.amount || !charge.paid || (charge.refunded && req.query.messageTemplate !== 'success')) {
    req.error = 'invalid-charge'
    req.removeContents = true
    req.data = {
      invoice: {
        invoiceid: ''
      }
    }
    return
  }
  req.data = { invoice, charge }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
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
    if (req.removeContents) {
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
