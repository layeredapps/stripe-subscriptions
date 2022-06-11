const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.subscriptionitemid) {
    req.error = 'invalid-subscriptionitemid'
    req.removeContents = true
    req.data = {
      subscriptionItem: {
        subscriptionitem: ''
      }
    }
    return
  }
  let subscriptionItemRaw
  try {
    subscriptionItemRaw = await global.api.administrator.subscriptions.SubscriptionItem.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      subscriptionItem: {
        subscriptionitemid: ''
      }
    }
    if (error.message === 'invalid-subscriptionitemid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const subscriptionItem = formatStripeObject(subscriptionItemRaw)
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      subscriptionItem: {
        subscriptionitemid: ''
      }
    }
    return
  }
  req.data = { subscriptionItem }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.subscriptionItem, 'subscription_item')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  } else {
    if (req.body) {
      const quantityField = doc.getElementById('quantity')
      quantityField.setAttribute('value', req.body.quantity || '')
    } else {
      const quantityField = doc.getElementById('quantity')
      quantityField.setAttribute('value', req.data.subscriptionItem.quantity)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.quantity) {
    return renderPage(req, res, 'invalid-quantity')
  }
  try {
    const quantity = parseInt(req.body.quantity, 10)
    if (quantity < 1) {
      return renderPage(req, res, 'invalid-quantity')
    }
  } catch (error) {
    return renderPage(req, res, 'invalid-quantity')
  }
  try {
    await global.api.administrator.subscriptions.SetSubscriptionItemQuantity.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?subscriptionitemid=${req.query.subscriptionitemid}&message=success`
    })
    return res.end()
  }
}
