import axios from 'axios';

// Keep local development configurable, but make the deployed storefront
// point at the separately deployed API instead of the SPA /api rewrite.
const configuredApiUrl=String(import.meta.env.VITE_API_URL||'https://alhana-tools-eug1.vercel.app/api').replace(/\/+$/,'');
const API_URL=/\/api$/i.test(configuredApiUrl)?configuredApiUrl:`${configuredApiUrl}/api`;
export const api=axios.create({baseURL:API_URL,headers:{'Content-Type':'application/json'},timeout:10000});
api.interceptors.request.use(config=>{const token=localStorage.getItem('oddatak-token');if(token)config.headers.Authorization=`Bearer ${token}`;if(typeof FormData!=='undefined'&&config.data instanceof FormData){delete config.headers['Content-Type'];delete config.headers['content-type']}return config});
export const productService={list:params=>api.get('/products',{params}),categories:()=>api.get('/categories'),get:id=>api.get(`/products/${id}`),featured:()=>api.get('/products',{params:{featured:true,limit:4}}).then(r=>r.data?.data?.products?.length?r:api.get('/products',{params:{limit:4}}))};
export const authService={login:payload=>api.post('/auth/login',payload),register:payload=>api.post('/auth/register',payload),me:()=>api.get('/auth/me'),changePassword:payload=>api.put('/auth/change-password',payload)};
export const orderService={create:payload=>api.post('/orders',payload),track:payload=>api.post('/orders/track',payload),list:()=>api.get('/orders/my-orders'),adminList:()=>api.get('/orders'),updateStatus:(id,status)=>api.put(`/orders/${id}/status`,{status}),updatePaymentStatus:(id,payload)=>api.put(`/orders/${id}/payment-status`,payload),updateShipment:(id,payload)=>api.put(`/orders/${id}/shipment`,payload),uploadReceipt:(id,file)=>{const body=new FormData();body.append('receipt',file);return api.post(`/orders/${id}/payment-receipt`,body)}};
export const messageService={send:payload=>api.post('/messages',payload),list:()=>api.get('/messages'),update:(id,payload)=>api.put(`/messages/${id}`,payload)};
const webpVariant=async(file,maxEdge,quality)=>{
  const bitmap=await createImageBitmap(file);const edge=Math.max(bitmap.width,bitmap.height);
  if(edge<=maxEdge&&file.size<=250*1024){bitmap.close();return file}
  const scale=Math.min(1,maxEdge/edge);const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
  if(!blob||blob.size>=file.size)return file;
  const ext=blob.type.split('/')[1]||'webp';
  return new File([blob],file.name.replace(/\.[^.]+$/,`.${ext}`),{type:blob.type||'image/webp'});
};
const optimizeProductImages=async form=>{
  if(typeof window==='undefined'||typeof createImageBitmap!=='function'||!(form instanceof FormData))return form;
  const optimized=new FormData();let imageIndex=0;
  for(const [key,value] of form.entries()){
    if(key!=='images'||typeof File==='undefined'||!(value instanceof File)||!value.type.startsWith('image/')){optimized.append(key,value);continue}
    const cover=imageIndex++===0;
    try{optimized.append('images',await webpVariant(value,1200,0.78));if(cover)optimized.append('thumbnail',await webpVariant(value,480,0.68))}
    catch{optimized.append('images',value);if(cover)optimized.append('thumbnail',value)}
  }
  return optimized;
};
export const adminService={stats:()=>api.get('/admin/stats'),users:()=>api.get('/users'),updateUser:(id,payload)=>api.put(`/users/${id}`,payload),products:params=>api.get('/products', {params}),createProduct:form=>optimizeProductImages(form).then(body=>api.post('/products',body)),updateProduct:(id,form)=>optimizeProductImages(form).then(body=>api.put(`/products/${id}`,body)),deleteProduct:id=>api.delete(`/products/${id}`)};
