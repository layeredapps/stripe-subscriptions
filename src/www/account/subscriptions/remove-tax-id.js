const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.taxid) {
    req.error = 'invalid-taxid'
    req.removeContents = true
    req.data = {
      taxid: {
        taxid: ''
      }
    }
    return
  }
  if (!req.query.taxid) {
    req.error = 'invalid-taxid'
    req.removeContents = true
    req.data = {
      taxid: {
        taxid: ''
      }
    }
    return
  }
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      taxid: {
        taxid: req.query.taxid
      }
    }
    return
  }
  let taxidRaw
  try {
    taxidRaw = await global.api.user.subscriptions.TaxId.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      taxid: {
        taxid: ''
      }
    }
    if (error.message === 'invalid-taxid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const taxid = formatStripeObject(taxidRaw)
  req.data = { taxid }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.taxid, 'taxid')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      dashboard.HTML.renderTemplate(doc, null, 'success', 'message-container')
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.user.subscriptions.DeleteTaxId.delete(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?taxid=${req.query.taxid}&message=success`
    })
    return res.end()
  }
}
