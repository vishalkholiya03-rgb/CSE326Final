var KEY="mds_db",SKEY="mds_me",mem=null,db,me=null,view="dashboard",authMode="login";
var STYLES=["Ballet","Hip Hop","Salsa","Contemporary","Bollywood","Bhangra","Jazz"];
var DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

/* ---------- storage ---------- */
function seed(){
  return {seq:10,
  users:[{id:1,name:"Studio Admin",email:"admin@studio.com",pass:"admin123",role:"admin"},
         {id:2,name:"Maya Rao",email:"maya@studio.com",pass:"maya123",role:"instructor"},
         {id:3,name:"Sam Kapoor",email:"sam@studio.com",pass:"sam123",role:"student"}],
  classes:[{id:1,title:"Beginner Ballet",style:"Ballet",instructorId:2,day:"Mon",time:"17:00",capacity:12,price:800},
           {id:2,title:"Street Hip Hop",style:"Hip Hop",instructorId:2,day:"Wed",time:"18:30",capacity:15,price:700},
           {id:3,title:"Bhangra Blast",style:"Bhangra",instructorId:2,day:"Sat",time:"10:00",capacity:20,price:600}],
  bookings:[{id:1,classId:1,studentId:3,status:"approved",date:new Date().toLocaleDateString()}],
  notes:[]};
}
function load(){try{var r=localStorage.getItem(KEY);if(r)return JSON.parse(r)}catch(e){}return mem||seed()}
function save(){mem=db;try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}}
function nid(){db.seq++;return db.seq}

/* ---------- helpers ---------- */
function $(id){return document.getElementById(id)}
function h(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function find(arr,id){return arr.filter(function(x){return x.id==id})[0]}
function uname(id){var u=find(db.users,id);return u?u.name:"—"}
function toast(t){var d=document.createElement("div");d.textContent=t;$("toast").appendChild(d);setTimeout(function(){d.remove()},3500)}
function notify(uid,text){db.notes.unshift({id:nid(),userId:uid,text:text,time:new Date().toLocaleString()})}
function badge(s){return '<span class="badge b-'+s+'">'+s+'</span>'}
function approvedCount(cid){return db.bookings.filter(function(b){return b.classId==cid&&b.status=="approved"}).length}
function can(role){return Array.isArray(role)?role.indexOf(me.role)>-1:me.role==role}
function opts(arr,sel){return arr.map(function(a){return '<option '+(a==sel?"selected":"")+'>'+h(a)+'</option>'}).join("")}

/* ---------- auth (login.html / register.html) ---------- */
function showAuth(mode){
  var reg=mode=="register";
  $("app").innerHTML='<div class="auth"><div class="box"><h1>💃 My Dance Studio</h1><p class="sub">'+(reg?"Create your account":"Welcome back")+'</p>'+
  '<div class="tabs"><a class="'+(reg?"":"on")+'" href="login.html">Login</a><a class="'+(reg?"on":"")+'" href="register.html">Register</a></div>'+
  (reg?'<label>Full name</label><input id="a_name">':"")+
  '<label>Email</label><input id="a_email" type="email"><label>Password</label><input id="a_pass" type="password">'+
  (reg?'<label>I am a</label><select id="a_role"><option value="student">Student</option><option value="instructor">Instructor</option></select>':"")+
  '<div class="err" id="a_err"></div><button class="btn full" onclick="'+(reg?"doRegister()":"doLogin()")+'">'+(reg?"Create account":"Login")+'</button>'+
  (reg?"":'<p class="hint">Demo logins:<br>Admin: admin@studio.com / admin123<br>Instructor: maya@studio.com / maya123<br>Student: sam@studio.com / sam123</p>')+
  '<p class="hint"><a href="index.html">← Back to home</a></p></div></div>';
}
function startAuth(mode){
  db=load();
  try{if(sessionStorage.getItem(SKEY)&&find(db.users,sessionStorage.getItem(SKEY))){location.href="dashboard.html";return}}catch(e){}
  showAuth(mode);
}
function loginDone(u,msg){
  try{sessionStorage.setItem(SKEY,u.id);sessionStorage.setItem("mds_welcome",msg)}catch(e){}
  location.href="dashboard.html";
}
function doLogin(){
  var e=$("a_email").value.trim().toLowerCase(),p=$("a_pass").value;
  var u=db.users.filter(function(x){return x.email==e&&x.pass==p})[0];
  if(!u){$("a_err").textContent="Wrong email or password.";return}
  loginDone(u,"Welcome back, "+u.name+"!");
}
function doRegister(){
  var n=$("a_name").value.trim(),e=$("a_email").value.trim().toLowerCase(),p=$("a_pass").value,r=$("a_role").value,er="";
  if(n.length<2)er="Name must be at least 2 characters.";
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))er="Enter a valid email.";
  else if(p.length<6)er="Password needs 6+ characters.";
  else if(db.users.some(function(x){return x.email==e}))er="Email already registered.";
  if(er){$("a_err").textContent=er;return}
  var u={id:nid(),name:n,email:e,pass:p,role:r};db.users.push(u);
  notify(1,"New "+r+" registered: "+n);save();
  loginDone(u,"Account created. Welcome, "+n+"!");
}
function logout(){try{sessionStorage.removeItem(SKEY)}catch(e){}location.href="login.html"}

