const $=id=>document.getElementById(id);
let sessionId=localStorage.getItem('yar_session')||crypto.randomUUID();
localStorage.setItem('yar_session',sessionId);
let attached=null;

function addMessage(role,text,extra=''){
  const chat=$('chat');
  const w=chat.querySelector('.welcome'); if(w) w.remove();
  const row=document.createElement('div'); row.className='msg '+role;
  const bubble=document.createElement('div'); bubble.className='bubble';
  bubble.textContent=text; if(extra) bubble.innerHTML += `<div class="source-note">${extra}</div>`;
  row.appendChild(bubble); chat.appendChild(row); chat.scrollTop=chat.scrollHeight;
  return bubble;
}
function quick(t){$('message').value=t;$('message').focus()}
function newChat(){sessionId=crypto.randomUUID();localStorage.setItem('yar_session',sessionId);location.reload()}
function toggleSidebar(){$('.sidebar').classList.toggle('open')}
function saveMemory(){
  const m=prompt('چه چیزی را می‌خواهی به خاطر بسپارم؟');
  if(!m)return;
  fetch('/api/memories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId,memory:m})}).then(loadMemories)
}
async function loadMemories(){
  const r=await fetch('/api/memories/'+sessionId); const d=await r.json();
  $('memoryList').innerHTML=d.memories.map(x=>`<div style="margin-top:5px">• ${escapeHtml(x)}</div>`).join('');
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

$('file').addEventListener('change',async e=>{
  const f=e.target.files[0]; if(!f)return;
  $('attachment').textContent='در حال خواندن '+f.name+'...';
  const fd=new FormData();fd.append('file',f);
  try{
    const r=await fetch('/api/upload',{method:'POST',body:fd}); const d=await r.json();
    if(!r.ok)throw new Error(d.detail||'خطا');
    attached=d;
    $('attachment').textContent='📎 '+d.filename+' آماده شد.';
  }catch(err){$('attachment').textContent='❌ '+err.message}
});

$('composer').addEventListener('submit',async e=>{
  e.preventDefault();
  const input=$('message'), text=input.value.trim(); if(!text)return;
  let final=text;
  if(attached?.kind==='text') final += `\n\n[متن فایل ${attached.filename}]\n${attached.text}`;
  if(attached?.kind==='image') final += `\n\n[تصویر پیوست شده: ${attached.filename}]`;
  addMessage('user',text+(attached?`\n📎 ${attached.filename}`:''));
  input.value='';$('attachment').textContent='';const old=attached;attached=null;
  const bubble=addMessage('assistant','در حال فکر کردن…');bubble.classList.add('typing');
  $('composer').querySelector('.send').disabled=true;
  try{
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      session_id:sessionId,message:final,mode:$('mode').value,web_search:$('webSearch').checked
    })});
    const d=await r.json(); if(!r.ok)throw new Error(d.detail||'خطای سرور');
    bubble.textContent=d.answer;
  }catch(err){bubble.textContent='❌ '+err.message;bubble.classList.add('error')}
  finally{$('composer').querySelector('.send').disabled=false;loadMemories()}
});

$('message').addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('composer').requestSubmit()}
});
$('mic').onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){alert('تشخیص صدای فارسی در این مرورگر پشتیبانی نمی‌شود.');return}
  const r=new SR();r.lang='fa-IR';r.interimResults=false;
  r.onresult=e=>{$('message').value=e.results[0][0].transcript};
  r.start();
};
loadMemories();
