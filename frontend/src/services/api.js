import axios from 'axios';
const API_URL=import.meta.env.VITE_API_URL||'https://alhana-tools-eug1.vercel.app/api';
export const api=axios.create({baseURL:API_URL,headers:{'Content-Type':'application/json'},timeout:10000});
api.interceptors.request.use(config=>{const token=localStorage.getItem('oddatak-token');if(token)config.headers.Authorization=`Bearer ${token}`;return config});
export const productService={list:params=>api.get('/products',{params}),get:id=>api.get(`/products/${id}`),featured:()=>api.get('/products?featured=true')};
export const authService={login:payload=>api.post('/auth/login',payload),register:payload=>api.post('/auth/register',payload),me:()=>api.get('/auth/me'),changePassword:payload=>api.put('/auth/change-password',payload)};
export const orderService={create:payload=>api.post('/orders',payload),list:()=>api.get('/orders/my-orders'),adminList:()=>api.get('/orders'),updateStatus:(id,status)=>api.put(`/orders/${id}/status`,{status}),updatePaymentStatus:(id,payload)=>api.put(`/orders/${id}/payment-status`,payload),updateShipment:(id,payload)=>api.put(`/orders/${id}/shipment`,payload),uploadReceipt:(id,file)=>{const body=new FormData();body.append('receipt',file);return api.post(`/orders/${id}/payment-receipt`,body)}};
export const messageService={send:payload=>api.post('/messages',payload),list:()=>api.get('/messages'),update:(id,payload)=>api.put(`/messages/${id}`,payload)};
export const adminService={stats:()=>api.get('/admin/stats'),users:()=>api.get('/users'),updateUser:(id,payload)=>api.put(`/users/${id}`,payload),products:params=>api.get('/products',{params}),createProduct:form=>api.post('/products',form),updateProduct:(id,form)=>api.put(`/products/${id}`,form),deleteProduct:id=>api.delete(`/products/${id}`)};
