import fs from 'node:fs';

let panel = fs.readFileSync('cloudflare-bot/panel/index.html', 'utf8');

// 1. Add table header for AI keywords
panel = panel.replace(
  '<th>ضد تبلیغ</th><th>وضعیت</th><th>عملیات</th>',
  '<th>ضد تبلیغ</th><th>کلیدواژه AI</th><th>وضعیت</th><th>عملیات</th>'
);

// 2. Add AI keywords button in renderSources
const oldRenderRow = `      <td><button class="icon-btn \${s.block_ads!==0?'success':''}" title="\${adTitle}" onclick="toggleAdBlock(\${s.id},\${s.block_ads===0?1:0})">\${adIcon}</button></td>
      <td><span class="badge \${s.active?'b-on':'b-off'}">\${s.active?'فعال':'غیرفعال'}</span></td>`;

const newRenderRow = `      <td><button class="icon-btn \${s.block_ads!==0?'success':''}" title="\${adTitle}" onclick="toggleAdBlock(\${s.id},\${s.block_ads===0?1:0})">\${adIcon}</button></td>
      <td>
        <button class="icon-btn \${s.ai_keywords_enabled!==0?'success':''}" title="\${s.ai_keywords_enabled===0?'پذیرش AI خاموش — کلیک برای روشن':'پذیرش AI روشن — کلیک برای خاموش (پرش)'}" onclick="toggleAIKeywords(\${s.id},\${s.ai_keywords_enabled===0?1:0})">
          \${s.ai_keywords_enabled===0?'❌':'🤖'}
        </button>
      </td>
      <td><span class="badge \${s.active?'b-on':'b-off'}">\${s.active?'فعال':'غیرفعال'}</span></td>`;

if (panel.includes(oldRenderRow)) {
  panel = panel.replace(oldRenderRow, newRenderRow);
}

// 3. Add toggleAIKeywords function
const oldToggleAdBlock = `async function toggleAdBlock(id, newVal){
  try{
    await api('sources/'+id, {method:'PUT', body:JSON.stringify({block_ads:newVal})});
    const s = SOURCES.find(x=>x.id===id); if(s) s.block_ads = newVal;
    renderSources();
    toast(newVal===1?'🟢 ضد تبلیغات روشن شد':'🔴 ضد تبلیغات خاموش شد');
  }catch(e){toast(e.message, false)}
}`;

const newToggleAdBlock = `async function toggleAdBlock(id, newVal){
  try{
    await api('sources/'+id, {method:'PUT', body:JSON.stringify({block_ads:newVal})});
    const s = SOURCES.find(x=>x.id===id); if(s) s.block_ads = newVal;
    renderSources();
    toast(newVal===1?'🟢 ضد تبلیغات روشن شد':'🔴 ضد تبلیغات خاموش شد');
  }catch(e){toast(e.message, false)}
}
async function toggleAIKeywords(id, newVal){
  try{
    await api('sources/'+id, {method:'PUT', body:JSON.stringify({ai_keywords_enabled:newVal})});
    const s = SOURCES.find(x=>x.id===id); if(s) s.ai_keywords_enabled = newVal;
    renderSources();
    toast(newVal===1?'🤖 پذیرش کلیدواژه هوش مصنوعی فعال شد':'❌ پیشنهاد و پذیرش کلیدواژه AI غیرفعال (پرش) شد');
  }catch(e){toast(e.message, false)}
}`;

if (panel.includes(oldToggleAdBlock)) {
  panel = panel.replace(oldToggleAdBlock, newToggleAdBlock);
}

// 4. In openAddModal: add checkbox for ai_keywords_enabled
panel = panel.replace(
  '<div class="field"><label><input type="checkbox" id="m_block_ads" checked /> سیستم ضد تبلیغات فعال باشد</label></div>',
  '<div class="field"><label><input type="checkbox" id="m_block_ads" checked /> سیستم ضد تبلیغات فعال باشد</label></div>\n    <div class="field"><label><input type="checkbox" id="m_ai_keywords" checked /> 🤖 پذیرش و پیشنهاد خودکار کلیدواژه‌های هوش مصنوعی (AI Keywords)</label></div>'
);

// 5. In saveSource (adding source): include ai_keywords_enabled
panel = panel.replace(
  'block_ads: $(\'#m_block_ads\').checked ? 1 : 0,',
  'block_ads: $(\'#m_block_ads\').checked ? 1 : 0,\n      ai_keywords_enabled: $(\'#m_ai_keywords\') ? ($(\'#m_ai_keywords\').checked ? 1 : 0) : 1,'
);

// 6. In openEditModal: add checkbox for ai_keywords_enabled
panel = panel.replace(
  '<div class="field"><label><input type="checkbox" id="e_block_ads" ${s.block_ads!==0?\'checked\':\'\'} /> سیستم ضد تبلیغات فعال باشد</label></div>',
  '<div class="field"><label><input type="checkbox" id="e_block_ads" ${s.block_ads!==0?\'checked\':\'\'} /> سیستم ضد تبلیغات فعال باشد</label></div>\n    <div class="field"><label><input type="checkbox" id="e_ai_keywords" ${s.ai_keywords_enabled!==0?\'checked\':\'\'} /> 🤖 پذیرش و پیشنهاد خودکار کلیدواژه‌های هوش مصنوعی (AI Keywords)</label></div>'
);

// 7. In saveEditSource: include ai_keywords_enabled
panel = panel.replace(
  'block_ads: $(\'#e_block_ads\').checked ? 1 : 0,',
  'block_ads: $(\'#e_block_ads\').checked ? 1 : 0,\n      ai_keywords_enabled: $(\'#e_ai_keywords\') ? ($(\'#e_ai_keywords\').checked ? 1 : 0) : 1,'
);

fs.writeFileSync('cloudflare-bot/panel/index.html', panel);
console.log('Panel HTML updated successfully!');
