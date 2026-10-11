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
- `src/hero-character.js`: hero-specific adult rig with a tapered clean-shaven face, 88 separate sculpted hair locks, bevelled acetate sunglasses with temple arms and lens clearance, a visible neck, and a patterned red shirt. Two-joint arm reach keeps the wrist attached to the mouse and keyboard; supported armrest poses blend into the greeting and stand-up. Foot plants and body advance share a continuous walking path. The head smoothly alternates its gaze between the two monitors.
- `src/character.js`: the separate contact character, preserved while the hero is refined.
- `src/components/Experience.jsx`: the synchronized desk-to-scanner narrative, progressive labels, and mobile cards.
- `src/experience.css`: desktop, phone, and landscape framing for the 3D narrative.
- `src/contact-scene.js` and `src/components/ContactCharacter.jsx`: parcel-and-letter scene with a sleeping character, scroll-driven wake-up, and a tappable hello wave.
- `src/contact.css`: responsive contact scene with the heading at upper left, parcels at lower left, a centered character, and a back-to-top footer.
- `src/components/DecodedText.jsx`: motion-aware text decoding for the opening role and hologram labels.
- `src/theme.css`: the personalized mint, forest-green, and coral palette.
- `src/components/MusicPlayer.jsx` and `src/components/SoundCloudSong.jsx`: computer-style controls, a visible native Hindi music stream, and remembered pause/volume/track preferences. SoundCloud playback is confirmed by actual playback progress and repeats through its supported Widget API. The original instrumental has local audio analysis; stream speaker pulses are decorative.
- `src/music.js`: the default Hindi romantic track is Anuv Jain's original acoustic “Baarishein”, streamed through the uploader's SoundCloud player. The original 76 BPM lo-fi composition “Window Light” remains available in the playlist. No external recording is downloaded or rehosted.
- `src/desk-display.js`: a 52-line code editor, multiple animated typing rows, a blinking cursor, and a continuous 36-second down/up scrolling loop.
- `public/music/studio-lofi.wav` and `scripts/compose-lofi.mjs`: seamless stereo piano, bass, and brushed drums loop with its reproducible composition source.
- `src/App.jsx`: page layouts, navigation, route transitions, and persistent music controls.
- `src/styles.css`: responsive styling and reduced-motion support.
- `public/media`: optimized photos, thumbnails, full-length project videos, and resume.

The original assets remain in `src/img`, `src/vids`, and `src/pdf` for reference and are excluded from deployment uploads. Public videos retain the original durations; they are encoded as H264 with streaming metadata.

## Content sources

Updated resume in `src/pdf/PRANAV RAO K RESUME.pdf`, public LinkedIn profile/search extracts at https://www.linkedin.com/in/pranav-rao-k/, and GitHub at https://github.com/pranavraok. Recent projects include Mentora, NutriGo, HostelVoice, and TradeLedger. The exact TradeLedger role was not available publicly and is not asserted.

The visual reference was https://david-hckh.com/. The React implementation, 3D models, and lo-fi composition are original; no models, code, or music from the reference are used.

## Accessibility and performance

Keyboard navigation, visible focus states, meaningful link labels, native media controls, motion-preference support, portrait fallback if WebGL initialization fails, and visibility-aware animation. Heavy 3D code loads only when a scene approaches the viewport. Music defaults to on and loops until paused; browsers that block audible autoplay require an initial tap. An explicit pause is remembered. The phone layout reserves space for the native music player without covering the character.
