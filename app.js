(function(){
"use strict";
var $=function(s){return document.querySelector(s)};
var S={url:"",pwd:"",demo:false,students:[],cards:[],page:"",timers:[],lastKey:""};
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},sget:function(k){try{return sessionStorage.getItem(k)}catch(e){return null}},sset:function(k,v){try{sessionStorage.setItem(k,v)}catch(e){}},sdel:function(k){try{sessionStorage.removeItem(k)}catch(e){}}};
function sheetUrl(){return(window.SMARTATTEND&&window.SMARTATTEND.SHEET)||store.get("sa_sheet")||""}
function ini(n){var p=String(n).trim().split(/\s+/);return((p[0]||"?").charAt(0)+(p[1]?p[1].charAt(0):"")).toUpperCase()}
function av(n){var h=0,t=String(n);for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))%360;return'<span class="av" style="background:hsl('+h+' 55% 42%)">'+esc(ini(n))+'</span>'}
function pw(id,l,ac){return'<label for="'+id+'">'+l+'</label><div class="pw"><input id="'+id+'" type="password" autocomplete="'+ac+'"><button type="button" class="eye" data-t="'+id+'">Show</button></div>'}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".eye");if(!b)return;var i=document.getElementById(b.dataset.t);if(!i)return;var show=i.type==="password";i.type=show?"text":"password";b.textContent=show?"Hide":"Show";b.setAttribute("aria-label",show?"Hide password":"Show password")});
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function iso(d){return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)}
function todayStr(){return iso(new Date())}
function fn(s){return((s.first||"")+" "+(s.last||"")).trim()}
function toast(m){var t=$("#toast");t.textContent=m;t.classList.remove("hide");clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.add("hide")},2600)}
function fail(e){toast(e&&e.message?e.message:"Something went wrong. Try again.")}
function pct(n,d){return d?Math.round(n*100/d):0}

/* ---------- demo backend ---------- */
var D={students:[],rows:[],cards:[]};
(function(){
 var nm=[["Aarav","Patil","BCA","First Year"],["Isha","Deshmukh","BCA","First Year"],["Rohan","Kulkarni","B.Tech","Second Year"],["Meera","Joshi","B.Tech","Second Year"],["Kabir","Shinde","MBA","First Year"],["Sana","Sheikh","MBA","Final Year"]];
 nm.forEach(function(n,i){D.students.push({uid:"4A1F9C0"+i,prn:"2026"+(1001+i),first:n[0],last:n[1],contact:"98765432"+(10+i),program:n[2],year:n[3],status:i===5?"Inactive":"Active",registered:"2026-08-01"})});
 for(var k=0;k<40;k++){var d=new Date();d.setDate(d.getDate()-k);if(d.getDay()===0)continue;
  D.students.forEach(function(s,j){if(s.status!=="Active"||(j*7+k*3)%9===0)return;if(k===0&&j>1)return;D.rows.push({date:iso(d),uid:s.uid,prn:s.prn,name:fn(s),time:"09:"+String(5+j*4+(k%7)).padStart(2,"0")+":10",status:"Present"})})}
 D.cards.push({uid:"9F3C21AA",first:todayStr()+" 09:41:02",last:todayStr()+" 09:41:02",taps:1});
})();
function demoScan(isNew){
 if(isNew){var u=Math.random().toString(16).slice(2,10).toUpperCase();D.cards.push({uid:u,first:todayStr()+" "+new Date().toTimeString().slice(0,8),last:"",taps:1});toast("Demo: new card tapped");}
 else{var f=D.students.filter(function(s){return s.status==="Active"&&!D.rows.some(function(r){return r.date===todayStr()&&r.uid===s.uid})})[0];
  if(!f)return toast("Demo: everyone is already marked");D.rows.push({date:todayStr(),uid:f.uid,prn:f.prn,name:fn(f),time:new Date().toTimeString().slice(0,8),status:"Present"});toast("Demo: "+fn(f)+" tapped in")}
 refresh()}
