/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/subscriptions/create-product', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-name', () => {
      it('missing posted name', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: '',
          statement_descriptor: 'description',
          unit_label: 'thing',
          tax_code: 'txcd_41060003'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-name')
      })
    })

    describe('invalid-product-name-length', () => {
      it('posted name too short', async () => {
        global.minimumProductNameLength = 10
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'this',
          statement_descriptor: 'description',
          unit_label: 'thing',
          tax_code: 'txcd_41060003'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-product-name-length')
      })

      it('posted name too long', async () => {
        global.maximumProductNameLength = 1
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'that',
          statement_descriptor: 'description',
          unit_label: 'thing',
          tax_code: 'txcd_41060003'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-product-name-length')
      })
    })

    describe('invalid-statement_descriptor', () => {
      it('missing posted statement_descriptor', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'productName',
          statement_descriptor: '',
          unit_label: 'thing',
          tax_code: 'txcd_41060003'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-statement_descriptor')
      })
    })

    describe('invalid-tax_code', () => {
      it('missing posted tax_code', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'productName',
          statement_descriptor: 'description',
          unit_label: 'thing',
          tax_code: ''
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tax_code')
      })

      it('invalid posted tax_code', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'productName',
          statement_descriptor: 'description',
          unit_label: 'thing',
          tax_code: 'invalid'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tax_code')
      })
    })
  })

  describe('receives', () => {
    it('optional posted published (boolean)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product name',
        statement_descriptor: 'description',
        unit_label: 'thing',
        publishedAt: 'true',
        tax_code: 'txcd_41060003'
      }
      const product = await req.post()
      assert.notStrictEqual(product.publishedAt, undefined)
      assert.notStrictEqual(product.publishedAt, null)
    })

    it('required posted name (string)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product name',
        statement_descriptor: 'description',
        unit_label: 'thing',
        publishedAt: 'true',
        tax_code: 'txcd_41060003'
      }
      const product = await req.post()
      assert.strictEqual(product.stripeObject.name, 'product name')
    })

    it('required posted statement_descriptor (string)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product name',
        statement_descriptor: 'description',
        unit_label: 'thing',
        publishedAt: 'true',
        tax_code: 'txcd_41060003'
      }
      const product = await req.post()
      assert.strictEqual(product.stripeObject.statement_descriptor, 'description')
    })

    it('required posted unit_label (string)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product name',
        statement_descriptor: 'description',
        unit_label: 'thing',
        publishedAt: 'true',
        tax_code: 'txcd_41060003'
      }
      const product = await req.post()
      assert.strictEqual(product.stripeObject.unit_label, 'thing')
    })

    it('required posted tax_code (string)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product name',
        statement_descriptor: 'description',
        unit_label: 'thing',
        publishedAt: 'true',
        tax_code: 'txcd_41060003'
      }
      const product = await req.post()
      assert.strictEqual(product.stripeObject.tax_code, 'txcd_41060003')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product name',
        statement_descriptor: 'description',
        unit_label: 'thing',
        tax_code: 'txcd_41060003'
      }
      req.filename = __filename
      req.saveResponse = true
      const product = await req.post()
      assert.strictEqual(product.object, 'product')
    })
  })

  describe('configuration', () => {
    it('environment MINIMUM_PRODUCT_NAME_LENGTH', async () => {
      global.minimumProductNameLength = 10
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'this',
        statement_descriptor: 'description',
        unit_label: 'thing',
        tax_code: 'txcd_41060003'
      }
      let errorMessage
      try {
        await req.post()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-product-name-length')
    })

    it('environment MAXIMUM_PRODUCT_NAME_LENGTH', async () => {
      global.maximumProductNameLength = 1
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'that',
        statement_descriptor: 'description',
        unit_label: 'thing',
        tax_code: 'txcd_41060003'
      }
      let errorMessage
      try {
        await req.post()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-product-name-length')
    })
  })
})
