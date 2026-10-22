# 1.0.1: adaptive-quality input preservation

The approved engine and adapter remain byte-identical. An external subclass,
loaded after the approved adapter and before the wrapper, retains only a real
queued pointer gesture across the first adaptive-quality resize when CSS
viewport dimensions have not changed and the budget still allows running.
It does not preserve simulation fields, add input, force quality, alter shaders,
or bypass the hard performance stop. Real resize and scroll still cancel input.

The archived `examples/cursor-liquido.html` is unchanged (0.1.1-recovery).
`dist/cursor-liquido-standalone.html` is the candidate, built offline
from the demo, CSS and four-script bundle.

Run `npm run build`, `npm test`, `npm run test:browser`, and
`npm run test:quality`. The quality regression uses real Playwright mouse input
with a declared slow-frame timing fixture (11 slow frames, 116.7ms).
It is not an FPS benchmark or physical-GPU certification. Baseline A and
candidate B are exercised A-B-B-A, in Mucho and Hardcore, with float dye readback.
No synthetic dye or simulation field preservation is used.

## Touch input and scheduler regression

The opt-in touch assertion waits at most two seconds for a real solver splat,
then applies the original positive-splat assertion. A fixed event delay does
not guarantee RAF delivery. `tests/browser/touch-input.cjs` proves the missing
synchronization with a declared held-first-RAF fixture: six real handler inputs
queue one gesture, the early counter is zero, and native RAF delivery consumes
exactly one splat with nonzero float dye. No input is added after the release,
no counter or simulation field is changed, and no direct frame call is used.

A separate CDP test sends trusted Chromium touch events, verifies opt-in
rendering, then pans vertically. Native scroll must move the page, issue
pointercancel, and clear queued input without preventDefault. This is browser
emulation, not a physical iPhone or Android certification.

The first two complete candidate runs failed the touch assertion (39/40).
A later diagnostic run passed the unchanged immediate assertion (40/40).
The precise scheduling of those historical failures was not captured, so its
cause remains unverified; the held-RAF regression proves a defect in the test's
fixed-delay assumption rather than retroactively proving those trace details.
The final expanded suite includes both new input cases and all original colour
assertions. CI runs the quality regression as well as the complete browser suite.