/* ---------- shell: header + menu shared by every app page ---------- */
function navItems(){
  var n=[["dashboard","Dashboard"],["classes","Classes"],["bookings",me.role=="student"?"My Bookings":"Bookings"]];
  if(can("admin"))n.push(["users","Users"]);
  if(can(["admin","instructor"]))n.push(["reports","Reports"]);
  n.push(["alerts","Alerts ("+myNotes().length+")"]);return n;
}
function myNotes(){return db.notes.filter(function(n){return n.userId==me.id})}
function go(v){location.href=v+".html"}
function start(v){
  db=load();
  try{var id=sessionStorage.getItem(SKEY);if(id)me=find(db.users,id)||null}catch(e){}
  if(!me){location.href="login.html";return}
  if((v=="users"&&!can("admin"))||(v=="reports"&&!can(["admin","instructor"]))){location.href="dashboard.html";return}
  view=v;
  $("app").innerHTML='<header class="grad"><h2><a href="index.html" style="color:#fff;text-decoration:none">💃 My Dance Studio</a></h2><div class="who"><span>'+h(me.name)+' '+badge(me.role)+'</span><button class="btn ghost sm" style="color:#fff;border-color:#fff" onclick="logout()">Logout</button></div></header>'+
  '<nav>'+navItems().map(function(i){return '<a class="'+(i[0]==v?"on":"")+'" href="'+i[0]+'.html">'+i[1]+'</a>'}).join("")+'</nav><main id="main"></main>';
  ({dashboard:vDash,classes:vClasses,bookings:vBookings,users:vUsers,reports:vReports,alerts:vAlerts})[v]();
  try{var w=sessionStorage.getItem("mds_welcome");if(w){toast(w);sessionStorage.removeItem("mds_welcome")}}catch(e){}
}

/* ---------- dashboard ---------- */
function myClasses(){return can("instructor")?db.classes.filter(function(c){return c.instructorId==me.id}):db.classes}
function myBookings(){
  if(can("student"))return db.bookings.filter(function(b){return b.studentId==me.id});
  if(can("instructor")){var ids=myClasses().map(function(c){return c.id});return db.bookings.filter(function(b){return ids.indexOf(b.classId)>-1})}
  return db.bookings;
}
function vDash(){
  var b=myBookings(),pend=b.filter(function(x){return x.status=="pending"}).length,s="";
  function st(n,l){return '<div class="card stat"><b>'+n+'</b><span>'+l+'</span></div>'}
  s+=st(myClasses().length,can("student")?"Classes available":"Classes")+st(b.length,"Bookings")+st(pend,"Pending requests");
  if(can("admin"))s+=st(db.users.filter(function(u){return u.role=="student"}).length,"Students")+st(db.users.filter(function(u){return u.role=="instructor"}).length,"Instructors");
  var up=myClasses().slice(0,3).map(function(c){return '<div class="note"><b>'+h(c.title)+'</b> <small>'+c.day+' · '+c.time+' · '+h(uname(c.instructorId))+'</small></div>'}).join("");
  $("main").innerHTML='<h3>Hello, '+h(me.name)+' 👋</h3><div class="grid">'+s+'</div><div class="card"><h3>Upcoming classes</h3>'+(up||'<div class="empty">No classes yet.</div>')+'</div>';
}

