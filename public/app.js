const form=document.querySelector("#registration-form");
const radios=[...document.querySelectorAll('input[name="category"]')];
const total=document.querySelector("#total"),note=document.querySelector("#price-note");
const photo=document.querySelector("#vehicle-photo"),uploadTitle=document.querySelector("#upload-title"),uploadHint=document.querySelector("#upload-hint");
const message=document.querySelector("#form-message"),submit=document.querySelector("#submit-button");
function updateCategory(){const r=radios.find(x=>x.checked);document.querySelectorAll(".category-card").forEach(c=>c.classList.toggle("selected",c.querySelector("input").checked));total.textContent=Number(r.dataset.price).toLocaleString("it-IT",{style:"currency",currency:"EUR"});note.textContent="Categoria: "+r.value}
radios.forEach(r=>r.addEventListener("change",updateCategory));updateCategory();
photo.addEventListener("change",()=>{const f=photo.files[0];if(!f){uploadTitle.textContent="SCEGLI LA FOTO";uploadHint.textContent="JPG, PNG o WEBP • massimo 8 MB";return}uploadTitle.textContent=f.name;uploadHint.textContent=(f.size/1024/1024).toFixed(2)+" MB • foto selezionata"});
form.addEventListener("submit",async e=>{e.preventDefault();message.textContent="";const f=photo.files[0];if(!f){message.textContent="Seleziona una foto del veicolo.";return}if(f.size>8*1024*1024){message.textContent="La foto supera il limite di 8 MB.";return}if(!["image/jpeg","image/png","image/webp"].includes(f.type)){message.textContent="Formato non supportato. Usa JPG, PNG o WEBP.";return}
const data=new FormData(form);const category=radios.find(x=>x.checked);data.set("category",category.value);data.set("amount",category.dataset.price);
submit.disabled=true;submit.textContent="ELABORAZIONE...";
try{const response=await fetch("/api/register",{method:"POST",body:data});const result=await response.json();if(!response.ok)throw new Error(result.error||"Invio non riuscito");if(result.approvalUrl){location.href=result.approvalUrl;return}message.textContent=result.message||"Richiesta ricevuta."}
catch(err){message.textContent=err.message||"Servizio momentaneamente non disponibile. Riprova più tardi."}
finally{submit.disabled=false;submit.innerHTML='CONTINUA CON PAYPAL <span>→</span>'}
});