function demoApi(a,p){
 if(a==="login")return{ok:true};
 if(a==="getStudents")return{students:D.students.map(function(s){return Object.assign({},s)})};
 if(a==="getNewCards")return{cards:D.cards.slice()};
 if(a==="getAttendance")return{rows:D.rows.filter(function(r){return r.date>=p.from&&r.date<=p.to})};
 if(a==="changePassword")return{ok:true};
 if(a==="dismissCard"){D.cards=D.cards.filter(function(c){return c.uid!==p.uid});return{ok:true}}
 if(a==="saveStudent"){
  if(D.students.some(function(s){return s.prn===p.prn&&s.uid!==p.uid}))return{error:"This PRN belongs to another student."};
  var x=D.students.filter(function(s){return s.uid===p.uid})[0];
  if(p.mode==="add"){if(x)return{error:"This card is already assigned to a student."};D.students.push({uid:p.uid,prn:p.prn,first:p.first,last:p.last,contact:p.contact,program:p.program,year:p.year,status:"Active",registered:todayStr()});D.cards=D.cards.filter(function(c){return c.uid!==p.uid});return{ok:true}}
  if(!x)return{error:"Student not found."};["prn","first","last","contact","program","year","status"].forEach(function(k){x[k]=p[k]});return{ok:true}}
 if(a==="setAttendance"){var s=D.students.filter(function(s){return s.uid===p.uid})[0];D.rows=D.rows.filter(function(r){return!(r.date===p.date&&r.uid===p.uid)});if(p.present)D.rows.push({date:p.date,uid:s.uid,prn:s.prn,name:fn(s),time:"Manual",status:"Present"});return{ok:true}}
 return{error:"Unknown action"}}

/* ---------- API ---------- */
var API=(window.SMARTATTEND&&window.SMARTATTEND.API)||"/api/gas";
S.url=API;
var WRITES={saveStudent:1,dismissCard:1,setAttendance:1,changePassword:1};
var MSG={bad_backend:"The server did not return data. In Apps Script, deploy as a Web app with access set to “Anyone”, and use the URL that ends in /exec.",unreachable:"Could not reach Google Apps Script. Try again in a moment."};
function api(a,p){
 p=p||{};
 if(S.demo)return new Promise(function(r){setTimeout(function(){r(demoApi(a,p))},100)});
 var body=Object.assign({action:a,pwd:S.pwd},p),req;
 if(WRITES[a])req=fetch(API,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)});
 else{var q=Object.keys(body).map(function(k){return encodeURIComponent(k)+"="+encodeURIComponent(body[k])}).join("&");req=fetch(API+(API.indexOf("?")>-1?"&":"?")+q,{cache:"no-store"})}
 return req.catch(function(){throw new Error("The browser could not reach the backend ("+API.slice(0,32)+"…). If this is a direct Google URL, use /api/gas in config.js instead.")}).then(function(r){
  return r.json().catch(function(){return{error:"bad_backend"}}).then(function(j){
   if(j&&j.error==="unauthorized"){logout();throw new Error("Session expired. Sign in again.")}
   if(j&&MSG[j.error]){var m=MSG[j.error];if(j.preview!==undefined)m+=" [Google replied HTTP "+j.status+" from "+j.host+(j.path||"")+": "+(j.preview||"empty")+"]";throw new Error(m)}
   if(!r.ok)throw new Error((j&&j.error)||("Server error "+r.status));
   return j})})}

/* ---------- auth ---------- */
$("#lf").addEventListener("submit",function(e){e.preventDefault();
 var p=$("#lpwd").value;$("#lerr").textContent="";
 if(!p)return $("#lerr").textContent="Enter the admin password.";
 S.pwd=p;S.demo=false;$("#lerr").textContent="Checking…";$("#lbtn").disabled=true;
 api("login").then(function(j){$("#lbtn").disabled=false;if(j&&j.ok){store.sset("sa_pwd",p);enter()}else $("#lerr").textContent="Wrong password."})
 .catch(function(x){$("#lbtn").disabled=false;$("#lerr").textContent=x.message})});
