# App list

The apps installed on the TV on 2026-10-25 (`aerotizen apps`), with the two IDs that matter:

- **Tizen app ID**: what you launch (`tizen.application.launch(id)`).
- **Store number**: what the TV's REST API answers for. `GET http://<TV>:8001/api/v2/applications/<number>`
  returns `running` and `visible`. Asked by the Tizen app ID, `visible` never changed (found
  with Disney+), so ArtHome's watcher uses the store number. The table is in
  `launcher/js/tienda.js`.

"Home → ArtHome" is the result of pressing Home inside the app with ArtHome's watcher on (see
[findings](findings.md#coming-back-with-home)).

## Streaming and TV

| App | Tizen app ID | Store number | Home → ArtHome |
|---|---|---|---|
| Netflix | `org.tizen.netflix-app` | 3201907018807 | ✓ |
| YouTube | `9Ur5IzDKqV.TizenYouTube` | 111299001912 | ✓ |
| Spotify | `rJeHak5zRg.Spotify` | 3201606009684 | ✓ |
| Prime Video | `org.tizen.primevideo` | 3201910019365 | ✗ stays visible in Samsung's preview; it sends `touchDisable` on the remote channel (not used yet) |
| Disney+ | `MCmYXNxgcu.DisneyPlus` | 3201901017640 | ⚠ stays visible in the preview; the watcher saw Home once with the store number, not confirmed on screen |
| Movistar Plus+ | `m52SXlMi8Y.YOMVITIZEN` | 141199000051 | ? to test with the store number |
| Crunchyroll | `OGLLvqej7u.CrunchyrollWebApp` | 3202302030097 | ? to test |
| Atresplayer | `Y7yjOduDyF.Atresplayer` | 11101300901 | ? to test |
| RTVE Play | `ubrNshqKcU.ALaCarta` | 3201904018214 | ? |
| 3Cat | `PzkKxRdFT6.TV3` | 3201902017785 | ? |
| SkyShowtime | `skysh0WTIM.SkyShowtime` | 3202208028071 | ? |
| Apple TV | `com.samsung.tv.aria-video` | 3201807016597 | ? |
| TizenBrew (TizenTube) | `xvvl3S1bvH.TizenBrewNextGeneration` | — | ✗ never reports itself as visible |

For **every** app, the **Samsung TV Plus** button on the remote brings ArtHome back. There's a
short TV Plus flash.

## Others

| App | Tizen app ID | Store number | Notes |
|---|---|---|---|
| Browser | `org.tizen.browser` | 3202010022079 | |
| Amazon Alexa | `AQKO41xyKP.AmazonAlexa` | 3202004020626 | |
| Security Center | `J9fZJDMi1v.SecurityCenter` | 3202009021877 | |
| BixbyPromotion | `com.samsung.tv.bixby-promotion` | 3202205027543 | |

## Hidden by default in ArtHome

AeroTizen's CLI flags these as bloat. Nothing was uninstalled; ArtHome only hides them in All
apps, and they can be shown again.

| App | Tizen app ID | Store number |
|---|---|---|
| Xbox | `GHI3a0zMSx.XboxGamePass` | 3202203026799 |
| GeForce NOW | `w0wZu3xkQq.GeForceNOW` | 3202102023078 |
| Amazon Luna | `CmeyUlnhYY.LunaWebApp` | 3202203026819 |
| e-Manual | `g0l3ad0res.emanual` | 20222100002 |
| Rakuten TV | `vbUQClczfR.Wuakitv` | 3201511006428 |

## System pieces

| What | ID | Notes |
|---|---|---|
| ArtHome | `DclHome001.Home` (service `DclHome001.Watcher`) | Same IDs as AeroTizen, so it installs as an update |
| Samsung's TV viewer | `org.tizen.tv-viewer` | Opened by ArtHome for Live TV and HDMI. The TV refuses to open it from the computer (REST API and developer mode) |
| Samsung's home screen | `com.samsung.tv.csfs` | Doesn't answer when asked for its state |
| Art Mode | WebSocket channel `com.samsung.art-app` | Not an app you launch; see [findings](findings.md#art-mode) |

## Regenerating `tienda.js`

When apps are installed or removed, `tienda.js` has to be regenerated from the TV's list. The
store number isn't in what `tizen.getAppsInfo()` returns. The icon path sometimes includes it
(`apps_icon/all/<number>/`) and ArtHome uses that as a fallback, but not reliably. The
numbers here came from the TV's app list snapshot that `aerotizen apps` saves in
`~/.config/aerotizen/`.
