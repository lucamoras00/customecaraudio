// Backend Node.js: invio iscrizioni con foto e checkout PayPal.
// Configurare le variabili in .env prima dell'avvio. Non inserire segreti nel frontend.
require("dotenv").config();
const express=require("express"), multer=require("multer"), nodemailer=require("nodemailer"), path=require("path");
const {randomUUID}=require("crypto");
const app=express();
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024},fileFilter:(req,file,cb)=>cb(null,["image/jpeg","image/png","image/webp"].includes(file.mimetype))});
const prices={"Moto":5,"Custom":15,"Car Audio":25};
const mailer=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==="true",auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
const paypalBase=process.env.PAYPAL_MODE==="live"?"https://api-m.paypal.com":"https://api-m.sandbox.paypal.com";
async function paypalToken(){const auth=Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");const r=await fetch(`${paypalBase}/v1/oauth2/token`,{method:"POST",headers:{Authorization:`Basic ${auth}`,"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"});if(!r.ok)throw new Error("Autenticazione PayPal non riuscita");return (await r.json()).access_token}
async function createOrder(amount,description,customId){const token=await paypalToken();const r=await fetch(`${paypalBase}/v2/checkout/orders`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({intent:"CAPTURE",purchase_units:[{reference_id:customId,custom_id:customId,description,amount:{currency_code:"EUR",value:Number(amount).toFixed(2)}}],application_context:{brand_name:"Caorle Car Meet",user_action:"PAY_NOW",return_url:`${process.env.PUBLIC_BASE_URL}/api/paypal/success`,cancel_url:`${process.env.PUBLIC_BASE_URL}/?payment=cancelled#iscrizione`}})});const j=await r.json();if(!r.ok)throw new Error(j.message||"Creazione ordine PayPal non riuscita");return j}
const pending=new Map(); // In produzione sostituire con database persistente.
app.post("/api/register",upload.single("photo"),async(req,res)=>{try{
const {firstName,lastName,phone,email,vehicle,category,amount,privacy}=req.body;
if(!firstName||!lastName||!phone||!email||!vehicle||!privacy||!req.file||!prices[category]||Number(amount)!==prices[category])return res.status(400).json({error:"Controlla i campi obbligatori, la privacy e la foto."});
const id=randomUUID();pending.set(id,{id,firstName,lastName,phone,email,vehicle,category,amount:prices[category],photo:req.file,createdAt:new Date().toISOString(),status:"pending"});
const order=await createOrder(prices[category],`Iscrizione Caorle Car Meet - ${category}`,id);pending.get(id).paypalOrderId=order.id;
const approvalUrl=order.links?.find(x=>x.rel==="approve")?.href;if(!approvalUrl)throw new Error("Link di pagamento non disponibile");
res.json({approvalUrl});
}catch(err){console.error(err);res.status(500).json({error:"Non è stato possibile avviare l'iscrizione. Riprova più tardi."})}});
app.get("/api/paypal/success",async(req,res)=>{try{
const orderId=req.query.token;if(!orderId)return res.redirect("/?payment=error#iscrizione");
const entry=[...pending.values()].find(x=>x.paypalOrderId===orderId);if(!entry)return res.status(404).send("Iscrizione non trovata. Contatta gli organizzatori.");
const token=await paypalToken();const r=await fetch(`${paypalBase}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"}});const capture=await r.json();
if(!r.ok||capture.status!=="COMPLETED")return res.status(400).send("Pagamento non completato. Contatta gli organizzatori.");
entry.status="paid";
await mailer.sendMail({from:process.env.MAIL_FROM,to:process.env.ORGANIZER_EMAIL,replyTo:entry.email,subject:`Nuova iscrizione pagata - Caorle Car Meet - ${entry.category}`,text:`ISCRIZIONE CONFERMATA\nID: ${entry.id}\nNome: ${entry.firstName} ${entry.lastName}\nTelefono: ${entry.phone}\nEmail: ${entry.email}\nVeicolo: ${entry.vehicle}\nCategoria: ${entry.category}\nQuota: €${entry.amount}\nPagamento PayPal: ${orderId}\nData: ${entry.createdAt}`,attachments:[{filename:entry.photo.originalname.replace(/[^a-zA-Z0-9._-]/g,"_"),content:entry.photo.buffer,contentType:entry.photo.mimetype}]});
await mailer.sendMail({from:process.env.MAIL_FROM,to:entry.email,subject:"Iscrizione confermata - Caorle Car Meet",text:`Ciao ${entry.firstName},\n\nil pagamento di €${entry.amount} per Caorle Car Meet è stato verificato e la tua iscrizione risulta confermata.\n\nCategoria: ${entry.category}\nVeicolo: ${entry.vehicle}\nData evento: 20 febbraio 2027\nLuogo: Caorle\n\nGrazie e ci vediamo al raduno!\nCaorle Car Meet`});
pending.delete(entry.id);res.redirect("/?payment=success#iscrizione");
}catch(err){console.error(err);res.status(500).send("Pagamento ricevuto o in verifica. Contatta gli organizzatori per assistenza.")}});
app.get("/privacy.html",(req,res)=>res.sendFile(path.join(__dirname,"public","privacy.html")));
app.listen(process.env.PORT||3000,()=>console.log(`Caorle Car Meet attivo sulla porta ${process.env.PORT||3000}`));