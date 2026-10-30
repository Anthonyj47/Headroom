var CATS=[["Housing","#4e79a7"],["Food","#f28e2b"],["Transport","#59a14f"],["Bills","#b07aa1"],["Fun","#e15759"],["Health","#76b7b2"],["Other","#9c9c94"]];
var CURS=[["USD","US dollar"],["EUR","Euro"],["GBP","British pound"],["ZAR","South African rand"],["NGN","Nigerian naira"],["KES","Kenyan shilling"],["GHS","Ghanaian cedi"],["INR","Indian rupee"],["AUD","Australian dollar"],["CAD","Canadian dollar"],["NZD","New Zealand dollar"],["JPY","Japanese yen"],["CNY","Chinese yuan"],["BRL","Brazilian real"],["MXN","Mexican peso"],["AED","UAE dirham"]];
var KEY="budget-planner-v2";
var $=function(id){return document.getElementById(id)};
function pad(n){return String(n).padStart(2,"0")}
function iso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function ym(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)}
function shift(m,n){var p=m.split("-");return ym(new Date(+p[0],+p[1]-1+n,1))}
function mlabel(m){var p=m.split("-");return new Date(+p[0],+p[1]-1,1).toLocaleDateString(undefined,{month:"long",year:"numeric"})}
function addDays(d,n){var p=d.split("-");return iso(new Date(+p[0],+p[1]-1,+p[2]+n))}
function startOf(k){return state.starts[k]||k+"-"+pad(state.payday)}
function endOf(k){return addDays(startOf(shift(k,1)),-1)}
function inPeriod(d,k){return d>=startOf(k)&&d<startOf(shift(k,1))}
function periodOf(d){var k=d.slice(0,7),g=0;while(d<startOf(k)&&g++<14)k=shift(k,-1);while(d>=startOf(shift(k,1))&&g++<28)k=shift(k,1);return k}
function plabel(k){
  if(state.payday===1&&!state.starts[k]&&!state.starts[shift(k,1)])return mlabel(k);
  var s=startOf(k),e=endOf(k);return dlabel(s)+" to "+dlabel(e)+" "+e.slice(0,4);
}
function dayIn(day,k){
  var s=startOf(k),e=endOf(k),p=s.split("-"),y=+p[0],m=+p[1]-1,c=[];
  for(var i=0;i<2;i++){var last=new Date(y,m+i+1,0).getDate();c.push(iso(new Date(y,m+i,Math.min(day,last))))}
  for(var j=0;j<2;j++)if(c[j]>=s&&c[j]<=e)return c[j];
  return c[0]<s?c[1]:c[0];
}
function billDue(b,k){return !b.date?"":(b.repeat?dayIn(+b.date.slice(8,10),k):b.date)}
function billShown(b,k){return !b.date||(b.repeat?endOf(k)>=b.date:inPeriod(b.date,k))}
function dlabel(s){var p=s.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString(undefined,{day:"numeric",month:"short"})}

var state={currency:"USD",month:ym(new Date()),incomes:{},limits:{},expenses:[]};
try{
  var s=localStorage.getItem(KEY);
  if(s){var p=JSON.parse(s);if(p&&Array.isArray(p.expenses)){state=p;}}
  else{
    var o=localStorage.getItem("budget-planner-v1");
    if(o){var q=JSON.parse(o),t=iso(new Date());
      state.incomes[state.month]=q.income||0;
      state.currency={"R":"ZAR","€":"EUR","£":"GBP"}[q.symbol]||"USD";
      state.expenses=(q.expenses||[]).map(function(e){return{id:e.id,desc:e.desc,amount:e.amount,cat:e.cat,date:t}});
    }
  }
}catch(e){}
state.incomes=state.incomes||{};state.limits=state.limits||{};state.month=ym(new Date());
if(Array.isArray(state.cats)&&state.cats.length)CATS=state.cats.filter(function(c){return Array.isArray(c)&&typeof c[0]==="string"&&typeof c[1]==="string"});
if(!CATS.some(function(c){return c[0]==="Other"}))CATS.push(["Other","#9c9c94"]);
state.cats=CATS;
state.expenses.forEach(function(e){if(e.type!=="in"&&!CATS.some(function(c){return c[0]===e.cat}))e.cat="Other"});
Object.keys(state.incomes).forEach(function(m){var v=state.incomes[m];if(v>0)state.expenses.push({id:Date.now()+Math.random(),desc:"Income",amount:v,type:"in",cat:"",date:m+"-01"})});
state.incomes={};
if(!Array.isArray(state.bills))state.bills=[];
state.bills.forEach(function(b){if(b.note===undefined){b.note=b.day?"Due on the "+ord(b.day):"";delete b.day}});
if(!state.budgets||typeof state.budgets!=="object")state.budgets={};
if(typeof state.payday!=="number"||!(state.payday>=1&&state.payday<=28))state.payday=1;
if(!state.starts||typeof state.starts!=="object")state.starts={};
state.month=periodOf(iso(new Date()));
state.bills.forEach(function(b){
  if(b.repeat!==undefined)return;
  b.repeat=true;b.date="";
  var m=/^Due on the (\d{1,2})(?:st|nd|rd|th)$/.exec(b.note||"");
  if(m){b.date=dayIn(+m[1],state.month);b.note=""}
});
if(!state.paid||typeof state.paid!=="object")state.paid={};
var editing=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function money(n){try{return new Intl.NumberFormat(undefined,{style:"currency",currency:state.currency}).format(n)}catch(e){return Number(n).toFixed(2)}}
function colorOf(c){for(var i=0;i<CATS.length;i++)if(CATS[i][0]===c)return CATS[i][1];return "#9c9c94"}
function fillCats(sel,val){sel.textContent="";CATS.forEach(function(c){var o=document.createElement("option");o.textContent=c[0];sel.appendChild(o)});if(val)sel.value=val}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}

