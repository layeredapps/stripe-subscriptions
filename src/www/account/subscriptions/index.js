const dashboard = require('@layeredapps/dashboard')
const statuses = ['active', 'trialing', 'past_due', 'canceled', 'unpaid']
const intervals = ['day', 'week', 'month', 'year']
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const customers = await global.api.user.subscriptions.Customers.get(req)
  if (customers && customers.length) {
    for (const i in customers) {
      const customer = formatStripeObject(customers[i])
      customers[i] = customer
    }
  }
  delete (req.query.customerid)
  const subscriptions = await global.api.user.subscriptions.Subscriptions.get(req)
  if (subscriptions && subscriptions.length) {
    for (const i in subscriptions) {
      const subscription = formatStripeObject(subscriptions[i])
      subscriptions[i] = subscription
      req.query.planid = subscription.planid
      const planRaw = await global.api.user.subscriptions.PublishedPlan.get(req)
      const plan = formatStripeObject(planRaw)
      if (!plan.amount || subscription.status !== 'active' || subscription.cancel_at_period_end) {
        subscription.nextChargeFormatted = '-'
      } else {
        subscription.nextChargeFormatted = dashboard.Format.date(subscription.current_period_end)
      }
      subscription.plan = plan
    }
  }
  delete (req.query.subscriptionid)
  const invoices = await global.api.user.subscriptions.Invoices.get(req)
  if (invoices && invoices.length) {
    for (const i in invoices) {
      const invoice = formatStripeObject(invoices[i])
      invoices[i] = invoice
    }
  }
  req.data = { customers, subscriptions, invoices }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  let allFree = true
  const removeElements = []
  if (req.data.subscriptions && req.data.subscriptions.length) {
    dashboard.HTML.renderTable(doc, req.data.subscriptions, 'subscription-row', 'subscriptions-table')
    for (const subscription of req.data.subscriptions) {
      allFree = allFree || subscription.plan.amount > 0
      for (const status of statuses) {
        if (subscription.status === status) {
          continue
        }
        removeElements.push(`${status}-subscription-${subscription.id}`)
      }
      if (subscription.status === 'active') {
        if (subscription.cancel_at_period_end) {
          removeElements.push(`active-subscription-${subscription.id}`)
        } else {
          removeElements.push(`canceling-subscription-${subscription.id}`)
        }
      } else if (subscription.status === 'canceled') {
        removeElements.push(`canceling-subscription-${subscription.id}`)
      }
      for (const interval of intervals) {
        if (interval !== subscription.plan.interval) {
          removeElements.push(`${interval}-multiple-interval-${subscription.id}`, `${interval}-singular-interval-${subscription.id}`)
        } else {
          if (subscription.quantity < 2) {
            removeElements.push(`${interval}-multiple-interval-${subscription.id}`)
          } else {
            removeElements.push(`${interval}-singular-interval-${subscription.id}`)
          }
        }
      }
    }
    removeElements.push('no-subscriptions')
  } else {
    removeElements.push('subscriptions-table')
  }
  if (req.data.invoices && req.data.invoices.length) {
    dashboard.HTML.renderTable(doc, req.data.invoices, 'invoice-row', 'invoices-table')
    for (const invoice of req.data.invoices) {
      if (invoice.status === 'open') {
        const paid = doc.getElementById(`paid-${invoice.id}`)
        paid.parentNode.removeChild(paid)
      } else {
        const open = doc.getElementById(`open-${invoice.id}`)
        open.parentNode.removeChild(open)
      }
    }
    removeElements.push('no-invoices')
  } else {
    removeElements.push('invoices-table')
  }
  if (req.data.customers && req.data.customers.length) {
    dashboard.HTML.renderTable(doc, req.data.customers, 'customer-row', 'customers-table')
    removeElements.push('no-customers')
  } else {
    removeElements.push('customers-table')
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
