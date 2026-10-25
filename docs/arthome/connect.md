# Connecting the TV to the computer

How a computer talks to a Samsung The Frame 2022 (Tizen 6.5) without Tizen Studio. Everything
here was done from a Mac on the same Wi-Fi as the TV; Linux and Windows work the same with
AeroTizen's CLI.

The TV opens four doors, each for a different job:

| Port | What | Needs |
|---|---|---|
| 8001 (HTTP) | The TV's local REST API: model, power state, and whether an app is running and visible | Nothing |
| 8001 (WebSocket) | The Art Mode channel (`com.samsung.art-app`) | Nothing |
| 8002 (secure WebSocket) | The remote control channel: send keys | A one-time permission on the TV; it returns a token |
| 26101 | The developer connection (`sdb`): install apps, push files, debugging | Developer mode with the Host PC IP set to the computer |

## 1. Find the TV

Note the TV's IP address (Settings → General & Privacy → Network → Network Status) and, ideally,
reserve it in the router so it doesn't change. `aerotizen discover` also finds it.

Check it answers:

```bash
curl http://<TV IP>:8001/api/v2/
```

It returns the model, firmware and `"FrameTVSupport": "true"` on a Frame.

## 2. Developer mode and the Host PC IP

1. Open **Apps**, then the **Settings** gear inside Apps, and type **1 2 3 4 5** on the remote.
   On the 2022 interface typing it on the Apps panel itself does nothing; it only works on Apps →
   Settings.
2. Switch Developer mode **on** and set **Host PC IP** to the computer's IP.
3. **Unplug the TV for 30 seconds.** Holding the power button only puts The Frame in standby;
   the developer port (26101) doesn't open until the TV really restarts.
4. `aerotizen --tv <TV IP> status` should show `developerMode=1`.

The TV accepts the developer connection only from the Host PC IP. Every change of that IP
needs another 30-second unplug.

**TizenBrew conflict.** TizenBrew (used for TizenTube, YouTube without ads) needs the Host PC
IP set to `127.0.0.1`. So:

- `127.0.0.1` for daily use, when TizenBrew is in use;
- the computer's IP only while installing or updating something from the computer.

## 3. AeroTizen's CLI

```bash
python3 -m venv .venv-aerotizen
.venv-aerotizen/bin/pip install .        # from this repository; the CLI is unchanged AeroTizen
.venv-aerotizen/bin/aerotizen --tv <TV IP> status
.venv-aerotizen/bin/aerotizen --tv <TV IP> apps
```

## 4. Certificates

```bash
.venv-aerotizen/bin/aerotizen certs
```

It opens Samsung's sign-in page; the TV owner signs in once with their Samsung account. The
certificates are tied to that account and to the TV's ID, and live in
`~/.config/aerotizen/certs/`.

**Back them up.** An app can only be updated in place with the certificate it was signed
with. Without it you have to uninstall and lose the app's settings.

## 5. Install ArtHome

```bash
.venv-aerotizen/bin/aerotizen --tv <TV IP> install ./launcher
```

Install fails if a DevTools session (step 8) is still connected. Close it first.

## 6. The remote control channel (port 8002)

The first time a program connects, the TV shows a prompt to allow it. Accept it with the
remote; the TV gives back a token that's reused from then on. ArtHome's service uses this to
send `KEY_MENU` (it opens Samsung's full settings over ArtHome).

**Never connect or send keys while the TV is in Art Mode.** The prompt isn't visible there,
it times out, and the TV marks that client as refused.

## 7. Pushing data without reinstalling

The developer connection can **push** files to `/home/owner/share/tmp/sdk_tools/`. ArtHome's
service picks them up from there:

- `arthome-obras.json`: the artwork labels (title, author, year by artwork ID). They show
  the next time ArtHome comes to the front.
- `arthome-restaurar.json`: a settings backup to restore (Settings → About → Restore).

The TV **refuses pulls** ("You cannot pull files from this path"), so the settings backup goes
the other way: ArtHome POSTs it over HTTP to the computer at `<Host PC IP>:47791/copia`
(Settings → About → "Send the backup to the computer"). The receiving script accepts
connections only from the TV's IP.

The helper script that does both (`arthome_datos.py subir-obras | bajar-copia | restaurar FILE`)
uses `aerotizen.sdb.Sdb(...).push(...)`. It isn't in this repository yet.

## 8. Debugging

```bash
.venv-aerotizen/bin/aerotizen --tv <TV IP> inspect launcher
```

It restarts ArtHome with Chrome DevTools on `127.0.0.1:9222` on the computer. Open it in a
Chromium browser, or send `Runtime.evaluate` over the WebSocket from
`http://127.0.0.1:9222/json` to run JavaScript inside ArtHome.

## 9. Preview on the computer

- `npx serve -l 4800 launcher` serves ArtHome in a browser. It scales 1920×1080 to the
  window and uses demo apps.
- `ARTHOME_TELE=<TV IP> node tools/servicio-pruebas.js` runs the service on port 47790,
  read-only against the real TV, so the preview shows the real artwork.
- `?servicio=http://host:port` on the page URL points it at another service.

## Undo

- Developer mode: Apps → Settings → 12345 → off, then unplug the TV for 30 seconds.
- ArtHome: switch off the watcher in its Settings, then uninstall it from Apps → Settings.
- Remote permission: Settings → General & Privacy → External Device Manager → Device Connection Manager
  → Device List, remove the client.