CURS.forEach(function(c){var o=el("option","",c[0]+" – "+c[1]);o.value=c[0];$("cur").appendChild(o)});
$("cur").value=state.currency;
refreshCats();

function render(){
  $("mlabel").textContent=plabel(state.month);
  if(document.activeElement!==$("payday"))$("payday").value=state.payday;
  if(document.activeElement!==$("p-start"))$("p-start").value=startOf(state.month);
  if(document.activeElement!==$("p-end"))$("p-end").value=endOf(state.month);
  renderBills();
  var all=state.expenses.filter(function(e){return inPeriod(e.date,state.month)});
  var exps=all.filter(function(e){return e.type!=="in"});
  var income=budgetFor(state.month);
  if(document.activeElement!==$("budget"))$("budget").value=income||"";
  var spent=exps.reduce(function(s,e){return s+e.amount},0);
  var billsTotal=state.bills.filter(function(b){return billShown(b,state.month)}).reduce(function(s,b){return s+b.amount},0);
  var total=spent+billsTotal;
  var left=income-total;
  $("spent").textContent=money(total);
  $("left").textContent=money(left);
  $("left").className="big "+(left<0?"bad":"good");
  $("bar").className="bar"+(total>income?" over":"");
  $("bar").firstElementChild.style.width=(income>0?Math.min(100,total/income*100):(total>0?100:0))+"%";
  var incl=billsTotal>0?", including "+money(billsTotal)+" of bills":"";
  $("barText").textContent=income>0?(total>income?"You\u2019re over budget by "+money(total-income):Math.round(total/income*100)+"% of your budget spent")+incl:"Enter your budget to see progress";

  var totals={};exps.forEach(function(e){totals[e.cat]=(totals[e.cat]||0)+e.amount});

  var acc=0,stops=[];
  CATS.forEach(function(c){var v=totals[c[0]]||0;if(v>0){var a=acc/spent*100;acc+=v;stops.push(c[1]+" "+a+"% "+(acc/spent*100)+"%")}});
  $("donut").style.background=stops.length?"conic-gradient("+stops.join(",")+")":"var(--line)";
  $("hole").textContent=stops.length?money(spent):"No spending";

  var cats=$("cats");cats.textContent="";
  CATS.forEach(function(c){
    var name=c[0],t=totals[name]||0,lim=state.limits[name]||0,over=lim>0&&t>lim;
    var d=el("div","cat"),r=el("div","row");
    var dot=el("span","dot");dot.style.background=c[1];
    var li=el("input","lim");li.type="number";li.min="0";li.step="any";li.placeholder="Limit";li.value=lim||"";li.setAttribute("aria-label",name+" limit");
    li.onchange=function(){var v=parseFloat(li.value);if(v>0)state.limits[name]=v;else delete state.limits[name];save();render()};
    r.appendChild(dot);r.appendChild(el("span","nm",name));r.appendChild(el("span","",money(t)));r.appendChild(li);
    var tr=el("div","track"),f=el("div");
    f.style.background=over?"var(--bad)":c[1];
    f.style.width=(lim>0?Math.min(100,t/lim*100):(spent>0?t/spent*100:0))+"%";
    tr.appendChild(f);d.appendChild(r);d.appendChild(tr);
    if(over)d.appendChild(el("div","note","Over limit by "+money(t-lim)));
    cats.appendChild(d);
  });

  var list=$("list");list.textContent="";
  if(!exps.length)list.appendChild(el("div","empty","No expenses this month. Add one above."));
  exps.slice().sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:b.id-a.id}).forEach(function(e){
    list.appendChild(editing===e.id?editRow(e):viewRow(e));
  });
}

