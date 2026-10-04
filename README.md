# Chaos Theory and Strange Attractors

## Authors

- Me
- Claude (for the live viewer)

## Demo (Aizawa Attractor)

![](Animations/Thumbnail.gif)

| Color             | Initial Position      |
| ----------------- | --------------------- |
| Blue | (x, y, z) = (0.1, 0, 0) |
| Orange | (x, y, z) = (0.2, 0.1, 0.1) |
| Green | (x, y, z) = (0.3, 0.1, 0.1) |

## Live viewer

[**Open the live viewer**](https://epa058.github.io/Strange-Attractors/): a glowing particle cloud for each attractor that you can rotate, running in your browser. About half a million particles follow the equations on the GPU, and brighter regions are where the system spends more time. The *Thin lines* option draws a few long trajectories as glowing lines instead, like a line plot.

The viewer is in the `docs/` folder:

- `index.html`: the page and its controls
- `viewer.js`: GPU simulation (RK4) and rendering
- `attractors.js`: the equations and settings for each attractor, matching `Code.py`

To run it locally, start a small web server in the `docs/` folder and open http://localhost:8000:

```
cd docs
python -m http.server
```

(Opening `index.html` directly from disk doesn't work: browsers block pages opened that way from loading their scripts.)

## License

GNU General Public License v3.0

## FAQ

#### Why did you start this project?

Because I thought it was cool.

#### The integration algorithm you use is the most basic form of numerical integration. What's so impressive about this project?

Not every project you do has to impress Harvard's graduate school admissions office. I did it because it was fun and because I thought the results looked cool.

#### Simon, was that last question just you projecting your insecurities onto faceless viewers who had no intention of trashing your project?

Yeah :/
