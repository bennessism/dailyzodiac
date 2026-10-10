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
 overall:{focus:"the day's overall direction",tension:"Balance what matters emotionally against the urge to act or prove a point.",support:"Use cooperation between the planets to settle priorities and move forward deliberately.",placement:"Notice where this planet's usual concerns shape the day's choices."},
 love:{focus:"affection, trust and close relationships",tension:"Intensity or pride can make affection feel like a contest; explain what you need without testing another person's loyalty.",support:"Make space for mutual affection and give the other person room to express a different need.",placement:"Pay attention to the difference between genuine closeness and unspoken expectations."},
 work:{focus:"work, responsibilities and professional decisions",tension:"A strong impulse to push ahead can conflict with cooperation at work; agree on responsibilities before making demands.",support:"Use the shared momentum to coordinate work and turn ideas into a practical next step.",placement:"Apply this planet's strengths to a concrete task while keeping colleagues' expectations in view."},
 money:{focus:"purchases, resources and financial judgment",tension:"Desire and urgency can pull financial choices in different directions; compare the immediate appeal with the practical cost.",support:"Align preferences with available resources and consider what will still be worthwhile later.",placement:"Review the reasons behind a financial choice instead of relying only on confidence or caution."},
 communication:{focus:"what is said, heard and understood",tension:"A firm opinion or sensitive subject may make ordinary words sound sharper; ask one clear question before defending a position.",support:"Use the opening for a frank conversation that makes assumptions and expectations clearer.",placement:"Choose words that express the point without losing the listener."},
 social:{focus:"friendships and group dynamics",tension:"Different personalities may compete for attention or control; give others room instead of turning a social difference into a contest.",support:"Bring people together around a common interest and welcome different contributions.",placement:"Notice whether the social atmosphere calls for initiative, tact or a little more space."},
 energy:{focus:"drive, stamina and the pace of action",tension:"A burst of motivation can meet emotional resistance or competing demands; pace yourself rather than pushing at full speed.",support:"Put the available momentum into one useful activity rather than scattering it.",placement:"Use motivation thoughtfully and notice when it is time to slow down."},
 advice:{focus:"the most useful priority today",tension:"Do not let a passing urge settle a decision that needs reflection; identify the one issue worth addressing first.",support:"Choose one constructive step that makes the most of today's cooperative tendency.",placement:"Identify one manageable step instead of trying to solve everything at once."}
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
 return `${p.name} in ${p.sign.name} brings ${planet.topic} into a ${sign.quality} style. This favors ${sign.strength} in ${THEMES[theme]?.focus||"daily life"}, while ${sign.shadow} and ${planet.care} deserve attention.`;
}
function aspect(p,theme){
 const a=topic(p.planetA),b=topic(p.planetB),s1=SIGNS[p.planetA.sign.id],s2=SIGNS[p.planetB.sign.id],rule=ASPECT[p.aspect.id];
 if(!rule)return "";
 const t=THEMES[theme]||THEMES.overall;
 const challenging=["square","opposition"].includes(p.aspect.id);
 const body=challenging?t.tension:t.support;
 return `In ${t.focus}, ${p.planetA.name} in ${p.planetA.sign.name} brings ${a.topic}, while ${p.planetB.name} in ${p.planetB.sign.name} emphasizes ${b.topic}. Their ${p.aspect.label.toLowerCase()} ${rule.meaning}. ${s1&&s2?`${p.planetA.sign.name}'s ${s1.quality} manner meets ${p.planetB.sign.name}'s ${s2.quality} manner. `:""}${body}`;
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
 const selected=signals.filter(s=>s.relation!=="neutral");
 const candidates=aspects.filter(a=>theme.planets.includes(a.planetA.id)||theme.planets.includes(a.planetB.id)).map(a=>{
  const relevant=(theme.planets.includes(a.planetA.id)?1:0)+(theme.planets.includes(a.planetB.id)?1:0);
  const quick=["moon","mercury","venus","mars","sun"].includes(a.planetA.id)||["moon","mercury","venus","mars","sun"].includes(a.planetB.id);
  return {a,score:relevant*1.5+a.exactness+(quick?0.8:0)};
 }).sort((x,y)=>y.score-x.score);
 const top=candidates[0]?.a;
 const lead=selected.find(s=>!top||!(s.id===top.planetA.id||s.id===top.planetB.id))||selected[0];
 const chunks=[];
 if(top){
  chunks.push(`<p class="daily-aspect"><strong>Current sky influence · ${esc(top.planetA.name)} in ${esc(top.planetA.sign.name)} ${esc(top.aspect.label.toLowerCase())} ${esc(top.planetB.name)} in ${esc(top.planetB.sign.name)}</strong><span class="muted">Exact aspect angle: ${top.aspect.angle}° · current separation: ${top.separation.toFixed(2)}° · orb: ${top.aspect.delta.toFixed(2)}° (allowed ${top.aspect.orb}°)</span> ${esc(aspect(top,theme.id))} ${esc(movement(top,priorAspects))}</p>`);
 }
 if(lead){
  const t=THEMES[theme.id]||THEMES.overall;
  if(!top||!(lead.id===top.planetA.id||lead.id===top.planetB.id)){
    chunks.push(`<p><strong>${esc(lead.name)} in ${esc(lead.sign.name)} · ${esc(lead.relation)}</strong> ${esc(placement(lead,theme.id))} ${esc(t.placement)} Its whole-sign relationship to ${esc(selectedSign.name)} is ${esc(lead.relation)}.</p>`);
  }else if(!top){
    chunks.push(`<p>${esc(lead.name)} in ${esc(lead.sign.name)} makes ${esc(theme.label.toLowerCase())} worth considering through its ${esc(lead.relation)} relationship to ${esc(selectedSign.name)}.</p>`);
  }
 }else if(!top){chunks.push("<p>No major configured whole-sign influence or current aspect stands out for this theme.</p>");}
 return chunks.join("");
}
