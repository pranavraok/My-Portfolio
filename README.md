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
- `src/approved-avatar.js` and `public/media/pranav-approved-head.glb`: the approved Meshy face, swept hair, clear glasses, and headphones, shared by the hero and contact scene.
- `src/avatar-body.js`: compact black-hoodie/floral-shorts avatar with sleeves skinned to the torso at each shoulder, articulated wrists and five digits, slightly staggered chair-to-desk hand transfers, and a greeting with overlapping shoulder, elbow and wrist movement plus softly curled fingers. Palms and fingertips fit on the armrests. The rise hinges at the hips, keeps the hands supported through its first 30%, and releases them with a small clearance arc before settling beside the thighs. The rise and planted gait share the same final arm pose. `src/hero-character.js` and `src/character.js` load this rig.
- `src/components/Experience.jsx`: the synchronized desk-to-scanner narrative, progressive labels, and mobile cards, with one damped scroll clock for the room, camera, chair and character. A speed limit within the workspace gives short phone swipes time to finish the chair turn and stand-up. It is bypassed when scrolling beyond the workspace. The desktop camera follows the cursor on both axes with a gentle return to center.
- `src/experience.css`: desktop, phone, and landscape framing for the 3D narrative.
- `src/contact-scene.js` and `src/components/ContactCharacter.jsx`: parcel-and-letter scene with a sleeping character, scroll-driven wake-up, and a tappable hello wave.
- `src/contact.css`: responsive contact scene with the heading at upper left, parcels at lower left, a centered character, and a back-to-top footer.
- `src/components/DecodedText.jsx`: motion-aware text decoding for the opening role and hologram labels.
- `src/theme.css`: the personalized mint, forest-green, and coral palette.
- `src/components/MusicPlayer.jsx` and `src/music.js`: the owner's selected Tera Mera Rishta Purana (Slowed + Reverb) recording, hosted locally with native looped playback, remembered pause preference, a small header button, and a clickable 3D desk speaker. No external music widget is loaded. The speaker pulses follow local audio analysis.
- `public/music/tera-mera-rishta-lofi.mp3` and `public/music/CREDITS.txt`: the specific Curova Lofi upload selected by the owner after they stated permission had been granted, converted to stereo MP3 with gentle endpoint fades. This version contains vocals and replaces the previously active Indian instrumental. The footer links to the selected source; the archived CC BY 4.0 instrumental remains credited in CREDITS.txt.
- `src/desk-display.js`: a complete 52-line code editor with a blinking cursor and a gentle 300-second up/down scroll. Its clock advances only while the workspace and monitor are visible and the character is working; lines are not erased and retyped.
- `public/music/studio-lofi.wav` and `scripts/compose-lofi.mjs`: seamless stereo piano, bass, and brushed drums loop with its reproducible composition source.
- `src/App.jsx`: page layouts, navigation, route transitions, and persistent music controls.
- `src/styles.css`: responsive styling and reduced-motion support.
- `public/media`: optimized photos, thumbnails, full-length project videos, and resume.

The original assets remain in `src/img`, `src/vids`, and `src/pdf` for reference and are excluded from deployment uploads. Public videos retain the original durations; they are encoded as H264 with streaming metadata.

## Content sources

Updated resume in `src/pdf/PRANAV RAO K RESUME.pdf`, public LinkedIn profile/search extracts at https://www.linkedin.com/in/pranav-rao-k/, and GitHub at https://github.com/pranavraok. Recent projects include Mentora, NutriGo, HostelVoice, and TradeLedger. The exact TradeLedger role was not available publicly and is not asserted.

The visual reference was https://david-hckh.com/. No models, code, or music from that website are used. The approved avatar head was generated in Meshy from the user's reference; its movable body and scene are built in Three.js. The current background song source is https://www.youtube.com/watch?v=g7wCkTvU_VY, selected by the owner in this session with their stated permission for use. It is not represented as CC BY or as Tum Se Hi instrumental.

## Accessibility and performance

Keyboard navigation, visible focus states, meaningful link labels, motion-preference support, portrait fallback if WebGL initialization fails, and visibility-aware animation. Heavy 3D code loads only when a scene approaches the viewport. Music defaults to on and loops until paused; browsers that block audible autoplay require an initial tap. An explicit pause is remembered. The phone layout keeps the physical speaker and its keyboard-accessible tap target inside the workspace; the only persistent music UI is the small play/pause button.
