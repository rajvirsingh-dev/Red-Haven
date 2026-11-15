export function captainMessage(state) {
  const story=state.mode==='story';
  const transport=story?10:Math.floor((state.day-1)/10)*10+11;
  const supply=story?10:Math.ceil(state.day/5)*5;
  const crewEta=Math.max(0,transport-state.day);
  const supplyEta=Math.max(0,supply-state.day);
  const statements=[
    'Your crew is counting on a clear plan. Check the reserves before dispatching anyone.',
    'Recover the cargo at your own pace. Each crate can be collected once.',
    'Sol’s plants were growing before you arrived. Two lighting tasks prepare their first harvest.',
    'Review the historical solar bulletin and prepare your shelter before the exercise.',
    'Keep human crew inside the shelter. Pip can perform the outdoor inspection.',
    'Send your status report through the repaired relay. Replies take 32 simulated minutes round trip.',
    'A successful harvest supports your stored meals. Check both maturity and moisture.',
    'A beacon signal helps the transport find the crater. Continuous transmission costs more power.',
    'Inspect the night forecast. Spare parts can restore damaged outpost systems.',
    'The transport is at the crater. Complete your handover and mission report.',
  ];
  const warning=state.hazard==='storm'?'Shelter exercise today. Protect the crew and review system strain.':
    state.hazard==='fault'?'Battery fault today. Check power capacity and outpost integrity.':null;
  return {
    text:story?statements[state.day-1]:warning??'Your outpost is operating on an extended contract. Maintain the systems and plan for the next delivery.',
    supplyDay:supply,crewDay:transport,supplyEta,crewEta,
    supplyLabel:story?'Transport cargo on Day 10':'Next supply delivery',
    crewLabel:story?'Crew transfer on Day 10':'Next crew rotation',
    detail:story?'Transport cargo becomes available if you continue in Endless Mode.':
      'Scheduled delivery contains 4 power, 2 oxygen, 6 meals, and 3 parts, within storage capacity.',
    crates:2-Number(!!state.caches.air)-Number(!!state.caches.parts),
    received:'Reyes → Captain · Daily packet '+state.day,
  };
}