$("#demoBtn").addEventListener("click",function(){S.demo=true;enter()});
function enter(){$("#login").classList.add("hide");$("#app").classList.remove("hide");route()}
function logout(){S.pwd="";S.demo=false;store.sdel("sa_pwd");stopTimers();closeModal();$("#app").classList.add("hide");$("#login").classList.remove("hide");$("#lpwd").value="";$("#lerr").textContent=""}
$("#logout").addEventListener("click",logout);

/* ---------- routing ---------- */
function stopTimers(){S.timers.forEach(clearInterval);S.timers=[]}
function every(f,ms){S.timers.push(setInterval(f,ms))}
var PAGES={dashboard:pgDash,students:pgStudents,calendar:pgCal,records:pgRecords,settings:pgSettings};
function route(){stopTimers();var p=(location.hash||"#dashboard").slice(1);if(!PAGES[p])p="dashboard";S.page=p;
 document.querySelectorAll("nav a").forEach(function(a){a.classList.toggle("on",a.dataset.p===p)});PAGES[p]();badge()}
function refresh(){if(S.page==="dashboard")loadDash();else route()}
window.addEventListener("hashchange",function(){if(!$("#app").classList.contains("hide"))route()});
function badge(){api("getNewCards").then(function(r){S.cards=r.cards||[];var b=$("#nb");b.textContent=S.cards.length;b.classList.toggle("hide",!S.cards.length)}).catch(function(){})}
function demoBar(){return S.demo?'<div class="demo"><span>Demo mode: sample data, nothing is saved.</span><div><button class="btn sm" id="sim1">Tap a registered card</button><button class="btn sm" id="sim2">Tap a new card</button></div></div>':""}
function bindSim(){if($("#sim1")){$("#sim1").onclick=function(){demoScan(false)};$("#sim2").onclick=function(){demoScan(true)}}}

/* ---------- dashboard ---------- */
function pgDash(){
 $("#main").innerHTML=demoBar()+'<div class="top"><div><h2>Today</h2><div class="sub">'+new Date().toDateString()+'</div></div><button class="btn ghost" id="sheetBtn">Open Google Sheet</button></div><div id="nc"></div>'+
 '<div class="stats"><div class="stat p"><b id="sP">–</b><span>Present</span></div><div class="stat a"><b id="sA">–</b><span>Absent</span></div><div class="stat"><b id="sT">–</b><span>Active students</span></div></div>'+
 '<div class="grid2"><div class="panel"><div class="live"><span class="ring off" id="ring"></span><span id="lastScan">Waiting for the first scan today…</span></div><ul class="feed" id="feed"></ul></div>'+
 '<div class="panel"><h3>Not yet in</h3><ul class="feed" id="abs"></ul></div></div>';
 bindSim();$("#sheetBtn").onclick=function(){var u=sheetUrl();if(S.demo)return toast("Demo mode has no Google Sheet.");if(!u){toast("Add the Sheet link in Settings first.");location.hash="#settings";return}window.open(u,"_blank","noopener")};
 loadDash();every(loadDash,5000)}
