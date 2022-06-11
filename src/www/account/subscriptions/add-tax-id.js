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
        customerid: '',
        object: 'customer'
      }
    }
    return
  }
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      customer: {
        customerid: req.query.customerid,
        object: 'customer'
      }
    }
    return
  }
  let customer
  try {
    let customerRaw
    try {
      customerRaw = await global.api.user.subscriptions.Customer.get(req)
    } catch (error) {
      req.removeContents = true
      if (error.message === 'invalid-customerid' || error.message === 'invalid-account') {
        req.error = error.message
      } else {
        req.error = 'unknown-error'
      }
      req.data = {
        customer: {
          customerid: req.query.customerid,
          object: 'customer'
        }
      }
      return
    }
    customer = formatStripeObject(customerRaw)
  } catch (error) {
    req.error = error.message
    req.removeContents = true
  }
  if (req.error) {
    return
  }
  req.data = { customer }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.customer, 'customer')
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
  try {
    await global.api.user.subscriptions.CreateTaxId.post(req)
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
