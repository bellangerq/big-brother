# big-brother

Big Brother is intended to spy on my good doggo™ when she is alone.

## How to launch

Connect to the Raspberry Pi from a Mac using SSH and start the script:

```sh
ssh <ip-address>
PASSWORD=<password> python big-brother.py
```

## To do

- Launch script on Raspberry Pi boot.
- Clean code
- Ping the server on page load to detect if it is up or not (create a route /ping)
- Make it a PWA with push notifications