function viewRow(e){
  var row=el("div","item");
  var isIn=e.type==="in";
  var dot=el("span","dot");dot.style.background=isIn?"var(--accent)":colorOf(e.cat);
  var nm=el("div","name",e.desc);nm.appendChild(el("div","meta",(isIn?"Money in":e.cat)+" · "+dlabel(e.date)));
  var ed=el("button","x","✎");ed.setAttribute("aria-label","Edit");ed.onclick=function(){editing=e.id;render()};
  var x=el("button","x","×");x.setAttribute("aria-label","Delete");
  x.onclick=function(){state.expenses=state.expenses.filter(function(i){return i.id!==e.id});save();render()};
  var am=el("strong",isIn?"good":"",(isIn?"+":"−")+money(e.amount));
  row.appendChild(dot);row.appendChild(nm);row.appendChild(am);row.appendChild(ed);row.appendChild(x);
  return row;
}

function editRow(e){
  var row=el("div","edit");
  var d=el("input");d.type="text";d.value=e.desc;d.maxLength=60;
  var a=el("input");a.type="number";a.step="any";a.min="0";a.value=e.amount;
  var c=el("select");fillCats(c,e.cat);
  var dt=el("input");dt.type="date";dt.value=e.date;
  var acts=el("div","acts"),cancel=el("button","ghost","Cancel"),ok=el("button","","Save");
  cancel.onclick=function(){editing=null;render()};
  ok.onclick=function(){
    var v=parseFloat(a.value);
    if(!(v>0)||!d.value.trim()||!dt.value)return;
    e.desc=d.value.trim();e.amount=v;if(e.type!=="in")e.cat=c.value;e.date=dt.value;
    state.month=periodOf(e.date);editing=null;save();render();
  };
  acts.appendChild(cancel);acts.appendChild(ok);
  (e.type==="in"?[d,a,dt,acts]:[d,a,c,dt,acts]).forEach(function(n){row.appendChild(n)});
  return row;
}

$("cur").onchange=function(){state.currency=this.value;save();render()};