/* ---------- classes (CRUD + search/filter) ---------- */
function vClasses(){
  $("main").innerHTML='<div class="bar"><input id="q" placeholder="Search classes or instructors…" oninput="fillClasses()"><select id="fs" onchange="fillClasses()"><option value="">All styles</option>'+opts(STYLES)+'</select><select id="fd" onchange="fillClasses()"><option value="">All days</option>'+opts(DAYS)+'</select>'+
  (can(["admin","instructor"])?'<button class="btn" onclick="classForm()">+ Add class</button>':"")+'</div><div class="grid" id="list"></div>';
  fillClasses();
}
function fillClasses(){
  var q=$("q").value.toLowerCase(),fs=$("fs").value,fd=$("fd").value;
  var list=myClasses().filter(function(c){
    return (c.title+" "+uname(c.instructorId)).toLowerCase().indexOf(q)>-1&&(!fs||c.style==fs)&&(!fd||c.day==fd)});
  $("list").innerHTML=list.map(function(c){
    var left=c.capacity-approvedCount(c.id),act="";
    if(can("student")){
      var mine=db.bookings.filter(function(b){return b.classId==c.id&&b.studentId==me.id&&(b.status=="pending"||b.status=="approved")})[0];
      act=mine?badge(mine.status):'<button class="btn sm" onclick="book('+c.id+')">'+(left>0?"Request booking":"Join waitlist request")+'</button>';
    }else act='<button class="btn alt sm" onclick="classForm('+c.id+')">Edit</button><button class="btn bad sm" onclick="delClass('+c.id+')">Delete</button>';
    return '<div class="card cls"><span class="badge b-instructor" style="width:fit-content">'+h(c.style)+'</span><h4>'+h(c.title)+'</h4><small>👩‍🏫 '+h(uname(c.instructorId))+'</small><small>🗓 '+c.day+' at '+c.time+'</small><small>💺 '+left+' of '+c.capacity+' seats left · ₹'+c.price+'</small><div class="row">'+act+'</div></div>';
  }).join("")||'<div class="empty">No classes match.</div>';
}
function classForm(id){
  var c=id?find(db.classes,id):{title:"",style:STYLES[0],instructorId:me.role=="instructor"?me.id:0,day:"Mon",time:"17:00",capacity:10,price:500};
  var ins=db.users.filter(function(u){return u.role=="instructor"});
  var insSel=can("admin")?'<label>Instructor</label><select id="c_ins">'+ins.map(function(u){return '<option value="'+u.id+'" '+(u.id==c.instructorId?"selected":"")+'>'+h(u.name)+'</option>'}).join("")+'</select>':"";
  openModal('<h3>'+(id?"Edit":"Add")+' class</h3><label>Title</label><input id="c_title" value="'+h(c.title)+'"><label>Style</label><select id="c_style">'+opts(STYLES,c.style)+'</select>'+insSel+
  '<label>Day</label><select id="c_day">'+opts(DAYS,c.day)+'</select><label>Time</label><input id="c_time" type="time" value="'+c.time+'"><label>Capacity (1–50)</label><input id="c_cap" type="number" value="'+c.capacity+'"><label>Price (₹)</label><input id="c_price" type="number" value="'+c.price+'"><div class="err" id="m_err"></div>'+
  '<div class="row"><button class="btn" onclick="saveClass('+(id||0)+')">Save</button><button class="btn ghost" onclick="closeModal()">Cancel</button></div>');
}
function saveClass(id){
  var t=$("c_title").value.trim(),cap=parseInt($("c_cap").value),pr=parseFloat($("c_price").value),tm=$("c_time").value,er="";
  var ins=can("admin")?parseInt($("c_ins").value):me.id;
  if(t.length<3)er="Title needs 3+ characters.";
  else if(!ins)er="Add an instructor account first.";
  else if(!tm)er="Pick a time.";
  else if(!(cap>=1&&cap<=50))er="Capacity must be 1–50.";
  else if(isNaN(pr)||pr<0)er="Price must be 0 or more.";
  if(er){$("m_err").textContent=er;return}
  var o={title:t,style:$("c_style").value,instructorId:ins,day:$("c_day").value,time:tm,capacity:cap,price:pr};
  if(id){Object.assign(find(db.classes,id),o)}else{o.id=nid();db.classes.push(o)}
  save();closeModal();toast("Class saved ✔");vClasses();
}
function delClass(id){
  if(!confirm("Delete this class and its bookings?"))return;
  db.classes=db.classes.filter(function(c){return c.id!=id});
  db.bookings=db.bookings.filter(function(b){return b.classId!=id});
  save();toast("Class deleted");vClasses();
}

