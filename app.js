/* Team Optimus — Earth Jukebox
 * Global explorer uses NASA POWER daily point API.
 * EIC mode samples a verified NASA EIC SVS 5313 video frame-by-frame.
 * No generated/AI music: Web Audio synthesis follows measured image features.
 */
const $=id=>document.getElementById(id);
const PARAMS={
 T2M:{label:"Temperature",unit:"°C",note:"Temperature maps to pitch: higher monthly averages create higher notes.",instrument:"sine"},
 RH2M:{label:"Humidity",unit:"%",note:"Humidity maps to pitch and timbre: higher monthly averages create brighter, higher notes.",instrument:"triangle"},
 PRECTOTCORR:{label:"Precipitation",unit:"mm/day",note:"Precipitation maps to note duration: wetter monthly averages create longer notes.",instrument:"sine"},
 WS10M:{label:"Wind speed",unit:"m/s",note:"Wind speed maps to tempo: higher monthly averages create faster note sequences.",instrument:"triangle"},
 PS:{label:"Surface pressure",unit:"kPa",note:"Pressure maps to pitch intervals: changes shift notes through a fixed scale.",instrument:"sine"},
 ALLSKY_SFC_SW_DWN:{label:"Solar radiation",unit:"MJ/m²/day",note:"Solar radiation maps to loudness: higher monthly averages create louder notes.",instrument:"sine"}
};
const PARAMETER_LIST=Object.keys(PARAMS);
let selected={lat:28.6139,lng:77.2090,name:"Delhi, India"},dailyData=[],monthlyData=[],chart=null,audioContext=null,playTimer=null,playing=false,currentOscillators=[],globe=null;
let eicRAF=null,eicAudioOn=false,eicOsc=null,eicGain=null,eicLastSample=0,eicLocalUrl=null,eicSourceMode="remote";
function announce(m){$("liveAnnouncement").textContent=m}
function setStatus(m){$("dataStatus").textContent=m}
function selectedParam(){return document.querySelector('input[name="variable"]:checked').value}
function yearBounds(year){const y=Number(year),now=new Date(),end=y===now.getFullYear()?new Date(now.getTime()-86400000):new Date(y,11,31);return{start:`${y}0101`,end:`${end.getFullYear()}${String(end.getMonth()+1).padStart(2,"0")}${String(end.getDate()).padStart(2,"0")}`}}
function populateYears(){const s=$("yearSelect"),cur=new Date().getFullYear();for(let y=cur;y>=2001;y--){let o=document.createElement("option");o.value=y;o.textContent=y+(y===cur?" (year to date)":"");s.append(o)}s.value=String(cur-1)}
function initGlobe() {
  const el = $("globeViz");

  if (typeof Globe !== "function") {
    el.textContent = "Globe library unavailable.";
    return;
  }

  globe = Globe()(el)
    .width(el.clientWidth)
    .height(el.clientHeight)
    .globeImageUrl(
      "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
    )
    .bumpImageUrl(
      "https://unpkg.com/three-globe/example/img/earth-topology.png"
    )
    .backgroundColor("rgba(0,0,0,0)")
    .showAtmosphere(true)
    .atmosphereColor("#63c9ef")
    .atmosphereAltitude(0.18)
    .pointsData([
      {
        lat: selected.lat,
        lng: selected.lng,
        size: 0.55,
        color: "#66e6c0"
      }
    ])
    .pointLat("lat")
    .pointLng("lng")
    .pointColor("color")
    .pointAltitude(0.02)
    .pointRadius("size")
    .onGlobeClick(({ lat, lng }) =>
      setLocation(lat, lng, "Selected coordinates")
    );

  globe.pointOfView(
    { lat: selected.lat, lng: selected.lng, altitude: 2.1 },
    1000
  );

  window.addEventListener("resize", () => {
    globe
      .width(el.clientWidth)
      .height(el.clientHeight);
  });
}
function setLocation(lat,lng,name){lat=Number(lat);lng=Number(lng);if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat< -90||lat>90||lng< -180||lng>180){announce("Latitude must be between minus 90 and 90. Longitude must be between minus 180 and 180.");return}selected={lat,lng,name:name||"Selected coordinates"};$("latitude").value=lat.toFixed(4);$("longitude").value=lng.toFixed(4);$("locationLabel").textContent=`Selected location: ${selected.name} (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;if(globe){globe.pointsData([{lat,lng,size:.65,color:"#66e6c0"}]);globe.pointOfView({lat,lng,altitude:2},900)}setStatus("Location selected · load data");announce(`Selected ${selected.name}. Latitude ${lat.toFixed(3)}, longitude ${lng.toFixed(3)}.`)}
async function searchPlace(){const q=$("placeSearch").value.trim();if(!q)return;$("searchBtn").disabled=true;setStatus("Finding place…");try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`,{headers:{Accept:"application/json"}});if(!r.ok)throw Error("Place search service unavailable");const a=await r.json();if(!a.length)throw Error("No matching place found");setLocation(+a[0].lat,+a[0].lon,a[0].display_name.split(",").slice(0,3).join(","))}catch(e){setStatus("Place search unavailable");announce(e.message)}finally{$("searchBtn").disabled=false}}
async function loadNASAData(){const year=+$("yearSelect").value,b=yearBounds(year),url=new URL("https://power.larc.nasa.gov/api/temporal/daily/point");Object.entries({parameters:PARAMETER_LIST.join(","),community:"RE",longitude:selected.lng,latitude:selected.lat,start:b.start,end:b.end,format:"JSON","time-standard":"UTC"}).forEach(([k,v])=>url.searchParams.set(k,v));$("loadData").disabled=true;$("loadData").textContent="Loading NASA data…";setStatus("Requesting NASA POWER data…");try{const r=await fetch(url);const j=await r.json();if(!r.ok)throw Error(j?.messages?.join(" ")||`NASA POWER HTTP ${r.status}`);const series=j?.properties?.parameter?.[selectedParam()];if(!series)throw Error("The requested parameter was not returned.");dailyData=Object.entries(series).map(([date,value])=>({date,value:Number(value)})).filter(d=>Number.isFinite(d.value)&&d.value!==-999).sort((a,b)=>a.date.localeCompare(b.date));if(!dailyData.length)throw Error("No valid daily measurements were returned.");monthlyData=makeMonthly(dailyData);renderData();$("playSound").disabled=false;$("downloadCsv").disabled=false;$("speakSummary").disabled=false;$("stopSound").disabled=false;$("audioStatus").textContent="Soundscape ready. Press Play to listen.";setStatus(`NASA POWER · ${dailyData.length} daily records`);announce(`Data loaded for ${selected.name}. ${dailyData.length} valid daily ${PARAMS[selectedParam()].label} records.`)}catch(e){setStatus("Data could not be loaded");$("audioStatus").textContent=e.message;announce(`NASA data error: ${e.message}`);console.error(e)}finally{$("loadData").disabled=false;$("loadData").textContent="↗ Load NASA data"}}
function makeMonthly(data){let a=Array.from({length:12},(_,i)=>({month:i+1,values:[]}));data.forEach(d=>a[+d.date.slice(4,6)-1]?.values.push(d.value));return a.map(x=>({month:x.month,mean:x.values.length?x.values.reduce((p,c)=>p+c,0)/x.values.length:null,count:x.values.length})).filter(x=>x.mean!==null)}
function dateLabel(s){return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`}
function fmt(n){return Number(n).toFixed(2)}
function renderData(){const key=selectedParam(),meta=PARAMS[key],vals=dailyData.map(d=>d.value),mean=vals.reduce((a,b)=>a+b,0)/vals.length,max=dailyData.reduce((a,b)=>b.value>a.value?b:a),min=dailyData.reduce((a,b)=>b.value<a.value?b:a);$("meanValue").textContent=`${fmt(mean)} ${meta.unit}`;$("meanUnit").textContent=meta.label;$("maxValue").textContent=`${fmt(max.value)} ${meta.unit}`;$("maxDate").textContent=`${dateLabel(max.date)} · daily maximum`;$("minValue").textContent=`${fmt(min.value)} ${meta.unit}`;$("minDate").textContent=`${dateLabel(min.date)} · daily minimum`;$("recordCount").textContent=String(vals.length);$("monthlyTable").innerHTML=monthlyData.map(m=>`<tr><th scope="row">${new Date(2000,m.month-1,1).toLocaleString("en",{month:"long"})}</th><td>${fmt(m.mean)} ${meta.unit}</td><td>${m.count}</td></tr>`).join("");if(chart)chart.destroy();chart=new Chart($("yearChart").getContext("2d"),{type:"line",data:{labels:dailyData.map(d=>dateLabel(d.date)),datasets:[{label:`${meta.label} (${meta.unit})`,data:vals,borderColor:"#63d4ef",backgroundColor:"rgba(99,212,239,.12)",borderWidth:1.6,pointRadius:0,fill:true,tension:.22}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{labels:{color:"#c4d4e2"}},tooltip:{backgroundColor:"#10263a",titleColor:"#fff",bodyColor:"#c9d9e6"}},scales:{x:{ticks:{color:"#829bb1",maxTicksLimit:12},grid:{color:"rgba(120,160,190,.09)"}},y:{ticks:{color:"#829bb1"},grid:{color:"rgba(120,160,190,.12)"},title:{display:true,text:meta.unit,color:"#9ab1c5"}}}}});$("mappingText").textContent=meta.note}
function stopSound(){if(playTimer)clearTimeout(playTimer);playTimer=null;currentOscillators.forEach(o=>{try{o.stop()}catch(_){}});currentOscillators=[];playing=false;$("soundWave").classList.remove("playing");$("playSound").disabled=!monthlyData.length;$("playSound").textContent="▶ Play yearly sonification";$("audioStatus").textContent="Playback stopped."}
function playSound(){if(!monthlyData.length)return;stopSound();const C=window.AudioContext||window.webkitAudioContext;if(!C){$("audioStatus").textContent="Web Audio is unavailable in this browser.";return}audioContext=audioContext||new C();audioContext.resume();const key=selectedParam(),meta=PARAMS[key],v=monthlyData.map(x=>x.mean),lo=Math.min(...v),hi=Math.max(...v),range=hi-lo||1,scale=[0,2,4,5,7,9,11,12];let i=0;playing=true;$("soundWave").classList.add("playing");$("playSound").disabled=true;function next(){if(!playing)return;if(i>=monthlyData.length){stopSound();$("audioStatus").textContent="Yearly sonification complete.";return}const m=monthlyData[i],n=(m.mean-lo)/range,degree=Math.round(n*7),freq=220*Math.pow(2,scale[degree]/12),dur=key==="PRECTOTCORR"?.34+n*.45:.34,vol=key==="ALLSKY_SFC_SW_DWN"?.035+n*.09:.075,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=meta.instrument;osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(vol,audioContext.currentTime+.035);gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+dur);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+dur+.03);currentOscillators=[osc];$("audioStatus").textContent=`${new Date(2000,m.month-1,1).toLocaleString("en",{month:"long"})}: ${fmt(m.mean)} ${meta.unit}`;i++;playTimer=setTimeout(next,key==="WS10M"?Math.max(180,650-n*350):650)}next()}
function downloadCSV(){if(!dailyData.length)return;const csv=["date,parameter,value,unit",...dailyData.map(d=>`${dateLabel(d.date)},${selectedParam()},${d.value},${PARAMS[selectedParam()].unit}`)].join("\n"),a=document.createElement("a"),u=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.href=u;a.download=`earth-jukebox-${selectedParam()}-${$("yearSelect").value}.csv`;a.click();URL.revokeObjectURL(u)}
function speak(text){if(!("speechSynthesis"in window)){announce("Text-to-speech is not supported in this browser.");return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-IN";speechSynthesis.speak(u)}
function speakSummary(){if(!dailyData.length)return;const key=selectedParam(),v=dailyData.map(d=>d.value),avg=v.reduce((a,b)=>a+b,0)/v.length; speak(`${PARAMS[key].label} at ${selected.name} during ${$("yearSelect").value}. The average of the available daily values was ${fmt(avg)} ${PARAMS[key].unit}. The highest daily value was ${fmt(Math.max(...v))} and the lowest was ${fmt(Math.min(...v))}. There were ${v.length} valid daily records. These are NASA POWER gridded data, not a weather station reading at the exact cursor point.`)}
function setMode(mode){const e=mode==="eic";$("explorerMode").classList.toggle("hidden",e);$("eicMode").classList.toggle("hidden",!e);document.querySelectorAll(".mode-tab").forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});announce(e?"EIC Jukebox mode. NASA Earth Information Center visual track.":"Global data explorer mode.")}
function eicStop(){eicAudioOn=false;if(eicRAF)cancelAnimationFrame(eicRAF);eicRAF=null;if(eicOsc){try{eicOsc.stop()}catch(_){}}eicOsc=null;eicGain=null;$("eicVideo").pause();$("eicStatus").textContent="EIC sonification stopped."}
function startEicSound(){const v=$("eicVideo"),C=window.AudioContext||window.webkitAudioContext;if(!C){$("eicStatus").textContent="Web Audio is not supported in this browser.";return}if(v.readyState<2){$("eicStatus").textContent="Wait for the NASA video to load, then press Play again.";return}eicStop();audioContext=audioContext||new C();audioContext.resume();eicAudioOn=true;eicLastSample=0;const canvas=$("eicCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});let lastNoteAt=0;
function sample(now){if(!eicAudioOn)return;if(v.paused||v.ended){if(v.ended){eicAudioOn=false;$("eicStatus").textContent="EIC video and sonification complete."}return}if(now-lastNoteAt>280){try{canvas.width=48;canvas.height=27;ctx.drawImage(v,0,0,48,27);const px=ctx.getImageData(0,0,48,27).data;let sum=0,count=0;for(let i=0;i<px.length;i+=4){if(px[i+3]>10){sum+=(.2126*px[i]+.7152*px[i+1]+.0722*px[i+2])/255;count++}}if(!count)throw Error("No readable frame pixels");const brightness=sum/count,scale=[0,2,4,5,7,9,11,12],degree=Math.max(0,Math.min(7,Math.round(brightness*7))),freq=196*Math.pow(2,scale[degree]/12);if(eicOsc){try{eicOsc.stop()}catch(_){}}eicOsc=audioContext.createOscillator();eicGain=audioContext.createGain();eicOsc.type="sine";eicOsc.frequency.setValueAtTime(freq,audioContext.currentTime);eicGain.gain.setValueAtTime(.0001,audioContext.currentTime);eicGain.gain.exponentialRampToValueAtTime(.055,audioContext.currentTime+.025);eicGain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.22);eicOsc.connect(eicGain);eicGain.connect(audioContext.destination);eicOsc.start();eicOsc.stop(audioContext.currentTime+.24);$("eicStatus").textContent=`Live frame sonification · average frame luminance ${(brightness*100).toFixed(1)}% · ${Math.round(freq)} Hz`;lastNoteAt=now}catch(err){eicAudioOn=false;v.pause();$("eicStatus").textContent="Frame pixels could not be read from the remote NASA video because of browser cross-origin restrictions. Download the same official EIC video from the NASA SVS page, then load it using the local video upload below. The uploaded local video can be analyzed frame by frame.";announce("Remote video frame analysis was blocked. Use the official video download and local upload option.") ;return}}eicRAF=requestAnimationFrame(sample)}
v.muted=true;v.play().then(()=>{eicRAF=requestAnimationFrame(sample);$("eicStatus").textContent="EIC video playing. Frame brightness is being sampled to generate notes."}).catch(err=>{$("eicStatus").textContent=`Video could not start: ${err.message}. Check your internet connection or load the official video file.`})}
function loadLocalEic(file){if(!file)return;if(eicLocalUrl)URL.revokeObjectURL(eicLocalUrl);eicStop();eicLocalUrl=URL.createObjectURL(file);const v=$("eicVideo");v.crossOrigin=null;v.src=eicLocalUrl;v.load();eicSourceMode="local";$("eicStatus").textContent=`Loaded local video: ${file.name}. Press Play EIC with sound to analyze frames.`;announce("Local EIC video loaded. Press play to start frame sonification.")}
function initVoice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){$("voiceBtn").disabled=true;$("voiceBtn").title="Voice recognition is not supported. Use text and keyboard controls.";return}const r=new SR();r.lang="en-IN";r.interimResults=false;r.maxAlternatives=1;r.onstart=()=>{$("voiceBtn").setAttribute("aria-pressed","true");$("voiceBtn").textContent="Listening…";announce("Voice commands active. Try: find Delhi, show temperature, load data, play sound, or open EIC mode.")};r.onend=()=>{$("voiceBtn").setAttribute("aria-pressed","false");$("voiceBtn").innerHTML="🎙 Voice commands"};r.onerror=()=>announce("Voice recognition failed. Text and keyboard controls remain available.");r.onresult=e=>handleVoice(e.results[0][0].transcript);$("voiceBtn").addEventListener("click",()=>{try{r.start()}catch(_){announce("Voice recognition is already active.")}})}
function handleVoice(raw){const q=raw.toLowerCase().trim();announce(`Command heard: ${raw}`);if(/\b(eic|jukebox mode|eic mode)\b/.test(q)){setMode("eic");return}if(/\b(global explorer|globe mode|explorer mode)\b/.test(q)){setMode("explorer");return}if(/\b(play|start)\b/.test(q)&&$("eicMode").classList.contains("hidden")){if(monthlyData.length)playSound();else announce("Load NASA data before playing the yearly sonification.");return}if(/\b(play|start)\b/.test(q)&&!$("eicMode").classList.contains("hidden")){startEicSound();return}if(/\b(stop|pause)\b/.test(q)){stopSound();eicStop();return}if(/\b(load|fetch)\b/.test(q)){if(!$("eicMode").classList.contains("hidden"))startEicSound();else loadNASAData();return}if(/\b(temperature|humidity|precipitation|rainfall|wind|pressure|solar)\b/.test(q)){const map={temperature:"T2M",humidity:"RH2M",precipitation:"PRECTOTCORR",rainfall:"PRECTOTCORR",wind:"WS10M",pressure:"PS",solar:"ALLSKY_SFC_SW_DWN"};const word=q.match(/temperature|humidity|precipitation|rainfall|wind|pressure|solar/)[0],radio=document.querySelector(`input[name="variable"][value="${map[word]}"]`);if(radio){radio.checked=true;radio.dispatchEvent(new Event("change"));announce(`${PARAMS[map[word]].label} selected. Say load data to retrieve it.`)}return}if(/\b(read|explain|describe)\b/.test(q)){if(!$("eicMode").classList.contains("hidden"))speakEic();else speakSummary();return}if(/\b(find|search|go to|show me|locate)\b/.test(q)){const place=q.replace(/^(find|search|go to|show me|locate)\s*/,"").replace(/\b(data|weather|temperature|humidity)\b/g,"").trim();$("placeSearch").value=place;setMode("explorer");searchPlace();return}$("placeSearch").value=raw;setMode("explorer");searchPlace()}
function speakEic(){speak("This is NASA Scientific Visualization Studio item 5313, Change in Night Lights between 2012 and 2023, EIC Version. The video is sampled at regular intervals. Average brightness across each sampled frame is mapped to a note in a pentatonic scale. Brighter frames produce higher notes. This is a sonification of the displayed visual pattern, not a calibrated measurement of night light radiance. NASA SVS credits Kel Elkins.")}
$("searchBtn").addEventListener("click",searchPlace);$("placeSearch").addEventListener("keydown",e=>{if(e.key==="Enter")searchPlace()});$("applyCoords").addEventListener("click",()=>setLocation($("latitude").value,$("longitude").value,"Selected coordinates"));$("loadData").addEventListener("click",loadNASAData);$("playSound").addEventListener("click",playSound);$("stopSound").addEventListener("click",stopSound);$("downloadCsv").addEventListener("click",downloadCSV);$("speakSummary").addEventListener("click",speakSummary);document.querySelectorAll('input[name="variable"]').forEach(el=>el.addEventListener("change",()=>{document.querySelectorAll(".variable-option").forEach(x=>x.classList.toggle("selected",x.querySelector("input").checked));$("mappingText").textContent=PARAMS[selectedParam()].note;if(dailyData.length){dailyData=[];monthlyData=[];$("playSound").disabled=true;$("downloadCsv").disabled=true;$("speakSummary").disabled=true;setStatus("Variable changed · reload data")}}));document.querySelectorAll(".mode-tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));$("eicPlay").addEventListener("click",startEicSound);$("eicStop").addEventListener("click",eicStop);$("eicFile").addEventListener("change",e=>loadLocalEic(e.target.files[0]));$("speakEic").addEventListener("click",speakEic);$("eicVideo").addEventListener("ended",()=>{eicAudioOn=false;if(eicRAF)cancelAnimationFrame(eicRAF);$("eicStatus").textContent="EIC playback complete."});window.addEventListener("beforeunload",()=>{eicStop();stopSound();if(eicLocalUrl)URL.revokeObjectURL(eicLocalUrl)});
populateYears();initGlobe();initVoice();setStatus("Choose a place and load data");
// ===================================
// EARTH JUKEBOX - NARRATOR CONTROLS
// ===================================

const narratorPlay = document.getElementById("narratorPlay");
const narratorPause = document.getElementById("narratorPause");
const narratorStop = document.getElementById("narratorStop");

// Play / Resume narration
narratorPlay?.addEventListener("click", () => {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  } else if (window.speechSynthesis.speaking) {
    return;
  } else {
    // Start a new narration
    const textToSpeak =
      document.querySelector(".accessibility-note")?.innerText;

    if (textToSpeak) {
      const speech = new SpeechSynthesisUtterance(textToSpeak);
      speech.lang = "en-IN";
      speech.rate = 0.9;
      window.speechSynthesis.speak(speech);
    }
  }
});

// Pause narration
narratorPause?.addEventListener("click", () => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
});

// Stop narration
narratorStop?.addEventListener("click", () => {
  window.speechSynthesis.cancel();
});