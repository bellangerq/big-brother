// Show stream and hide form when connected
const img = document.querySelector('figure img')
const form = document.querySelector('form')
const figure = document.querySelector('figure')

img.src = '/stream.mjpg'

img.addEventListener(
  'load',
  () => {
    form.setAttribute('hidden', 'hidden')
    figure.classList.remove('hidden')
  },
  { once: true }
)

// Push notifications
const pushButton = document.querySelector('.push')

pushButton.addEventListener('click', () => {
  setupServiceWorker()
})

async function setupServiceWorker() {
  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    return
  }

  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/'
  })

  registration.pushManager
    .getSubscription()
    .then(async (subscription) => {
      if (subscription) {
        return subscription
      }
      const publicKey = await (await fetch('/push/public-key')).text()

      // never resolve or reject on ungoogled chromium
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      })
    })
    .then(async (subscription) => {
      await fetch('/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      })
    })
    .catch((err) => {
      console.error({ err })
    })
}
