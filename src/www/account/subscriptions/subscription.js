const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-subscription.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
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
        subscriptionid: ''
      }
    }
    return
  }
  const subscription = formatStripeObject(subscriptionRaw)
  if (subscription.status === 'canceled') {
    req.error = 'invalid-subscription'
    return
  }
  req.query.planid = subscription.planid
  let planRaw
  try {
    planRaw = await global.api.user.subscriptions.PublishedPlan.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      subscription: {
        subscriptionid: ''
      }
    }
    if (error.message === 'invalid-planid' || error.message === 'invalid-plan') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const plan = formatStripeObject(planRaw)
  subscription.amountFormatted = dashboard.Format.money(plan.amount || 0, plan.currency)
  subscription.currency = plan.currency
  if (!plan.amount || (subscription.status !== 'trialing' && subscription.status !== 'active') || subscription.cancel_at_period_end) {
    subscription.nextCharge = '-'
  } else {
    subscription.nextCharge = new Date(subscription.current_period_end * 1000)
  }
  req.query.accountid = req.account.accountid
  const invoices = await global.api.user.subscriptions.Invoices.get(req)
  if (invoices && invoices.length) {
    for (const i in invoices) {
      const invoice = formatStripeObject(invoices[i])
      invoices[i] = invoice
    }
  }
  req.data = { subscription, plan, invoices }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const removeElements = []
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.subscription, 'subscription')
  navbar.setup(doc, req.data.subscription)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('subscriptions-table', 'invoices-container')
    }
  } else {
    if (req.data.subscription.status === 'trialing') {
      removeElements.push(`canceled-subscription-${req.data.subscription.subscriptionid}`, `past_due-subscription-${req.data.subscription.subscriptionid}`, `unpaid-subscription-${req.data.subscription.subscriptionid}`, `canceling-subscription-${req.data.subscription.subscriptionid}`, `active-subscription-${req.data.subscription.subscriptionid}`)
    } else if (req.data.subscription.status === 'active') {
      removeElements.push(`canceled-subscription-${req.data.subscription.subscriptionid}`, `past_due-subscription-${req.data.subscription.subscriptionid}`, `unpaid-subscription-${req.data.subscription.subscriptionid}`, `trial-subscription-${req.data.subscription.subscriptionid}`)
      if (req.data.subscription.cancel_at_period_end) {
        removeElements.push(`active-subscription-${req.data.subscription.subscriptionid}`, `change-plan-link-${req.data.subscription.subscriptionid}`, `cancel-subscription-link-${req.data.subscription.subscriptionid}`)
      } else {
        removeElements.push(`canceling-subscription-${req.data.subscription.subscriptionid}`)
      }
    } else {
      removeElements.push(`active-subscription-${req.data.subscription.subscriptionid}`, `trial-subscription-${req.data.subscription.subscriptionid}`, `canceling-subscription-${req.data.subscription.subscriptionid}`, `change-plan-link-${req.data.subscription.subscriptionid}`)
      if (req.data.subscription.status === 'past_due') {
        removeElements.push(`canceled-subscription-${req.data.subscription.subscriptionid}`, `unpaid-subscription-${req.data.subscription.subscriptionid}`)
      } else if (req.data.subscription.status === 'canceled') {
        removeElements.push(`past_due-subscription-${req.data.subscription.subscriptionid}`, `unpaid-subscription-${req.data.subscription.subscriptionid}`)
      } else if (req.data.subscription.status === 'unpaid') {
        removeElements.push(`canceled-subscription-${req.data.subscription.subscriptionid}`, `past_due-subscription-${req.data.subscription.subscriptionid}`)
      }
    }
    for (const interval of ['day', 'week', 'month', 'year']) {
      if (interval !== req.data.plan.interval) {
        removeElements.push(`${interval}-singular-interval-${req.data.subscription.subscriptionid}`, `${interval}-multiple-interval-${req.data.subscription.subscriptionid}`)
        continue
      }
      if (req.data.plan.interval_count === 1) {
        removeElements.push(`${interval}-multiple-interval-${req.data.subscription.subscriptionid}`)
      } else {
        removeElements.push(`${interval}-singular-interval-${req.data.subscription.subscriptionid}`)
      }
    }
    if (req.data.invoices && req.data.invoices.length) {
      dashboard.HTML.renderTable(doc, req.data.invoices, 'invoice-row', 'invoices-table')
    } else {
      removeElements.push('invoices-container')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
