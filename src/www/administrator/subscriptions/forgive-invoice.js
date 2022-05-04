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
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      invoice: {
        invoiceid: req.query.invoiceid
      }
    }
    return
  }
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
      invoice: {
        invoiceid: req.query.invoiceid
      }
    }
    return
  }
  const invoice = formatStripeObject(invoiceRaw)
  if (invoice.status !== 'open' && invoice.status !== 'draft') {
    if (invoice.status === 'uncollectible') {
      req.error = 'already-forgiven'
    } else if (invoice.status === 'paid') {
      req.error = 'already-paid'
    } else {
      req.error = 'invalid-invoice'
    }
    req.removeContents = true
    req.data = {
      invoice: {
        invoiceid: ''
      }
    }
    return
  }
  req.data = { invoice }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.invoice, 'invoice')
  navbar.setup(doc, req.data.invoice)
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
    await global.api.administrator.subscriptions.SetInvoiceUncollectible.patch(req)
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
