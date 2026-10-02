# LiquidMusic

A [Spicetify](https://spicetify.app) theme inspired by iOS 27 and Apple Music: frosted glass panels, a floating
player, and an accent colour taken from whatever is playing.

![LiquidMusic in dark mode, on the home page](screenshots/home-dark.webp)

## Features

- **Glass everywhere.** The library, the side panel, the toolbar, menus and the search field are frosted glass
  over a blurred copy of the current artwork, so the whole window takes on the colours of the song.
- **Colour from the artwork.** The accent (buttons, progress bar, highlights, links) is picked from the album cover
  and adjusted until it reads at 4.5:1 or better on the theme's surfaces. Panels thicken on busy covers so
  secondary text stays legible.
- **Floating player.** The playback bar becomes a pill with an LCD-style track display, floating at the bottom of
  the window whatever the size of the side panels. On narrow windows it drops secondary controls first, so the title
  always has room.
- **Light, dark or automatic.** The `auto` scheme follows your system setting and switches live.
- **Accessibility.** Reduced motion, reduced transparency and increased contrast system settings are respected:
  animations calm down, and glass turns into solid surfaces.

## Screenshots

| | |
|---|---|
| ![Home page in light mode](screenshots/home-light.webp) | ![Artist page with its banner photo](screenshots/artist-dark.webp) |
| ![Liked Songs in dark mode](screenshots/playlist-dark.webp) | ![Liked Songs in light mode](screenshots/playlist-light.webp) |
| ![Synced lyrics in the accent of the album cover](screenshots/lyrics-dark.webp) | ![Glass context menu with an accent highlight](screenshots/context-menu.webp) |

## Install

### From the Marketplace

Open the **Marketplace** in Spotify, go to **Themes**, search for **LiquidMusic** and install it. Pick `auto`, `dark`
or `light` from the colour scheme menu at the top of the Marketplace.

On Spotify 1.3.3, the Marketplace's own tab bar (Extensions, Themes…) doesn't show until Spicetify supports that
version, so the Themes tab can't be reached: install LiquidMusic manually instead. Once it's active, it brings the
Marketplace's tabs back.

### Manually

1. Copy the `LiquidMusic` folder into your Spicetify `Themes` folder:
   - Windows: `%APPDATA%\spicetify\Themes`
   - macOS and Linux: `~/.config/spicetify/Themes`

   (`spicetify path userdata` prints the exact location.)
2. Select the theme and turn on the options it needs:

   ```sh
   spicetify config current_theme LiquidMusic color_scheme auto
   spicetify config inject_css 1 replace_colors 1 inject_theme_js 1
   spicetify apply
   ```

`inject_theme_js` is required: the dynamic accent, the artwork backdrop and the automatic light/dark switch run in
the theme's script.

### Colour schemes

| Scheme | |
|---|---|
| `auto` | Follows your system's light or dark setting (default) |
| `dark` | Always dark |
| `light` | Always light |

Change it with `spicetify config color_scheme dark`, then `spicetify apply`.

## Font

The theme uses [Inter](https://rsms.me/inter/), loaded from Google Fonts when Spotify starts. If it can't load,
text falls back to SF Pro, Segoe UI Variable, then your system font.

## Extensions

LiquidMusic is tested with these Marketplace extensions:

- **Spicy Lyrics:** its lyrics card sits in the Now Playing panel after the track title, also while a Canvas video
  plays.
- **Cover Ambience:** the artwork's colour tints the track display in the middle of the player pill.
- **Extensions with top-bar buttons** (Syncify…): their buttons join the toolbar's glass capsule.
- **The Marketplace itself** is restyled to match: glass cards, capsule controls.

On Spotify 1.3.3, Quick Queue adds its buttons on album and artist pages, but not yet on playlists, Liked Songs or
search results: there it can't read which track a row holds, with or without the theme, and needs an update from
its author.

## Compatibility

Built and tested with Spicetify 2.45.1 and Spotify 1.3.0, 1.3.1 and 1.3.3 on Windows 11. macOS has its own
adjustments (room for the window buttons) but hasn't been tested on a Mac.

Themes style Spotify through readable class names that Spicetify adds from its class map. When a Spotify update
lands before Spicetify's map covers it (Spotify 1.3.3 renamed nearly every class), LiquidMusic restores the names it
needs itself, from markers Spotify keeps between versions, so the theme keeps working in the meantime.

Spotify changes its interface often; if something looks off after an update, please open an issue with a screenshot
and your Spotify version. If you can, add what `LiquidMusic.hooks()` returns in Spotify's DevTools console
(`spicetify enable-devtools`): it lists the parts of Spotify the theme no longer finds.

## Credits

Inspired by Apple's design for iOS and Apple Music. Not affiliated with Apple or Spotify.
Inter is designed by Rasmus Andersson and released under the SIL Open Font License.
