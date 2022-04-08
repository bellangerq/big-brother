import { StreamCamera, Codec } from 'pi-camera-connect'
import express from 'express'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import wp from 'web-push'
import 'dotenv/config'

const envVars = ['PASSWORD', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY']
envVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Please define the \`${envVar}\` variable.`)
    process.exit(1)
  }
})

const __dirname = dirname(fileURLToPath(import.meta.url))

const jwtSecret = 'jwt-secret__' + crypto.randomUUID()
const cookieKey = 'user-id'
const url =
  process.env.NODE_ENV !== 'production'
    ? 'http://localhost:3000'
    : 'https://big-brother.quentin-bellanger.com'

// Generate vapid keys
const publicKey = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY

wp.setVapidDetails('https://quentin-bellanger.com', publicKey, privateKey)

async function loadSubscriptions() {
  let subscriptions = []

  try {
    const rawSubscriptionsFile = await fs.promises.readFile(
      path.join(__dirname, './subscriptions.json')
    )
    subscriptions = JSON.parse(rawSubscriptionsFile)
  } catch (error) {
    console.error('Failed to load subscriptions file. Defaulting to [].')
  }

  return subscriptions
}

async function saveNewSubscription(subscription) {
  const subscriptions = await loadSubscriptions()

  const subscriptionAlreadyExist = subscriptions.some((sub) => {
    return sub.endpoint === subscription.endpoint
  })

  if (subscriptionAlreadyExist) {
    console.warn('Subscription already saved. Skipping.')
    return
  }

  subscriptions.push(subscription)

  try {
    await fs.promises.writeFile(
      path.join(__dirname, './subscriptions.json'),
      JSON.stringify(subscriptions)
    )
  } catch (err) {
    console.error('Error while writing "subscriptions.json".')
  }
}

const runApp = async () => {
  let streamCamera = null
  if (process.env.NODE_ENV === 'production') {
    streamCamera = new StreamCamera({
      codec: Codec.MJPEG,
      width: 1280,
      height: 720,
      fps: 15
    })

    await streamCamera.startCapture()
  }

  const app = express()

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(cookieParser())
  app.use(morgan('dev'))

  app.post('/login', (req, res) => {
    const password = req.body.password
    if (password !== process.env.PASSWORD) {
      return res.sendStatus(403)
    }

    res.set({
      Location: url,
      'Set-Cookie': `${cookieKey}=${jwt.sign({}, jwtSecret)}`
    })
    res.sendStatus(301)
  })

  app.get('/stream.mjpg', async (req, res) => {
    try {
      jwt.verify(req.cookies[cookieKey], jwtSecret)
    } catch (error) {
      res.sendStatus(403)
      return
    }

    if (process.env.NODE_ENV !== 'production') {
      const p = path.join(__dirname, '/placeholder.png')
      res.sendFile(p)
    } else {
      res.writeHead(200, {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0',
        Pragma: 'no-cache',
        Connection: 'close',
        'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary'
      })

      let isReady = true

      let frameHandler = (frameData) => {
        try {
          if (!isReady) {
            return
          }
          isReady = false
          res.write(
            `--myboundary\nContent-Type: image/jpg\nContent-length: ${frameData.length}\n\n`
          )
          res.write(frameData, function () {
            isReady = true
          })
        } catch (ex) {
          console.error('Unable to send frame: ' + ex)
        }
      }

      let frameEmitter = streamCamera.on('frame', frameHandler)

      req.on('close', () => {
        frameEmitter.removeListener('frame', frameHandler)
        console.log('Connection terminated: ' + req.hostname)
      })
    }
  })

  app.get('/push/public-key', (req, res) => {
    res.set('Content-Type', 'text/plain').send(publicKey)
  })

  app.post('/push/register', async (req, res) => {
    const subscription = req.body.subscription
    await saveNewSubscription(subscription)
    res.sendStatus(201)
  })

  app.listen(2018, async () => {
    console.log(`Listening on port 2018!`)
    const subscriptions = await loadSubscriptions()

    subscriptions.forEach(async (sub) => {
      try {
        await wp.sendNotification(sub)
      } catch (error) {
        console.error('Error sending notification to: ', sub.endpoint)
      }
    })
  })
}

runApp()
