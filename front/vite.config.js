export default {
  server: {
    proxy: {
      '/login': 'http://localhost:2018',
      '/stream.mjpg': 'http://localhost:2018',
      '/push/': 'http://localhost:2018'
    }
  }
}
