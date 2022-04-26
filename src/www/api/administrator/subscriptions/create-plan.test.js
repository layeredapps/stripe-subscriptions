/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/subscriptions/create-plan', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-planid', () => {
      it('invalid posted planid is not alphanumeric_', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: '123123!@#!@#!',
          currency: 'usd',
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '0',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-planid')
      })
    })

    describe('invalid-planid-length', () => {
      it('posted planid is too short', async () => {
        global.minimumPlanIDLength = 100
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'this',
          currency: 'usd',
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '0',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-planid-length')
      })

      it('posted planid is too long', async () => {
        global.maximumPlanIDLength = 1
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'that',
          currency: 'usd',
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '0',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-planid-length')
      })
    })

    describe('invalid-productid', () => {
      it('missing posted productid', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM1',
          currency: 'usd',
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '0',
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
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM2',
          currency: 'usd',
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '0',
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
      it('ineligible posted product is not published', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {})
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM3',
          currency: 'usd',
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '0',
          productid: administrator.product.productid
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

    describe('invalid-amount', () => {
      it('missing posted amount', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM4',
          currency: 'usd',
          amount: '',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '0',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-amount')
      })

      it('invalid posted amount', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM5',
          currency: 'usd',
          amount: 'invalid',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '0',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-amount')
      })
    })

    describe('invalid-currency', () => {
      it('missing posted currency', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM6',
          currency: '',
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '0',
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
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM7',
          currency: 'invalid',
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '0',
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

    describe('invalid-interval', () => {
      it('missing posted interval', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM8',
          currency: 'usd',
          amount: '1000',
          interval: '',
          interval_count: '1',
          trial_period_days: '0',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-interval')
      })

      it('invalid posted interval', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM9',
          currency: 'usd',
          amount: '1000',
          interval: 'invalid',
          interval_count: '1',
          trial_period_days: '0',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-interval')
      })
    })

    describe('invalid-interval-count', () => {
      it('missing posted interval_count', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM10',
          currency: 'usd',
          amount: '1000',
          interval: 'month',
          interval_count: '',
          trial_period_days: '0',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-interval_count')
      })

      it('invalid posted interval_count', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM11',
          currency: 'usd',
          amount: '1000',
          interval: 'month',
          interval_count: 'nvalid',
          trial_period_days: '0',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-interval_count')
      })
    })

    describe('invalid-trial_period', () => {
      it('invalid posted trial_period', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM12',
          currency: 'usd',
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          trial_period_days: 'invalid',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-trial_period_days')
      })
    })

    describe('invalid-usage_type', () => {
      it('invalid posted usage_type', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          planid: 'CUSTOM13',
          currency: 'usd',
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          trial_period_days: '7',
          usage_type: 'invalid',
          productid: administrator.product.productid
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-usage_type')
      })
    })
  })

  describe('receives', () => {
    it('optional posted published (boolean)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        planid: 'CUSTOM14',
        currency: 'usd',
        amount: '1000',
        interval: 'month',
        interval_count: '1',
        trial_period_days: '0',
        productid: administrator.product.productid,
        publishedAt: 'true'
      }
      const plan = await req.post()
      assert.notStrictEqual(plan.publishedAt, undefined)
      assert.notStrictEqual(plan.publishedAt, null)
    })

    it('optional posted trial_period_days (integer)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        planid: 'CUSTOM15',
        currency: 'usd',
        amount: '1000',
        interval: 'month',
        interval_count: '1',
        trial_period_days: '3',
        productid: administrator.product.productid
      }
      const plan = await req.post()
      assert.strictEqual(plan.stripeObject.trial_period_days, 3)
    })

    it('optional posted usage_type (licensed|metered)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        planid: 'CUSTOM16',
        currency: 'usd',
        amount: '1000',
        interval: 'month',
        interval_count: '1',
        trial_period_days: '3',
        usage_type: 'metered',
        productid: administrator.product.productid
      }
      const plan = await req.post()
      assert.strictEqual(plan.stripeObject.usage_type, 'metered')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        planid: 'CUSTOM17',
        currency: 'usd',
        amount: '1000',
        interval: 'month',
        interval_count: '1',
        trial_period_days: '0',
        productid: administrator.product.productid
      }
      req.filename = __filename
      req.saveResponse = true
      const plan = await req.post()
      assert.strictEqual(plan.object, 'plan')
    })
  })

  describe('configuration', () => {
    it('environment MINIMUM_PLANID_LENGTH', async () => {
      global.minimumPlanIDLength = 100
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        planid: 'tooshort',
        currency: 'usd',
        amount: '1000',
        interval: 'month',
        interval_count: '1',
        trial_period_days: '0',
        productid: administrator.product.productid
      }
      let errorMessage
      try {
        await req.post()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-planid-length')
    })

    it('environment MAXIMUM_PLANID_LENGTH', async () => {
      global.maximumPlanIDLength = 1
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-plan')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        planid: 'toolong',
        currency: 'usd',
        amount: '1000',
        interval: 'month',
        interval_count: '1',
        trial_period_days: '0',
        productid: administrator.product.productid
      }
      let errorMessage
      try {
        await req.post()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-planid-length')
    })
  })
})
