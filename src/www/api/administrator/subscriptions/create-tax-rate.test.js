/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/create-tax-rate', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    const req = TestHelper.createRequest('/api/administrator/subscriptions/create-tax-rate')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      display_name: 'NY Sales Tax',
      percentage: '',
      inclusive: 'true',
      active: 'true',
      state: 'NY',
      country: 'US',
      description: 'Sales tax in NY',
      jurisdiction: 'US',
      tax_type: 'sales_tax'
    }
    // invalid percentage
    try {
      await req.post()
    } catch (error) {
      cachedResponses.missingPercentage = error.message
    }
    req.body.percentage = 'invalid'
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidPercentage = error.message
    }
    req.body.percentage = '-7'
    try {
      await req.post()
    } catch (error) {
      cachedResponses.negativePercentage = error.message
    }
    req.body.percentage = '105'
    try {
      await req.post()
    } catch (error) {
      cachedResponses.excessivePercentage = error.message
    }
    req.body.percentage = '12.5'
    // invalid display name
    req.body.display_name = ''
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidDisplayName = error.message
    }
    req.body.display_name = 'GST (US)'
    // invalid inclusive
    req.body.inclusive = ''
    try {
      await req.post()
    } catch (error) {
      cachedResponses.missingInclusive = error.message
    }
    req.body.inclusive = 'invalid'
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidInclusive = error.message
    }
    req.body.inclusive = true
    // invalid country
    req.body.country = 'ivnalid'
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidCountry = error.message
    }
    req.body.country = 'US'
    // invalid state
    req.body.state = 'invalid'
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidState = error.message
    }
    req.body.state = 'NY'
    // invalid tax type
    req.body.tax_type = 'invalid'
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidTaxType = error.message
    }
    req.body.tax_type = 'sales_tax'
    // good
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.returns = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-percentage', () => {
      it('missing posted percentage', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingPercentage
        assert.strictEqual(errorMessage, 'invalid-percentage')
      })

      it('invalid posted percentage', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPercentage
        assert.strictEqual(errorMessage, 'invalid-percentage')
      })

      it('invalid posted percentage is negative', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.negativePercentage
        assert.strictEqual(errorMessage, 'invalid-percentage')
      })

      it('invalid posted percentage exceeds 100', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.excessivePercentage
        assert.strictEqual(errorMessage, 'invalid-percentage')
      })
    })

    describe('invalid-display_name', () => {
      it('missing posted display_name', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidDisplayName
        assert.strictEqual(errorMessage, 'invalid-display_name')
      })
    })

    describe('invalid-inclusive', () => {
      it('missing posted inclusive', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingInclusive
        assert.strictEqual(errorMessage, 'invalid-inclusive')
      })

      it('invalid posted inclusive', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidInclusive
        assert.strictEqual(errorMessage, 'invalid-inclusive')
      })
    })

    describe('invalid-country', () => {
      it('invalid posted country', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidCountry
        assert.strictEqual(errorMessage, 'invalid-country')
      })
    })

    describe('invalid-state', () => {
      it('invalid posted state', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidState
        assert.strictEqual(errorMessage, 'invalid-state')
      })
    })

    describe('invalid-tax_type', () => {
      it('invalid posted tax_type', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidTaxType
        assert.strictEqual(errorMessage, 'invalid-tax_type')
      })
    })
  })

  describe('receives', () => {
    it('required posted display_name', async function () {
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.display_name, 'GST (US)')
    })

    it('required posted percentage', async function () {
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.percentage, 12.5)
    })

    it('required posted inclusive', async function () {
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.inclusive, true)
    })

    it('optional posted tax_type', async function () {
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.tax_type, 'sales_tax')
    })

    it('optional posted description', async function () {
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.description, 'Sales tax in NY')
    })

    it('optional posted jurisdiction', async function () {
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.jurisdiction, 'US')
    })

    it('optional posted state', async function () {
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.state, 'NY')
    })

    it('optional posted country', async function () {
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.country, 'US')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.object, 'taxrate')
    })
  })
})
