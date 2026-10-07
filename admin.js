const supabase=window.supabase.createClient(window.FRSHOP_SUPABASE_URL,window.FRSHOP_SUPABASE_KEY);
let products=[],payments=[],orders=[],editingPaymentId=null,selectedProductImages=[];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const money=v=>Number(v||0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" USDT";
function toast(msg,error=false){const t=$("#toast");t.textContent=msg;t.className="toast show"+(error?" error":"");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.className="toast",2800)}
async function requireAdmin(){
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user){showLogin();return false}
 if((user.email||"").toLowerCase()!=="manseurange@gmail.com"){await supabase.auth.signOut();showLogin();toast("Accès administrateur refusé.",true);return false}
 return true
}
function showLogin(){$("#loginView").classList.remove("hidden");$("#appView").classList.add("hidden")}
async function loadAll(){const [pr,pa,or]=await Promise.all([supabase.from("products").select("*").order("created_at",{ascending:false}),supabase.from("payment_methods").select("*").order("created_at",{ascending:false}),supabase.from("orders").select("*").order("created_at",{ascending:false})]);if(pr.error)throw pr.error;if(pa.error)throw pa.error;if(or.error)throw or.error;products=(pr.data||[]).map(p=>({...p,images:Array.isArray(p.images)?p.images:[],paymentUrl:p.payment_url||""}));payments=pa.data||[];orders=or.data||[];renderAll()}
function renderAll(){updateStats();renderProducts();renderPayments();renderOrders();renderRecent();renderPopular();fillCategories()}
function updateStats(){$("#statProducts").textContent=products.length;$("#statPayments").textContent=payments.filter(x=>x.enabled).length;$("#statOrders").textContent=orders.length;$("#statRevenue").textContent=money(orders.reduce((s,o)=>s+Number(o.total||0),0))}
function productImage(p){return p.images?.[0]||"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#eef2f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="24">FR SHOP</text></svg>')}
function renderProducts(){const q=$("#productSearch")?.value.toLowerCase()||"",cat=$("#productCategory")?.value||"",list=products.filter(p=>(!q||[p.name,p.category].join(" ").toLowerCase().includes(q))&&(!cat||p.category===cat));$("#productGrid").innerHTML=list.length?list.map(p=>'<article class="product-card"><div class="product-cover"><img src="'+esc(productImage(p))+'" alt=""></div><div class="product-info"><small>'+esc(p.category)+'</small><h3>'+esc(p.name)+'</h3><div class="product-meta"><span class="price">'+money(p.price)+'</span>'+(p.featured?'<span class="badge">Mis en avant</span>':"")+'</div><div class="actions"><button class="btn btn-ghost" onclick="editProduct(\''+esc(p.id)+'\')">Modifier</button><button class="btn btn-danger" onclick="deleteProduct(\''+esc(p.id)+'\')">Supprimer</button></div></div></article>').join(""):"<div class='empty-state'>Aucun produit trouvé.</div>"}
function renderPayments(){$("#paymentGrid").innerHTML=payments.length?payments.map(p=>'<article class="payment-card"><div class="payment-top"><div class="payment-title"><span class="coin-icon">₿</span><div><h3>'+esc(p.name)+'</h3><small>'+esc(p.network||"Réseau non défini")+'</small></div></div><span class="status '+(p.enabled?"on":"off")+'">'+(p.enabled?"Actif":"Désactivé")+'</span></div>'+(p.wallet_address?'<div class="wallet">'+esc(p.wallet_address)+'</div>':"")+(p.qr_url?'<img class="qr" src="'+esc(p.qr_url)+'" alt="QR">':"")+'<div class="actions"><button class="btn btn-ghost" onclick="editPayment('+Number(p.id)+')">Modifier</button><button class="btn btn-danger" onclick="deletePayment('+Number(p.id)+')">Supprimer</button></div></article>').join(""):"<div class='empty-state'>Aucun moyen de paiement.</div>"}
function customer(o){return o.customer||{}}
function renderOrders(){const q=$("#orderSearch")?.value.toLowerCase()||"",list=orders.filter(o=>{const c=customer(o);return !q||[o.id,c.name,c.email,c.city].join(" ").toLowerCase().includes(q)});$("#ordersTable").innerHTML=list.length?list.map(o=>{const c=customer(o);return '<div class="order-row"><div><span class="order-id">'+esc(o.id)+'</span><small>'+new Date(o.created_at).toLocaleString("fr-FR")+'</small></div><div><strong>'+esc(c.name||"Client")+'</strong><small>'+esc(c.email||"")+'</small></div><div><strong>'+money(o.total)+'</strong><small>'+esc(o.payment||"")+'</small></div><div><span class="status '+(o.payment_screenshot_path?"on":"off")+'">'+(o.payment_screenshot_path?"Preuve reçue":"Sans preuve")+'</span></div><button class="btn btn-ghost" onclick="showOrder(\''+esc(o.id)+'\')">Détails</button></div>'}).join(""):"<div class='empty-state'>Aucune commande.</div>"}
function renderRecent(){const list=orders.slice(0,5);$("#recentOrders").innerHTML=list.length?'<table class="order-table"><thead><tr><th>Commande</th><th>Client</th><th>Total</th><th></th></tr></thead><tbody>'+list.map(o=>{const c=customer(o);return '<tr><td><b>'+esc(o.id)+'</b></td><td>'+esc(c.name||"—")+'</td><td><b>'+money(o.total)+'</b></td><td><button class="text-btn" onclick="showOrder(\''+esc(o.id)+'\')">Voir</button></td></tr>'}).join("")+'</tbody></table>':"<div class='empty-state'>Aucune commande.</div>"}
function renderPopular(){$("#popularProducts").innerHTML=products.slice(0,5).map(p=>'<div class="mini-item"><img src="'+esc(productImage(p))+'" alt=""><div><strong>'+esc(p.name)+'</strong><small>'+money(p.price)+'</small></div></div>').join("")||"<div class='empty-state'>Aucun produit.</div>"}
function fillCategories(){const cur=$("#productCategory").value,cats=[...new Set(products.map(p=>p.category).filter(Boolean))].sort();$("#productCategory").innerHTML='<option value="">Toutes les catégories</option>'+cats.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join("");$("#productCategory").value=cur}
async function uploadProductImages(productId){
 const files=[...($("#pimagesFile").files||[])];
 if(!files.length)return selectedProductImages;
 if(files.length>3)throw new Error("Maximum 3 images.");
 const urls=[];
 for(const file of files){
  if(!["image/png","image/jpeg","image/webp"].includes(file.type))throw new Error("Format image non accepté.");
  if(file.size>10*1024*1024)throw new Error("Chaque image doit faire au maximum 10 Mo.");
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
  const path=productId+"/"+crypto.randomUUID()+"."+ext;
  const up=await supabase.storage.from("product-images").upload(path,file,{contentType:file.type,upsert:false});
  if(up.error)throw up.error;
  urls.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
 }
 return [...selectedProductImages,...urls].slice(0,3);
}
async function saveProduct(e){
 e.preventDefault();
 const id=$("#pid").value||"p-"+Date.now();
 try{
  const images=await uploadProductImages(id);
  const payload={id,name:$("#pname").value.trim(),category:$("#pcat").value.trim(),price:Number($("#pprice").value),images,payment_url:$("#purl").value.trim(),featured:$("#pfeatured").checked,updated_at:new Date().toISOString()};
  const r=$("#pid").value?await supabase.from("products").update(payload).eq("id",id):await supabase.from("products").insert(payload);
  if(r.error)throw r.error;
  toast("Produit enregistré.");closeModal("productModal");e.target.reset();$("#pid").value="";selectedProductImages=[];$("#imagePreview").innerHTML="";await loadAll();
 }catch(err){toast("Impossible d'enregistrer : "+err.message,true)}
}
window.editProduct=id=>{const p=products.find(x=>x.id===id);if(!p)return;$("#pid").value=p.id;$("#pname").value=p.name;$("#pcat").value=p.category;$("#pprice").value=p.price;selectedProductImages=[...(p.images||[])];$("#pimages").value="";$("#pimagesFile").value="";renderImagePreview();$("#purl").value=p.paymentUrl||p.payment_url||"";$("#pfeatured").checked=!!p.featured;$("#productModalTitle").textContent="Modifier le produit";openModal("productModal")}
window.deleteProduct=async id=>{if(!confirm("Supprimer ce produit ?"))return;const r=await supabase.from("products").delete().eq("id",id);if(r.error)return toast("Suppression impossible : "+r.error.message,true);toast("Produit supprimé.");await loadAll()}
async function savePayment(e){e.preventDefault();const payload={name:$("#payName").value.trim(),network:$("#payNetwork").value.trim(),wallet_address:$("#payWallet").value.trim(),qr_url:$("#payQr").value.trim(),url:$("#payUrl").value.trim(),enabled:$("#payEnabled").checked};const r=editingPaymentId?await supabase.from("payment_methods").update(payload).eq("id",editingPaymentId):await supabase.from("payment_methods").insert(payload);if(r.error)return toast("Impossible d'enregistrer : "+r.error.message,true);toast("Paiement enregistré.");closeModal("paymentModal");e.target.reset();editingPaymentId=null;$("#payEnabled").checked=true;await loadAll()}
window.editPayment=id=>{const p=payments.find(x=>Number(x.id)===Number(id));if(!p)return;editingPaymentId=p.id;$("#paymentModalTitle").textContent="Modifier le paiement";$("#payName").value=p.name||"";$("#payNetwork").value=p.network||"";$("#payWallet").value=p.wallet_address||"";$("#payQr").value=p.qr_url||"";$("#payUrl").value=p.url||"";$("#payEnabled").checked=!!p.enabled;openModal("paymentModal")}
window.deletePayment=async id=>{if(!confirm("Supprimer ce moyen de paiement ?"))return;const r=await supabase.from("payment_methods").delete().eq("id",id);if(r.error)return toast("Suppression impossible : "+r.error.message,true);toast("Paiement supprimé.");await loadAll()}
window.showOrder=id=>{const o=orders.find(x=>x.id===id);if(!o)return;const c=customer(o);let proof="";if(o.payment_screenshot_path){const u=supabase.storage.from("payment-screenshots").getPublicUrl(o.payment_screenshot_path);proof='<h3>Preuve de paiement</h3><a href="'+esc(u.data.publicUrl)+'" target="_blank"><img class="proof" src="'+esc(u.data.publicUrl)+'" alt="Preuve"></a>'}$("#orderDetails").innerHTML='<span class="eyebrow">COMMANDE</span><h2>'+esc(o.id)+'</h2><div class="order-detail-grid"><div class="detail-box"><small>Client</small><strong>'+esc(c.name||"—")+'</strong></div><div class="detail-box"><small>Email</small><strong>'+esc(c.email||"—")+'</strong></div><div class="detail-box"><small>Téléphone</small><strong>'+esc(c.phone||"—")+'</strong></div><div class="detail-box"><small>Adresse</small><strong>'+esc([c.address,c.city,c.postal,c.region].filter(Boolean).join(", ")||"—")+'</strong></div><div class="detail-box"><small>Total</small><strong>'+money(o.total)+'</strong></div><div class="detail-box"><small>Paiement</small><strong>'+esc(o.payment||"—")+'</strong></div></div>'+proof+'<h3>Articles</h3><pre style="white-space:pre-wrap;background:#f8fafc;padding:14px;border-radius:12px;overflow:auto">'+esc(JSON.stringify(o.items||[],null,2))+'</pre>';openModal("orderModal")}
function openModal(id){$("#"+id).classList.add("show")}function closeModal(id){$("#"+id).classList.remove("show")}function renderImagePreview(){$("#imagePreview").innerHTML=selectedProductImages.map((u,i)=>"<div class=\"upload-thumb\"><img src=\""+esc(u)+"\"><button type=\"button\" onclick=\"removeProductImage("+i+")\">×</button></div>").join("")}window.removeProductImage=i=>{selectedProductImages.splice(i,1);renderImagePreview()};function newProduct(){selectedProductImages=[];$("#productForm").reset();$("#pid").value="";$("#productModalTitle").textContent="Nouveau produit";openModal("productModal")}function newPayment(){editingPaymentId=null;$("#paymentForm").reset();$("#payEnabled").checked=true;$("#paymentModalTitle").textContent="Nouveau moyen";openModal("paymentModal")}function go(section){$$(".section-page").forEach(x=>x.classList.toggle("active",x.id===section));$$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.section===section));$("#sidebar").classList.remove("open")}
function setup(){$$("[data-section]").forEach(b=>b.onclick=()=>go(b.dataset.section));$$("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));$$("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));["productModal","paymentModal","orderModal"].forEach(id=>$("#"+id).addEventListener("click",e=>{if(e.target.id===id)closeModal(id)}));$("#newProduct").onclick=newProduct;$("#pimagesFile").onchange=()=>{const files=[...$("#pimagesFile").files];if(files.length>3){toast("Maximum 3 images.",true);$("#pimagesFile").value="";return}$("#imagePreview").innerHTML=selectedProductImages.map((u,i)=>"<div class=\"upload-thumb\"><img src=\""+esc(u)+"\"></div>").join("")+files.map(f=>"<div class=\"upload-thumb\"><img src=\""+URL.createObjectURL(f)+"\"></div>").join("")};$("#quickProduct").onclick=newProduct;$("#newPayment").onclick=newPayment;$("#productForm").onsubmit=saveProduct;$("#paymentForm").onsubmit=savePayment;$("#productSearch").oninput=renderProducts;$("#productCategory").onchange=renderProducts;$("#orderSearch").oninput=renderOrders;$("#refreshOrders").onclick=()=>loadAll().catch(e=>toast(e.message,true));$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");$("#logout").onclick=async()=>{await supabase.auth.signOut();showLogin()};
$("#loginForm").onsubmit=async e=>{
 e.preventDefault();
 const email=$("#adminEmail").value.trim().toLowerCase(),password=$("#adminPass").value;
 const {error}=await supabase.auth.signInWithPassword({email,password});
 if(error){toast("Email ou mot de passe incorrect.",true);return}
 if(!(await requireAdmin()))return;
 showApp();
}
}
async function showApp(){
 if(!(await requireAdmin()))return;
 $("#loginView").classList.add("hidden");$("#appView").classList.remove("hidden");
 try{await loadAll()}catch(e){toast("Erreur Supabase : "+e.message,true)}
}
setup();
supabase.auth.onAuthStateChange((_event)=>{if(_event==="SIGNED_OUT")showLogin()});
requireAdmin().then(ok=>{if(ok)showApp()});