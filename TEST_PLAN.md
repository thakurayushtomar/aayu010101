# Test Plan — Earth Jukebox

Run these tests in the same browser/device used for the hackathon presentation.

| ID | Test | Expected result |
|---|---|---|
| T01 | Open index through local server | App loads with no fatal JS error |
| T02 | Click globe | Coordinate inputs and selected location update |
| T03 | Enter valid coordinates | Location updates |
| T04 | Enter latitude 91 | Accessible validation announcement; no API request |
| T05 | Search a city | Place result resolves or an informative error appears |
| T06 | Load NASA POWER data | Daily chart, statistics and monthly table populate |
| T07 | Select another parameter | Old data is invalidated; user is prompted to reload |
| T08 | Download CSV | CSV includes date, parameter, value and unit |
| T09 | Play yearly sonification | Monthly notes are generated from monthly data |
| T10 | Stop sonification | Notes stop and status updates |
| T11 | Switch to EIC mode | EIC player, mapping, source and credits appear |
| T12 | Play remote EIC video | Video starts; frame sampling generates notes if CORS permits |
| T13 | Simulate remote CORS failure | App stops and explains local official-video upload fallback |
| T14 | Load official video locally | Local video can be sampled without remote canvas CORS |
| T15 | Keyboard-only navigation | All controls can be reached and activated |
| T16 | Screen-reader run | Labels, status messages and data table are understandable |
| T17 | Voice command unsupported | Text/keyboard controls remain available |
| T18 | Voice command supported | Recognized commands route to expected action |
| T19 | Browser refresh | App resets without stale playback |
| T20 | Public deployment | App works in private browser without login |

Record actual result, browser, date, tester and notes. Do not mark a test passed unless it has been run.
