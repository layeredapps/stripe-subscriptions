const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.customerid) {
    req.error = 'invalid-customerid'
    req.removeContents = true
    req.data = {
      customer: {
        customerid: ''
      }
    }
    return
  }
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      customer: {
        customerid: req.query.customerid
      }
    }
    return
  }
  let customerRaw
  try {
    customerRaw = await global.api.user.subscriptions.Customer.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
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
  req.data = { customer }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.customer, 'customer')
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
    await global.api.user.subscriptions.DeleteCustomer.delete(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?customerid=${req.query.customerid}&message=success`
    })
    return res.end()
  }
}
