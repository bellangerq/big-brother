// /**
//  * @returns {boolean} True when the browser supports the required APIs.
//  */
// function checkBrowserSuppport() {
//   return 'Notification' in window
// }

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

// const pushButton = document.querySelector('.push')

// if (!checkBrowserSuppport()) {
//   pushButton.setAttribute('hidden', 'hidden')
// }

// pushButton.addEventListener('click', async (e) => {
//   const result = await Notification.requestPermission()

//   if (result !== 'granted') {
//     // permission denied
//     return
//   }

//   // register service worker
//   const registration = await navigator.serviceWorker.register(
//     '/serviceWorker.js'
//   )

//   // FIXME: handle Safari support
//   let subscription = await registration.pushManager.getSubscription()

//   if (subscription) {
//     // already subscribed
//     return
//   }

//   const publicKey = await (await fetch('/public-key')).text()

//   subscription = await registration.pushManager.subscribe({
//     userVisibleOnly: true,
//     applicationServerKey: publicKey
//   })

//   console.log(subscription)

//   await fetch('/register', {
//     method: 'POST',
//     body: JSON.stringify({ subscription }),
//     headers: { 'Content-Type': 'application/json' }
//   })

//   fetch('/trigger-notifications', { method: 'POST' })

//   // // permission granted
//   // const notification = new Notification('Odette est en direct', {
//   //   body: 'Viens espionner Odette :)',
//   //   lang: 'fr'
//   // })
// })
