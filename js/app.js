import { calculateCurrentSky } from "./ephemeris.js";
import { signForLongitude, detectAspects, rankSignalsForTheme, formatDegree } from "./zodiac-engine.js";

const $ = id => document.getElementById(id);
const loadJson = async path => {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`Failed to load ${path}`);
  return r.json();
};
const titleCase = s => s.replace(/\b\w/g,m=>m.toUpperCase());
const formatDate = d => new Intl.DateTimeFormat(undefined,{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(d);

function renderWheel(signs,onSelect,active=null){
  const wheel=$("zodiac-wheel");
  const radius=window.innerWidth<=680?132:176;
  wheel.innerHTML=signs.map((sign,i)=>{
    const a=(-90+i*30)*Math.PI/180;
    const x=Math.cos(a)*radius, y=Math.sin(a)*radius;
    return `<div class="sign-node" style="transform:translate(-50%,-50%) translate(${x}px,${y}px)">
      <button class="sign-button ${active===sign.id?"active":""}" data-sign="${sign.id}" aria-label="${sign.name}">
        <span class="sign-glyph">${sign.symbol}</span>
      </button>
      <div class="sign-label">${sign.name}</div>
    </div>`;
  }).join("");
  wheel.querySelectorAll(".sign-button").forEach(b=>b.addEventListener("click",()=>onSelect(b.dataset.sign)));
}

function renderSky(positioned){
  $("sky-list").innerHTML=positioned.map(p=>`<div class="sky-row">
    <strong>${p.name}</strong>
    <span class="sky-sign">${p.sign.symbol} ${p.sign.name}</span>
    <span class="sky-degree">${formatDegree(p.sign.degree)}</span>
  </div>`).join("");
}

function aspectInterpretation(item,themeId,library){
  const key=`${item.planetA.id}_${item.planetB.id}`;
  const record=library.entries?.[key]?.[item.aspect.id];
  return record?.[themeId]||record?.overall||"";
}

function renderSharedAspects(aspects,library){
  $("aspect-list").innerHTML=aspects.length
    ? aspects.slice(0,8).map(item=>{
        const copy=aspectInterpretation(item,"overall",library);
        return `<article class="aspect-row">
          <div class="aspect-title">
            <strong>${item.planetA.name} ${item.aspect.label.toLowerCase()} ${item.planetB.name}</strong>
            <span class="aspect-meta">${item.aspect.nature} · orb ${item.aspect.delta.toFixed(2)}°</span>
          </div>
          ${copy?`<p class="aspect-copy">${copy}</p>`:""}
        </article>`;
      }).join("")
    : '<p class="muted">No configured major aspects are within orb at this moment.</p>';
}

function buildThemeText({theme,signals,relationStatements,planetSigns,aspects,aspectLibrary}){
  const parts=[];
  for(const signal of signals.filter(s=>s.relation!=="neutral").slice(0,3)){
    const placement=planetSigns.entries?.[`${signal.id}_${signal.sign.id}`];
    const ptxt=placement?.[theme.id]||placement?.overall||"";
    const rtxt=relationStatements[signal.relation]?.[theme.id]||relationStatements[signal.relation]?.overall||"";
    if(ptxt||rtxt) parts.push(`<p><strong>${signal.name} in ${signal.sign.name} · ${titleCase(signal.relation)}</strong>${ptxt} ${rtxt}</p>`);
  }
  return parts.length?parts.join(""):"<p>No major configured signal dominates this theme right now, so it can be treated as a quieter background area today.</p>";
}

function renderFixed(sign,profiles){
  const p=profiles[sign.id];
  $("fixed-info").hidden=false;
  $("fixed-title").textContent=sign.name;
  $("fixed-symbol").textContent=sign.symbol;
  $("fixed-profile").textContent=p.profile;
  $("fixed-strength").textContent=p.strength;
  $("fixed-challenge").textContent=p.challenge;
  $("fixed-basics").textContent=p.basics;
}

function renderReading({sign,themes,positioned,aspects,rules,relationStatements,planetSigns,aspectLibrary,date,profiles}){
  renderFixed(sign,profiles);
  $("reading").hidden=false;
  $("reading-title").textContent=`${sign.name} Daily Zodiac`;
  $("reading-subtitle").textContent=formatDate(date);
  $("sign-symbol").textContent=sign.symbol;
  $("theme-grid").innerHTML=themes.map(theme=>{
    const signals=rankSignalsForTheme({selectedSign:sign,positionedPlanets:positioned,theme,relationWeights:rules.relationWeights});
    return `<article class="theme-card"><h3>${theme.label}</h3>${buildThemeText({theme,signals,relationStatements,planetSigns,aspects,aspectLibrary})}</article>`;
  }).join("");
  $("fixed-info").scrollIntoView({behavior:"smooth",block:"start"});
}

async function main(){
  const date=new Date();
  $("today-date").textContent=formatDate(date);

  const [signData,themeData,aspectData,rules,relationStatements,planetSigns,aspectLibrary,profiles]=await Promise.all([
    loadJson("./data/signs.json"),loadJson("./data/themes.json"),loadJson("./data/aspects.json"),
    loadJson("./data/daily-rules.json"),loadJson("./data/relation-statements.json"),
    loadJson("./data/planet-signs.json"),loadJson("./data/planet-aspects.json"),loadJson("./data/sign-profiles.json")
  ]);

  const signs=signData.signs;
  let positioned=[],aspects=[],active=null;

  const choose=id=>{
    if(!positioned.length)return;
    active=id;
    renderWheel(signs,choose,active);
    const sign=signs.find(s=>s.id===id);
    renderReading({sign,themes:themeData.themes,positioned,aspects,rules,relationStatements,planetSigns,aspectLibrary,date,profiles});
  };

  renderWheel(signs,choose,active);

  try{
    const sky=await calculateCurrentSky(date);
    positioned=sky.positions.map(p=>({...p,sign:signForLongitude(p.longitude,signs)}));
    aspects=detectAspects(positioned,aspectData.aspects);
    $("engine-status").className="status ok";
    $("engine-status").textContent=`Ephemeris ready · ${sky.engine} · ${sky.ephemeris} · source: ${sky.engineSource}`;
    renderSky(positioned);
    renderSharedAspects(aspects,aspectLibrary);
    renderWheel(signs,choose,active);
    window.addEventListener("resize",()=>renderWheel(signs,choose,active));
  }catch(e){
    console.error(e);
    $("engine-status").className="status error";
    $("engine-status").textContent="Ephemeris unavailable. No zodiac reading is generated until the calculation engine loads successfully.";
  }
}
main().catch(e=>{console.error(e);$("engine-status").className="status error";$("engine-status").textContent="Daily Zodiac could not initialize.";});