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
- `src/approved-avatar.js` and `public/media/pranav-approved-head-fast.glb`: the approved Meshy face, swept hair, clear glasses, and headphones, shared by the hero and contact scene. The 3.35 MB delivery file retains the exact geometry of the 8.81 MB original and uses optimized 1024px textures. The original remains available for future asset work.
- `index.html`, `src/startup.js`, and `src/components/Scene.jsx`: an immediate forest-green splash, an early avatar preload, and direct hero initialization. The splash dismisses after the first complete 3D frame; failed 3D loads reveal the portrait fallback. Direct project pages also clear the splash.
- `src/avatar-body.js`: compact black-hoodie/floral-shorts avatar with sleeves skinned to the torso at each shoulder, articulated wrists and five digits, slightly staggered chair-to-desk hand transfers, and the approved forearm-driven greeting. A continuous wrist/palm surface, cloth cuffs, and a proportionate thumb avoid the previous detached wrist appearance. The seated elbows keep the forearms above the padding, while the palms bear on it with a gentle wrist angle, curled inner thumbs, and fingertips over the rounded front edge. The chair transition first slides the hips forward and leans at the hips, then extends the legs. Hands stay supported through the first 42% of the transition, lift clear before moving toward the thighs, and turn only after clearing the padding. Reversing the same trajectory reaches for the armrests before lowering onto the seat. Feet remain planted, and the final arm pose matches the gait. `src/hero-character.js` and `src/character.js` load this rig.
- `src/components/Experience.jsx`: the synchronized desk-to-scanner narrative, progressive labels, and mobile cards, with one damped scroll clock for the room, camera, chair and character. The rise and return run at a slower speed than the chair swivel, giving short phone swipes time to complete the supported movement. The speed limit is bypassed when scrolling beyond the workspace. The desktop camera follows the cursor on both axes with a gentle return to center.
- `src/experience.css`: desktop, phone, and landscape framing for the 3D narrative.
- `src/contact-scene.js` and `src/components/ContactCharacter.jsx`: parcel-and-letter scene with a sleeping character, scroll-driven wake-up, and a tappable hello wave.
- `src/footer-motion.js` and `src/face-eyelids.js`: a staged footer greeting with quiet folded arms, closed sleeping eyes, breathing, a gradual head lift, settling blink, two forearm-led waves and a relaxed return. Eyelids use the approved head's measured eye coordinates and matching skin shading inside the glasses; the hero's face and approved greeting remain unchanged. The footer measures its current position in the viewport rather than cached scroll distances, finishes waking once revealed, and pauses its local clock offscreen. A tap wakes it from any visible position, and repeat taps are disabled until the arms settle. Phone framing adapts to shorter screens and leaves clearance around the raised hand and feet.
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

The visual reference was https://david-hckh.com/. No models, code, or music from that website are used. The approved avatar head was generated in Meshy from the user's reference; its movable body and scene are built in Three.js. The greeting motion was studied frame by frame from Ketut Subiyanto's live-action reference, https://www.pexels.com/video/a-man-greeting-and-waving-his-hand-4586958/. Its forearm carries two broad swings while a shared bend axis keeps the elbow stable; the wrist follows with a small delay, relaxed fingers stay open, and the thumb/index/pinky arrangement matches each hand. The current background song source is https://www.youtube.com/watch?v=g7wCkTvU_VY, selected by the owner in this session with their stated permission for use. It is not represented as CC BY or as Tum Se Hi instrumental.

The chair support, preparatory lean, push, hand release, and controlled return were studied frame by frame from Medbridge's YouTube demonstration, https://www.youtube.com/watch?v=1HESRTfudm4. The movement is adapted to the existing avatar and wheeled chair; no video or animation asset is copied into the site.

The walking sequence was studied frame by frame from Endless Reference's real-time front/side footage, https://www.youtube.com/watch?v=GBkJY86tZRE. Four steps now include brief double support, toe push-off, a lifted passing foot, heel contact and weight acceptance. The clog rotates around its ground contact rather than the ankle, and the supporting foot is fixed in world space. Arm swings oppose the leading leg, with small torso weight shifts. The chair's upper seat swivels independently of its stationary wheeled base; the torso and feet follow with a small lag. Reversing the scroll returns to the armrests before lowering, and a subtle cushion compression softens the final seating. A shared clock gives the turn, supported rise, walking and return time to read on a short phone swipe. The approved greeting is unchanged.

## Accessibility and performance

Keyboard navigation, visible focus states, meaningful link labels, motion-preference support, portrait fallback if WebGL initialization fails, and visibility-aware animation. Heavy 3D code loads only when a scene approaches the viewport. Music defaults to on and loops until paused; browsers that block audible autoplay require an initial tap. An explicit pause is remembered. The phone layout keeps the physical speaker and its keyboard-accessible tap target inside the workspace; the only persistent music UI is the small play/pause button.
