import express from 'express'

const app = express()

app.get('/foo', (req, res) => {
  res.send({
    message: 'Hello world'
  })
})

const port = process.env.PORT || 2018
app.listen(port, () => {
  console.log('Server is live on port', port)
})