function loadDash(){
 var t=todayStr();
 Promise.all([api("getStudents"),api("getAttendance",{from:t,to:t}),api("getNewCards")]).then(function(r){
  if(S.page!=="dashboard")return;
  S.students=r[0].students||[];S.cards=r[2].cards||[];
  var act=S.students.filter(function(u){return u.status==="Active"}),rows=(r[1].rows||[]).slice().sort(function(a,b){return a.time<b.time?1:-1}),seen={};
  rows.forEach(function(x){seen[x.uid]=1});var ab=act.filter(function(u){return!seen[u.uid]});
  $("#sP").textContent=rows.length;$("#sA").textContent=ab.length;$("#sT").textContent=act.length;
  var b=$("#nb");b.textContent=S.cards.length;b.classList.toggle("hide",!S.cards.length);
  $("#nc").innerHTML=S.cards.length?'<div class="panel nc"><h3>'+S.cards.length+' new card'+(S.cards.length>1?"s":"")+' waiting to be assigned</h3><ul class="feed">'+S.cards.map(function(c){return'<li><span><code>'+esc(c.uid)+'</code><br><small>Tapped '+esc(c.taps)+'× · last '+esc(c.last||c.first)+'</small></span><span><button class="btn sm" data-a="'+esc(c.uid)+'">Assign student</button> <button class="btn ghost sm" data-x="'+esc(c.uid)+'">Dismiss</button></span></li>'}).join("")+'</ul></div>':"";
  document.querySelectorAll("#nc [data-a]").forEach(function(x){x.onclick=function(){stuForm({uid:x.dataset.a},false)}});
  document.querySelectorAll("#nc [data-x]").forEach(function(x){x.onclick=function(){api("dismissCard",{uid:x.dataset.x}).then(function(){toast("Card dismissed");loadDash()}).catch(fail)}});
  var key=rows.length?rows[0].uid+rows[0].time:"",isNew=key&&S.lastKey&&key!==S.lastKey;S.lastKey=key||S.lastKey;
  $("#feed").innerHTML=rows.length?rows.slice(0,12).map(function(x,i){return'<li'+(i===0&&isNew?' class="new"':'')+'><span class="av-row">'+av(x.name)+'<span><b>'+esc(x.name)+'</b><br><small>PRN '+esc(x.prn)+'</small></span></span><span style="text-align:right">'+esc(x.time)+'<br><span class="tag">'+esc(x.status||"Present")+'</span></span></li>'}).join(""):'<li class="empty" style="display:block">No scans yet today. Tap a card on the reader.</li>';
  $("#abs").innerHTML=ab.length?ab.map(function(u){return'<li><span>'+esc(fn(u))+'<br><small>'+esc(u.program)+'</small></span><span class="tag bad">Absent</span></li>'}).join(""):'<li class="empty" style="display:block">Everyone is in.</li>';
  if(rows.length){var p=rows[0].time.split(":"),d=new Date();d.setHours(+p[0],+p[1],+p[2]||0);$("#lastScan").textContent="Last scan: "+rows[0].name+" at "+rows[0].time.slice(0,5);$("#ring").classList.toggle("off",(new Date()-d)/6e4>30)}
 }).catch(fail)}

/* ---------- students ---------- */
function pgStudents(){
 $("#main").innerHTML=demoBar()+'<div class="top"><h2>Students</h2><button class="btn" id="addS">Add student</button></div><div class="panel"><div class="filters"><div style="flex:2"><label for="q">Search</label><input id="q" placeholder="Name, PRN, contact or card UID"></div><div><label for="fp">Program</label><select id="fp"><option value="">All programs</option></select></div></div>'+
 '<div class="tw"><table><thead><tr><th>Student</th><th>Program</th><th>Contact</th><th>Card UID</th><th>Attendance, 30 days</th><th>Status</th></tr></thead><tbody id="sb"><tr><td colspan="6" class="empty">Loading…</td></tr></tbody></table></div></div>';
 bindSim();$("#addS").onclick=function(){stuForm({},false)};
 var w=new Date();w.setDate(w.getDate()-29);
 Promise.all([api("getStudents"),api("getAttendance",{from:iso(w),to:todayStr()})]).then(function(r){
  S.students=r[0].students||[];var days={},per={};
  (r[1].rows||[]).forEach(function(x){days[x.date]=1;per[x.uid]=(per[x.uid]||0)+1});S.pct={};var nd=Object.keys(days).length;
  S.students.forEach(function(s){S.pct[s.uid]=pct(per[s.uid]||0,nd)});
  var progs=[];S.students.forEach(function(s){if(s.program&&progs.indexOf(s.program)<0)progs.push(s.program)});
  $("#fp").innerHTML='<option value="">All programs</option>'+progs.sort().map(function(p){return'<option>'+esc(p)+'</option>'}).join("");
  $("#q").oninput=drawStu;$("#fp").onchange=drawStu;drawStu()}).catch(fail)}
