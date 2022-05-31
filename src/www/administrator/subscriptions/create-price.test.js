/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/create-price', function () {
  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should create-price (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        type: 'recurring',
        billing_scheme: 'per_unit',
        nickname: 'Custom price',
        unit_amount: '1000',
        recurring_usage_type: 'licensed',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_aggregate_usage: 'sum',
        currency: 'usd',
        productid: administrator.product.productid
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/prices' },
        { click: '/administrator/subscriptions/create-price' },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorPrices)
      const result = await req.post()
      console.log(result)
      assert.strictEqual(true, result.redirect.startsWith('/administrator/subscriptions/price?priceid='))
    })
  })

  describe('errors', () => {
    it('invalid-productid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: '',
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'per_unit',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-productid')
    })

    it('invalid-currency', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: '',
        billing_scheme: 'per_unit',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-currency')
    })

    it('invalid-nickname', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: '',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'per_unit',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-nickname')
    })

    it('invalid-type', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: '',
        currency: 'usd',
        billing_scheme: 'per_unit',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-type')
    })

    it('invalid-billing_scheme', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: '',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-billing_scheme')
    })
    // per unit
    it('invalid-unit_amount', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'one_time',
        currency: 'usd',
        billing_scheme: 'per_unit',
        unit_amount: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-unit_amount')
    })

    it('invalid-transform_quantity_divide_by', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'one_time',
        currency: 'usd',
        billing_scheme: 'per_unit',
        unit_amount: '1000',
        transform_quantity_divide_by: '-100',
        transform_quantity_round: 'up',
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-transform_quantity_divide_by')
    })

    it('invalid-transform_quantity_round', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'one_time',
        currency: 'usd',
        billing_scheme: 'per_unit',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-transform_quantity_round')
    })
    // recurring billing
    it('invalid-recurring_interval', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'per_unit',
        recurring_interval: '',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-recurring_interval')
    })

    it('invalid-recurring_interval_count', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'per_unit',
        recurring_interval: 'day',
        recurring_interval_count: '',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: 'up'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-recurring_interval_count')
    })

    it('invalid-recurring_usage_type', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'per_unit',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: '',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: 'up'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-recurring_usage_type')
    })

    it('invalid-recurring_aggregate_usage', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'per_unit',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: '',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: 'up'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-recurring_aggregate_usage')
    })
    // tiered prices
    it('invalid-tier_mode', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'tiered',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: 'up',
        tier_mode: '',
        tier1_up_to: '100',
        tier1_flat_amount: '1000',
        tier2_up_to: 'inf',
        tier2_unit_amount: '3000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-tier_mode')
    })

    it('invalid-tier_up_to', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'tiered',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: 'up',
        tier_mode: 'graduated',
        tier1_up_to: '-1000',
        tier1_flat_amount: '1000',
        tier2_up_to: 'inf',
        tier2_unit_amount: '3000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-tier_up_to')
    })

    it('invalid-tier_up_to_inf', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'tiered',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: 'up',
        tier_mode: 'graduated',
        tier1_up_to: '100',
        tier1_flat_amount: '1000',
        tier2_up_to: 'inf',
        tier2_unit_amount: '3000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-tier_up_to_inf')
    })

    it('invalid-tier_ambiguous_amount', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'tiered',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: 'up',
        tier_mode: 'graduated',
        tier1_up_to: '100',
        tier1_flat_amount: '1000',
        tier1_unit_amount: '1000',
        tier2_up_to: 'inf',
        tier2_unit_amount: '3000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-tier_ambiguous_amount')
    })

    it('invalid-tier_unit_amount', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'tiered',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: 'up',
        tier_mode: 'graduated',
        tier1_up_to: 'inf',
        tier1_unit_amount: '-1000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-tier_unit_amount')
    })

    it('invalid-tier_flat_amount', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: 'Custom price',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'tiered',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: 'up',
        tier_mode: 'graduated',
        tier1_up_to: 'inf',
        tier1_flat_amount: '-1000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-tier_flat_amount')
    })

    it('invalid-xss-input', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        productid: administrator.product.productid,
        nickname: '<script>',
        type: 'recurring',
        currency: 'usd',
        billing_scheme: 'tiered',
        recurring_interval: 'day',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        recurring_aggregate_usage: 'sum',
        unit_amount: '1000',
        transform_quantity_divide_by: '10',
        transform_quantity_round: 'up',
        tier_mode: 'graduated',
        tier1_up_to: '100',
        tier1_flat_amount: '1000',
        tier2_up_to: 'inf',
        tier2_unit_amount: '3000'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-price')
      req.puppeteer = false
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        nickname: 'Custom price',
        type: 'recurring',
        usage_type: 'licensed',
        amount: '1000',
        interval: 'month',
        interval_count: '1',
        currency: 'usd',
        productid: administrator.product.productid,
        'csrf-token': 'invalid'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
