// Elements
} else {
alert('Preview not opened. To enable one-click preview, allow popups for this page or use Export .html.');
}
}
}
}catch(err){
console.error('Error opening preview:', err);
alert('An error occurred while trying to open the preview. Check console for details.');
}
});


// Save / Load snippets in localStorage
function getSnips(){
try{ return JSON.parse(localStorage.getItem('ohcj_snips')||'[]'); }catch(e){return []}
}
function saveSnips(arr){ localStorage.setItem('ohcj_snips', JSON.stringify(arr)); }


function renderList(){
const arr = getSnips();
snippetList.innerHTML = '';
if(!arr.length){ snippetList.innerHTML = '<div class="muted">No saved snippets yet.</div>'; return }
arr.slice().reverse().forEach((s,i)=>{
const el = document.createElement('div'); el.className='snip';
el.innerHTML = `<div style="flex:1"><strong class="small">${s.name}</strong><div class="muted small">${new Date(s.ts).toLocaleString()}</div></div>`;
const controls = document.createElement('div');
const load = document.createElement('button'); load.className='btn small'; load.textContent='Load';
const del = document.createElement('button'); del.className='btn small'; del.textContent='Delete';
controls.appendChild(load); controls.appendChild(del);
el.appendChild(controls);
load.addEventListener('click', ()=>{
htmlEl.value = s.html; cssEl.value = s.css; jsEl.value = s.js; if(auto) updatePreview(); else preview.srcdoc = buildSrcDoc();
});
del.addEventListener('click', ()=>{
const all = getSnips(); const idx = all.findIndex(x=>x.ts===s.ts);
if(idx>-1){ all.splice(idx,1); saveSnips(all); renderList(); }
});
snippetList.appendChild(el);
});
}


saveBtn.addEventListener('click', ()=>{
const name = (saveName.value||'untitled').slice(0,80);
const arr = getSnips();
arr.push({name,html:htmlEl.value,css:cssEl.value,js:jsEl.value,ts:Date.now()});
saveSnips(arr); renderList(); saveName.value='';
});


loadBtn.addEventListener('click', ()=>{
const arr = getSnips(); if(!arr.length) return alert('No saved snippets');
const s = arr[arr.length-1]; htmlEl.value=s.html; cssEl.value=s.css; jsEl.value=s.js; if(auto) updatePreview(); else preview.srcdoc = buildSrcDoc();
});


clearBtn.addEventListener('click', ()=>{
if(!confirm('Clear all editor contents?')) return; htmlEl.value=''; cssEl.value=''; jsEl.value=''; if(auto) updatePreview(); else preview.srcdoc = buildSrcDoc();
});


// Theme toggle
function setTheme(light){ document.documentElement.classList.toggle('light', !!light); themeBtn.textContent = light? 'Toggle Dark':'Toggle Light'; localStorage.setItem('ohcj_theme', JSON.stringify(!!light)); }
themeBtn.addEventListener('click', ()=>{ setTheme(!document.documentElement.classList.contains('light')); });
setTheme(JSON.parse(localStorage.getItem('ohcj_theme')||'false'));


// Init
renderList(); if(auto) updatePreview(); else preview.srcdoc = buildSrcDoc();


// Save workspace automatically on unload
window.addEventListener('beforeunload', ()=>{
localStorage.setItem('ohcj_workspace', JSON.stringify({html:htmlEl.value,css:cssEl.value,js:jsEl.value}));
});
// Restore workspace
(function(){
const w = JSON.parse(localStorage.getItem('ohcj_workspace')||'null');
if(w){ htmlEl.value = w.html||htmlEl.value; cssEl.value = w.css||cssEl.value; jsEl.value = w.js||jsEl.value; }
})();
