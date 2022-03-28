import webPush from 'web-push'
import express from 'express'
import bodyParser from 'body-parser'

const keys = {
  publicKey:
    'BD2gNRq9qFf8hiz3kwpr6GI0-eWE8LB8R5QW4woOgkov4Rv-LVOb-fcgnpJnzpPEwCXwfm-tPWciR0dZOUTS5Yg',
  privateKey: '6UdRkRpC-BsXvueGKg--LRw9HkCWxdy_ejuvqqp7km0'
}

webPush.setVapidDetails(
  'https://serviceworke.rs/',
  keys.publicKey,
  keys.privateKey
)

const subscriptions = []

const app = express()

app.use(bodyParser.json())

app.get('/public-key', (req, res) => {
  res.set('Content-Type', 'text/plain')
  res.send(keys.publicKey)
})

app.post('/register', (req, res) => {
  const subscription = req.body.subscription
  subscriptions.push(subscription)
  res.sendStatus(201)
})

app.post('/trigger-notifications', async (req, res) => {
  try {
    await Promise.all(subscriptions.map((sub) => webPush.sendNotification(sub)))
    res.sendStatus(201)
  } catch (e) {
    console.log(e)
    res.sendStatus(500)
  }
})

app.listen(4000)
