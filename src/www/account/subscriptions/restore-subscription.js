const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-subscription.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.subscriptionid) {
    req.error = 'invalid-subscriptionid'
    req.removeContents = true
    req.data = {
      subscription: {
        subscriptionid: ''
      }
    }
    return
  }
  let subscription
  try {
    let subscriptionRaw
    try {
      subscriptionRaw = await global.api.user.subscriptions.Subscription.get(req)
    } catch (error) {
      req.removeContents = true
      if (error.message === 'invalid-subscriptionid' || error.message === 'invalid-account') {
        req.error = error.message
      } else {
        req.error = 'unknown-error'
      }
      req.data = {
        subscription: {
          subscriptionid: req.query.subscriptionid
        }
      }
      return
    }
    subscription = formatStripeObject(subscriptionRaw)
  } catch (error) {
    req.error = error.message
    req.removeContents = true
  }
  if (req.error) {
    return
  }
  if (!subscription.cancel_at_period_end && req.query.message !== 'success') {
    req.error = 'invalid-subscription'
    req.removeContents = true
  }
  req.data = { subscription }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.subscription, 'subscription')
  navbar.setup(doc, req.data.subscription)
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
    await global.api.user.subscriptions.ResetSubscriptionCanceling.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?subscriptionid=${req.query.subscriptionid}&message=success`
    })
    return res.end()
  }
}
