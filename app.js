(() => {
const $=id=>document.getElementById(id); let db=null,user=null,admin=false,mode='login',stories=[],imagePath=null;
const routes={'Truyền Thuyết':'truyen-thuyet','Truyện Cười':'truyen-cuoi','Truyện Cổ Tích':'truyen-co-tich','Truyện Giải Thích Địa Phương':'truyen-dia-phuong'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(s,error=false){let t=$('toast');t.textContent=s;t.className='show'+(error?' error':'');setTimeout(()=>t.className='',3500)}
function page(key){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.dataset.section===key));document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.dataset.page===key));$('nav').classList.remove('open');scrollTo({top:0,behavior:'smooth'})}
function empty(){return '<div class="empty"><b>Kho truyện đang được xây dựng</b>Các câu chuyện sẽ xuất hiện tại đây sau khi quản trị viên thêm và xuất bản.</div>'}
function card(s){let excerpt=s.summary||s.content.slice(0,140);return `<article class="card" tabindex="0" data-story="${esc(s.id)}"><div class="cover">${s.image_url?`<img src="${esc(s.image_url)}" alt="${esc(s.title)}">`:'✦'}</div><div class="card-body"><span class="tag">${esc(s.category)}</span><h3>${esc(s.title)}</h3><p>${esc(excerpt.slice(0,150))}${excerpt.length>150?'…':''}</p><span class="read">ĐỌC CÂU CHUYỆN →</span></div></article>`}
function render(){let pub=stories.filter(s=>s.is_published),feat=pub.filter(s=>s.is_featured);$('featured').innerHTML=feat.length?feat.slice(0,6).map(card).join(''):empty();document.querySelectorAll('.category-grid').forEach(el=>{let a=pub.filter(s=>s.category===el.dataset.category);el.innerHTML=a.length?a.map(card).join(''):empty()})}
async function load(){if(!db){render();return}let {data,error}=await db.from('stories').select('*').eq('is_published',true).order('created_at',{ascending:false});if(error){console.error(error);render();return}stories=data||[];render()}
function modal(id,open){$(id).hidden=!open;document.body.style.overflow=open?'hidden':''}
function authTab(m){mode=m;$('auth-title').textContent=m==='login'?'Đăng nhập':'Tạo tài khoản';$('auth-submit').textContent=m==='login'?'Đăng nhập':'Đăng ký';$('login-tab').classList.toggle('selected',m==='login');$('signup-tab').classList.toggle('selected',m==='signup');$('auth-message').textContent=''}
async function refresh(){if(!db)return;let r=await db.auth.getUser();user=r.data.user;admin=false;if(user){let a=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();admin=!!a.data&&!a.error}$('open-auth').textContent=user?(admin?'Quản trị':'Tài khoản'):'Đăng nhập'}
async function submitAuth(e){e.preventDefault();if(!db){$('auth-message').textContent='Chưa cấu hình Supabase trong config.js.';return}let email=$('auth-email').value.trim(),password=$('auth-password').value;try{let r=mode==='login'?await db.auth.signInWithPassword({email,password}):await db.auth.signUp({email,password});if(r.error)throw r.error;if(mode==='signup'){$('auth-message').textContent='Đã gửi yêu cầu đăng ký. Kiểm tra email nếu cần xác nhận.';return}await refresh();modal('auth-modal',false);if(admin)await openAdmin();else toast('Đăng nhập thành công.')}catch(e){$('auth-message').textContent=e.message||'Không thể đăng nhập.'}}
async function openAdmin(){await refresh();if(!user){modal('auth-modal',true);$('auth-message').textContent='Đăng nhập tài khoản quản trị trước nhé.';return}if(!admin){toast('Tài khoản này chưa được cấp quyền quản trị.',true);return}$('admin-user').textContent=user.email;modal('admin-modal',true);await adminList()}
function tab(name){document.querySelectorAll('.admin-tab').forEach(b=>b.classList.toggle('selected',b.dataset.tab===name));$('admin-list').hidden=name!=='list';$('admin-editor').hidden=name!=='editor'}
async function adminList(){let r=await db.from('stories').select('*').order('created_at',{ascending:false});if(r.error){toast(r.error.message,true);return}stories=r.data||[];render();$('admin-stories').innerHTML=stories.length?stories.map(s=>`<div class="admin-row"><div><b>${esc(s.title)}</b><small>${esc(s.category)} · ${s.is_published?'Đã xuất bản':'Bản nháp'}${s.is_featured?' · Nổi bật':''}</small></div><div><button data-edit="${s.id}">Sửa</button><button data-publish="${s.id}">${s.is_published?'Gỡ xuất bản':'Xuất bản'}</button><button class="danger" data-delete="${s.id}">Xóa</button></div></div>`).join(''):empty()}
function reset(){ $('story-form').
async function uploadWordImage(image){
  let base64=await image.read("base64");
  let binary=atob(base64);
  let bytes=new Uint8Array(binary.length);

  for(let i=0;i<binary.length;i++){
    bytes[i]=binary.charCodeAt(i);
  }

  let blob=new Blob([bytes],{type:image.contentType});
  let ext=image.contentType.split('/')[1]||'png';

  if(ext==='jpeg')ext='jpg';

  let path=`${user.id}/word/${crypto.randomUUID()}.${ext}`;

  let up=await db.storage
    .from('story-images')
    .upload(path,blob,{contentType:image.contentType});

  if(up.error)throw up.error;

  return {
    src:db.storage.from('story-images').getPublicUrl(path).data.publicUrl
  };
}
reset();$('story-id').value='';imagePath=null;$('editor-title').textContent='Thêm truyện mới';$('story-message').textContent='';$('docx').value='';$('story-image').value=''}
function edit(id){let s=stories.find(x=>x.id===id);if(!s)return;reset();$('story-id').value=s.id;$('story-name').value=s.title;$('story-category').value=s.category;$('story-summary').value=s.summary||'';$('story-text').value=s.content;$('featured').checked=s.is_featured;$('published').checked=s.is_published;imagePath=s.image_path;$('editor-title').textContent='Chỉnh sửa truyện';tab('editor')}
async function save(e){e.preventDefault();if(!db||!admin)return;let id=$('story-id').value,p={title:$('story-name').value.trim(),category:$('story-category').value,summary:$('story-summary').value.trim(),content:$('story-text').value.trim(),is_featured:$('featured').checked,is_published:$('published').checked,author_name:user.email||''};if(!p.title||!p.content){$('story-message').textContent='Vui lòng nhập tên truyện và nội dung.';return}try{let file=$('story-image').files[0];if(file){if(file.size>5*1024*1024)throw Error('Ảnh cần nhỏ hơn 5 MB.');let ext=file.name.split('.').pop().toLowerCase(),path=`${user.id}/${crypto.randomUUID()}.${ext}`;let up=await db.storage.from('story-images').upload(path,file,{contentType:file.type});if(up.error)throw up.error;p.image_path=path;p.image_url=db.storage.from('story-images').getPublicUrl(path).data.publicUrl}else if(id){let old=stories.find(s=>s.id===id);p.image_path=old?.image_path||null;p.image_url=old?.image_url||null}let r=id?await db.from('stories').update(p).eq('id',id):await db.from('stories').insert(p);if(r.error)throw r.error;toast(id?'Đã cập nhật truyện.':'Đã thêm truyện.');reset();tab('list');await adminList()}catch(e){$('story-message').textContent=e.message||'Không lưu được truyện.'}}
async function init(){document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState(null,'','#'+a.dataset.page);page(a.dataset.page)}));window.addEventListener('hashchange',()=>page((location.hash||'#trang-chu').slice(1)));page((location.hash||'#trang-chu').slice(1));$('menu-toggle').onclick=()=>$('nav').classList.toggle('open');$('open-auth').onclick=async()=>{if(user&&admin)await openAdmin();else modal('auth-modal',true)};$('login-tab').onclick=()=>authTab('login');$('signup-tab').onclick=()=>authTab('signup');$('auth-form').onsubmit=submitAuth;document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal(b.dataset.close,false));document.querySelectorAll('.backdrop').forEach(b=>b.onclick=e=>{if(e.target===b)modal(b.id,false)});document.addEventListener('click',async e=>{let c=e.target.closest('[data-story]');if(c){let s=stories.find(x=>x.id===c.dataset.story);if(s){$('reader-category').textContent=s.category;$('reader-title').textContent=s.title;$('reader-meta').textContent=s.author_name||'Kho tàng truyện dân gian địa phương';let content=s.content||'';

if(/<\/?(p|div|img|h[1-6]|ul|ol|li|table|br)\b/i.test(content)){
  $('reader-content').innerHTML=DOMPurify.sanitize(content);
}else{
  $('reader-content').textContent=content;
}modal('reader-modal',true)}return}let ed=e.target.closest('[data-edit]');if(ed){edit(ed.dataset.edit);return}let pub=e.target.closest('[data-publish]');if(pub){let s=stories.find(x=>x.id===pub.dataset.publish);let r=await db.from('stories').update({is_published:!s.is_published}).eq('id',s.id);if(r.error)toast(r.error.message,true);else await adminList();return}let del=e.target.closest('[data-delete]');if(del){let s=stories.find(x=>x.id===del.dataset.delete);if(s&&confirm(`Xóa truyện “${s.title}”?`)){let r=await db.from('stories').delete().eq('id',s.id);if(r.error)toast(r.error.message,true);else await adminList()} }});$('new-story').onclick=()=>{reset();tab('editor')};$('cancel-edit').onclick=()=>{reset();tab('list')};document.querySelectorAll('.admin-tab').forEach(b=>b.onclick=()=>{if(b.dataset.tab==='editor'&&!$('story-id').value)reset();tab(b.dataset.tab)});$('story-form').onsubmit=save;$('story-form').onsubmit=save;
$('docx').onchange=async e=>{
  let f=e.target.files[0];
  if(!f)return;

  if(!f.name.toLowerCase().endsWith('.docx')){
    $('story-message').textContent='Vui lòng chọn file .docx.';
    return;
  }

  try{
    $('story-message').textContent='Đang đọc văn bản và tải ảnh...';

    let r=await mammoth.convertToHtml(
      {arrayBuffer:await f.arrayBuffer()},
      {
        convertImage:mammoth.images.imgElement(
          image=>uploadWordImage(image)
        )
      }
    );

    $('story-text').value=r.value.trim();

    if(!$('story-name').value){
      $('story-name').value=f.name
        .replace(/\.docx$/i,'')
        .replace(/[_-]/g,' ');
    }

    $('story-message').textContent=
      'Đã nhập nội dung và ảnh. Hãy kiểm tra trước khi lưu.';
  }catch(err){
    console.error(err);
    $('story-message').textContent=
      'Không đọc được Word hoặc tải ảnh thất bại: '+err.message;
  }
};
;modal('admin-modal',false);toast('Đã đăng xuất.')};let ok=window.SUPABASE_URL&&!SUPABASE_URL.includes('PASTE_YOUR')&&window.SUPABASE_ANON_KEY&&!SUPABASE_ANON_KEY.includes('PASTE_YOUR');if(ok&&window.supabase){db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);db.auth.onAuthStateChange(()=>setTimeout(refresh,0));await refresh();await load()}else render()}
document.addEventListener('DOMContentLoaded',init);
})();
