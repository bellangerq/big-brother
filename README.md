# big-brother

Big Brother is intended to spy on Odette when she is alone with a Raspberry Pi camera.

Thank you [Adrien](https://github.com/hissalht) for your kind help on this project. 🙏🏼

## Development

- Install dependencies on both client and server: `yarn`
- Run Vite local app on [port 3000](http://localhost:3000): `yarn dev`
- Run Express local server on [port 2018](http://localhost:2018): `yarn start`

SSH can be used to do [remote development with VS Code](https://code.visualstudio.com/docs/remote/ssh).

## Deployment

Every push on `main` will trigger a deployment of the front-end on Netlify.

To start the server from the Rasbperry pi, precise the `NODE_ENV` variable directly in the command.

```sh
# Using default password
NODE_ENV=production yarn start
# Using custom password
NODE_ENV=production PASSWORD=foobar yarn start
```

## To do

- Move focus to tab/window on notification click
- Change subscribe button if already subscribed
- Show success on button click subscribe
- Show stream on notif click if user is connected
