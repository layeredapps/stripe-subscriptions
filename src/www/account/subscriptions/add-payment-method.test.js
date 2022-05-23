/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/subscriptions/add-payment-method', function () {
  describe('view', () => {
    it('should present the form for no stripe.js', async () => {
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('stripe-v3'), undefined)
      assert.strictEqual(doc.getElementById('form-stripejs-v3'), undefined)
      assert.strictEqual(doc.getElementById('form-nojs').tag, 'form')
      assert.strictEqual(doc.getElementById('number').tag, 'input')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the form for stripe.js v3', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('stripe-v3').tag, 'script')
      assert.strictEqual(doc.getElementById('form-nojs'), undefined)
      assert.strictEqual(doc.getElementById('form-stripejs-v3').tag, 'form')
      assert.strictEqual(doc.getElementById('number'), undefined)
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should require name for no stripe.js', async () => {
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      req.fill = '#form-nojs'
      req.body = {
        name: '',
        cvc: '111',
        number: '4111111111111111',
        exp_month: '1',
        exp_year: (new Date().getFullYear() + 1).toString().substring(2)
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-name')
    })

    it('should require CVC for no stripe.js', async () => {
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      req.fill = '#form-nojs'
      req.body = {
        name: 'Tester',
        cvc: '0',
        number: '4111111111111111',
        exp_month: '1',
        exp_year: (new Date().getFullYear() + 1).toString().substring(2)
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-cvc')
    })

    it('should require card number for no stripe.js', async () => {
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      req.fill = '#form-nojs'
      req.body = {
        name: 'Tester',
        cvc: '123',
        number: '',
        exp_month: '1',
        exp_year: (new Date().getFullYear() + 1).toString().substring(2)
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-number')
    })

    it('should require expiration month for no stripe.js', async () => {
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      req.fill = '#form-nojs'
      req.body = {
        name: 'Tester',
        cvc: '123',
        number: '4111111111111111',
        exp_month: '',
        exp_year: (new Date().getFullYear() + 1).toString().substring(2)
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-exp_month')
    })

    it('should require expiration year for no stripe.js', async () => {
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      req.fill = '#form-nojs'
      req.body = {
        name: 'Tester',
        cvc: '123',
        number: '4111111111111111',
        exp_month: '1',
        exp_year: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-exp_year')
    })

    it('should add payment information no stripe.js (screenshots)', async () => {
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      req.fill = '#form-nojs'
      req.body = {
        email: user.profile.contactEmail,
        description: 'Chase Sapphire',
        name: user.profile.fullName,
        cvc: '123',
        number: '4111111111111111',
        exp_month: '1',
        exp_year: (new Date().getFullYear() + 1).toString().substring(2),
        line1: '285 Fulton St',
        line2: 'Apt 893',
        city: 'New York',
        state: 'NY',
        postal_code: '10007',
        country: 'US'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/subscriptions' },
        { click: '/account/subscriptions/billing-profiles' },
        { click: `/account/subscriptions/billing-profile?customerid=${user.customer.customerid}` },
        { click: `/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}` },
        { fill: '#form-nojs' }
      ]
      global.pageSize = 50
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    // TODO: needs to work with stripe.js
    // it('should add payment information stripe.js v3', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createCustomer(user, {
    //     email: user.profile.contactEmail
    //   })
    //   global.stripeJS = 3
    //   const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
    //   req.account = user.account
    //   req.session = user.session
    //   req.waitBefore = async (page) => {
    //     console.log('waitbefore....')
    //     while (true) {
    //       const loaded = await page.evaluate(() => {
    //         return window.loaded
    //       })
    //       if (loaded) {
    //         console.log('finished')
    //         break
    //       }
    //       await page.waitForTimeout(100)
    //     }
    //   }
    //   req.waitAfter = async (page) => {
    //     console.log('waitafter....')
    //     while (true) {
    //       try {
    //         const loaded = await page.evaluate(() => {
    //           const container = document.getElementById('message-container')
    //           return container && container.children && container.children.length
    //         })
    //         if (loaded) {
    //           console.log('finished')
    //           break
    //         }
    //       } catch (error) {
    //       }
    //       await page.waitForTimeout(100)
    //     }
    //   }
    //   req.body = {
    //     email: user.profile.contactEmail,
    //     description: 'description',
    //     name: user.profile.fullName,
    //     'cvc-container': '111',
    //     'card-container': '4111111111111111',
    //     'expiry-container': '12' + ((new Date().getFullYear() + 1).toString()).substring(2),
    //     line1: '285 Fulton St',
    //     line2: 'Apt 893',
    //     city: 'New York',
    //     state: 'NY',
    //     'postal_code-container': '10007',
    //     country: 'US'
    //   }
    //   const result = await req.post()
    //   const doc = TestHelper.extractDoc(result.html)
    //   const messageContainer = doc.getElementById('message-container')
    //   const message = messageContainer.child[0]
    //   assert.strictEqual(message.attr.template, 'success')
    // })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const forms = doc.getElementsByTagName('form')
      assert.strictEqual(forms.length, 1)
      assert.strictEqual(forms[0].attr.id, 'form-nojs')
      global.stripeJS = 3
      const result2 = await req.get()
      const doc2 = TestHelper.extractDoc(result2.html)
      const forms2 = doc2.getElementsByTagName('form')
      assert.strictEqual(forms2.length, 1)
      assert.strictEqual(forms2[0].attr.id, 'form-stripejs-v3')
    })

    it('environment AUTOMATIC_BILLING_PROFILE_FULL_NAME', async () => {
      global.automaticBillingProfileFullName = true
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const nameContainer = doc.getElementById('note-container-full-name')
      const message = nameContainer.child[0]
      assert.strictEqual(message.attr.template, 'update-profile-full-name')
      global.stripeJS = 3
      const result2 = await req.get()
      const doc2 = TestHelper.extractDoc(result2.html)
      const nameContainer2 = doc2.getElementById('note-container-full-name')
      const message2 = nameContainer2.child[0]
      assert.strictEqual(message2.attr.template, 'update-profile-full-name')
    })

    it('environment REQUIRE_BILLING_PROFILE_ADDRESS', async () => {
      global.requireBillingProfileAddress = false
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const profileDescriptionContainer = doc.getElementById('profileDescriptionContainer')
      assert.strictEqual(profileDescriptionContainer, undefined)
      req.fill = '#form-nojs'
      req.body = {
        description: 'Chase Sapphire',
        email: user.profile.contactEmail,
        name: user.profile.fullName,
        cvc: '111',
        number: '4111111111111111',
        exp_month: '12',
        exp_year: ((new Date().getFullYear() + 1).toString()).substring(2)
      }
      req.waitAfter = async (page) => {
        while (true) {
          try {
            const loaded = await page.evaluate(() => {
              return document.getElementById('message-container').children.length
            })
            if (loaded) {
              break
            }
          } catch (error) {
          }
          await TestHelper.wait(100)
        }
      }
      const result2 = await req.post()
      const doc2 = TestHelper.extractDoc(result2.html)
      const messageContainer = doc2.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
      global.stripeJS = 3
      req.fill = '#form-stripejs-v3'
      req.body = {
        description: 'Chase Sapphire',
        email: user.profile.contactEmail,
        name: user.profile.fullName,
        'cvc-container': { type: true, value: '111' },
        'card-container': { type: true, value: '4111111111111111' },
        'expiry-container': { type: true, value: '12' + ((new Date().getFullYear() + 1).toString()).substring(2) },
        'postal_code-container': { type: true, value: '10007' }
      }
      const result3 = await req.post()
      const doc3 = TestHelper.extractDoc(result3.html)
      const messageContainer2 = doc3.getElementById('message-container')
      const message2 = messageContainer2.child[0]
      assert.strictEqual(message2.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-xss-input', async function () {
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      req.fill = '#form-nojs'
      req.body = {
        email: user.profile.contactEmail,
        description: 'Chase Sapphire',
        name: user.profile.fullName,
        cvc: '123',
        number: '4111111111111111',
        exp_month: '1',
        exp_year: (new Date().getFullYear() + 1).toString().substring(2),
        line1: '285 Fulton St',
        line2: 'Apt 893',
        city: '<script>',
        state: 'New York',
        postal_code: '10007',
        country: 'US'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
    })

    it('invalid-csrf-token', async function () {
      global.stripeJS = false
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/add-payment-method?customerid=${user.customer.customerid}`)
      req.puppeteer = false
      req.account = user.account
      req.session = user.session
      req.fill = '#form-nojs'
      req.body = {
        email: user.profile.contactEmail,
        description: 'Chase Sapphire',
        name: user.profile.fullName,
        cvc: '123',
        number: '4111111111111111',
        exp_month: '1',
        exp_year: (new Date().getFullYear() + 1).toString().substring(2),
        line1: '285 Fulton St',
        line2: 'Apt 893',
        city: 'New York',
        state: 'NY',
        postal_code: '10007',
        country: 'US',
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
