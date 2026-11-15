# Redhaven · Ten Days Until Dawn

A 3D Mars survival and resource-management game for junior commanders. Start from a landed spacecraft, configure the surface delivery, take care of your crew for ten mission days, and decide whether to keep the outpost running in Endless Mode.

## Play locally

Requires Node.js 22.12+ and a browser with WebGL.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Use the station labels or drag the map to inspect the outpost. Start a mission, check the payload and budget, and choose one optional task per day alongside the oxygen allocation. Read the forecast before confirming. The game saves your mission to the current browser. Sound can be enabled from the header.

```sh
npm test
npm run build
npm run preview
```

The build produces a static site in `dist/` and works under a subpath. The simulation is independent of the Three.js render loop. Zustand persists the current mission and checkpoint. Howler plays the original synthesized habitat loop and interface effects.

## NASA sources

- [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) · The bundled [flare catalog snapshot](src/flares.json) covers 8–17 May 2024. [Retrieval endpoint](https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-08&endDate=2024-05-17). SHA-256: `9ba63f1fe9f53933b03faff2789f11d91547f5b417816399c9dbead42e59a42b`.
- [NASA Veggie experiment](https://ntrs.nasa.gov/citations/20160004060) · The growing period explains why the greenhouse starts with an existing crop.
- [NASA Mars communications analysis](https://ntrs.nasa.gov/citations/20220013418) · A simulated 16-minute one-way delay affects when Earth can reply.

The observation cards show archived data. The mission dates, flare-to-shelter-cost mapping, resource values, and physical scenario are educational abstractions. The game does not predict Mars radiation exposure from flare class.
