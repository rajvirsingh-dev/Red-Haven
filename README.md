# Redhaven · Ten Days Until Dawn

A 3D Mars survival and resource-management game for junior commanders. Start from a landed spacecraft, configure the surface delivery, take care of your crew for ten mission days, and decide whether to keep the outpost running in Endless Mode.

## Play locally

Requires Node.js 22.12+ and a browser with WebGL.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The outpost fills the screen, base-builder style. Your supplies are in the top-right corner, and the day and job count are in the top left. Your crew cards sit in the bottom bar. Drag Mika, Sol, or Pip onto a building in the 3D view, or onto its label. Buildings with available jobs glow while you drag. Dropping a crew member, or tapping a building, opens that building's job cards with their power, parts, and suit-oxygen costs. Tap a card to send the crew. Each crew specialty saves power on relevant work. The Goal, Inbox, and Medals buttons on the left open the mission checklist, the captain's daily packet, and milestones. After two jobs, press End Day to choose life-support power and check the morning forecast. Drag to orbit, and scroll or pinch to zoom.

Every task minigame is played by dragging. Mining has you drag the drill bit over each glowing fracture and release to drill. Ice processing has you drag pipe sections into the grid and tap them to rotate until the water flows. Cargo recovery has you drag supply seals into their remembered order. Harvesting has you drag the mature, well-watered plants into the harvest crate. Tapping and the keyboard work as alternatives to dragging. Canceling an activity spends no resources. Successful work applies its costs and rewards once. The crew member then walks to the site and does the job: swinging a pickaxe at the ore seam, chipping ice, hammering repairs, tending plants, or loading crates. Then they carry the haul home. Floating numbers show what each job cost and earned, and the resource bars flash as they change. While one crew member is out, you can send another. Their card shows trip progress, Skip finishes every trip at once, and End Day calls everyone home. The progress bar advances after each task. 
Mission saves, completed tasks, crew experience, deposits, and checkpoints are stored in the current browser. All original saves remain playable. Mining and ice deposits have three collections per mission or endless contract. The first two-task workday introduces your crew and highlights the relevant controls. A tutorial skip control is available. Tapping a crew card and then a building, or using the keyboard on the building labels, works as an alternative to dragging. Reduced-motion mode skips expedition and camera animations.

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
