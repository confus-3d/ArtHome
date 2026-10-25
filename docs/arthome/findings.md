# Findings

What we learned about a **Samsung The Frame 2022** (TQ65LS03BGUXXC, Tizen 6.5, firmware
1720.7) while building ArtHome, October 2026. Some of it may hold for other 2022 Samsung TVs;
none of it is documented by Samsung unless a source is given.

## Coming back with Home

AeroTizen's approach: a background service starts with the TV, remembers which app ArtHome
opened, and polls the TV's REST API. When that app stops being `visible`, the user must have
pressed Home, so it reopens the launcher.

- **Ask by store number, not by Tizen app ID.** `GET :8001/api/v2/applications/<id>` with
  the Tizen app ID (`MCmYXNxgcu.DisneyPlus`) always reported `visible: true`; with the store
  number (`3201901017640`) it changes. See [apps.md](apps.md).
- **The 2022 Smart Hub keeps the previous app in a preview window.** Apps that keep drawing
  there (Prime Video, Disney+) are still `visible` after Home. Samsung documents **no
  setting to turn the preview off**: owners of the S95B and Frame 2022 ask for it on
  Samsung's forums with no official answer. "Start with Smart Hub" (Settings → General &
  Privacy → Start Screen Option) only affects power-on.
- What each app reports when you press Home (probe: open, wait 10 s, Home, wait 10 s):

  | App | REST `visible` | DIAL (port 8080) | Remote channel |
  |---|---|---|---|
  | Netflix | goes false | | |
  | YouTube | goes false | running → stopped | |
  | Spotify | goes false | | |
  | Prime Video | stays true | | `touchEnable` on open, **`touchDisable` on Home** |
  | Disney+ | stays true (preview) | | nothing |
  | TizenTube | never true | | nothing |
  | Crunchyroll, Atresplayer | to test by store number | stays running | |

- **Samsung's home screen can't be detected.** `com.samsung.tv.csfs` doesn't answer.
- **The Home key can't be read.** The system keeps it. A background service gets no key
  events at all, and inside another app the keys go to that app.
- **Tizen's own notices don't arrive.** `tizen.application.addAppStatusChangeListener`
  delivered nothing from the service on this TV. `visibilitychange` only reports the
  launcher's own page; once Netflix is in front, ArtHome is hidden and frozen.
- **The screen can't be read** (no permission, and video is protected).
- **The Samsung TV Plus button works as an ArtHome button.** It opens TV Plus over any app, the
  watcher sees TV Plus come to the front and opens ArtHome. TV Plus flashes for a moment, and
  that flash can't be removed. TV Plus has to be enabled; if it's disabled the button does
  nothing.
- **Forget the previous app.** Once ArtHome has been in front for 2.5 s, the service forgets
  the app it was watching. Otherwise a stale "still visible" app blocked the next return.
- **Speed:** polling every 150 ms and calling the launcher directly (without first listing
  every app) brings it back in about a second.
- **Not done:** making Home itself open another app needs undocumented internal settings or
  root. Replacing TV Plus with our own app isn't possible either: the TV only accepts the
  version Samsung signs. With a streaming box (Google TV, Apple TV) Home would work, but TV
  and HDMI still go through Samsung's home screen.

## Art Mode

- **The Art Mode guard must ask fresh.** AeroTizen checks Art Mode twice, fresh each time,
  with a 1.5 s grace before reopening the launcher. We tried caching the answer and shortening
  the grace to 0.15 s, and ArtHome reopened on top of Art Mode, so the TV couldn't be put to
  sleep. We reverted to the original, and it stays that way.
- **The Art channel only answers broadcasts.** On WebSocket `:8001/api/v2/channels/com.samsung.art-app`,
  requests sent `to: "host"` (as the `samsungtvws` library does) got no answer while
  AeroTizen/ArtHome was connected; the same requests sent `to: "broadcast"` work.
- **Current artwork:** `get_current_artwork` returns the ID (`MY_F0032`). Sometimes there's no
  answer; three short tries of 2.5 s and a retry after 8 s cover it.
- **Images:** only `get_thumbnail_list` answers (`get_thumbnail` doesn't). The file arrives on
  a separate D2D socket: a 4-byte header length, a JSON header with `fileLength`, then the
  file. The thumbnail is **384×216**, too soft for full screen, but fine blurred.
- **Turning Art Mode on:** `set_artmode_status` with `on`.
- Upload, select and delete from the computer all work. Uploads go to the TV's internal memory
  (`content_type: myphoto`); works from a USB stick show as `usb`. Whether they stay without the
  stick isn't checked.
- The TV accepted the matte `modern_polar` but showed none on screen. We use no mat.
- `get_auto_rotation_status` hung for over 60 s.
- Polling Art Mode every 3 s was unnecessary; ArtHome now asks every minute, and on demand
  right before it would reopen.

## The TV as a platform

- **Chromium 85**, drawn at 1920×1080 and upscaled on the 4K panel. Live CSS blur and
  backdrop filters are too slow: blur once on a small canvas and let the browser stretch it,
  and animate only position and opacity. arn0-tv's measurements on Tizen 6.5 agree.
- **The service runs an old Node.js**, so it's ES5 with no `Buffer.from` (ArtHome uses a
  small helper).
