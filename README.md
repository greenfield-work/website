# Greenfield website

The coming-soon site for [Greenfield](https://greenfield.work), built by [Fabrica](https://fabricahq.com).

## Run locally

Serve this directory with a static web server:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. There is no build step, package installation, or application backend. Deploy this directory as the static document root. Domain and hosting configuration are separate from this repository.

## Design and behavior

The page uses Greenfield Brand Kit v1.3 artwork and locally hosted Figtree. The headline is a placeholder, and the garden illustrates a product concept rather than released capabilities.

Light, Dark, and System use the same theme-picker pattern as Fabrica. System is the default and follows device changes. An explicit preference is stored locally. The page has no tracking or audio.

The animation is pre-rendered. Its H.264 file packs color on the left and a synchronized alpha mask on the right; the small WebGL compositor restores transparency over either theme. Replacement videos must preserve this packing and match the canvas dimensions. The current visible frame is 768 by 576 pixels, making the encoded frame 1536 by 576 pixels.

Play and Pause control playback. Hidden tabs pause automatically, and a manual pause survives tab changes. Reduced-motion visitors see the completed transparent garden without downloading the movie. The static WebP also provides a fallback when JavaScript, WebGL, or video is unavailable.

See [animation provenance](assets/animation-source.txt) and the [Figtree license](assets/OFL-Figtree.txt). Blender sources are maintained separately from the deployable website.
