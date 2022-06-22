/* eslint-env mocha */
require('./test-helper.js')
const assert = require('assert')
const properties = [
  { camelCase: 'stripeJS', raw: 'STRIPE_JS', description: 'Use client-side stripe.js in browser', value: '3', default: '', valueDescription: 'Integer' },
  { camelCase: 'maximumStripeRetries', raw: 'MAXIMUM_STRIPE_RETRIES', description: 'Retry Stripe web requests', value: '2', default: '', valueDescription: 'Integer', defaultDescription: '0' },
  { camelCase: 'subscriptionWebhookEndPointSecret', raw: 'SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET', description: 'Secret provided by Stripe to sign webhooks', value: 'wh_sec_xxx', valueDescription: 'String', noDefaultValue: true },
  { camelCase: 'stripeKey', raw: 'STRIPE_KEY', description: 'The `sk_test_xxx` key from Stripe', value: 'sk_test_xxx', valueDescription: 'String', noDefaultValue: true },
  { camelCase: 'stripePublishableKey', raw: 'STRIPE_PUBLISHABLE_KEY', description: 'The `pk_test_xxx` key from Stripe', value: 'pk_test_xxx', valueDescription: 'String', noDefaultValue: true },
  { camelCase: 'overdueInvoiceThreshold', raw: 'OVERDUE_INVOICE_THRESHOLD', description: 'Duration in days to allow open invoices before enforcing payment', value: '6', default: '1', valueDescription: 'Integer' },
  { camelCase: 'subscriptionRefundPeriod', raw: 'SUBSCRIPTION_REFUND_PERIOD', description: 'Time in seconds after an invoice is paid that users may refund a charge', value: '7200', default: '3600', defaultDescription: 'seconds', valueDescription: 'Integer' },
  { camelCase: 'automaticBillingProfileDescription', raw: 'AUTOMATIC_BILLING_PROFILE_DESCRIPTION', description: 'Use billing information for profile description', value: 'true', noDefaultValue: true, valueDescription: 'Boolean' },
  { camelCase: 'automaticBillingProfileFullName', raw: 'AUTOMATIC_BILLING_PROFILE_FULL_NAME', description: 'Use profile full name as billing full name', value: 'true', noDefaultValue: true, valueDescription: 'Boolean' },
  { camelCase: 'automaticBillingProfileEmail', raw: 'AUTOMATIC_BILLING_PROFILE_EMAIL', description: 'Use profile contact email as billing email', value: 'true', noDefaultValue: true, valueDescription: 'Boolean' },
  { camelCase: 'skipConfirmSubscription', raw: 'SKIP_CONFIRM_SUBSCRIPTION', description: 'Auto-submit "confirm subscription" if the user has billing information', value: 'true', noDefaultValue: true, valueDescription: 'Boolean' },
  { camelCase: 'requireBillingProfileAddress', raw: 'REQUIRE_BILLING_PROFILE_ADDRESS', description: 'Require address with billing information', value: 'true', noDefaultValue: true, valueDescription: 'Boolean' }
]

describe('index', () => {
  const webhookSecret = global.subscriptionWebhookEndPointSecret
  const stripeKey = process.env.SUBSCRIPTIONS_STRIPE_KEY || process.env.STRIPE_KEY
  const stripePublishableKey = process.env.SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
  before(async () => {
    const testHelper = require('./test-helper.js')
    await testHelper.setupBefore()
  })

  beforeEach(async () => {
    delete (global.stripeKey)
    delete (global.stripePublishableKey)
    delete (global.subscriptionWebhookEndPointSecret)
  })
  afterEach(() => {
    global.stripeKey = stripeKey
    global.stripePublishableKey = stripePublishableKey
    global.subscriptionWebhookEndPointSecret = webhookSecret
    process.env.SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET = webhookSecret
    process.env.SUBSCRIPTIONS_STRIPE_KEY = stripeKey
    process.env.SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY = stripePublishableKey
    delete (require.cache[require.resolve('./index.js')])
    require('./index.js').setup(global.applicationPath)
  })
  after(() => {
    delete (require.cache[require.resolve('./index.js')])
    require('./index.js').setup(global.applicationPath)
  })
  for (const property of properties) {
    describe(property.raw, () => {
      describe(property.description, () => {
        if (!property.noDefaultValue) {
          if (property.raw.startsWith('STRIPE_')) {
            process.env.SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET = 'wh_sec_xxx'
            process.env.SUBSCRIPTIONS_STRIPE_KEY = 'sk_test_xxx'
            process.env.SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY = 'pk_test_xxx'
          }
          it('default ' + (property.default || property.defaultDescription || 'unset'), async () => {
            delete (process.env[property.raw])
            delete (require.cache[require.resolve('./index.js')])
            require('./index.js')
            delete (require.cache[require.resolve('./index.js')])
            assert.strictEqual((global[property.camelCase] || '').toString().trim(), property.default.toString())
          })
        }
        it(property.valueDescription, async () => {
          if (property.raw.startsWith('STRIPE_')) {
            process.env.SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET = 'wh_sec_xxx'
            process.env.SUBSCRIPTIONS_STRIPE_KEY = 'sk_test_xxx'
            process.env.SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY = 'pk_test_xxx'
          }
          process.env[property.raw] = property.value
          delete (require.cache[require.resolve('./index.js')])
          global.subscriptionWebhookEndPointSecret = false
          require('./index.js')
          delete (require.cache[require.resolve('./index.js')])
          assert.strictEqual(global[property.camelCase].toString(), property.value)
        })
        global.stripeKey = stripeKey
        global.stripePublishableKey = stripePublishableKey
        global.subscriptionWebhookEndPointSecret = webhookSecret
        process.env.SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET = webhookSecret
        process.env.SUBSCRIPTIONS_STRIPE_KEY = stripeKey
        process.env.SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY = stripePublishableKey
        delete (require.cache[require.resolve('./index.js')])
        require('./index.js').setup(global.applicationPath)
      })
    })
  }
  global.stripeKey = stripeKey
  global.stripePublishableKey = stripePublishableKey
  global.subscriptionWebhookEndPointSecret = webhookSecret
  process.env.SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET = webhookSecret
  process.env.SUBSCRIPTIONS_STRIPE_KEY = stripeKey
  process.env.SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY = stripePublishableKey
  delete (require.cache[require.resolve('./index.js')])
  require('./index.js').setup(global.applicationPath)
})
