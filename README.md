# Concentric Panel

A concentric ring clock with a calendar panel, on a black background. Plain
HTML, CSS and JavaScript: no libraries, no build step.

Live: https://i5dr0id.github.io/concentric-panel/

- The seconds ring sweeps continuously (updated every frame).
- The minute ring rolls to each new minute; the current minute is enlarged and
  its neighbors step aside.
- The panel shows the weekday, date, the month with today marked, and how far
  through the day and the year you are.
- The cursor hides after 2.5 s without movement, so it works as a wallpaper or
  screen saver page.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `style.css` | Layout, rings, panel |
| `clock.js` | Builds the rings and keeps everything in time |

## Run

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server
```

The font is [Outfit](https://fonts.google.com/specimen/Outfit) from Google Fonts,
falling back to the system font offline.

A plain-JavaScript rewrite of the `/panel` layout from
[concentric](https://github.com/i5dr0id/concentric).
