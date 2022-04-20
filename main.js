(async () => {
  if (!process.env.SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET) {
    if (!process.env.EXIT_ON_START) {
      const stripeKey = {
        apiKey: process.env.SUBSCRIPTIONS_STRIPE_KEY || process.env.STRIPE_KEY
      }
      const stripe = require('stripe')({
        apiVersion: global.stripeAPIVersion
      })
      if (global.maxmimumStripeRetries) {
        stripe.setMaxNetworkRetries(global.maximumStripeRetries)
      }
      const webhooks = await stripe.webhookEndpoints.list({ limit: 100 }, stripeKey)
      if (webhooks && webhooks.data && webhooks.data.length) {
        for (const webhook of webhooks.data) {
          await stripe.webhookEndpoints.del(webhook.id, stripeKey)
        }
      }
      const webhook = await stripe.webhookEndpoints.create({
        url: `${process.env.DASHBOARD_SERVER}/webhooks/subscriptions/index-subscription-data`,
        enabled_events: enabledEvents
      }, stripeKey)
      global.subscriptionWebhookEndPointSecret = webhook.secret
      delete (process.env.DASHBOARD_SERVER)
    }
  }
  const dashboard = require('@layeredapps/dashboard')
  await dashboard.start(__dirname)
  require('./index.js').setup()
  if (process.env.NODE_ENV === 'testing') {
    const helperRoutes = require('./test-helper-routes.js')
    global.sitemap['/api/create-fake-payout'] = helperRoutes.createFakePayout
    global.sitemap['/api/fake-amount-owed'] = helperRoutes.fakeAmountOwed
    global.sitemap['/api/toggle-refunds'] = helperRoutes.toggleRefunds
    global.sitemap['/api/toggle-overdue-invoice-threshold'] = helperRoutes.toggleOverdueInvoiceThreshold
  }
})()

const enabledEvents = [
  'setup_intent.canceled',
  'setup_intent.created',
  'setup_intent.setup_failed',
  'setup_intent.succeeded',
  // 'sigma.scheduled_query_run.created',
  // 'review.closed',
  // 'review.opened',
  // 'sku.created',
  // 'sku.deleted',
  // 'sku.updated',
  'source.canceled',
  'source.chargeable',
  'source.failed',
  'source.mandate_notification',
  'source.refund_attributes_required',
  'source.transaction.created',
  'source.transaction.updated',
  // 'tax_rate.created',
  // 'tax_rate.updated',
  // 'topup.canceled',
  // 'topup.created',
  // 'topup.failed',
  // 'topup.reversed',
  // 'topup.succeeded',
  // 'transfer.created',
  // 'transfer.failed',
  // 'transfer.paid',
  // 'transfer.reversed',
  // 'transfer.updated',
  // 'reporting.report_run.failed',
  // 'reporting.report_run.succeeded',
  // 'reporting.report_type.updated',
  // 'product.created',
  // 'product.deleted',
  // 'product.updated',
  // 'price.created',
  // 'price.deleted',
  // 'price.updated',
  // 'plan.created',
  // 'plan.deleted',
  // 'plan.updated',
  // 'order_return.created',
  'payment_intent.amount_capturable_updated',
  'payment_intent.canceled',
  'payment_intent.created',
  'payment_intent.payment_failed',
  'payment_intent.processing',
  'payment_intent.succeeded',
  // 'order.payment_succeeded',
  'payment_method.attached',
  'payment_method.card_automatically_updated',
  'payment_method.detached',
  'payment_method.updated',
  // 'payout.canceled',
  // 'payout.created',
  // 'payout.failed',
  // 'payout.paid',
  // 'payout.updated',
  // 'mandate.updated',
  // 'person.created',
  // 'person.deleted',
  // 'person.updated',
  // 'issuing_card.created',
  // 'issuing_card.updated',
  // 'order.created',
  // 'order.payment_failed',
  // 'order.updated',
  // 'issuing_dispute.created',
  // 'issuing_dispute.funds_reinstated',
  // 'issuing_dispute.updated',
  // 'issuing_transaction.created',
  // 'issuing_transaction.updated',
  // 'issuing_authorization.created',
  // 'issuing_authorization.request',
  // 'issuing_authorization.updated',
  // 'file.created',
  // 'credit_note.created',
  // 'credit_note.updated',
  // 'credit_note.voided',
  // 'issuing_cardholder.created',
  // 'issuing_cardholder.updated',
  // 'invoiceitem.created',
  // 'invoiceitem.deleted',
  // 'invoiceitem.updated',
  'invoice.created',
  // 'invoice.deleted',
  'invoice.finalized',
  'invoice.marked_uncollectible',
  'invoice.paid',
  'invoice.payment_action_required',
  'invoice.payment_failed',
  'invoice.payment_succeeded',
  'invoice.sent',
  'invoice.upcoming',
  'invoice.updated',
  'invoice.voided',
  // 'coupon.created',
  // 'coupon.deleted',
  // 'coupon.updated',
  // 'checkout.session.async_payment_failed',
  // 'checkout.session.async_payment_succeeded',
  // 'checkout.session.completed',
  // 'customer.created',
  // 'customer.deleted',
  'customer.updated',
  'customer.discount.created',
  // 'customer.discount.deleted',
  'customer.discount.updated',
  // 'customer.source.created',
  // 'customer.source.deleted',
  'customer.source.expiring',
  'customer.source.updated',
  // 'customer.subscription.created',
  // 'customer.subscription.deleted',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'customer.subscription.trial_will_end',
  'customer.subscription.updated',
  // 'customer.tax_id.created',
  // 'customer.tax_id.deleted',
  // 'customer.tax_id.updated',
  // 'account.external_account.deleted',
  'charge.captured',
  'charge.expired',
  'charge.failed',
  'charge.pending',
  'charge.refunded',
  'charge.succeeded',
  'charge.updated',
  'charge.dispute.closed',
  'charge.dispute.created',
  'charge.dispute.funds_reinstated',
  'charge.dispute.funds_withdrawn',
  'charge.dispute.updated',
  'charge.refund.updated'
  // 'capability.updated',
  // 'balance.available',
  // 'account.updated',
  // 'account.external_account.created',
  // 'account.external_account.updated',
  // 'subscription_schedule.aborted',
  // 'subscription_schedule.canceled',
  // 'subscription_schedule.completed',
  // 'subscription_schedule.created',
  // 'subscription_schedule.expiring',
  // 'subscription_schedule.released',
  // 'subscription_schedule.updated'
]
