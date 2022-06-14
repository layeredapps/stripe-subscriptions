# Documentation for Stripe Subscriptions module

#### Shortcuts

- [Documentation website](https://layeredapps.github.io)
- [Module documentation](https://layeredapps.github.io/stripe-subscriptions-module)
- [UI screenshots](https://layeredapps.github.io/stripe-subscriptions-ui)
- [API documentation](https://layeredapps.github.io/stripe-subscriptions-api)
- [Environment configuration](https://layeredapps.github.io/stripe-subscriptions-configuration)

#### Index

- [Introduction](#introduction)
- [Import this module](#import-this-module)
- [Setting up your Stripe credentials](#setting-up-your-stripe-credentials)
- [Configuring your products and prices](#configuring-your-products-and-prices)
- [Provided server, content and proxy handlers](#provided-server-content-and-proxy-handlers)
- [Storage engine](#storage-engine)
- [Access the API](#access-the-api)
- [Github repository](https://github.com/layeredapps/stripe-subscriptions)
- [NPM package](https://npmjs.org/layeredapps/stripe-subscriptions)

# Introduction

Dashboard bundles everything a web app needs, all the "boilerplate" like signing in and changing passwords, into a parallel server so you can write a much smaller web app.

The Stripe Subscriptions module adds a complete interface for creating and managing your Stripe products, prices, subscriptions etc.  Users can self-cancel their subscriptions at any time and you can nominate a 0+ day period allowing users to refund themselves too.  You can optionally require a subscription and/or no unpaid invoices from all users outside of the `/account/` and `/administrator/` content.  The [Stripe API documentation](https://stripe.com/docs/api) supplements this documentation.

## Import this module

Install the module with NPM:

    $ npm install @layeredapps/stripe-subscriptions

Edit your `package.json` to activate the module:

    "dashboard": {
      "modules": [
        "@layeredapps/stripe-subscriptions"
      ]
    }

## Setting up your Stripe credentials

You will need to retrieve various keys from [Stripe](https://stripe.com).  During development your webhook will be created automatically, but in production with multiple dashboard server instances they share a configured webhook:

    - create your Stripe account and find your API keys
    - create a webhook for https://your_domain/webhooks/subscriptions/index-subscription-data 
    - environment STRIPE_JS=3|2|false
    - environment STRIPE_KEY=sk_test_xxxxxxx
    - environment STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx
    - environment SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET=whsec_xxxxxxxx

### Configuring your products and prices

This module adds a complete interface for creating products and prices with one-time, recurring and tiered billing.  Stripe's nomenclature and structure is used directly so for more information refer to the <a href="https://stripe.com/docs">Stripe documentation</a> and <a href="https://stripe.com/docs/api">Stripe API documentation</a>.

Users subscribe to prices and prices must be built from products.  Additionally, this module imposes a 'publish' status on products and prices that controls access to them by users.

1.  Administrator creates product
2.  Administrator publishes product
3.  Administrator creates price(s)
4.  Administrator publishes price(s)
5.  User creates a billing profile, if your prices are free then they do not require payment information but their Customer object must still be created
5.  User creates subscription to price(s)

Your application will need to use the API to create their subscription to the appropriate prices by POSTING:

    {your_dashboard_server}/api/user/subscriptions/create-subscription?customerid=X

POST data:

    priceids=price1,price2,price3
    quantities=1,1,1
    taxrateids=optional
    couponid=optional
    trial_period_days=optional
    billing_cycle_anchor=optional
    paymentmethodid=optional (will use default customer payment method)

The API will return their subscription object or throw an exception.  You can view the exceptions in `api.txt` or the documentation website.

#### Example with plan selection screen:

1) provide a page where users select their plan eg {your_application_server}/plans

2) Plan buttons are linked to create billing profile with redirect to start subscription

3) User enters payment information at `{your_dashboard_server}/account/subscriptions/create-billing-profile?return-url=/create-subscription%2Fplan=gold`

4) user redirects to `{your_application_server}/create-subscription?plan=gold`

5) Subscription is created via API at `{your_dashboard_server}/api/user/subscriptions/create-subscription?customerid=X`

#### Example with just one subscription type

1) Subscribe button is linked to create billing profile with redirect to start subscription
    
2) User enters payment information at `{your_dashboard_server}/account/subscriptions/create-billing-profile?return-url=/create-subscription`

3) User redirects to `{your_application_server}/create-subscription`

4) Subscription is created via API at `{your_dashboard_server}/api/user/subscriptions/create-subscription?customerid=X`

#### Example with metered billing

When you use metered billing prices are set based on usage amount, eg disk storage on a server.  You can set usage amounts using the API:

    {your_dashboard_server}/api/user/subscriptions/create-usage-record?subscriptionid=X

POST data:

    subscriptionitemid=X
    quantity=8
    action=increment|set

The subscription item id can be found in `subscription.items.data` array, eg `subscription.items.data[0].id`.

The API will return their usage object or throw an exception.  You can view the exceptions in `api.txt` or the documentation website.

### Customizing billing information entry

You can adjust certain parts of the payment information collection with environment variables.

Use `AUTOMATIC_BILLING_PROFILE_DESCRIPTION=true` to skip customers assigning a desciption to their profiles.

Use `AUTOMATIC_BILLING_PROFILE_FULL_NAME=true` to use the full name from the user's profile which you can collect at registration.  The user can update their profile to keep these matched.

Use `AUTOMATIC_BILLING_PROFILE_EMAIL=true` to use the contact email from the user's profile which you can collect at registration.  The user can update their profile with a different email address if necessary.

Use `REQUIRE_BILLING_PROFILE_ADDRESS=false` to disable the address collection.  You can enable it on a per-request basis by creating a `server` script and overriding the global setting:

    module.exports = {
        after: (req) => {
            if (!req.account) {
                return
            }
            if (some condition you determine) {
                req.requireBillingProfileAddress = true
            }
        }
    }

If you use `AUTOMATIC_BILLING_PROFILE_EMAIL` and `AUTOMATIC_BILLING_PROFILE_FULL_NAME` but the user does not have a profile they provide those values as normal.  To ensure the user has a profile with this information use `REQUIRE_PROFILE=true` and `USER_PROFILE_FIELDS=contact-email,full-name` to collect it at registration.

### Styling the Stripe elements

Using StripeJS version 3 sensitive fields like credit card numbers are created by Stripe in nested iframes and styled using a JavaScript object passed to their script.

You can specify your own JavaScript styling on your application server at `/stripe-element-style.json`.  This module will automatically detect if the browser is in light or dark mode, or switched mode, and apply your settings:

    {
        "light": {
            "base": {
                "color": "#666666",
                "fontFamily": "\"Helvetica Neue\", Helvetica, sans-serif",
                "fontSmoothing": "antialiased",
                "fontSize": "16px",
                "::placeholder": {
                    "color": "#EEEEEE"
                }
            },
            "invalid": {
                "color": "#990000",
                "iconColor": "#fa755a"
            }
        },
        "dark": {
            "base": {
                "color": "#666666",
                "fontFamily": "\"Helvetica Neue\", Helvetica, sans-serif",
                "fontSmoothing": "antialiased",
                "fontSize": "16px",
                "::placeholder": {
                    "color": "#EEEEEE"
                }
            },
            "invalid": {
                "color": "#990000",
                "iconColor": "#fa755a"
            }
        }
    }


# Provided server, content and proxy handlers

This module comes with some convenience scripts you can add to your `package.json`:

| Type     | Script path                                                                       | Description                                                                                                                                                                                                                                                                                                                                                                            |
|----------|-----------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| proxy    | @layeredapps/stripe-subscriptions/src/proxy/x-customers.js                        | Dashboard will bundle the user's `Customer` objects in `x-customers` header.                                                                                                                                                                                                                                                                                                           |
| proxy    | @layeredapps/stripe-subscriptions/src/proxy/x-has-customer-billing.js             | Sets `x-has-customer-billing` to `true` or `false` if the user has a Customer object with payment method.                                                                                                                                                                                                                                                                              |
| proxy    | @layeredapps/stripe-subscriptions/src/proxy/x-has-customer.js                     | Sets `x-has-customer` to `true` or `false` if the user has a Customer object.                                                                                                                                                                                                                                                                                                          |
| proxy    | @layeredapps/stripe-subscriptions/src/proxy/x-has-subscription.js                 | Sets `x-has-subscription` to `true` or `false` if the user has a subscription that is not canceled or canceling.                                                                                                                                                                                                                                                                       |
| proxy    | @layeredapps/stripe-subscriptions/src/proxy/x-invoices-latest.js                  | Dashboard will bundle the user's latest Invoice objects in `x-invoices-latest` header.                                                                                                                                                                                                                                                                                                 |
| proxy    | @layeredapps/stripe-subscriptions/src/proxy/x-invoices-open.js                    | Dashboard will bundle the user's open Invoice objects in `x-invoices-open` header.                                                                                                                                                                                                                                                                                                     |
| proxy    | @layeredapps/stripe-subscriptions/src/proxy/x-invoices.js                         | Dashboard will bundle the user's Invoice objects in `x-invoices` header.                                                                                                                                                                                                                                                                                                               |
| proxy    | @layeredapps/stripe-subscriptions/src/proxy/x-prices.js                            | Dashboard will bundle all published prices in `x-prices` header.                                                                                                                                                                                                                                                                                                                         |
| proxy    | @layeredapps/stripe-subscriptions/src/proxy/x-subscriptions-active.js             | Dashboard will bundle all the user's `active` subscriptions in `x-subscriptions-active` header.                                                                                                                                                                                                                                                                                        |
| proxy    | @layeredapps/stripe-subscriptions/src/proxy/x-subscriptions.js                    | Dashboard will bundle all the user's subscriptions in `x-subscriptions` header.                                                                                                                                                                                                                                                                                                        |
| server   | @layeredapps/stripe-subscriptions/src/server/bind-stripe-key.js                   | The Stripe API key object will be bound to `req.stripeKey` |.                                                                                                                                                                                                                                                                                                                          |
| server   | @layeredapps/stripe-subscriptions/src/server/check-before-cancel-subscription.js  | Require users complete steps, such as deleting data, before canceling their subscription.  Set a `CHECK_BEFORE_CANCEL_SUBSCRIPTION` path such as `/check-delete` on your Application server, Dashboard will query this API passing `?subscriptionid=xxxxx` and you may respond with { "redirect": "/your-delete-requirements" } or { "redirect": false }" to enforce the requirements. |
| server   | @layeredapps/stripe-subscriptions/src/server/require-payment-confirmation.js      | If the user has an invoice requiring payment confirmation they will be redirected to provide it.  They can still access `/account` and `/administrator` routes (if an administrator)                                                                                                                                                                                                   |
| server   | @layeredapps/stripe-subscriptions/src/server/require-payment.js                   | If the user has an invoice requiring payment they will be redirected to provide it.  They can still access `/account` and `/administrator` routes (if an administrator)                                                                                                                                                                                                                |
| server   | @layeredapps/stripe-subscriptions/src/server/require-subscription.js              | If the user does not have a subscription they will be redirected to create one.  They can still access `/account` and `/administrator` routes (if an administrator)                                                                                                                                                                                                                    |

This module includes "private" content scripts that are configured automatically:

|----------|----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| content  | @layeredapps/stripe-subscriptions/src/content/embed-stripe-element-style.js            | When STRIPE_JS=3 this loads "/stripe-elements-style.json" from this module or your application server to style Stripe's special fields created with stripe.js.  The style object is cached for 60 seconds.                                                                                                                                                                        |

## Storage engine

By default this module will share whatever storage you use for Dashboard.  You can specify nothing, specify an alternate storage backend, or specify the same type with a separate database.

    SUBSCRIPTIONS_STORAGE=mysql
    SUBSCRIPTIONS_DATABASE_URL=mysql://username:password@host:port/db

If your Dashboard is configured with database read replication servers this module will follow that configuration.  You can also specify module-specific read replication:

    SUBSCRIPTIONS_STORAGE_REPLICATION=true
    SUBSCRIPTIONS_DATABASE_URL=postgres://1.0.0.0:5432/subscriptions
    SUBSCRIPTIONS_READ_DATABASE_URL1=postgres://1.0.0.1:5432/subscriptions
    SUBSCRIPTIONS_READ_DATABASE_URL2=postgres://1.0.0.2:5432/subscriptions
    SUBSCRIPTIONS_READ_DATABASE_URL3=postgres://1.0.0.3:5432/subscriptions

### Access the API

Dashboard and official modules are completely API-driven and you can access the same APIs on behalf of the user making requests.  You perform `GET`, `POST`, `PATCH`, and `DELETE` HTTP requests against the API endpoints to fetch or modify data.  This example fetches the user's subscriptions using NodeJS, you can do this with any language:

You can view API documentation within the NodeJS modules' `api.txt` files, or on the [documentation site](https://layeredapps.github.io/stripe-subscriptions-api).

    const subscriptions = await proxy(`/api/user/subscriptions/subscriptions?accountid=${accountid}&all=true`, accountid, sessionid)

    const proxy = util.promisify((path, accountid, sessionid, callback) => {
        const requestOptions = {
            host: 'dashboard.example.com',
            path: path,
            port: '443',
            method: 'GET',
            headers: {
                'x-application-server': 'application.example.com',
                'x-application-server-token': process.env.APPLICATION_SERVER_TOKEN,
                'x-accountid': accountid,
                'x-sessionid': sessionid
            }
        }
        const proxyRequest = require('https').request(requestOptions, (proxyResponse) => {
            let body = ''
            proxyResponse.on('data', (chunk) => {
                body += chunk
            })
            return proxyResponse.on('end', () => {
                return callback(null, JSON.parse(body))
            })
        })
        proxyRequest.on('error', (error) => {
            return callback(error)
        })
        return proxyRequest.end()
      })
    }
