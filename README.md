# Redhaven · Ten Days Until Dawn

A 3D Mars survival and resource-management game for junior commanders. Start from a landed spacecraft, configure the surface delivery, take care of your crew for ten mission days, and decide whether to keep the outpost running in Endless Mode.

## Play locally

Requires Node.js 22.12+ and a browser with WebGL.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Select station labels for close-up inspections or drag to orbit. Design your delivery, then follow the Day 1 crew tutorial. Assign Mika, Sol, or Pip to two tasks each day by selecting them or dragging a portrait onto a task or station. Drag power and parts chips onto compatible tasks to queue their allocation. Each crew specialty saves power on relevant work.

Mining uses a drill-alignment challenge, ice processing uses a rotating-pipe puzzle, cargo recovery uses a manifest memory challenge, and harvesting asks you to identify mature, well-watered plants. Canceling an activity spends no resources. Successful work applies its costs and rewards once, then shows the expedition and collection animation. The progress bar advances after each task. Allocate life-support power and check the overnight forecast before ending the day.

Mission saves, completed tasks, crew experience, deposits, and checkpoints are stored in the current browser. All original saves remain playable. Mining and ice deposits have three collections per mission or endless contract. The first two-task workday introduces your crew and highlights the relevant controls. A tutorial skip control is available. Mouse, keyboard, and touch selection provide alternatives to dragging. Reduced-motion mode skips expedition and camera animations.

Enable sound from the header. Mix controls independently adjust the original 24-second ambient music loop and the layered mining, ice, radio, assignment, cargo, greenhouse, and commendation sound effects. The score changes tempo during shelter exercises and stops while the tab is hidden.

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
The captain’s daily inbox shows the actual transport, resupply, and crew-rotation schedule. Each mission priority has a checklist with actionable steps. Outpost integrity records damage after a night with an unreinforced storm shelter, an uninspected battery fault, or critically low oxygen reserves. Maintenance restores integrity using work and parts. Damage values are educational training rules. The night forecast explains each pending deduction before confirmation.
