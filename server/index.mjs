import { StreamCamera, Codec } from 'pi-camera-connect'
import express from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

if (!process.env.PASSWORD) {
  console.error('Please define the `PASSWORD` variable.')
  process.exit(1)
}

const jwtSecret = 'jwt-secret__' + crypto.randomUUID()
const cookieKey = 'user-id'
const url =
  process.env.NODE_ENV !== 'production'
    ? 'http://localhost:3000'
    : 'https://big-brother.quentin-bellanger.com'

const runApp = async () => {
  const app = express()

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(cookieParser())

  app.post('/login', (req, res) => {
    const password = req.body.password
    if (password !== process.env.PASSWORD) {
      console.error('Wrong password!')
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
      console.log(error)
      res.sendStatus(403)
      return
    }

    if (process.env.NODE_ENV !== 'production') {
      const __dirname = dirname(fileURLToPath(import.meta.url))
      const p = path.join(__dirname, '/placeholder.png')
      res.sendFile(p)
    } else {
      const streamCamera = new StreamCamera({
        codec: Codec.MJPEG,
        width: 1280,
        height: 720,
        fps: 15
      })

      await streamCamera.startCapture()

      res.writeHead(200, {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0',
        Pragma: 'no-cache',
        Connection: 'close',
        'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary'
      })

      console.log('Accepting connection: ' + req.hostname)
      let isReady = true

      let frameHandler = (frameData) => {
        try {
          if (!isReady) {
            return
          }
          isReady = false
          console.log('Writing frame: ' + frameData.length)
          res.write(
            `--myboundary\nContent-Type: image/jpg\nContent-length: ${frameData.length}\n\n`
          )
          res.write(frameData, function () {
            isReady = true
          })
        } catch (ex) {
          console.log('Unable to send frame: ' + ex)
        }
      }

      let frameEmitter = streamCamera.on('frame', frameHandler)

      req.on('close', () => {
        frameEmitter.removeListener('frame', frameHandler)
        console.log('Connection terminated: ' + req.hostname)
      })
    }
  })
  app.listen(2018, () => console.log(`Listening on port 2018!`))
}
runApp()
