# Pranav Rao K — React portfolio

A responsive React / Vite portfolio with a clay character, opening wave, synchronized chair swivel, grounded stand-up and footsteps, a scroll-driven holographic scan, and an animated contact scene. Includes project pages, video walkthroughs, and updated professional content.

## Run locally

Requires Node.js 22.12+ (production uses Node.js 24).

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

The production build is written to `dist`. Vercel uses the configuration in `vercel.json`, including project-page rewrites.

## Update the content

- `src/data.js`: profile, project descriptions, verified links, and achievement dates.
- `src/scene.js`: one continuous 3D world, scroll-driven camera movement, workspace, lighting, and holographic scan.
- `src/character.js`: photo-inspired character with an adult tapered jaw, fitted wavy hair, sunglasses, and a patterned red shirt. Two-joint arm reach keeps the wrist attached to the mouse and keyboard in the working pose; supported armrest poses blend into the greeting and stand-up. Foot plants and body advance share a continuous walking path.
- `src/components/Experience.jsx`: the synchronized desk-to-scanner narrative, progressive labels, and mobile cards.
- `src/experience.css`: desktop, phone, and landscape framing for the 3D narrative.
- `src/contact-scene.js` and `src/components/ContactCharacter.jsx`: parcel-and-letter scene with a sleeping character, scroll-driven wake-up, and a tappable hello wave.
- `src/contact.css`: responsive contact scene with the heading at upper left, parcels at lower left, a centered character, and a back-to-top footer.
- `src/components/DecodedText.jsx`: motion-aware text decoding for the opening role and hologram labels.
- `src/theme.css`: the personalized mint, forest-green, and coral palette.
- `src/components/MusicPlayer.jsx`: computer-style music controls with speaker panning, volume, and live audio analysis.
- `src/music.js`: favorite-track configuration and the desk-monitor radio display. The default soundtrack is the original 76 BPM lo-fi composition “Window Light”; favorite songs will be added once supplied.
- `src/desk-display.js`: code editor with a typing comment and blinking cursor on the right monitor.
- `public/music/studio-lofi.wav` and `scripts/compose-lofi.mjs`: seamless stereo piano, bass, and brushed drums loop with its reproducible composition source.
- `src/App.jsx`: page layouts, navigation, route transitions, and opt-in lo-fi music.
- `src/styles.css`: responsive styling and reduced-motion support.
- `public/media`: optimized photos, thumbnails, full-length project videos, and resume.

The original assets remain in `src/img`, `src/vids`, and `src/pdf` for reference and are excluded from deployment uploads. Public videos retain the original durations; they are encoded as H264 with streaming metadata.

## Content sources

Updated resume in `src/pdf/PRANAV RAO K RESUME.pdf`, public LinkedIn profile/search extracts at https://www.linkedin.com/in/pranav-rao-k/, and GitHub at https://github.com/pranavraok. Recent projects include Mentora, NutriGo, HostelVoice, and TradeLedger. The exact TradeLedger role was not available publicly and is not asserted.

The visual reference was https://david-hckh.com/. The React implementation, 3D models, and lo-fi composition are original; no models, code, or music from the reference are used.

## Accessibility and performance

Keyboard navigation, visible focus states, meaningful link labels, native video controls, motion-preference support, portrait fallback if WebGL initialization fails, and visibility-aware animation. Heavy 3D code loads only when a scene approaches the viewport. Sound starts only after the visitor enables it.
