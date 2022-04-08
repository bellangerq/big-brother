/* eslint-env serviceworker */
self.addEventListener('push', function (event) {
  event.waitUntil(
    self.registration.showNotification('Odette est en live 🎥', {
      body: "Viens l'espionner 👀🕵️",
      silent: false,
      vibrate: [300]
    })
  )
})
