self.addEventListener('push', (e) => {
  console.log(e)
  // e.waitUntil(
  //   self.registration.showNotification('Big Brother', {
  //     body: 'Alea iacta est'
  //   })
  // )
})