function drawStu(){
 var q=$("#q").value.trim().toLowerCase(),fp=$("#fp").value;
 var L=S.students.filter(function(s){return(!fp||s.program===fp)&&(!q||[fn(s),s.prn,s.contact,s.uid].join(" ").toLowerCase().indexOf(q)>-1)});
 $("#sb").innerHTML=L.length?L.map(function(s){var p=S.pct[s.uid]||0;return'<tr class="click" data-u="'+esc(s.uid)+'"><td><div class="av-row">'+av(fn(s))+'<span><b>'+esc(fn(s))+'</b><br><small>PRN '+esc(s.prn)+'</small></span></div></td><td>'+esc(s.program)+'<br><small>'+esc(s.year)+'</small></td><td>'+esc(s.contact)+'</td><td><code>'+esc(s.uid)+'</code></td><td><span class="bar"><i style="width:'+p+'%"></i></span>'+p+'%</td><td><span class="tag '+(s.status==="Active"?"":"mut")+'">'+esc(s.status)+'</span></td></tr>'}).join(""):'<tr><td colspan="6" class="empty">'+(S.students.length?"No students match your search.":"No students yet. Tap a new card on the reader, then assign it from the Dashboard, or choose Add student.")+'</td></tr>';
 document.querySelectorAll("#sb tr.click").forEach(function(r){r.onclick=function(){stuForm(S.students.filter(function(s){return s.uid===r.dataset.u})[0],true)}})}
function closeModal(){var m=$("#modal");m.classList.add("hide");m.innerHTML=""}
function fld(id,l,v,a){return'<label for="'+id+'">'+l+'</label><input id="'+id+'" value="'+esc(v)+'" '+(a||"")+'>'}
function stuForm(s,edit){
 var m=$("#modal"),yrs=["First Year","Second Year","Third Year","Final Year"],progs=["B.Tech","BCA","MCA","MBA","B.Sc","B.Com"];
 S.students.forEach(function(x){if(x.program&&progs.indexOf(x.program)<0)progs.push(x.program)});
 m.classList.remove("hide");
 m.innerHTML='<form class="mbox" id="sf"><h3>'+(edit?"Edit student":"Assign student")+'</h3><div class="sub">'+(edit?"Update details. Changes save to the Google Sheet.":(s.uid?"This card was tapped on the reader. Add the student who owns it.":"Enter the card UID, or tap the card first and assign it from the Dashboard."))+'</div>'+
 fld("fu","Card UID",s.uid||"",'required'+((edit||s.uid)?" readonly":""))+
 fld("fp2","PRN",s.prn||"","required")+
 '<div class="row"><div>'+fld("ff","First name",s.first||"","required")+'</div><div>'+fld("fl","Last name",s.last||"","required")+'</div></div>'+
 '<div class="row"><div>'+fld("fc","Contact number",s.contact||"",'inputmode="tel" placeholder="10 digits"')+'</div><div><label for="fy">Year</label><select id="fy">'+yrs.map(function(y){return'<option'+(s.year===y?" selected":"")+'>'+y+'</option>'}).join("")+'</select></div></div>'+
 fld("fpr","Program",s.program||"",'list="pl" placeholder="e.g. B.Tech"')+'<datalist id="pl">'+progs.map(function(p){return'<option value="'+esc(p)+'">'}).join("")+'</datalist>'+
 (edit?'<label for="fs">Status</label><select id="fs"><option'+(s.status==="Active"?" selected":"")+'>Active</option><option'+(s.status!=="Active"?" selected":"")+'>Inactive</option></select>':"")+
 '<div class="hint" id="eh"></div><div class="acts"><button type="button" class="btn ghost" id="cx">Cancel</button><button class="btn" type="submit">'+(edit?"Save changes":"Assign student")+'</button></div></form>';
 $("#cx").onclick=closeModal;m.onmousedown=function(e){if(e.target===m)closeModal()};
 (s.uid?$("#fp2"):$("#fu")).focus();
 $("#sf").onsubmit=function(e){e.preventDefault();
  var uid=$("#fu").value.trim().toUpperCase().replace(/[^0-9A-F]/g,""),ct=$("#fc").value.replace(/[\s-]/g,"").replace(/^\+?91(?=\d{10}$)/,"");
  if(!uid)return $("#eh").textContent="Enter the card UID using digits and letters A–F only.";
  if(ct&&!/^\d{10}$/.test(ct))return $("#eh").textContent="Contact number must be 10 digits.";
  var btn=$("#sf button[type=submit]");btn.disabled=true;
  api("saveStudent",{mode:edit?"edit":"add",uid:uid,prn:$("#fp2").value.trim(),first:$("#ff").value.trim(),last:$("#fl").value.trim(),contact:ct,program:$("#fpr").value.trim(),year:$("#fy").value,status:edit?$("#fs").value:"Active"})
  .then(function(r){btn.disabled=false;if(r.error)return $("#eh").textContent=r.error;closeModal();toast(edit?"Changes saved":"Student assigned");refresh();badge()}).catch(function(x){btn.disabled=false;fail(x)})}}

