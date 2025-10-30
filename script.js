// Elements
    const htmlEl = document.getElementById('html');
    const cssEl = document.getElementById('css');
    const jsEl = document.getElementById('js');
    const preview = document.getElementById('preview');
    const runBtn = document.getElementById('runBtn');
    const autoToggle = document.getElementById('autoToggle');
    const downloadBtn = document.getElementById('downloadBtn');
    const openNewBtn = document.getElementById('openNewBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const snippetList = document.getElementById('snippetList');
    const saveName = document.getElementById('saveName');
    const clearBtn = document.getElementById('clearBtn');
    const themeBtn = document.getElementById('themeBtn');

    // Helpers
    function buildSrcDoc(){
      const html = htmlEl.value;
      const css = '<style>'+cssEl.value+'</style>';
      const js = '<script>'+jsEl.value+'<\/script>';
      return `<!doctype html><html><head><meta charset="utf-8">${css}</head><body>${html}${js}</body></html>`;
    }

    function updatePreview(){
      preview.srcdoc = buildSrcDoc();
    }

    // Run button
    runBtn.addEventListener('click', updatePreview);

    // Auto-preview
    let auto = JSON.parse(localStorage.getItem('ohcj_auto')||'false');
    autoToggle.checked = auto;
    function setAuto(v){ auto = v; localStorage.setItem('ohcj_auto', JSON.stringify(!!v)); }
    autoToggle.addEventListener('change', (e)=>{ setAuto(e.target.checked); });

    // Keyboard shortcut Ctrl+Enter
    document.addEventListener('keydown', (e)=>{
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
        e.preventDefault(); updatePreview();
      }
    });

    // Auto update while typing
    [htmlEl, cssEl, jsEl].forEach(el=>{
      el.addEventListener('input', ()=>{ if (auto) updatePreview(); });
    });

    // Download exported HTML file
    downloadBtn.addEventListener('click', ()=>{
      const blob = new Blob([buildSrcDoc()], {type:'text/html'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = (saveName.value || 'snippet') + '.html'; a.click();
      URL.revokeObjectURL(url);
    });

    // Open preview in new tab --- fixed to handle blocked popups
    openNewBtn.addEventListener('click', ()=>{
      try{
        const w = window.open();
        if (w && w.document){
          // Normal case: new window opened, write preview
          w.document.open();
          w.document.write(buildSrcDoc());
          w.document.close();
        } else {
          // Popup blocked or window.open returned null
          const userChoice = confirm('Popup was blocked or failed to open a new window.\n\nDo you want to open the preview in the current tab (this will replace the editor)? Click Cancel to instead export the HTML file.');
          if (userChoice){
            // Create a blob URL and navigate current tab to it (user agreed)
            const blob = new Blob([buildSrcDoc()], {type:'text/html'});
            const url = URL.createObjectURL(blob);
            // navigate current tab — user consented
            window.location.href = url;
          } else {
            // Offer to download instead
            const doDownload = confirm('Would you like to download the HTML file so you can open it manually?');
            if (doDownload){
              const blob = new Blob([buildSrcDoc()], {type:'text/html'});
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = (saveName.value || 'snippet') + '.html'; a.click();
              URL.revokeObjectURL(url);
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
