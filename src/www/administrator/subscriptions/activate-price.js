const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-price.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.priceid) {
    req.error = 'invalid-priceid'
    req.removeContents = true
    req.data = {
      price: {
        priceid: ''
      }
    }
    return
  }
  let priceRaw
  try {
    priceRaw = await global.api.administrator.subscriptions.Price.get(req)
  } catch (error) {
    req.removeContents = true
    if (error.message === 'invalid-priceid' || error.message === 'invalid-price') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.data = {
      price: {
        priceid: req.query.priceid
      }
    }
    return
  }
  const price = formatStripeObject(priceRaw)
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      price
    }
    return
  }
  if (price.active) {
    req.error = 'already-active'
    req.removeContents = true
    req.data = {
      price: {
        priceid: ''
      }
    }
    return
  }
  req.data = { price }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.price, 'price')
  navbar.setup(doc, req.data.price)
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
    await global.api.administrator.subscriptions.SetPriceActive.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?priceid=${req.query.priceid}&message=success`
    })
    return res.end()
  }
}
