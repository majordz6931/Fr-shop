(() => {
"use strict";
const sb=window.supabase.createClient(window.FRSHOP_SUPABASE_URL,window.FRSHOP_SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=s=>document.querySelector(s); let products=[],payments=[],cart=[],store={};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>Number(v||0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" USDT";
const img=p=>Array.isArray(p.images)&&p.images[0]?p.images[0]:"https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80";
function status(msg){const x=$("#checkoutStatus");if(x)x.textContent=msg}
async function load(){
  const [pr,pm,ss]=await Promise.all([
    sb.from("products").select("*").order("featured",{ascending:false}).order("created_at",{ascending:false}),
    sb.from("payment_methods").select("*").eq("enabled",true).order("id"),sb.from("site_settings").select("value").eq("key","store").maybeSingle()
  ]);
  if(pr.error){console.error("Produits:",pr.error);$("#productsGrid").innerHTML='<div class="error">Impossible de charger les produits.</div>';}
  else products=pr.data||[];
  if(ss.data?.value)store=ss.data.value;
  applyStoreSettings();
  if(pm.error){
    console.error("Moyens de paiement:",pm.error);
    payments=[];
    $("#paymentGrid").innerHTML='<div class="empty">Impossible de charger les moyens de paiement. Vérifiez les règles RLS de payment_methods.</div>';
  }else{
    payments=pm.data||[];
  }
  buildCategories(); render(); buildForms();
}
function applyStoreSettings(){
  const s=store||{};
  const brand=document.querySelectorAll(".brand");brand.forEach(x=>{x.textContent=s.name||"Top-Shop"});
  const h1=document.querySelector(".hero h1");if(h1)h1.innerHTML=esc(s.hero_title||"La technologie")+"<br><em>"+esc(s.hero_emphasis||"sans compromis.")+"</em>";
  const hp=document.querySelector(".hero-copy>p");if(hp)hp.textContent=s.hero_text||"";
  const banner=document.querySelector(".top-banner img");if(banner)banner.src="https://i.ibb.co/bgktf3pT/1791410595006-01a11863-f0db-782b-a6a0-a464b9f2b0cb.png";
  const dp=document.querySelector(".delivery p");if(dp)dp.textContent=s.delivery_text||"";
  const ds=document.querySelector(".delivery>strong");if(ds)ds.innerHTML=esc(s.delivery_price||"0 €")+"<small>"+esc(s.delivery_label||"LIVRAISON")+"</small>";
}
function buildCategories(){const cats=[...new Set(products.map(p=>p.category).filter(Boolean))];$("#categoryList").innerHTML='<button class="cat active-cat" data-cat="">✦<b>Tous les produits</b><small>Afficher tout</small></button>'+cats.map(c=>'<button class="cat" data-cat="'+esc(c)+'">✦<b>'+esc(c)+'</b><small>Découvrir</small></button>').join("");document.querySelectorAll(".cat").forEach(b=>b.onclick=()=>{document.querySelectorAll(".cat").forEach(x=>x.classList.remove("active-cat"));b.classList.add("active-cat");render(b.dataset.cat||"")})}
function render(filter=""){const q=($("#search")?.value||"").trim().toLowerCase();const list=products.filter(p=>(!filter||p.category===filter)&&((p.name||"")+" "+(p.category||"")).toLowerCase().includes(q));$("#productsGrid").innerHTML=list.length?list.map(p=>'<article class="product"><img loading="lazy" src="'+esc(img(p))+'" alt="'+esc(p.name)+'" onerror="this.src=\'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80\'"><div class="body"><small>'+esc(p.category)+'</small><h3>'+esc(p.name)+'</h3><div class="foot"><b>'+money(p.price)+'</b><a class="add" href="product.html?id='+encodeURIComponent(p.id)+'">Acheter</a></div>'+(p.payment_url?'<a class="product-pay" target="_blank" rel="noopener" href="'+esc(p.payment_url)+'">Paiement direct ↗</a>':"")+'</div></article>').join(""):'<div class="empty">Aucun produit trouvé.</div>';document.querySelectorAll(".add").forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.id);if(p){cart.push(p);updateCart();$("#cartDrawer").classList.add("open")}})}
function qrUrl(p){
  const data=p.wallet_address||p.qr_url||p.url||"";
  return data?"https://quickchart.io/qr?size=220&margin=2&text="+encodeURIComponent(data):"";
}
function renderPayments(){
  $("#paymentGrid").innerHTML=payments.length?payments.map(p=>{
    const isBinance=(p.name||"").toLowerCase().includes("binance");
    const qr=qrUrl(p);
    const openQr=p.qr_url?'<a class="payment-action secondary" target="_blank" rel="noopener" href="'+esc(p.qr_url)+'">Voir le QR original ↗</a>':"";
    const payUrl=p.url||p.qr_url;
    const pay=isBinance&&payUrl?'<a class="payment-action binance" target="_blank" rel="noopener" href="'+esc(payUrl)+'">☰ Ouvrir Binance Pay ↗</a>':"";
    const code=p.wallet_address?'<div class="payment-code"><span>Code / adresse</span><button type="button" class="copy-code" data-code="'+esc(p.wallet_address)+'">Copier</button><code>'+esc(p.wallet_address)+'</code></div>':"";
    return '<div class="payment">'+
      '<div class="payment-top"><div><b>'+esc(p.name||"Paiement")+'</b><small>'+esc(p.network||"Crypto")+'</small></div></div>'+
      (qr?'<a class="payment-qr" target="_blank" rel="noopener" href="'+esc(qr)+'"><img src="'+esc(qr)+'" alt="QR code '+esc(p.name||"paiement")+'"></a>':"")+
      code+
      '<div class="payment-actions">'+openQr+pay+'</div>'+
    '</div>';
  }).join(""):'<div class="empty">Aucun moyen de paiement disponible.</div>';
  document.querySelectorAll(".copy-code").forEach(b=>b.onclick=async()=>{
    try{await navigator.clipboard.writeText(b.dataset.code);b.textContent="Copié ✓";setTimeout(()=>b.textContent="Copier",1400)}
    catch(e){alert("Copiez le code manuellement.")}
  });
}
async function sendSupport(e){e.preventDefault();const email=$("#supportEmail").value.trim(),message=$("#supportMessage").value.trim(),box=$("#supportStatus");if(box)box.textContent="Envoi…";const r=await sb.from("support_messages").insert({email,message});if(r.error){console.error(r.error);if(box)box.textContent="Impossible d’envoyer le message. Réessayez.";return}if(box)box.textContent="✓ Message envoyé. Merci, notre équipe vous répondra.";$("#supportForm").reset();setTimeout(()=>$("#supportModal").classList.remove("open"),1800)}
function updateCart(){$("#cartCount").textContent=cart.length;$("#cartItems").innerHTML=cart.length?cart.map((p,i)=>'<div class="cartline"><img src="'+esc(img(p))+'" alt=""><div><b>'+esc(p.name)+'</b><br><span>'+money(p.price)+'</span></div><button class="remove" data-i="'+i+'">×</button></div>').join(""):"<p class='empty'>Votre panier est vide.</p>";$("#cartTotal").textContent=money(cart.reduce((s,p)=>s+Number(p.price||0),0));document.querySelectorAll(".remove").forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.i),1);updateCart()})}
function paymentDetails(p){
  if(!p)return "";
  const data=p.wallet_address||p.url||p.qr_url||"";
  const qr=data?"https://quickchart.io/qr?size=260&margin=2&text="+encodeURIComponent(data):"";
  const code=p.wallet_address?'<div class="selected-pay-code"><span>Adresse / code</span><button type="button" class="copy-selected" data-code="'+esc(p.wallet_address)+'">Copier</button><code>'+esc(p.wallet_address)+'</code></div>':"";
  const binance=(p.name||"").toLowerCase().includes("binance");
  const btn=binance&&(p.url||p.qr_url)?'<a class="selected-binance" target="_blank" rel="noopener" href="'+esc(p.url||p.qr_url)+'">☰ Ouvrir Binance Pay ↗</a>':"";
  return '<div class="selected-payment"><b>Paiement sélectionné</b><strong>'+esc(p.name||"Paiement")+' — '+esc(p.network||"")+'</strong>'+(qr?'<img class="selected-payment-qr" src="'+esc(qr)+'" alt="QR code"><small>Scannez ce QR code pour payer</small>':"")+code+btn+'</div>';
}
function showPaymentDetails(){
  const v=$("#paymentMethod").value, p=payments.find(x=>((x.name||"")+" — "+(x.network||""))===v);
  const box=$("#selectedPaymentDetails"); if(box)box.innerHTML=paymentDetails(p);
  document.querySelectorAll(".copy-selected").forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.code);b.textContent="Copié ✓";setTimeout(()=>b.textContent="Copier",1400)}catch(e){alert("Copiez le code manuellement.")}});
}
function buildForms(){const countrySelect=$("#customerCountry");if(countrySelect){const list=window.TOP_SHOP_COUNTRIES||[];countrySelect.innerHTML='<option value="">🌍 Choisissez votre pays</option>'+list.map(c=>'<option value="'+esc(c.code)+'">'+esc(c.flag+" "+c.name)+'</option>').join("");countrySelect.value="DZ";}$("#paymentMethod").innerHTML='<option value="">Méthode de paiement</option>'+payments.map(p=>'<option value="'+esc((p.name||"")+" — "+(p.network||""))+'">'+esc((p.name||"Paiement")+" — "+(p.network||""))+'</option>').join("");$("#paymentMethod").onchange=showPaymentDetails;showPaymentDetails()}
async function checkout(e){e.preventDefault();if(!cart.length)return status("Votre panier est vide.");const f=$("#paymentScreenshot").files[0];if(!f)return status("Veuillez joindre la preuve de paiement.");if(!["image/png","image/jpeg","image/webp"].includes(f.type))return status("Format accepté : PNG, JPG ou WEBP.");if(f.size>10*1024*1024)return status("La capture doit faire 10 MB maximum.");status("Envoi de la commande…");const id="TS-"+Date.now().toString(36).toUpperCase(),safe=f.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=id+"/"+safe;const up=await sb.storage.from("payment-screenshots").upload(path,f,{contentType:f.type,upsert:false});if(up.error){console.error(up.error);return status("Erreur d'envoi de la preuve : "+up.error.message)}const publicUrl=sb.storage.from("payment-screenshots").getPublicUrl(path).data.publicUrl;const customer={name:$("#customerName").value.trim(),email:$("#customerEmail").value.trim(),phone:$("#customerPhone").value.trim(),address:$("#customerAddress").value.trim(),city:$("#customerCity").value.trim(),postal:$("#customerPostal").value.trim(),country:$("#customerCountry").value,country_name:(window.TOP_SHOP_COUNTRIES||[]).find(c=>c.code===$("#customerCountry").value)?.name||""};const total=cart.reduce((s,p)=>s+Number(p.price||0),0);const r=await sb.from("orders").insert({id,customer,items:cart.map(p=>({id:p.id,name:p.name,price:p.price})),total,payment:$("#paymentMethod").value,payment_screenshot_path:publicUrl});if(r.error){console.error(r.error);return status("Erreur lors de la commande : "+r.error.message)}status("✓ Commande "+id+" envoyée avec succès.");cart=[];updateCart();setTimeout(()=>$("#checkoutModal").classList.remove("open"),1800)}
document.addEventListener("DOMContentLoaded",()=>{$("#search").oninput=()=>render(document.querySelector(".active-cat")?.dataset.cat||"");$("#cartBtn").onclick=()=>$("#cartDrawer").classList.add("open");document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest(".drawer,.modal").classList.remove("open"));$("#checkoutBtn").onclick=()=>{if(!cart.length)return alert("Votre panier est vide.");$("#cartDrawer").classList.remove("open");$("#checkoutModal").classList.add("open")};$("#checkoutForm").onsubmit=checkout;$("#supportBtn").onclick=()=>$("#supportModal").classList.add("open");$("#supportForm").onsubmit=sendSupport;load();});
})();