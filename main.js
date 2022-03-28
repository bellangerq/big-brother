/**
 * @returns {boolean} True when the browser supports the required APIs.
 */
function checkBrowserSuppport() {
  return 'Notification' in window
}

// Show stream and hide form when connected
const img = document.querySelector('img')
const form = document.querySelector('form')
const figure = document.querySelector('figure')

img.addEventListener(
  'load',
  () => {
    form.setAttribute('hidden', 'hidden')
    figure.classList.remove('hidden')
  },
  { once: true }
)

const pushButton = document.querySelector('.push')
const pushSupport = document.querySelector('.push-support')

if (!checkBrowserSuppport()) {
  pushButton.setAttribute('disabled', 'disabled')
  pushSupport.removeAttribute('hidden')
}

pushButton.addEventListener('click', async (e) => {
  const result = await Notification.requestPermission()

  if (result !== 'granted') {
    // permission denied
    return
  }

  // permission granted
  setTimeout(() => {
    const notification = new Notification('Odette est en direct', {
      body: 'Viens espionner Odette :)',
      lang: 'fr'
    })
  }, 1000)
})