/* ---------- calendar ---------- */
var C={y:new Date().getFullYear(),m:new Date().getMonth(),sel:todayStr(),rows:[]};
var MN=["January","February","March","April","May","June","July","August","September","October","November","December"];
function pgCal(){
 $("#main").innerHTML=demoBar()+'<div class="top"><h2>Calendar</h2><div class="cnav"><button class="btn ghost sm" id="cp" aria-label="Previous month">‹</button><b id="cm"></b><button class="btn ghost sm" id="cn" aria-label="Next month">›</button><button class="btn ghost sm" id="ct">Today</button></div></div><div class="gc"><div class="panel"><div class="cal" id="cal"></div></div><div class="panel" id="day"></div></div>';
 bindSim();
 $("#cp").onclick=function(){C.m--;if(C.m<0){C.m=11;C.y--}loadCal()};$("#cn").onclick=function(){C.m++;if(C.m>11){C.m=0;C.y++}loadCal()};
 $("#ct").onclick=function(){var d=new Date();C.y=d.getFullYear();C.m=d.getMonth();C.sel=todayStr();loadCal()};loadCal()}
function loadCal(){
 var a=iso(new Date(C.y,C.m,1)),b=iso(new Date(C.y,C.m+1,0));
 Promise.all([api("getStudents"),api("getAttendance",{from:a,to:b})]).then(function(r){if(S.page!=="calendar")return;S.students=r[0].students||[];C.rows=r[1].rows||[];drawCal();drawDay()}).catch(fail)}
function dayInfo(dt){var pr={};C.rows.forEach(function(r){if(r.date===dt)pr[r.uid]=r});var act=S.students.filter(function(s){return s.status==="Active"&&s.registered<=dt});var p=Object.keys(pr).length;return{pr:pr,act:act,p:p,t:Math.max(act.length,p)}}
function drawCal(){
 $("#cm").textContent=MN[C.m]+" "+C.y;
 var h="",first=new Date(C.y,C.m,1).getDay(),n=new Date(C.y,C.m+1,0).getDate(),td=todayStr();
 ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(function(d){h+='<div class="dh">'+d+'</div>'});
 for(var i=0;i<first;i++)h+='<button class="blank" tabindex="-1" disabled></button>';
 for(var d=1;d<=n;d++){var dt=iso(new Date(C.y,C.m,d)),fut=dt>td,x=dayInfo(dt);
  h+='<button data-d="'+dt+'" class="'+(dt===C.sel?"sel ":"")+(dt===td?"today ":"")+(fut?"fut ":"")+(fut||!x.t?"":(pct(x.p,x.t)>=75?"hi":pct(x.p,x.t)>=40?"mid":"lo"))+'"><b>'+d+'</b>'+(fut||!x.t?"<span>&nbsp;</span>":'<span>'+x.p+' / '+x.t+'</span><span class="bar"><i style="width:'+pct(x.p,x.t)+'%"></i></span>')+'</button>'}
 $("#cal").innerHTML=h;
 document.querySelectorAll("#cal button[data-d]").forEach(function(b){b.onclick=function(){C.sel=b.dataset.d;drawCal();drawDay()}})}