/* ---------- booking workflow ---------- */
function book(cid){
  var c=find(db.classes,cid);
  db.bookings.push({id:nid(),classId:cid,studentId:me.id,status:"pending",date:new Date().toLocaleDateString()});
  notify(c.instructorId,me.name+" requested to join "+c.title);
  save();toast("Request sent for "+c.title+". Awaiting approval.");fillClasses();
}
function vBookings(){
  $("main").innerHTML='<div class="bar"><input id="q" placeholder="Search class or student…" oninput="fillBookings()"><select id="fs" onchange="fillBookings()"><option value="">All statuses</option>'+opts(["pending","approved","rejected","cancelled"])+'</select></div><div class="card scroll" id="list"></div>';
  fillBookings();
}
function fillBookings(){
  var q=$("q").value.toLowerCase(),fs=$("fs").value;
  var list=myBookings().filter(function(b){
    var c=find(db.classes,b.classId)||{title:""};
    return (c.title+" "+uname(b.studentId)).toLowerCase().indexOf(q)>-1&&(!fs||b.status==fs)});
  var rows=list.map(function(b){
    var c=find(db.classes,b.classId)||{title:"(deleted)"},a="";
    if(can(["admin","instructor"])&&b.status=="pending")a='<button class="btn ok sm" onclick="setStatus('+b.id+',\'approved\')">Approve</button> <button class="btn bad sm" onclick="setStatus('+b.id+',\'rejected\')">Reject</button>';
    if(can("student")&&(b.status=="pending"||b.status=="approved"))a='<button class="btn bad sm" onclick="setStatus('+b.id+',\'cancelled\')">Cancel</button>';
    return '<tr><td>'+h(c.title)+'</td><td>'+h(uname(b.studentId))+'</td><td>'+b.date+'</td><td>'+badge(b.status)+'</td><td>'+a+'</td></tr>';
  }).join("");
  $("list").innerHTML=rows?'<table><tr><th>Class</th><th>Student</th><th>Requested</th><th>Status</th><th>Action</th></tr>'+rows+'</table>':'<div class="empty">No bookings found.</div>';
}
function setStatus(id,s){
  var b=find(db.bookings,id),c=find(db.classes,b.classId);
  if(s=="approved"&&approvedCount(c.id)>=c.capacity){toast("Class is full. Cannot approve.");return}
  b.status=s;
  if(can("student"))notify(c.instructorId,me.name+" cancelled "+c.title);
  else notify(b.studentId,"Your booking for "+c.title+" was "+s+".");
  save();toast("Booking "+s);fillBookings();
}

/* ---------- users (admin) ---------- */
function vUsers(){
  $("main").innerHTML='<div class="bar"><input id="q" placeholder="Search users…" oninput="fillUsers()"><select id="fs" onchange="fillUsers()"><option value="">All roles</option>'+opts(["admin","instructor","student"])+'</select><button class="btn" onclick="userForm()">+ Add user</button></div><div class="card scroll" id="list"></div>';
  fillUsers();
}
function fillUsers(){
  var q=$("q").value.toLowerCase(),fs=$("fs").value;
  var rows=db.users.filter(function(u){return (u.name+u.email).toLowerCase().indexOf(q)>-1&&(!fs||u.role==fs)}).map(function(u){
    var self=u.id==me.id;
    return '<tr><td>'+h(u.name)+'</td><td>'+h(u.email)+'</td><td><select '+(self?"disabled":"")+' onchange="setRole('+u.id+',this.value)">'+opts(["admin","instructor","student"],u.role)+'</select></td><td>'+(self?"":'<button class="btn bad sm" onclick="delUser('+u.id+')">Delete</button>')+'</td></tr>';
  }).join("");
  $("list").innerHTML=rows?'<table><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr>'+rows+'</table>':'<div class="empty">No users found.</div>';
}
function userForm(){
  openModal('<h3>Add user</h3><label>Name</label><input id="u_name"><label>Email</label><input id="u_email" type="email"><label>Password</label><input id="u_pass" type="password"><label>Role</label><select id="u_role"><option>student</option><option>instructor</option><option>admin</option></select><div class="err" id="m_err"></div><div class="row"><button class="btn" onclick="saveUser()">Create</button><button class="btn ghost" onclick="closeModal()">Cancel</button></div>');
}
function saveUser(){
  var n=$("u_name").value.trim(),e=$("u_email").value.trim().toLowerCase(),p=$("u_pass").value,er="";
  if(n.length<2)er="Name needs 2+ characters.";
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))er="Enter a valid email.";
  else if(p.length<6)er="Password needs 6+ characters.";
  else if(db.users.some(function(x){return x.email==e}))er="Email already exists.";
  if(er){$("m_err").textContent=er;return}
  db.users.push({id:nid(),name:n,email:e,pass:p,role:$("u_role").value});save();closeModal();toast("User added");fillUsers();
}
function setRole(id,r){find(db.users,id).role=r;save();toast("Role updated");fillUsers()}
function delUser(id){
  if(!confirm("Delete this user and their bookings?"))return;
  db.users=db.users.filter(function(u){return u.id!=id});
  db.bookings=db.bookings.filter(function(b){return b.studentId!=id});
  save();toast("User deleted");fillUsers();
}

