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
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      subscription: {
        subscriptionid: req.query.subscriptionid
      }
    }
    return
  }
  let subscriptionRaw
  try {
    subscriptionRaw = await global.api.administrator.subscriptions.Subscription.get(req)
  } catch (error) {
    req.removeContents = true
    if (error.message === 'invalid-subscriptionid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.data = {
      subscription: {
        subscriptionid: ''
      }
    }
    return
  }
  const subscription = formatStripeObject(subscriptionRaw)
  if ((subscription.status !== 'active' && subscription.status !== 'trialing') ||
      subscription.cancel_at_period_end) {
    req.error = 'invalid-subscription'
  }
  req.data = { subscription }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.subscription, 'subscription')
  navbar.setup(doc, req.data.subscription)
  if (messageTemplate) {
    if (messageTemplate === 'success') {
      dashboard.HTML.renderTemplate(doc, null, `${messageTemplate}-${req.query.type}`, 'message-container')
    } else {
      console.log('message template', messageTemplate)
      dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    }
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  let type
  try {
    if (req.body && req.body.cancelation === 'delayed') {
      type = 'delayed'
      await global.api.administrator.subscriptions.SetSubscriptionCanceled.patch(req)
    } else {
      type = 'immediate'
      await global.api.administrator.subscriptions.DeleteSubscription.delete(req)
    }
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?subscriptionid=${req.query.subscriptionid}&message=success&type=${type}`
    })
    return res.end()
  }
}