function drawDay(){
 var dt=C.sel,x=dayInfo(dt),el=$("#day"),dd=new Date(dt+"T00:00:00");
 var h='<h3>'+dd.toDateString()+'</h3>';
 if(dt>todayStr()){el.innerHTML=h+'<div class="empty">This day hasn’t happened yet.</div>';return}
 var pl=Object.keys(x.pr).map(function(k){return x.pr[k]}).sort(function(a,b){return a.time<b.time?-1:1});
 var abs=x.act.filter(function(s){return!x.pr[s.uid]});
 h+='<div class="sub" style="margin-bottom:8px">'+x.p+' present · '+abs.length+' absent</div><b>Present</b>';
 h+=pl.length?pl.map(function(r){return'<div class="dayl"><span>'+esc(r.name)+'<br><small>'+esc(r.time==="Manual"?"Marked by admin":r.time)+'</small></span><button class="btn ghost sm" data-u="'+esc(r.uid)+'" data-p="0">Mark absent</button></div>'}).join(""):'<div class="sub" style="padding:8px 0">No one has scanned in.</div>';
 h+='<div style="margin-top:14px"><b>Absent</b></div>';
 h+=abs.length?abs.map(function(s){return'<div class="dayl"><span>'+esc(fn(s))+'<br><small>'+esc(s.program)+'</small></span><button class="btn sm" data-u="'+esc(s.uid)+'" data-p="1">Mark present</button></div>'}).join(""):'<div class="sub" style="padding:8px 0">Nobody is absent.</div>';
 el.innerHTML=h;
 el.querySelectorAll("button[data-u]").forEach(function(b){b.onclick=function(){b.disabled=true;api("setAttendance",{uid:b.dataset.u,date:dt,present:b.dataset.p==="1"}).then(function(){toast("Attendance updated");loadCal()}).catch(function(e){b.disabled=false;fail(e)})}})}

/* ---------- records ---------- */
var CUR=[];
function pgRecords(){
 var w=new Date();w.setDate(w.getDate()-6);
 $("#main").innerHTML=demoBar()+'<div class="top"><h2>Records</h2><button class="btn ghost" id="csv">Export CSV</button></div><div class="panel"><div class="filters">'+
 '<div><label for="rf">From</label><input type="date" id="rf" value="'+iso(w)+'"></div><div><label for="rt">To</label><input type="date" id="rt" value="'+todayStr()+'"></div>'+
 '<div><label for="rp">Student</label><select id="rp"><option value="">Everyone</option></select></div><div><label for="rv">Show</label><select id="rv"><option value="p">Present</option><option value="a">Absent</option></select></div></div>'+
 '<div class="tw"><table><thead><tr><th>Date</th><th>Student</th><th>PRN</th><th>Program</th><th>Time</th><th>Status</th></tr></thead><tbody id="rb"></tbody></table></div></div>';
 bindSim();
 api("getStudents").then(function(r){S.students=r.students||[];$("#rp").innerHTML='<option value="">Everyone</option>'+S.students.map(function(u){return'<option value="'+esc(u.uid)+'">'+esc(fn(u))+'</option>'}).join("");loadRecs()}).catch(fail);
 ["rf","rt","rp","rv"].forEach(function(id){$("#"+id).onchange=loadRecs});$("#csv").onclick=exportCsv}
