/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/subscriptions/create-price', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-productid', () => {
      it('missing posted productid', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          tax_behavior: 'inclusive',
          productid: ''
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-productid')
      })

      it('invalid posted productid', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          tax_behavior: 'inclusive',
          productid: 'invalid'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-productid')
      })
    })

    describe('invalid-product', () => {
      it('ineligible posted product is not active', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'false'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          productid: administrator.product.productid,
          tax_behavior: 'inclusive'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-product')
      })
    })

    describe('invalid-tax_behavior', () => {
      it('invalid posted tax_behavior', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'invalid',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tax_behavior')
      })
    })

    describe('invalid-unit_amount', () => {
      it('invalid posted unit_amount', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: 'invalid',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-unit_amount')
      })
    })

    describe('invalid-currency', () => {
      it('missing posted currency', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: '',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-currency')
      })

      it('invalid posted currency', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'invalid',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-currency')
      })
    })

    describe('invalid-recurring_interval', () => {
      it('invalid posted recurring_interval', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'invalid',
          recurring_interval_count: '1',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-recurring_interval')
      })
    })

    describe('invalid-recurring_interval_count', () => {
      it('missing posted recurring_interval_count', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-recurring_interval_count')
      })

      it('invalid posted recurring_interval_count', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: 'nvalid',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-recurring_interval_count')
      })

      it('invalid posted recurring_interval_count exceeds one year', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '14',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-recurring_interval_count')
      })
    })

    describe('invalid-recurring_aggregate_usage', () => {
      it('invalid posted recurring_aggregate_usage', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          recurring_aggregate_usage: 'invalid',
          recurring_usage_type: 'metered',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-recurring_aggregate_usage')
      })
    })

    describe('invalid-recurring_usage_type', () => {
      it('invalid posted recurring_usage_type', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          recurring_usage_type: 'invalid',
          recurring_aggregate_usage: 'sum',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-recurring_usage_type')
      })
    })

    describe('invalid-billing_scheme', () => {
      it('invalid posted billing_scheme', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          recurring_usage_type: 'metered',
          recurring_aggregate_usage: 'sum',
          billing_scheme: 'invalid',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-billing_scheme')
      })
    })

    describe('invalid-transform_quantity_divide_by', () => {
      it('invalid posted transform_quantity_divide_by', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          recurring_usage_type: 'metered',
          recurring_aggregate_usage: 'sum',
          billing_scheme: 'per_unit',
          transform_quantity_divide_by: 'invalid',
          transform_quantity_round: 'up',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-transform_quantity_divide_by')
      })
    })

    describe('invalid-transform_quantity_round', () => {
      it('invalid posted transform_quantity_round', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          recurring_usage_type: 'metered',
          recurring_aggregate_usage: 'sum',
          billing_scheme: 'per_unit',
          transform_quantity_divide_by: '1.2',
          transform_quantity_round: 'invalid',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-transform_quantity_round')
      })
    })

    describe('invalid-tiers_mode', () => {
      it('invalid posted tiers_mode', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          unit_amount: '1000',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          recurring_usage_type: 'metered',
          recurring_aggregate_usage: 'sum',
          billing_scheme: 'tiered',
          tiers_mode: 'invalid',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tiers_mode')
      })
    })

    describe('invalid-tier_up_to', () => {
      it('invalid posted tier_up_to', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          recurring_usage_type: 'metered',
          recurring_aggregate_usage: 'sum',
          billing_scheme: 'tiered',
          tiers_mode: 'volume',
          tier1_up_to: 'invalid',
          tier1_unit_amount: '9999',
          tier2_up_to: 'inf',
          tier2_unit_amount: '9999',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tier_up_to')
      })
    })

    describe('invalid-tier_unit_amount', () => {
      it('invalid posted tier_unit_amount', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          tax_behavior: 'inclusive',
          unit_amount: '1000',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          recurring_usage_type: 'metered',
          recurring_aggregate_usage: 'sum',
          billing_scheme: 'tiered',
          tiers_mode: 'volume',
          tier1_up_to: '1000',
          tier1_unit_amount: 'invalid',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tier_unit_amount')
      })
    })

    describe('invalid-tier_flat_amount', () => {
      it('invalid posted tier_flat_amount', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          active: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          currency: 'usd',
          tax_behavior: 'inclusive',
          unit_amount: '1000',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          recurring_usage_type: 'metered',
          recurring_aggregate_usage: 'sum',
          billing_scheme: 'tiered',
          tiers_mode: 'volume',
          tier1_up_to: '1000',
          tier1_flat_amount: 'invalid',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tier_flat_amount')
      })
    })
  })

  describe('receives', () => {
    it('required posted productid', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.product, administrator.product.productid)
    })

    it('required posted tax_behavior', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.tax_behavior, 'inclusive')
    })

    it('required posted currency', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.currency, 'usd')
    })

    it('optionally-required posted unit_amount', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.unit_amount, 1000)
    })

    it('optional posted active (boolean)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator)
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        productid: administrator.product.productid,
        active: 'true'
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.active, true)
    })

    it('optional posted billing_scheme (per_unit|tiered)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        billing_scheme: 'per_unit',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.billing_scheme, 'per_unit')
    })

    it('optional posted recurring_usage_type (licensed|metered)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.recurring.usage_type, 'metered')
    })

    it('optional posted recurring_interval (day|week|month|year)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.recurring.interval, 'month')
    })

    it('optionally-required posted recurring_interval_count', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.recurring.interval_count, 1)
    })

    it('optionally-required posted recurring_aggregate_usage (sum|max|last_ever|last_during_period)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.recurring.aggregate_usage, 'sum')
    })

    it('optional posted transform_quantity_divide_by', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        transform_quantity_divide_by: '7',
        transform_quantity_round: 'down',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.transform_quantity.divide_by, 7)
    })

    it('optionally-required posted transform_quantity_round (up|down)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        transform_quantity_divide_by: '7',
        transform_quantity_round: 'down',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.transform_quantity.round, 'down')
    })

    it('optionally-required posted tiers_mode (graduated|volume)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        billing_scheme: 'tiered',
        tiers_mode: 'volume',
        tier1_up_to: '1000',
        tier1_unit_amount: '9999',
        tier2_up_to: 'inf',
        tier2_unit_amount: '8999',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.tiers_mode, 'volume')
    })

    it('optional posted tier(1...)_up_to', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        billing_scheme: 'tiered',
        tiers_mode: 'volume',
        tier1_up_to: '1000',
        tier1_unit_amount: '9999',
        tier2_up_to: 'inf',
        tier2_unit_amount: '8999',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.tiers[0].up_to, 1000)
    })

    it('optional posted tier(1...)_unit_amount', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        billing_scheme: 'tiered',
        tiers_mode: 'volume',
        tier1_up_to: '1000',
        tier1_unit_amount: '9999',
        tier2_up_to: 'inf',
        tier2_unit_amount: '8999',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.tiers[1].unit_amount, 8999)
    })

    it('optional posted tier(1...)_flat_amount', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        billing_scheme: 'tiered',
        tiers_mode: 'volume',
        tier1_up_to: '1000',
        tier1_flat_amount: '9999',
        tier2_up_to: 'inf',
        tier2_flat_amount: '8999',
        productid: administrator.product.productid
      }
      const price = await req.post()
      assert.strictEqual(price.stripeObject.tiers[1].flat_amount, 8999)
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-price')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        currency: 'usd',
        tax_behavior: 'inclusive',
        unit_amount: '1000',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        productid: administrator.product.productid
      }
      req.filename = __filename
      req.saveResponse = true
      const price = await req.post()
      assert.strictEqual(price.object, 'price')
    })
  })
})