$("prev").onclick=function(){state.month=shift(state.month,-1);editing=null;render();setDate()};
$("next").onclick=function(){state.month=shift(state.month,1);editing=null;render();setDate()};
function setDate(){var t=iso(new Date());$("date").value=inPeriod(t,state.month)?t:startOf(state.month)}
$("form").onsubmit=function(ev){
  ev.preventDefault();
  var amt=parseFloat($("amt").value);
  if(!(amt>0)||!$("date").value)return;
  state.expenses.push({id:Date.now()+Math.random(),desc:$("desc").value.trim(),amount:amt,type:kind,cat:kind==="in"?"":$("cat").value,date:$("date").value});
  state.month=periodOf($("date").value);
  $("desc").value="";$("amt").value="";$("desc").focus();
  save();render();
};
function wireClear(id,label,pick){
  var b=$(id),t=null;
  b.onclick=function(){
    var n=state.expenses.filter(pick).length;
    if(!n){b.textContent="Nothing to clear";setTimeout(function(){b.textContent=label},1500);return}
    if(!t){b.textContent="Tap again to delete "+n;t=setTimeout(function(){t=null;b.textContent=label},4000);return}
    clearTimeout(t);t=null;b.textContent=label;
    state.expenses=state.expenses.filter(function(e){return !pick(e)});
    editing=null;save();render();
  };
}
function isOut(e){return e.type!=="in"}
wireClear("reset","Clear all expenses",isOut);
/* ---- Budget ---- */
function budgetFor(m){
  var b=state.budgets;
  if(b[m]!==undefined)return b[m];
  var ks=Object.keys(b).filter(function(k){return k<m&&b[k]>0}).sort();
  return ks.length?b[ks[ks.length-1]]:0;
}
$("budget").oninput=function(){state.budgets[state.month]=parseFloat(this.value)||0;save();render()};
/* ---- Payday ---- */
function pmsg(t){$("p-msg").textContent=t}
$("payday").onchange=function(){
  var v=parseInt(this.value,10);
  if(!(v>=1&&v<=28)){this.value=state.payday;pmsg("Choose a day from 1 to 28.");return}
  state.payday=v;state.month=periodOf(iso(new Date()));save();render();setDate();pmsg("Payday set to day "+v+".");
};
$("p-save").onclick=function(){
  var a=$("p-start").value,b=$("p-end").value;
  if(!a||!b||a>b){pmsg("Pick a start date and an end date, with the start first.");return}
  var k=state.month,k1=shift(k,1),old0=state.starts[k],old1=state.starts[k1];
  state.starts[k]=a;state.starts[k1]=addDays(b,1);
  if(!(startOf(shift(k,-1))<a&&state.starts[k1]<startOf(shift(k,2)))){
    if(old0===undefined)delete state.starts[k];else state.starts[k]=old0;
    if(old1===undefined)delete state.starts[k1];else state.starts[k1]=old1;
    pmsg("Those dates run into the neighbouring months. Try dates closer to your payday.");return;
  }
  save();render();setDate();pmsg("Dates saved.");
};
$("p-reset").onclick=function(){delete state.starts[state.month];delete state.starts[shift(state.month,1)];save();render();setDate();pmsg("Back to your usual payday.")};
/* ---- Bills checklist ---- */
var billArm=null;
function ord(n){var s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])}
function renderBills(){
  var box=$("bills");box.textContent="";
  var paid=state.paid[state.month]||{};
  var total=0,done=0;
  var today=iso(new Date()),past=endOf(state.month)<today;
  var list=state.bills.filter(function(b){return billShown(b,state.month)}).sort(function(a,b){var x=billDue(a,state.month)||"9999",y=billDue(b,state.month)||"9999";return x<y?-1:x>y?1:0});
  if(!list.length)box.appendChild(el("div","empty","No bills for this budget month. Add one below."));
  list.forEach(function(b){
    var ok=!!paid[b.id];total+=b.amount;if(ok)done+=b.amount;
    var row=el("div","bill"+(ok?" paid":"")),cb=el("input");
    cb.type="checkbox";cb.checked=ok;cb.setAttribute("aria-label","Paid: "+b.name);
    cb.onchange=function(){
      var m=state.paid[state.month]||(state.paid[state.month]={});
      if(cb.checked)m[b.id]=true;else delete m[b.id];
      save();render();
    };
    var nm=el("div","name",b.name),due=billDue(b,state.month);
    if(due){var md=el("div","meta","Due "+dlabel(due));
      if(!ok&&(past||due<today)){md.textContent+=past?" \u00b7 not marked paid":" \u00b7 overdue";md.className="meta late"}
      nm.appendChild(md)}
    if(b.note)nm.appendChild(el("div","meta",b.note));
    var x=el("button","x","×");x.type="button";x.setAttribute("aria-label","Remove "+b.name);
    x.onclick=function(){
      if(billArm!==b.id){billArm=b.id;x.textContent="Remove?";setTimeout(function(){if(billArm===b.id){billArm=null;render()}},4000);return}
      billArm=null;
      state.bills=state.bills.filter(function(i){return i.id!==b.id});
      Object.keys(state.paid).forEach(function(m){delete state.paid[m][b.id]});
      save();render();
    };
    row.appendChild(cb);row.appendChild(nm);row.appendChild(el("strong","",money(b.amount)));row.appendChild(x);
    box.appendChild(row);
  });
  $("billsum").textContent=list.length?"Paid "+money(done)+" of "+money(total)+" · "+money(total-done)+" still to pay":"";
}
(function(){
  var d=$("bday"),m=$("bmon"),o;
  o=el("option","","Day");o.value="";d.appendChild(o);
  for(var i=1;i<=31;i++){o=el("option","",String(i));o.value=i;d.appendChild(o)}
  o=el("option","","Every month");o.value="";m.appendChild(o);
  for(var j=0;j<12;j++){o=el("option","",new Date(2000,j,1).toLocaleDateString(undefined,{month:"short"}));o.value=j+1;m.appendChild(o)}
})();
$("brep").onchange=function(){
  var m=$("bmon");m.disabled=this.checked;m.options[0].textContent=this.checked?"Every month":"Month";if(this.checked)m.value="";
};
function bmsg(t){$("bmsg").textContent=t}
$("badd").onclick=function(){
  var n=$("bname").value.trim(),a=parseFloat($("bamt").value),note=$("bnote").value.trim();
  var day=parseInt($("bday").value,10)||0,mon=parseInt($("bmon").value,10)||0,rep=$("brep").checked,dt="";
  if(!n||!(a>0))return;
  if(!rep&&!(day&&mon)){bmsg("For a one-off bill, pick a day and a month. Or tick Repeats every month.");return}
  if(day){
    if(rep){dt=dayIn(day,state.month)}
    else{
      var st=startOf(state.month),en=endOf(state.month),mid=(new Date(st).getTime()+new Date(en).getTime())/2,y0=+st.slice(0,4),best=1e18;
      for(var y=y0-1;y<=y0+1;y++){
        var last=new Date(y,mon,0).getDate(),c=iso(new Date(y,mon-1,Math.min(day,last))),dist=Math.abs(new Date(c).getTime()-mid);
        if(dist<best){best=dist;dt=c}
      }
    }
  }
  state.bills.push({id:"b"+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36),name:n.slice(0,40),amount:a,date:dt,repeat:rep,note:note.slice(0,60)});
  $("bname").value="";$("bamt").value="";$("bday").value="";$("bnote").value="";if(!rep)$("bmon").value="";
  save();render();
  bmsg(dt&&!inPeriod(dt,state.month)?"Added. It is due "+dlabel(dt)+", which falls in "+plabel(periodOf(dt))+". Use the arrows to see it.":"");
};
/* ---- Categories ---- */
var catArm=null;
function catOk(n){return CATS.some(function(c){return c[0]===n})?n:"Other"}
function catmsg(t){$("catmsg").textContent=t}
function renderCatList(){
  var box=$("catlist");box.textContent="";
  CATS.forEach(function(c){
    var chip=el("span","chip"),dot=el("span","dot");dot.style.background=c[1];
    chip.appendChild(dot);chip.appendChild(el("span","",c[0]));
    if(c[0]!=="Other"){var x=el("button","x","×");x.type="button";x.setAttribute("aria-label","Remove "+c[0]);x.onclick=function(){removeCat(c[0])};chip.appendChild(x)}
    else chip.style.paddingRight="10px";
    box.appendChild(chip);
  });
}
function refreshCats(){
  var v=$("cat").value;fillCats($("cat"),v);
  var no=el("option","","+ New category…");no.value="__new__";$("cat").appendChild(no);
  renderCatList();
  var PAL=["#4e79a7","#f28e2b","#59a14f","#b07aa1","#e15759","#76b7b2","#edc948","#ff9da7","#9c755f","#2f7d5b","#d4a373","#7a6ff0"];
  var used=CATS.map(function(c){return c[1].toLowerCase()});
  $("newcol").value=PAL.filter(function(p){return used.indexOf(p)<0})[0]||"#7a6ff0";
}
function removeCat(name){
  var n=state.expenses.filter(function(e){return e.cat===name}).length;
  if(catArm!==name){
    catArm=name;
    catmsg(n?"Removing "+name+" will move its "+n+" expense"+(n===1?"":"s")+" to Other. Tap × again to confirm.":"Tap × again to remove "+name+".");
    setTimeout(function(){if(catArm===name){catArm=null;catmsg("")}},5000);
    return;
  }
  catArm=null;
  CATS=CATS.filter(function(c){return c[0]!==name});state.cats=CATS;
  state.expenses.forEach(function(e){if(e.cat===name)e.cat="Other"});
  delete state.limits[name];
  save();refreshCats();render();catmsg("Removed "+name+".");
}
$("addcat").onclick=function(){
  var n=$("newcat").value.trim().replace(/\s+/g," ");
  if(!n)return;
  if(/^(__proto__|constructor|prototype|toString|valueOf|hasOwnProperty)$/i.test(n)){catmsg("Please choose a different name.");return}
  if(CATS.some(function(c){return c[0].toLowerCase()===n.toLowerCase()})){catmsg("That category already exists.");return}
  var i=CATS.length-1;if(!CATS.length||CATS[i][0]!=="Other")i=CATS.length;
  CATS.splice(i,0,[n,$("newcol").value]);state.cats=CATS;
  $("newcat").value="";save();refreshCats();$("cat").value=n;lastCat=n;render();catmsg("Added "+n+".");
};
var kind="out";
function setKind(k){
  kind=k;
  $("k-out").className=k==="out"?"on":"";$("k-in").className=k==="in"?"on":"";
  $("cat").hidden=k==="in";
  $("desc").placeholder=k==="in"?"Where did it come from?":"What was it?";
}
$("k-out").onclick=function(){setKind("out")};
$("k-in").onclick=function(){setKind("in")};
var lastCat="";
$("cat").onchange=function(){
  if(this.value==="__new__"){this.value=lastCat||this.options[0].value;$("catbox").open=true;$("newcat").focus()}
  else lastCat=this.value;
};
$("newcat").onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();$("addcat").click()}};
setDate();render();