function loadRecs(){
 var f=$("#rf").value,t=$("#rt").value,pu=$("#rp").value,v=$("#rv").value;
 if(!f||!t||f>t)return toast("Choose a valid date range.");
 var by={};S.students.forEach(function(s){by[s.uid]=s});
 api("getAttendance",{from:f,to:t}).then(function(r){var rows=r.rows||[];
  if(v==="p")CUR=rows.filter(function(x){return!pu||x.uid===pu}).map(function(x){return{date:x.date,name:x.name,prn:x.prn,program:by[x.uid]?by[x.uid].program:"",time:x.time,status:"Present"}}).sort(function(a,b){return a.date===b.date?(a.time<b.time?1:-1):(a.date<b.date?1:-1)});
  else{CUR=[];var days=[],d=new Date(f+"T00:00:00"),seen={};while(iso(d)<=t&&days.length<92){days.push(iso(d));d.setDate(d.getDate()+1)}
   rows.forEach(function(x){seen[x.date+"|"+x.uid]=1});
   days.reverse().forEach(function(dt){S.students.forEach(function(s){if(s.status!=="Active"||(pu&&s.uid!==pu)||s.registered>dt)return;if(!seen[dt+"|"+s.uid])CUR.push({date:dt,name:fn(s),prn:s.prn,program:s.program,time:"–",status:"Absent"})})})}
  $("#rb").innerHTML=CUR.length?CUR.map(function(x){return'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.prn)+'</td><td>'+esc(x.program)+'</td><td>'+esc(x.time)+'</td><td><span class="tag '+(x.status==="Absent"?"bad":"")+'">'+x.status+'</span></td></tr>'}).join(""):'<tr><td colspan="6" class="empty">No records match these filters.</td></tr>'}).catch(fail)}
function exportCsv(){
 if(!CUR.length)return toast("Nothing to export for these filters.");
 var q=function(s){s=String(s==null?"":s);return/^[=+\-@]/.test(s)?"'"+s:s};
 var csv=["Date,Student,PRN,Program,Time,Status"].concat(CUR.map(function(x){return[x.date,x.name,x.prn,x.program,x.time,x.status].map(function(c){return'"'+q(c).replace(/"/g,'""')+'"'}).join(",")})).join("\r\n");
 var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="attendance_"+$("#rf").value+"_to_"+$("#rt").value+".csv";document.body.appendChild(a);a.click();a.remove();toast("CSV exported")}

/* ---------- settings ---------- */
function pgSettings(){
 $("#main").innerHTML='<div class="top"><h2>Settings</h2></div><div class="panel" style="max-width:560px"><label for="su">Google Sheet link</label><input id="su" type="url" placeholder="https://docs.google.com/spreadsheets/d/…" value="'+esc(sheetUrl())+'"><div class="sub" style="margin-top:6px">Used by the Open Google Sheet button on the dashboard.</div>'+
 '<label for="sa">Backend</label><input id="sa" readonly value="'+esc(S.demo?"Demo mode":S.url)+'">'+
 '<label for="sth">Theme</label><select id="sth"><option value="auto">Match my device</option><option value="light">Light</option><option value="dark">Dark</option></select>'+
 '<div class="acts"><button class="btn" id="ss">Save settings</button></div></div>';
 $("#sth").value=store.get("sa_theme")||"auto";
 $("#main").insertAdjacentHTML("beforeend",'<div class="panel" style="max-width:560px"><h3>Change password</h3>'+pw("cp0","Current password","current-password")+pw("cp1","New password (at least 6 characters)","new-password")+pw("cp2","Confirm new password","new-password")+'<div class="hint" id="cph"></div><div class="acts"><button class="btn" id="cps">Update password</button></div></div>');
 $("#cps").onclick=function(){var c=$("#cp0").value,n=$("#cp1").value,m=$("#cp2").value,h=$("#cph");h.textContent="";
  if(!c||!n||!m)return h.textContent="Fill in all three fields.";
  if(n.length<6)return h.textContent="New password must be at least 6 characters.";
  if(n!==m)return h.textContent="The new passwords do not match.";
  if(n===c)return h.textContent="Choose a password different from the current one.";
  if(S.demo)return toast("Demo mode: password not changed.");
  if(c!==S.pwd)return h.textContent="Current password is incorrect.";
  var b=$("#cps");b.disabled=true;
  api("changePassword",{newPwd:n}).then(function(r){b.disabled=false;
   if(r.error)return h.textContent=r.error==="unknown action"?"Update Code.gs in Apps Script and deploy a new version first.":r.error;
   S.pwd=n;store.sset("sa_pwd",n);["cp0","cp1","cp2"].forEach(function(id){$("#"+id).value=""});toast("Password updated")}).catch(function(x){b.disabled=false;fail(x)})};
 $("#ss").onclick=function(){var s=$("#su").value.trim();if(s&&!/^https:\/\/docs\.google\.com\/spreadsheets\//.test(s))return toast("Paste a link that starts with docs.google.com/spreadsheets.");store.set("sa_sheet",s);store.set("sa_theme",$("#sth").value);applyTheme();toast("Settings saved")}}
function applyTheme(){var t=store.get("sa_theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);else document.documentElement.removeAttribute("data-theme")}
applyTheme();
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("#modal").classList.contains("hide"))closeModal()});
(function(){var p=store.sget("sa_pwd");if(p){S.pwd=p;enter()}})();
})();