- **Live TV inside the launcher doesn't work here.** AeroTizen draws the TV in its own window
  (`tvwindow.show`). Coming from an app, the picture showed but the remote didn't respond
  (no channels, no guide). Switching the source and opening `org.tizen.tv-viewer` from the
  launcher works. The TV refuses to open that viewer from the computer.
- **`KEY_MENU`** on the remote channel opens Samsung's full settings on top of the launcher.
  Launching the settings app directly doesn't work on this firmware.
- **Developer mode:** the 12345 code only works on Apps → Settings, the developer port needs
  a real restart (unplug), and **files can be pushed but not pulled**. See
  [connect.md](connect.md).
- `tizen.getAppsInfo()` doesn't include the store number; the icon path sometimes does.
- Local storage survives updates, but the TV closes the launcher when memory is short. ArtHome
  caches the app list and the blurred background, so it draws instantly when it comes back.
- Removing preinstalled apps over the developer connection isn't allowed on Tizen 6+. Delete
  them on the TV (Apps → Settings); system apps can only be disabled.

## Ads and tracking

This part of the project is outside ArtHome, and it's **not finished**.

- **The internet provider intercepts all plain DNS.** In this home (Vodafone Spain, with a
  second router behind theirs), every UDP port 53 query is answered by the ISP's servers, whatever
  server you ask: NextDNS, Cloudflare, Google, Quad9. A traceroute to 1.1.1.1 "arrives" at the
  second hop. DNS over TCP gets through, and DNS over HTTPS or TLS can't be intercepted, but the
  TV can't use either. So NextDNS, AdGuard DNS or `1.1.1.1` set on the TV do nothing.
- **What works instead:** the blacklist of the home router (Xiaomi AX3000), set **for the TV
  only**, which is applied before the ISP. Exact domains only, no wildcards or keywords.
- **A generic blocklist for the whole house broke Netflix** before this project.
  `samsungcloudsolution.com/.net` blocked entirely is the likely cause: it also breaks YouTube
  and Amazon.

Planned rounds, one at a time, with every app tested after each:

0. `example.com` to check that the blacklist really filters the TV.
1. Viewing tracking (ACR): `samsungacr.com`, `log-1.samsungacr.com`, `log-2.samsungacr.com`,
   `log-3.samsungacr.com`, `log-config.samsungacr.com`, `log-ingestion.samsungacr.com`,
   `log-ingestion-eu.samsungacr.com`.
2. Ads: `samsungads.com`, `ads.samsungads.com`, `events.samsungads.com`,
   `config.samsungads.com`, `samsungadhub.com`, `ad.samsungadhub.com`, `rd.samsungadhub.com`,
   `tvx.adgrx.com`, `samsungrm.net`.
3. `acr0.samsungcloudsolution.com` on its own, in case the router treats it as the whole
   domain.
4. Optional telemetry: `samsungelectronics.com`, `samsungyosemite.com`.

Never block:

| Domain | Why |
|---|---|
| `samsungcloudsolution.com` / `.net` (whole) | Breaks YouTube, Amazon and others |
| `samsungqbe.com` (and `gpm.`, `osb.`) | Smart Hub and TV Plus content; reported to cause many problems |
| `samsungosp.com` | Samsung account sign-in |
| `samsungotn.net`, `otn*.samsungcloudsolution.net`, `otn.samsungcloudcdn.com` | Firmware updates |
| `svdca.samsungqbe.com` | Developer certificates |
| The streaming apps' own domains | The apps |

The list combines our observations, [Perflyst's SmartTV list](https://github.com/Perflyst/PiHoleBlocklist)
and AeroTizen's "safe" list in [`dns/`](../../dns/), minus anything one of them warns
breaks things. Undo: remove the last round's lines.

Status: round 0 hasn't run, because the router's web interface hangs (it answers ping and
port 80, then times out).

## Privacy settings

Settings → Support → Terms & Privacy → Privacy Choices on this model only lists documents,
with no visible switches. The consent for viewing information, interest-based ads and voice
is probably at the end of each document; this hasn't been checked yet. AeroTizen's
[settings guide](../settings.md) covers the rest.

## Other launchers

From the r/Tizen thread about Flix Home and the projects it links (October 2026):

| Project | Licence | Notes |
|---|---|---|
| [AeroTizen](https://github.com/helalaou/AeroTizen) | MIT | No root; starts at power-on, returns with Home from apps that report themselves; respects Art Mode. **ArtHome's base** |
| [arn0-tv](https://github.com/NelsonEU/arn0-tv) | MIT | Tizen 6.5, same firmware. Useful performance measurements |
| [CleanFrame](https://github.com/nthnclrk/CleanFrame) | MIT | Made for The Frame 2024 (Tizen 9) |
| TVDeck | MIT | TizenBrew module; opens from TizenBrew only |
| Flix Home, Scenic Home | none | Ideas only; no code can be reused |
| Root-based projects | | Not considered |

None offered an Art Mode button, which is why ArtHome exists.
