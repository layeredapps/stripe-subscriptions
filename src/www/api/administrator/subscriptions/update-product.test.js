/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/subscriptions/update-product', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-productid', () => {
      it('missing querystring productid', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/update-product')
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
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-productid')
      })

      it('invalid querystring productid', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/update-product?productid=invalid')
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
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-productid')
      })
    })

    describe('invalid-product', () => {
      it('ineligible querystring product is unpublished', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true',
          unpublishedAt: 'true'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
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
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-product')
      })
    })

    describe('invalid-name', () => {
      it('invalid posted name', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
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
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-name')
      })
    })

    describe('invalid-name-length', () => {
      it('posted name too short', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'short',
          statement_descriptor: 'description',
          unit_label: 'thing',
          tax_code: 'txcd_41060003'
        }
        global.minimumProductNameLength = 30
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-name-length')
      })

      it('posted name too long', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'looooooooooong',
          statement_descriptor: 'description',
          unit_label: 'thing',
          tax_code: 'txcd_41060003'
        }
        global.maximumProductNameLength = 3
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-name-length')
      })
    })

    describe('invalid-statement_descriptor', () => {
      it('invalid posted statement_descriptor', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'that',
          statement_descriptor: '',
          unit_label: 'thing',
          tax_code: 'txcd_41060003'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-statement_descriptor')
      })
    })

    describe('invalid-statement_descriptor-length', () => {
      it('posted statement_descriptor too short', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'that',
          statement_descriptor: 'test',
          unit_label: 'thing',
          tax_code: 'txcd_41060003'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-statement_descriptor-length')
      })

      it('posted statement_descriptor too long', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'that',
          statement_descriptor: '123456789 123456789 123456789',
          unit_label: 'thing',
          tax_code: 'txcd_41060003'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-statement_descriptor-length')
      })
    })

    describe('invalid-unit_label', () => {
      it('missing posted unit_label', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'that',
          statement_descriptor: 'description',
          unit_label: '',
          tax_code: 'txcd_41060003'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-unit_label')
      })
    })

    describe('invalid-tax_code', () => {
      it('missing posted tax_code', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'that',
          statement_descriptor: 'description',
          unit_label: 'thing',
          tax_code: ''
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tax_code')
      })

      it('invalid posted tax_code', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createProduct(administrator, {
          publishedAt: 'true'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          name: 'that',
          statement_descriptor: 'description',
          unit_label: 'thing',
          tax_code: 'invalid'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tax_code')
      })
    })
  })

  describe('receives', () => {
    it('required posted name', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'testing',
        statement_descriptor: 'description',
        unit_label: 'thing',
        tax_code: 'txcd_41060003'
      }
      const productNow = await req.patch(req)
      assert.strictEqual(productNow.stripeObject.name, 'testing')
    })

    it('required posted statement_descriptor', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'that',
        statement_descriptor: 'descriptor',
        unit_label: 'thing',
        tax_code: 'txcd_41060003'
      }
      const productNow = await req.patch(req)
      assert.strictEqual(productNow.stripeObject.statement_descriptor, 'descriptor')
    })

    it('required posted unit_label', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'that',
        statement_descriptor: 'description',
        unit_label: 'new-thing',
        tax_code: 'txcd_41060003'
      }
      const productNow = await req.patch(req)
      assert.strictEqual(productNow.stripeObject.unit_label, 'new-thing')
    })

    it('required posted tax_code', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'that',
        statement_descriptor: 'description',
        unit_label: 'thing',
        tax_code: 'txcd_37060012'
      }
      const productNow = await req.patch(req)
      assert.strictEqual(productNow.stripeObject.tax_code, 'txcd_37060012')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'new-name',
        statement_descriptor: 'new-description',
        unit_label: 'new-thing',
        tax_code: 'txcd_41060003'
      }
      req.filename = __filename
      req.saveResponse = true
      const product = await req.patch()
      assert.strictEqual(product.object, 'product')
    })
  })

  describe('configuration', () => {
    it('environment MINIMUM_PRODUCT_NAME_LENGTH', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      global.minimumProductNameLength = 100
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'new-name',
        statement_descriptor: 'new-description',
        unit_label: 'new-thitxcd_41060003ng',
        tax_code: 'txcd_41060003'
      }
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-name-length')
    })

    it('environment MAXIMUM_PRODUCT_NAME_LENGTH', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      global.maximumProductNameLength = 1
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'new-name',
        statement_descriptor: 'new-description',
        unit_label: 'new-thing',
        tax_code: 'txcd_41060003'
      }
      let errorMessage
      try {
        await req.patch(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-name-length')
    })
  })
})
