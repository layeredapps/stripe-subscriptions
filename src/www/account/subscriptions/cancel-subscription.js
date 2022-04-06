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
    throw new Error('invalid-subscriptionid')
  }
  if (req.query.message === 'success') {
    req.data = {
      subscription: {
        subscriptionid: req.query.subscriptionid,
        object: 'subscription',
        stripeObject: {
          id: req.query.subscriptionid,
          object: 'subscription'
        }
      },
      plan: {
        stripeObject: {}
      }
    }
    return
  }
  let subscription
  try {
    const subscriptionRaw = await global.api.user.subscriptions.Subscription.get(req)
    subscription = formatStripeObject(subscriptionRaw)
  } catch (error) {
    req.error = error.message
  }
  if (req.error) {
    req.data = {
      subscription: {
        subscriptionid: req.query.subscriptionid,
        object: 'subscription',
        stripeObject: {
          id: req.query.subscriptionid,
          object: 'subscription'
        }
      },
      plan: {
        stripeObject: {}
      }
    }
    return
  }
  req.query.planid = subscription.planid
  const planRaw = await global.api.user.subscriptions.PublishedPlan.get(req)
  const plan = formatStripeObject(planRaw)
  if (plan.amount) {
    plan.amountFormatted = dashboard.Format.money(plan.amount, plan.currency)
  }
  if ((subscription.status !== 'active' && subscription.status !== 'trialing') || subscription.cancel_at_period_end) {
    req.error = 'invalid-subscription'
  }
  req.data = { subscription, plan }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || req.error || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.subscription, 'subscription')
  navbar.setup(doc, req.data.subscription)
  if (messageTemplate) {
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      if (req.query.refund === 'credit') {
        dashboard.HTML.renderTemplate(doc, null, 'success-credit', 'message-container')
      } else if (req.query.refund === 'refund') {
        dashboard.HTML.renderTemplate(doc, null, 'success-refund', 'message-container')
      } else {
        dashboard.HTML.renderTemplate(doc, null, 'success', 'message-container')
      }
      return dashboard.Response.end(req, res, doc)
    }
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  const removeElements = []
  if (!req.data.plan.amount) {
    removeElements.push('refund-label', 'credit-label')
  } else if (req.data.subscription.trial_start && req.data.subscription.trial_end === req.data.subscription.current_period_end) {
    removeElements.push('refund-label', 'credit-label')
  } else {
    if (req.method === 'GET') {
      const ending = doc.getElementById('delay-checkbox')
      ending.setAttribute('checked', true)
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    if (!element.parentNode) {
      throw new Error('error removing element ' + id)
    }
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  let type
  try {
    if (req.body && req.body.refund === 'at_period_end') {
      type = 'at_period_end'
      await global.api.user.subscriptions.SetSubscriptionCanceled.patch(req)
    } else if (req.body && req.body.refund) {
      type = req.body.refund
      await global.api.user.subscriptions.DeleteSubscription.delete(req)
    } else {
      type = 'immediate'
      await global.api.user.subscriptions.DeleteSubscription.delete(req)
    }
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?subscriptionid=${req.query.subscriptionid}&message=success&refund=${type}`
    })
    return res.end()
  }
}