/* ---------- reports ---------- */
function bars(obj){
  var max=Math.max.apply(null,Object.keys(obj).map(function(k){return obj[k]}).concat(1));
  return Object.keys(obj).map(function(k){return '<div class="rb"><span>'+h(k)+'</span><i style="width:'+(obj[k]/max*60)+'%"></i><span>'+obj[k]+'</span></div>'}).join("")||'<div class="empty">No data.</div>';
}
function vReports(){
  var b=myBookings(),byS={pending:0,approved:0,rejected:0,cancelled:0},byStyle={},rev=0,rate=0;
  b.forEach(function(x){
    byS[x.status]++;var c=find(db.classes,x.classId);
    if(c){byStyle[c.style]=(byStyle[c.style]||0)+1;if(x.status=="approved")rev+=c.price}
  });
  var seats=myClasses().reduce(function(a,c){return a+c.capacity},0),filled=b.filter(function(x){return x.status=="approved"}).length;
  rate=seats?Math.round(filled/seats*100):0;
  $("main").innerHTML='<div class="grid"><div class="card stat"><b>₹'+rev+'</b><span>Revenue (approved bookings)</span></div><div class="card stat"><b>'+rate+'%</b><span>Seat occupancy</span></div><div class="card stat"><b>'+filled+'</b><span>Active students enrolled</span></div></div>'+
  '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))"><div class="card"><h3>Bookings by status</h3>'+bars(byS)+'</div><div class="card"><h3>Bookings by style</h3>'+bars(byStyle)+'</div></div>';
}

/* ---------- alerts ---------- */
function vAlerts(){
  var n=myNotes();
  $("main").innerHTML='<div class="card"><h3>Notifications</h3>'+(n.map(function(x){return '<div class="note">'+h(x.text)+'<small>'+x.time+'</small></div>'}).join("")||'<div class="empty">You are all caught up 🎉</div>')+
  (n.length?'<button class="btn ghost sm" style="margin-top:12px" onclick="clearNotes()">Clear all</button>':"")+'</div>';
}
function clearNotes(){db.notes=db.notes.filter(function(n){return n.userId!=me.id});save();go("alerts")}

/* ---------- modal + start ---------- */
function openModal(html){$("modal").innerHTML='<div class="box">'+html+'</div>';$("modal").hidden=false}
function closeModal(){$("modal").hidden=true;$("modal").innerHTML=""}
/* ---------- home page (index.html) ---------- */
function homeClasses(){
  db=load();
  $("hc").innerHTML=db.classes.slice(0,6).map(function(c){
    return '<div class="card cls"><span class="badge b-instructor" style="width:fit-content">'+h(c.style)+'</span><h4>'+h(c.title)+'</h4><small>👩‍🏫 '+h(uname(c.instructorId))+'</small><small>🗓 '+c.day+' at '+c.time+'</small><small>₹'+c.price+'</small></div>';
  }).join("")||'<div class="empty">Classes coming soon.</div>';
}
