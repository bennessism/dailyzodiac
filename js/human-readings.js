// Narrative interpretation of CALCULATED sky positions. No invented transits or events.
const PLANETS={
sun:{topic:"confidence and direction",verb:"lead with purpose",care:"ego or overcommitment"},
moon:{topic:"mood and emotional needs",verb:"notice your reactions",care:"reacting before feelings settle"},
mercury:{topic:"thinking and communication",verb:"ask clear questions",care:"assumptions and rushed conclusions"},
venus:{topic:"affection, values and agreement",verb:"express what matters kindly",care:"unspoken expectations"},
mars:{topic:"initiative and assertion",verb:"act decisively but deliberately",care:"impatience or unnecessary confrontation"},
jupiter:{topic:"growth and opportunity",verb:"choose worthwhile opportunities",care:"overpromising"},
saturn:{topic:"responsibility and boundaries",verb:"work steadily with realistic limits",care:"rigidity or discouragement"},
uranus:{topic:"change and independence",verb:"leave room for a new approach",care:"disruption for its own sake"},
neptune:{topic:"imagination and ideals",verb:"balance vision with clarity",care:"wishful assumptions"},
pluto:{topic:"depth and transformation",verb:"consider what needs meaningful change",care:"control or fixation"}
};
const SIGNS={
aries:{quality:"direct and pioneering",strength:"taking initiative",shadow:"rushing"},taurus:{quality:"steady and practical",strength:"building security",shadow:"resisting change"},gemini:{quality:"curious and adaptable",strength:"sharing ideas",shadow:"scattered attention"},cancer:{quality:"protective and feeling-led",strength:"offering care",shadow:"overprotectiveness"},leo:{quality:"expressive and proud",strength:"creative confidence",shadow:"pride"},virgo:{quality:"observant and methodical",strength:"refining details",shadow:"overanalysis"},libra:{quality:"cooperative and fairness-minded",strength:"finding balance",shadow:"indecision"},scorpio:{quality:"intense and discerning",strength:"investigating what matters",shadow:"suspicion or control"},sagittarius:{quality:"exploratory and candid",strength:"seeing possibilities",shadow:"overstatement"},capricorn:{quality:"disciplined and strategic",strength:"building lasting results",shadow:"rigidity"},aquarius:{quality:"independent and unconventional",strength:"thinking differently",shadow:"detachment"},pisces:{quality:"empathetic and imaginative",strength:"understanding nuance",shadow:"blurred boundaries"}
};
const THEMES={
overall:{place:"today's priorities",action:"Choose the response that serves your wider priorities, not just the loudest impulse."},
love:{place:"relationships",action:"Say what you need and leave space for the other person's perspective."},
work:{place:"work and responsibilities",action:"Make progress through clear priorities and practical follow-through."},
money:{place:"spending and commitments",action:"Consider the longer-term cost before treating a desire as a necessity."},
communication:{place:"conversations",action:"Clarify what was meant before reacting to what was heard."},
social:{place:"friendships and group situations",action:"Make room for differences without losing your own voice."},
energy:{place:"energy and motivation",action:"Pace your efforts so enthusiasm leads to something useful."},
advice:{place:"today's focus",action:"Give attention to what you can influence directly."}
};
const ASPECT={
conjunction:{meaning:"brings these concerns together",direction:"The same choice may involve both needs at once."},
sextile:{meaning:"offers an opening between these concerns",direction:"A modest initiative can help the two work together."},
trine:{meaning:"suggests a more natural flow between these concerns",direction:"Build on what is already working rather than forcing extra effort."},
square:{meaning:"puts these concerns under tension",direction:"Different needs may pull against one another; deliberate choices matter."},
opposition:{meaning:"places these concerns at opposite ends of a question",direction:"Look for balance instead of treating either side as the only answer."}
};
const REL={conjunction:"especially personal",sextile:"more open to cooperation",trine:"more flowing",square:"under pressure",opposition:"calling for balance"};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const topic=p=>PLANETS[p.id]||{topic:p.name.toLowerCase(),verb:"act thoughtfully",care:"excess"};
function placement(p,theme){
 const planet=topic(p),sign=SIGNS[p.sign.id]||{quality:"distinctive",strength:"using its strengths",shadow:"excess"};
 return `${p.name} in ${p.sign.name} brings ${planet.topic} into a ${sign.quality} style. This favors ${sign.strength} in ${THEMES[theme]?.place||"daily life"}, while ${sign.shadow} and ${planet.care} deserve attention.`;
}
function aspect(p,theme){
 const a=topic(p.planetA),b=topic(p.planetB),s1=SIGNS[p.planetA.sign.id],s2=SIGNS[p.planetB.sign.id],rule=ASPECT[p.aspect.id];
 if(!rule)return "";
 return `${p.planetA.name} in ${p.planetA.sign.name} emphasizes ${a.topic}; ${p.planetB.name} in ${p.planetB.sign.name} emphasizes ${b.topic}. Their ${p.aspect.label.toLowerCase()} ${rule.meaning}. ${s1&&s2?`${p.planetA.sign.name}'s ${s1.quality} approach meets ${p.planetB.sign.name}'s ${s2.quality} approach. `:""}${rule.direction} In ${THEMES[theme]?.place||"daily life"}, ${THEMES[theme]?.action||"Act with consideration."}`;
}
function movement(p,prior){
 if(!prior)return "";
 const key=[p.planetA.id,p.planetB.id].sort().join("_")+":"+p.aspect.id;
 const yesterday=prior.get(key);
 if(!yesterday)return "This aspect was not within the configured orb at yesterday's comparison time.";
 const delta=yesterday.aspect.delta-p.aspect.delta;
 if(delta>.05)return `The orb has narrowed by ${delta.toFixed(2)}° since yesterday's matching clock time, putting it closer to exactness.`;
 if(delta<-.05)return `The orb has widened by ${(-delta).toFixed(2)}° since yesterday's matching clock time, placing it farther from exactness.`;
 return "Its orb has changed little since yesterday's matching clock time.";
}
export function humanTheme({theme,signals,aspects,priorAspects,selectedSign}){
 const relevant=aspects.filter(a=>theme.planets.includes(a.planetA.id)||theme.planets.includes(a.planetB.id)).map(a=>{
  const n=(theme.planets.includes(a.planetA.id)?1:0)+(theme.planets.includes(a.planetB.id)?1:0);
  const quick=["moon","mercury","venus","mars","sun"].includes(a.planetA.id)||["moon","mercury","venus","mars","sun"].includes(a.planetB.id);
  return {a,score:n*1.5+a.exactness+(quick?.8:0)};
 }).sort((x,y)=>y.score-x.score);
 const top=relevant[0]?.a;
 const selected=signals.filter(s=>s.relation!=="neutral");
 // One meaningful placement rather than up to three separate paragraphs that restate sign qualities.
 const lead=selected.find(s=>top&&(s.id===top.planetA.id||s.id===top.planetB.id))||selected[0];
 const chunks=[];
 if(top){
  chunks.push(`<p class="daily-aspect"><strong>Current sky influence · ${esc(top.planetA.name)} in ${esc(top.planetA.sign.name)} ${esc(top.aspect.label.toLowerCase())} ${esc(top.planetB.name)} in ${esc(top.planetB.sign.name)}</strong><span class="muted">Exact aspect angle: ${top.aspect.angle}° · current separation: ${top.separation.toFixed(2)}° · orb: ${top.aspect.delta.toFixed(2)}° (allowed ${top.aspect.orb}°)</span> ${esc(aspect(top,theme.id))} ${esc(movement(top,priorAspects))}</p>`);
 }
 if(lead){
  const rel=lead.relation;
  // Avoid repeating the leading aspect's sign qualities as a second independent explanation.
  if(!top||!(lead.id===top.planetA.id||lead.id===top.planetB.id)){
   chunks.push(`<p><strong>${esc(lead.name)} in ${esc(lead.sign.name)} · ${esc(rel)}</strong> ${esc(placement(lead,theme.id))} This placement has a ${REL[rel]||"distinct"} whole-sign relationship to ${selectedSign.name}.</p>`);
  }else{
   chunks.push(`<p>${esc(lead.name)} in ${esc(lead.sign.name)} has a ${REL[rel]||"distinct"} whole-sign relationship to ${selectedSign.name}; keep that sign-specific context in mind when considering the aspect above.</p>`);
  }
 }else if(!top){chunks.push("<p>No major configured whole-sign influence or current aspect stands out for this theme.</p>");}
 return chunks.join("");
}
