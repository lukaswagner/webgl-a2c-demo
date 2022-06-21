# webgl-a2c-demo

Demo for working with alpha to coverage in WebGL.

How to enable A2C:
- use a multi sampled renderbuffer as storage
  - for the default framebuffer: set `antialias` context attribute to true
  - for custom framebuffer:
    - all attachments must be multi sampled renderbuffers
    - if the content is needed as texture, blit is required
    - set `antialias` context attribute to false to allow blitting to default framebuffer 
- `gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);`

In order to avoid alpha blending artifacts, no alpha should be rendered. Either is required:
- use a RGB renderbuffer
  - requires `alpha = false` during context creation
  - alternatively, blit to single sampled buffer first, followed by blit to screen
- disable alpha rendering in color mask `gl.colorMask(true, true, true, false);`
