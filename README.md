# webgl-msaa-test

Demo for working with alpha to coverage in WebGL.

How to enable A2C:
- use a multi sampled renderbuffer as storage
  - this requires all attachments to be multi sampled renderbuffers
  - if the content is needed as texture, blit is required
- `gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);`

In order to avoid alpha blending artifacts, no alpha should be rendered.
- use a RGB renderbuffer
  - requires `alpha = false` during context creation
  - alternatively, blit to single sampled buffer first, followed by blit to screen
- disable alpha rendering in color mask `gl.colorMask(true, true, true, false);`
