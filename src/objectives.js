export function objectiveSteps(state) {
  if(state.priority==='garden')return [
    {title:'Grow the existing crop',detail:'Assign greenhouse lighting twice. Crop stage '+state.crop+' / 3.',action:'grow',done:state.crop>=3||state.harvested},
    {title:'Reach the harvest window',detail:state.day<7?'The first harvest becomes available on Day 7.':'The harvest window is open.',done:state.day>=7},
    {title:'Harvest and save the experiment',detail:'Select mature, well-watered plants in the harvest activity.',action:'harvest',done:state.harvested},
  ];
  if(state.priority==='signal')return [
    {title:'Repair the Earth relay',detail:'From Day 3, use 2 parts and assign a crew member to the relay.',action:'relay',done:state.relay},
    {title:'Reach the report window',detail:state.day<6?'Full report transmissions open on Day 6.':'The report window is open.',done:state.day>=6},
    {title:'Deliver the mission report',detail:'Send a status report with the relay repaired. Earth replies after 32 simulated minutes.',action:'report',done:state.report},
  ];
  const needed=state.site==='ridge'?2:3;
  return [
    {title:'Restore the habitat',detail:'Assign the repair task. Mika saves 1 power.',action:'repair',done:state.habitat},
    {title:'Secure shelter materials',detail:'Have '+needed+' parts for your site. Mine ore or recover the parts crate if needed.',action:'mine',done:state.shield||state.parts>=needed},
    {title:'Reinforce the shelter',detail:'Spend '+needed+' parts on shelter reinforcement before the Day 5 exercise.',action:'brace',done:state.shield},
  ];
}
