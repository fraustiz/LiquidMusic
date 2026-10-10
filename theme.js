// LiquidMusic — theme.js
// 1. Light/dark mode (auto follows Windows)  2. Blurred artwork backdrop  3. Accent colour from the album art.
// The colour helpers below are pure and unit-tested (tests/color.test.js); the runtime only runs inside Spotify.
(function liquidMusic() {
	"use strict";

	const FALLBACK_ACCENT = { r: 250, g: 45, b: 72 }; // Apple Music red #FA2D48
	const CONTENT_BG = { dark: { r: 22, g: 22, b: 24 }, light: { r: 255, g: 255, b: 255 } };
	const MIN_CONTRAST = 4.5;
	const ON_ACCENT_WHITE_MIN = 3; // icons and semibold text on the accent, like Apple's white-on-red
	const PREFERENCE = {
		dark: ["VIBRANT", "LIGHT_VIBRANT", "PROMINENT", "DESATURATED"],
		light: ["DARK_VIBRANT", "VIBRANT", "PROMINENT"],
	};
	const WHITE = { r: 255, g: 255, b: 255 };
	const BLACK = { r: 0, g: 0, b: 0 };
	// The translucent layers between the artwork and the text (mirror the user.css tokens)
	const SURFACES = {
		dark: {
			scrim: { rgb: BLACK, alpha: 0.45 },
			content: { rgb: { r: 22, g: 22, b: 24 }, alpha: 0.62 },
			glass: { rgb: { r: 30, g: 30, b: 32 }, alpha: 0.55 },
			label2: { rgb: { r: 235, g: 235, b: 245 }, alpha: 0.6 },
		},
		light: {
			scrim: { rgb: WHITE, alpha: 0.5 },
			content: { rgb: WHITE, alpha: 0.68 },
			glass: { rgb: { r: 250, g: 250, b: 252 }, alpha: 0.6 },
			label2: { rgb: { r: 60, g: 60, b: 67 }, alpha: 0.6 },
		},
	};
	const MAX_SURFACE_ALPHA = 0.96;
	// Spicetify neutrals swapped at runtime in "auto" mode; must match color.ini [dark] / [light] (tested)
	const NEUTRALS = {
		dark: {
			text: "#FFFFFF", subtext: "#98989F", main: "#161618", "main-elevated": "#2C2C2E",
			highlight: "#2C2C2E", "highlight-elevated": "#3A3A3C", sidebar: "#000000", player: "#1C1C1E",
			card: "#2C2C2E", shadow: "#000000", "selected-row": "#FFFFFF", "button-disabled": "#48484A",
			"tab-active": "#3A3A3C", "notification-error": "#FF453A", misc: "#8E8E93",
		},
		light: {
			text: "#000000", subtext: "#6E6E73", main: "#FFFFFF", "main-elevated": "#F2F2F7",
			highlight: "#E5E5EA", "highlight-elevated": "#D1D1D6", sidebar: "#F2F2F7", player: "#FFFFFF",
			card: "#F2F2F7", shadow: "#000000", "selected-row": "#000000", "button-disabled": "#C7C7CC",
			"tab-active": "#E5E5EA", "notification-error": "#FF3B30", misc: "#8E8E93",
		},
	};

	// ------------------------------------------------------------------ pure helpers

	function parseColor(str) {
		if (typeof str !== "string") return null;
		const s = str.trim();
		let m = /^#([0-9a-f]{3})$/i.exec(s);
		if (m) {
			const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16));
			return { r, g, b };
		}
		m = /^#([0-9a-f]{6})$/i.exec(s);
		if (m) {
			const n = parseInt(m[1], 16);
			return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
		}
		m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i.exec(s);
		if (m) {
			const [r, g, b] = m.slice(1, 4).map(Number);
			if (r <= 255 && g <= 255 && b <= 255) return { r, g, b };
		}
		return null;
	}

	function toHex({ r, g, b }) {
		return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
	}

	function relativeLuminance({ r, g, b }) {
		const lin = (v) => {
			const c = v / 255;
			return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		};
		return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
	}

	function contrastRatio(a, b) {
		const la = relativeLuminance(a);
		const lb = relativeLuminance(b);
		return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
	}

	function rgbToHsl({ r, g, b }) {
		const rn = r / 255;
		const gn = g / 255;
		const bn = b / 255;
		const max = Math.max(rn, gn, bn);
		const min = Math.min(rn, gn, bn);
		const l = (max + min) / 2;
		if (max === min) return { h: 0, s: 0, l };
		const d = max - min;
		const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		let h;
		if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
		else if (max === gn) h = (bn - rn) / d + 2;
		else h = (rn - gn) / d + 4;
		return { h: h * 60, s, l };
	}

	function hslToRgb({ h, s, l }) {
		const c = (1 - Math.abs(2 * l - 1)) * s;
		const hp = (((h % 360) + 360) % 360) / 60;
		const x = c * (1 - Math.abs((hp % 2) - 1));
		const [r1, g1, b1] =
			hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
		const m = l - c / 2;
		return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) };
	}

	function pickAccent(swatches, mode) {
		if (!swatches || typeof swatches !== "object") return null;
		for (const key of PREFERENCE[mode] || PREFERENCE.dark) {
			const rgb = parseColor(swatches[key]);
			if (rgb && rgbToHsl(rgb).s >= 0.15) return rgb;
		}
		return null;
	}

	function ensureContrast(rgb, bg, min) {
		const lighten = relativeLuminance(bg) < 0.5;
		let hsl = rgbToHsl(rgb);
		let out = { ...rgb };
		for (let i = 0; i < 40 && contrastRatio(out, bg) < min; i++) {
			hsl = { ...hsl, l: Math.min(1, Math.max(0, hsl.l + (lighten ? 0.025 : -0.025))) };
			out = hslToRgb(hsl);
		}
		return out;
	}

	function onAccent(rgb) {
		return contrastRatio(rgb, WHITE) >= ON_ACCENT_WHITE_MIN ? WHITE : BLACK;
	}

	function compositeOver(top, alpha, bottom) {
		const mix = (t, b) => Math.round(t * alpha + b * (1 - alpha));
		return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b) };
	}

	// The artwork's dominant colour stands in for the blurred backdrop behind the panels.
	function representativeColor(swatches) {
		if (!swatches || typeof swatches !== "object") return null;
		for (const key of ["PROMINENT", "VIBRANT", "DARK_VIBRANT", "LIGHT_VIBRANT", "DESATURATED"]) {
			const rgb = parseColor(swatches[key]);
			if (rgb) return rgb;
		}
		return null;
	}

	// Secondary text must stay as readable as on the opaque reference surface: 4.5:1 in dark mode; in light mode
	// Apple's own secondary label only reaches ~3.5:1 on white, so the reference itself is the bar.
	function labelTarget(mode) {
		const s = SURFACES[mode] || SURFACES.dark;
		const onOpaque = (surface) => contrastRatio(compositeOver(s.label2.rgb, s.label2.alpha, surface.rgb), surface.rgb);
		const reference = Math.min(onOpaque(s.content), onOpaque(s.glass));
		return Math.min(MIN_CONTRAST, Math.round((reference - 0.1) * 100) / 100);
	}

	// Smallest opacity, from the design's base value up, at which secondary text is readable on the surface.
	function surfaceOver(surface, backdrop, label, target) {
		for (let alpha = surface.alpha; ; alpha = Math.min(MAX_SURFACE_ALPHA, alpha + 0.02)) {
			const effective = compositeOver(surface.rgb, alpha, backdrop);
			const text = compositeOver(label.rgb, label.alpha, effective);
			if (contrastRatio(text, effective) >= target || alpha >= MAX_SURFACE_ALPHA) {
				return { rgb: surface.rgb, alpha: Math.round(alpha * 100) / 100, effective };
			}
		}
	}

	// Content panel and glass panels over a given artwork colour; `worst` is the rendered surface the accent must
	// contrast with (the brighter one in dark mode, the darker one in light mode).
	function adaptSurfaces(artwork, mode) {
		const s = SURFACES[mode] || SURFACES.dark;
		const backdrop = compositeOver(s.scrim.rgb, s.scrim.alpha, artwork);
		const target = labelTarget(mode);
		const content = surfaceOver(s.content, backdrop, s.label2, target);
		const glass = surfaceOver(s.glass, backdrop, s.label2, target);
		const brighter = relativeLuminance(content.effective) >= relativeLuminance(glass.effective) ? content : glass;
		const darker = brighter === content ? glass : content;
		return { content, glass, worst: (mode === "light" ? darker : brighter).effective };
	}

	// Spotify's GraphQL `fetchExtractedColors` entry → the palette keys pickAccent() understands.
	function swatchesFromExtracted(entry) {
		if (!entry || typeof entry !== "object") return null;
		const usable = (c) => (c && !c.isFallback && typeof c.hex === "string" ? c.hex : null);
		const raw = usable(entry.colorRaw);
		const light = usable(entry.colorLight);
		const dark = usable(entry.colorDark);
		const swatches = {};
		if (raw) Object.assign(swatches, { VIBRANT: raw, PROMINENT: raw });
		if (light) swatches.LIGHT_VIBRANT = light;
		if (dark) swatches.DARK_VIBRANT = dark;
		return Object.keys(swatches).length ? swatches : null;
	}

	// Pages that need their own treatment, exposed to CSS as html[data-lm-page] (cheaper than :has() lookups)
	function pageKind(pathname) {
		if (typeof pathname !== "string") return "other";
		if (/^\/lyrics\/?$/.test(pathname)) return "lyrics";
		if (pathname === "/") return "home";
		return "other";
	}

	function artworkUrl(imageUri) {
		if (typeof imageUri !== "string" || !imageUri) return null;
		if (imageUri.startsWith("spotify:image:")) return "https://i.scdn.co/image/" + imageUri.slice("spotify:image:".length);
		if (imageUri.startsWith("https://")) return imageUri;
		return null;
	}

	// "dark" and "light" are fixed; anything else (auto, unset, or "marketplace" before the Marketplace sets the
	// scheme it installed) follows the system.
	function resolveMode(scheme, prefersLight) {
		const name = String(scheme || "").toLowerCase();
		if (name === "dark" || name === "light") return { auto: false, mode: name };
		return { auto: true, mode: prefersLight ? "light" : "dark" };
	}

	// user.css styles Spotify through the readable class names Spicetify adds from its class map (css-map). When
	// the map doesn't know the running Spotify (1.3.3 renamed nearly every hashed class), those names are missing
	// and the theme falls apart. Each hook finds the same element through markers Spotify keeps between versions
	// (ids, data-testid, structure) and gives it back its name. Order matters: a hook may build on names added by
	// the hooks above it.
	const CLASS_HOOKS = [
		// Layout
		["Root__top-container", ".Root > :has(> #main-view)"],
		["Root__globalNav", "#global-nav-bar"],
		["Root__nav-bar", "#Desktop_LeftSidebar_Id"],
		["Root__main-view", "#main-view"],
		["Root__right-sidebar", ".Root__top-container > :has(> .LayoutResizer__inline-start)"],
		["Root__right-sidebar-peek", ".Root__right-sidebar > :not(.LayoutResizer__resize-bar)"],
		["Root__right-sidebar-overlayWrapper", ".Root__right-sidebar-peek > *"],
		["Root__right-sidebar-peekContent", ".Root__right-sidebar-overlayWrapper > :has(aside)"],
		["main-nowPlayingView-container", ":has(> .NowPlayingView)"],
		["Root__now-playing-bar", ":has(> [data-testid='now-playing-bar'])"],
		// Library (left). Its row images get no hook: artists' round images can't be told from square ones
		["main-navBar-mainNav", ".Root__nav-bar > nav"],
		["main-yourLibraryX-library", ".Root__nav-bar > nav > :has(.YourLibraryX)"],
		["main-yourLibraryX-libraryContainer", ".YourLibraryX"],
		["main-yourLibraryX-collapseButton", ".YourLibraryX header > * > :first-child:has(button)"],
		["main-yourLibraryX-libraryRootlist", ".YourLibraryX [data-overlayscrollbars-viewport] > :first-child"],
		// Toolbar
		["main-globalNav-historyButtonsWrapper", "#global-nav-bar > div:first-of-type"],
		["main-globalNav-historyButtons", ".main-globalNav-historyButtonsWrapper > * > :has(> button + button)"],
		["main-globalNav-searchSection", "#global-nav-bar > :has([role='search'])"],
		["main-globalNav-searchContainer", ".main-globalNav-searchSection > :has([role='search'])"],
		["main-globalNav-link-icon", ".main-globalNav-searchContainer > button"],
		["main-globalNav-searchInputSection", ".main-globalNav-searchContainer > :has(> [role='search'])"],
		["main-globalNav-searchInputWrapper", ".main-globalNav-searchContainer > :has(> [role='search'])"],
		["main-globalNav-searchInputContainer", "#global-nav-bar [role='search']"],
		["main-globalNav-searchInputKBDWrapper", "#global-nav-bar [role='search'] :has(> kbd)"],
		["main-globalNav-contentRight", "#global-nav-bar > :last-child > :has(> [data-testid='user-widget-link'])"],
		["main-actionButtons", ".main-globalNav-contentRight > :has(> button[data-encore-id='buttonTertiary'])"],
		// Not styled by the theme: Spicetify only adds extensions' top-bar buttons (Spicetify.Topbar) once it finds
		// this button to copy its look from. Friend activity, or the group's last icon when it's turned off
		["main-globalNav-buddyFeed", ".main-actionButtons > button[data-restore-focus-key='buddy_feed'], .main-actionButtons:not(:has(> [data-restore-focus-key='buddy_feed'])) > button[data-encore-id='buttonTertiary']:last-of-type"],
		// Player pill
		["main-nowPlayingBar-container", "[data-testid='now-playing-bar']"],
		["main-nowPlayingBar-nowPlayingBar", "[data-testid='now-playing-bar'] > :has([data-testid='player-controls'])"],
		["main-nowPlayingBar-left", ".main-nowPlayingBar-nowPlayingBar > :has([data-testid='now-playing-widget'])"],
		["main-nowPlayingBar-center", ".main-nowPlayingBar-nowPlayingBar > :has([data-testid='player-controls'])"],
		["main-nowPlayingBar-right", ".main-nowPlayingBar-nowPlayingBar > :has([data-testid='volume-bar'], [data-testid='control-button-queue'])"],
		["main-nowPlayingBar-extraControls", ".main-nowPlayingBar-right > *"],
		["main-nowPlayingBar-volumeBar", "[data-testid='volume-bar']"],
		["main-nowPlayingWidget-nowPlaying", "[data-testid='now-playing-widget']"],
		["main-coverSlotCollapsed-container", "[data-testid='CoverSlotCollapsed__container']"],
		["main-nowPlayingWidget-coverArt", ":has(> [data-testid='cover-art-button'])"],
		["main-nowPlayingWidget-coverArtContainer", "[data-testid='cover-art-button']"],
		// Pages: sticky top bar, header (playlist, album, artist…), action bar, track list
		["main-topBar-background", "[data-testid='topbar'] > :first-child"],
		// Not styled by the theme: the Marketplace mounts its tab bar (Extensions, Themes…) into this wrapper and
		// shows none without it
		["main-topBar-topbarContentWrapper", "[data-testid='topbar-content-wrapper']"],
		["main-topBar-overlay", ".main-topBar-background > *"],
		["main-entityHeader-container", "[data-testid='entity-header']"],
		["main-entityHeader-contentWrapper", "[data-testid='entity-header'] > .contentSpacing"],
		// The page's colour: the header's first layer, Spotify's gradient over it, the band under the header (also
		// the names the "Smooth Reveal Playlist Gradient" snippet animates)
		["main-entityHeader-backgroundColor", "[data-testid='entity-header'] > div:first-child:empty:is([style*='background-color'], [style*='--background-base'])"],
		["main-entityHeader-overlay", ".main-entityHeader-backgroundColor + div:empty"],
		["main-actionBarBackground-background", "[data-testid='entity-header'] ~ div:empty:is([style*='background-color'], [style*='--background-base']), [data-testid='entity-header'] ~ div > div:empty:first-child:is([style*='background-color'], [style*='--background-base'])"],
		// Covers that open full size (album, podcast, episode, audiobook) are a button with no test id on Spotify
		// 1.3.4. Only square artwork is one: round pictures (artist, profile) sit in a div
		["main-entityHeader-imageContainer", ".main-entityHeader-contentWrapper [data-testid$='-image'], .main-entityHeader-contentWrapper > button:has(> * > img)"],
		["main-entityHeader-image", ".main-entityHeader-imageContainer img"],
		["main-entityHeader-title", "[data-testid='entityTitle'], [data-testid='adaptiveEntityTitle']"],
		["main-entityHeader-titleInner", "[data-testid='entityTitle'] h1, [data-testid='adaptiveEntityTitle'] > *"],
		["main-entityHeader-metaData", ".main-entityHeader-contentWrapper > :last-child > div:last-child:not(:has([data-testid='entityTitle'], [data-testid='adaptiveEntityTitle']))"],
		["playlist-playlist-actionBarBackground-background", "[data-testid='entity-header'] + div:empty"],
		["main-actionBar-ActionBarRow", "[data-testid='action-bar-row']"],
		["main-trackList-trackListHeader", "#main-view [role='grid'][aria-colcount] > :has([role='columnheader'])"],
		["main-trackList-trackListHeaderRow", "#main-view [role='grid'][aria-colcount] [role='row']:has(> [role='columnheader'])"],
		["main-trackList-trackListRow", "#main-view [role='grid'][aria-colcount] [role='row'] > [draggable='true']"],
		["main-trackList-rowImage", ".main-trackList-trackListRow [aria-colindex='2'] img"],
		// Not styled by the theme: Quick Queue's "button on the left" option looks for the title cell by this name
		["main-trackList-rowSectionStart", ".main-trackList-trackListRow > [role='gridcell'][aria-colindex='2']"],
		["main-trackList-rowDuration", ".main-trackList-trackListRow [role='gridcell']:last-child [data-encore-id='text']"],
		// Cards (home, search, artist pages…); artist and profile pictures are round
		["main-card-cardContainer", "[data-encore-id='card']"],
		["main-card-imageContainer", "[data-encore-id='card'] > :has(img)"],
		["main-cardImage-imageWrapper", ".main-card-imageContainer > :first-child"],
		["main-cardImage-image", ".main-cardImage-imageWrapper img"],
		["main-cardImage-circular", "[data-encore-id='card']:has(> :is([aria-labelledby*=':artist:'], [aria-labelledby*=':user:'])) :is(.main-cardImage-imageWrapper, .main-cardImage-image)"],
		["main-card-PlayButtonContainer", ".main-card-imageContainer > :has([data-encore-id='buttonPrimary'])"],
		["main-card-cardTitle", "[data-encore-id='cardTitle']"],
		// Expanded / full-screen Now Playing: the only scroll host right under the root grid
		["main-actionBar-ActionBarContainer", ".Root__top-container > * > [data-overlayscrollbars]"],
		// Now Playing panel (right)
		["main-nowPlayingView-headerContainer", ".NowPlayingView > * > :first-child:not([data-overlayscrollbars])"],
		["main-nowPlayingView-headerWrapper", ".main-nowPlayingView-headerContainer > *"],
		["main-nowPlayingView-headerTextWrapper", ".main-nowPlayingView-headerWrapper > :has(> a)"],
		["main-nowPlayingView-mainContainer", ".NowPlayingView > * > [data-overlayscrollbars]"],
		["main-nowPlayingView-panel", "[data-testid='NPV_Panel_OpenDiv']"],
		// From the test id, not from the panel's name: the [data-npv-root] panel below has that name too, and its
		// two columns are no grid and no section (the second one, taken for a card, got a background of its own)
		["main-nowPlayingView-nowPlayingGrid", "[data-testid='NPV_Panel_OpenDiv'] > :first-child > *"],
		["main-nowPlayingView-coverArtContainer", ".main-nowPlayingView-nowPlayingGrid [data-testid='track-visual-enhancement'] [data-testid='cover-drop-target']"],
		["main-nowPlayingView-coverArt", ".main-nowPlayingView-coverArtContainer > *"],
		["main-nowPlayingView-canvasVisualEnhancement", ".main-nowPlayingView-nowPlayingGrid :has(> * > .canvasVideoContainerNPV)"],
		["main-nowPlayingView-contextItemInfo", ".main-nowPlayingView-nowPlayingGrid > :has([data-testid='minimized-track-visual-enhancement'])"],
		["main-nowPlayingView-section", "[data-testid='NPV_Panel_OpenDiv'] > :not(:first-child)"],
		["main-nowPlayingView-sectionHeader", ".main-nowPlayingView-section :has(> h2)"],
		["main-nowPlayingView-aboutArtist", ".main-nowPlayingView-section:has([style*='background-image'])"],
		// Track title and artists, in the pill and in the Now Playing panel
		["main-trackInfo-container", "[data-testid='now-playing-widget'] > [data-testid='CoverSlotCollapsed__container'] + *, .main-nowPlayingView-contextItemInfo > [data-testid='minimized-track-visual-enhancement'] + *"],
		["main-trackInfo-name", ".main-trackInfo-container > :first-child"],
		["main-trackInfo-artists", ".main-nowPlayingWidget-nowPlaying .main-trackInfo-container > :nth-child(3), .main-nowPlayingView-contextItemInfo .main-trackInfo-container > :nth-child(2)"],
		["main-nowPlayingWidget-actionButtonWrapper", "[data-testid='now-playing-widget'] > :last-child:has(button)"],
		["player-controls", "[data-testid='player-controls']"],
		["player-controls__buttons", "[data-testid='general-controls']"],
		["player-controls__left", "[data-testid='general-controls'] > :first-child"],
		["playback-bar", "[data-testid='player-controls'] > :has([data-testid='playback-position'])"],
		["progress-bar", "[data-testid='progress-bar']"],
	];

	// Spotify 1.3.3 ships a second Now Playing panel, picked per install: [data-npv-root], a header floating over a
	// scroll area that holds the artwork, the track info and the section cards. Spicetify's class map doesn't know
	// it, so these hooks run even when the map covers the rest of Spotify. Only the names whose rules fit it.
	const NPV_ROOT_HOOKS = [
		["main-nowPlayingView-headerContainer", "[data-npv-root] > :first-child:not([data-overlayscrollbars])"],
		["main-nowPlayingView-mainContainer", "[data-npv-root] > [data-overlayscrollbars]"],
		// The scroll area's content. Found by position too: the artwork's slot only carries its test id while it shows
		// the cover, so with a Canvas, a video or an ad in its place this name and the next one were lost
		["main-nowPlayingView-panel", "[data-npv-root] [data-overlayscrollbars-viewport] > :has(> * > [data-testid='cover-art-slot']), [data-npv-root] > [data-overlayscrollbars] > [data-overlayscrollbars-viewport] > :only-child"],
		// The artwork is styled through its cover-art-slot in user.css: Spotify's styles for coverArtContainer would
		// turn the slot into a flex box with a 1s aspect-ratio transition.
		// The row under the artwork with the title and artists (the cards below have an h2 title)
		["main-nowPlayingView-contextItemInfo", "[data-npv-root] :has(> [data-testid='cover-art-slot']) + * > :has(a[href*='/artist/']):not(:has(h2)), [data-npv-root] .main-nowPlayingView-panel > :first-child + * > :has(a[href*='/artist/']):not(:has(h2))"],
		// Not main-trackInfo-container on their column: Spotify's own styles for that name (the pill's grid) centred
		// the title
		["main-trackInfo-name", "[data-npv-root] .main-nowPlayingView-contextItemInfo > :first-child > :first-child"],
		["main-trackInfo-artists", "[data-npv-root] .main-nowPlayingView-contextItemInfo > :first-child > :nth-child(2)"],
	];

	// Gives each element matched by a hook its class, when it doesn't already have it. Several passes, so hooks
	// can build on classes added in the pass before. Returns how many classes were added.
	function applyClassHooks(root, hooks) {
		const combined = hooks.map(([, selector]) => selector).join(", ");
		let added = 0;
		for (let pass = 0; pass < 8; pass++) {
			let addedThisPass = 0;
			const targets = [...(root.matches?.(combined) ? [root] : []), ...(root.querySelectorAll?.(combined) ?? [])];
			for (const el of targets) {
				for (const [name, selector] of hooks) {
					if (!el.classList.contains(name) && el.matches(selector)) {
						el.classList.add(name);
						addedThisPass++;
					}
				}
			}
			added += addedThisPass;
			if (!addedThisPass) break;
		}
		return added;
	}

	// Of the elements that changed, those no other changed element contains (each subtree is processed once).
	function outermostNodes(nodes) {
		const set = new Set(nodes);
		return [...set].filter((node) => {
			for (let parent = node.parentElement; parent; parent = parent.parentElement) if (set.has(parent)) return false;
			return true;
		});
	}

	// Diagnostic: the theme names (from the hook table) that no element on the page carries, in table order.
	function missingClassNames(hooks, isPresent) {
		return hooks.map(([name]) => name).filter((name) => !isPresent(name));
	}

	const helpers = {
		CLASS_HOOKS,
		NPV_ROOT_HOOKS,
		applyClassHooks,
		outermostNodes,
		missingClassNames,
		resolveMode,
		parseColor,
		toHex,
		relativeLuminance,
		contrastRatio,
		rgbToHsl,
		hslToRgb,
		pickAccent,
		ensureContrast,
		onAccent,
		compositeOver,
		representativeColor,
		labelTarget,
		adaptSurfaces,
		swatchesFromExtracted,
		pageKind,
		artworkUrl,
		FALLBACK_ACCENT,
		CONTENT_BG,
		MIN_CONTRAST,
		SURFACES,
		NEUTRALS,
	};
	if (typeof module !== "undefined" && module.exports) {
		module.exports = helpers;
		return;
	}

	// ------------------------------------------------------------------ runtime (Spotify only)

	// Loaded twice (e.g. re-injected)? Keep the first instance: a second one would duplicate every listener.
	if (window.LiquidMusic) return;
	window.LiquidMusic = {};

	// The theme's typeface. Added as a non-blocking <link> (an @import in user.css delayed the stylesheet and
	// tipped Spicetify's startup race into crashing Spotify).
	const FONT_CSS = "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&display=swap";
	if (!document.getElementById("lm-font")) {
		const link = document.createElement("link");
		link.id = "lm-font";
		link.rel = "stylesheet";
		link.href = FONT_CSS;
		(document.head || document.documentElement).append(link);
	}

	const LIGHT_QUERY = "(prefers-color-scheme: light)";
	// Under these preferences user.css makes every surface opaque: nothing to adapt
	const SOLID_SURFACES_QUERY = "(prefers-reduced-transparency: reduce), (prefers-contrast: more)";
	const WINDOW_BG = { dark: BLACK, light: { r: 242, g: 242, b: 247 } };
	const UNKNOWN_ARTWORK = { r: 128, g: 128, b: 128 };
	const root = document.documentElement;
	const state = { mode: "dark", auto: true, swatches: null, hasImage: false, request: 0, layer: 0, accent: FALLBACK_ACCENT };

	function warn(...args) {
		console.warn("[LiquidMusic]", ...args);
	}

	function safe(fn) {
		try {
			const result = fn();
			if (result && typeof result.catch === "function") result.catch(warn);
			return result;
		} catch (e) {
			warn(e);
		}
	}

	// Restores the readable class names when Spicetify's class map doesn't cover this Spotify (see CLASS_HOOKS).
	// The observer starts with the theme's script, before the extensions load: on each change it adds the names
	// right away, in the same batch, so extensions that look for them as soon as an element appears (Quick Queue
	// reads .main-trackList-trackListRow in new rows) find them. Once the main view exists it decides: with the map
	// present the main view already carries its name, and only the hooks for what the map doesn't know keep running.
	function startClassHooks() {
		let hooks = null;
		const decide = () => {
			const mainView = document.querySelector("#main-view, .Root__main-view");
			if (!mainView || !document.body) return false;
			const translate = !mainView.classList.contains("Root__main-view");
			hooks = (translate ? [...CLASS_HOOKS, ...NPV_ROOT_HOOKS] : NPV_ROOT_HOOKS).filter(([name, selector]) => {
				try {
					document.querySelector(selector);
					return true;
				} catch {
					warn("class hook skipped (selector not supported):", name);
					return false;
				}
			});
			if (translate) root.dataset.lmClassHooks = "on";
			applyClassHooks(document.body, hooks);
			return true;
		};
		const observer = new MutationObserver((records) => {
			safe(() => {
				if (hooks === null && !decide()) return;
				if (!hooks.length) return observer.disconnect();
				// Re-checked where the page changed: the subtree of each changed element (children added, or classes
				// reset by a React re-render), the outermost ones only
				for (const node of outermostNodes(records.map((record) => record.target))) {
					if (node.isConnected) applyClassHooks(node, hooks);
				}
			});
		});
		observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
		safe(decide);
	}
	safe(startClassHooks);

	// After a Spotify update, LiquidMusic.hooks() in the DevTools console lists the names the theme styles that are
	// missing from the current page, i.e. what broke. Some only exist on some pages (track rows on playlists,
	// cards on home) or with the right panel open: check a few pages.
	const PAGE_SPECIFIC = /^(main-entityHeader|main-trackList|main-topBar|main-actionBar|playlist-|main-card|main-nowPlayingView-(canvas|aboutArtist))/;
	window.LiquidMusic.hooks = () => {
		const missing = missingClassNames(CLASS_HOOKS, (name) => !!document.querySelector("." + CSS.escape(name)));
		// The [data-npv-root] Now Playing panel has no counterpart for some of the other panel's names
		const npvRootNames = document.querySelector("[data-npv-root]") ? new Set(NPV_ROOT_HOOKS.map(([name]) => name)) : null;
		const expected = (name) => !PAGE_SPECIFIC.test(name) && !(npvRootNames && name.startsWith("main-nowPlayingView-") && !npvRootNames.has(name));
		const report = {
			translator: root.dataset.lmClassHooks === "on" ? "on (restoring names)" : "off (Spicetify's class map covers this Spotify)",
			page: Spicetify.Platform?.History?.location?.pathname ?? location.pathname,
			// Expected on every page (with the right panel open): any name here is broken
			missing: missing.filter(expected),
			// Page headers, track lists, cards, Canvas…: only a problem on a page (or Now Playing panel) that shows them
			notOnThisPage: missing.filter((name) => !expected(name)),
		};
		console.info("[LiquidMusic]", report.missing.length ? `${report.missing.length} names missing` : "nothing missing", report);
		return report;
	};

	function setSpice(name, rgb) {
		root.style.setProperty(`--spice-${name}`, toHex(rgb));
		root.style.setProperty(`--spice-rgb-${name}`, `${rgb.r},${rgb.g},${rgb.b}`);
	}

	// Thickens the translucent panels just enough for the current artwork and returns the rendered surface
	// the accent has to contrast with (the opaque reference when the panels are solid).
	function applySurfaces() {
		if (matchMedia(SOLID_SURFACES_QUERY).matches) {
			root.style.removeProperty("--lm-bg-content");
			root.style.removeProperty("--lm-glass-thick-bg");
			return CONTENT_BG[state.mode];
		}
		const artwork = representativeColor(state.swatches) || (state.hasImage ? UNKNOWN_ARTWORK : WINDOW_BG[state.mode]);
		const s = adaptSurfaces(artwork, state.mode);
		const rgba = ({ rgb, alpha }) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
		root.style.setProperty("--lm-bg-content", rgba(s.content));
		root.style.setProperty("--lm-glass-thick-bg", rgba(s.glass));
		return s.worst;
	}

	function applyAccent() {
		const background = applySurfaces();
		const picked = pickAccent(state.swatches, state.mode) || FALLBACK_ACCENT;
		const accent = ensureContrast(picked, background, MIN_CONTRAST);
		state.accent = accent;
		root.style.setProperty("--lm-accent", toHex(accent));
		root.style.setProperty("--lm-on-accent", toHex(onAccent(accent)));
		for (const name of ["button", "button-active", "notification"]) setSpice(name, accent);
	}

	function applyMode() {
		Object.assign(state, resolveMode(Spicetify.Config?.color_scheme, matchMedia(LIGHT_QUERY).matches));
		root.dataset.lmTheme = state.mode;
		for (const [name, hex] of Object.entries(NEUTRALS[state.mode])) {
			if (state.auto) setSpice(name, parseColor(hex));
			// A fixed scheme gets its colours from color.ini (or the Marketplace): drop what auto mode set inline
			else for (const prefix of ["--spice-", "--spice-rgb-"]) root.style.removeProperty(prefix + name);
		}
		applyAccent();
	}

	// The Marketplace switches schemes live: it sets Config.color_scheme, then swaps in a
	// <style class="marketplaceScheme"> with the new colours (appended to <body> today; <head> watched too).
	function watchMarketplaceScheme() {
		const isScheme = (node) => node.nodeType === 1 && node.matches("style.marketplaceScheme");
		const observer = new MutationObserver((records) => {
			if (records.some((r) => [...r.addedNodes].some(isScheme))) safe(applyMode);
		});
		for (const parent of [document.head, document.body]) observer.observe(parent, { childList: true });
	}

	function backdrop() {
		let el = document.getElementById("lm-backdrop");
		if (!el) {
			el = document.createElement("div");
			el.id = "lm-backdrop";
			el.setAttribute("aria-hidden", "true");
			for (let i = 0; i < 2; i++) {
				const layer = document.createElement("div");
				layer.className = "lm-backdrop-layer";
				el.append(layer);
			}
			document.body.prepend(el);
		}
		return el;
	}

	function showBackdrop(url) {
		const layers = backdrop().children;
		const incoming = layers[1 - state.layer];
		incoming.style.backgroundImage = url ? `url("${url}")` : "none";
		incoming.classList.add("is-visible");
		layers[state.layer].classList.remove("is-visible");
		state.layer = 1 - state.layer;
	}

	// Preload so the cross-fade never fades to an empty layer; a newer track cancels an older load.
	function loadBackdrop(url, request) {
		if (!url) return showBackdrop(null);
		const img = new Image();
		img.onload = () => request === state.request && showBackdrop(url);
		img.onerror = () => request === state.request && showBackdrop(null);
		img.src = url;
	}

	// Spicetify.Player.data stays null until the first player event (e.g. after a reload while paused);
	// PlayerAPI already knows the current item.
	function currentItem() {
		return Spicetify.Player.data?.item || safe(() => Spicetify.Platform?.PlayerAPI?.getState?.()?.item) || null;
	}

	// At a cold start Spicetify.GraphQL can be populated after the first track is known: wait for it briefly
	// rather than dropping to colorExtractor (which is broken on Spotify 1.3.x). The wait is paid once: if the
	// query never shows up, later tracks go straight to the fallback.
	let graphqlWaitSpent = false;
	async function graphqlReady(timeoutMs = 5000) {
		for (let waited = 0; ; waited += 100) {
			const gql = Spicetify.GraphQL;
			if (gql?.Request && gql.Definitions?.fetchExtractedColors) return gql;
			if (graphqlWaitSpent || waited >= timeoutMs) {
				graphqlWaitSpent = true;
				return null;
			}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	// Spicetify.colorExtractor fails on Spotify 1.3.x ("Resolver not found"); the GraphQL query Spotify
	// itself uses works, so it goes first and colorExtractor stays as the fallback for other versions.
	async function extractSwatches(item, imageUrl) {
		const gql = imageUrl && (await graphqlReady());
		if (gql) {
			const res = await gql.Request(gql.Definitions.fetchExtractedColors, { imageUris: [imageUrl] });
			return swatchesFromExtracted(res?.data?.extractedColors?.[0]);
		}
		return typeof Spicetify.colorExtractor === "function" ? Spicetify.colorExtractor(item.uri) : null;
	}

	async function onSongChange() {
		const request = ++state.request;
		const item = currentItem();
		const meta = item?.metadata || {};
		const isAd = meta.is_advertisement === "true" || item?.type === "ad";
		const imageUrl = isAd ? null : artworkUrl(meta.image_url);
		state.hasImage = !!imageUrl;
		loadBackdrop(imageUrl, request);
		if (!item?.uri || isAd) {
			state.swatches = null;
			return applyAccent();
		}
		let swatches = null;
		try {
			swatches = await extractSwatches(item, imageUrl);
		} catch (e) {
			warn("colour extraction failed for", item.uri, e);
		}
		if (request !== state.request) return; // a newer track took over while we waited
		state.swatches = swatches;
		applyAccent();
	}

	function init() {
		backdrop();
		applyMode();
		matchMedia(LIGHT_QUERY).addEventListener("change", () => safe(applyMode));
		matchMedia(SOLID_SURFACES_QUERY).addEventListener("change", () => safe(applyAccent));
		watchMarketplaceScheme();
		Spicetify.Player.addEventListener("songchange", () => safe(onSongChange));
		watchPages(0);
		Object.assign(window.LiquidMusic, {
			refresh: () => onSongChange(),
			state: () => ({ mode: state.mode, auto: state.auto, accent: toHex(state.accent), request: state.request }),
		});
		whenItemReady(0);
	}

	// Flags the current page on <html data-lm-page>. Spicetify.Platform can arrive after the player APIs:
	// wait for its History (bounded to ~10 s).
	function watchPages(attempt) {
		const history = Spicetify.Platform?.History;
		if (!history?.listen) {
			if (attempt < 40) setTimeout(() => watchPages(attempt + 1), 250);
			return;
		}
		const markPage = (location) => (root.dataset.lmPage = pageKind(location?.pathname));
		markPage(history.location);
		history.listen((location) => safe(() => markPage(location)));
	}

	// At startup the player may not know the current item yet: wait for it (bounded to ~10 s).
	function whenItemReady(attempt) {
		if (currentItem() || attempt >= 40) return safe(onSongChange);
		setTimeout(() => whenItemReady(attempt + 1), 250);
	}

	(function waitForSpicetify(attempt) {
		const ready = window.Spicetify?.Player?.addEventListener && Spicetify.Config && document.body;
		if (ready) return safe(init);
		if (attempt >= 100) return warn("Spicetify APIs not available — dynamic colour disabled");
		setTimeout(() => waitForSpicetify(attempt + 1), 100);
	})(0);
})();
