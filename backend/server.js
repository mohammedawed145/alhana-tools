import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import {errorHandler,fail} from './middleware/core.js';

dotenv.config();
const app=express();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const allowed=(process.env.CLIENT_URL||'http://localhost:5173').split(',').map(x=>x.trim());

app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(cors({origin:(origin,cb)=>!origin||allowed.includes(origin)||origin?.includes('localhost')?cb(null,true):cb(new Error('CORS origin not allowed')),credentials:true}));
app.use(rateLimit({windowMs:15*60*1000,max:Number(process.env.RATE_LIMIT_MAX||300),standardHeaders:true,legacyHeaders:false}));
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:true,limit:'1mb'}));
app.use('/uploads/products',express.static(path.join(__dirname,'uploads/products')));
app.get('/health',(_req,res)=>res.json({success:true,message:'مؤسسة الهنا لتجارة العدد وارد الامارات API is healthy',timestamp:new Date().toISOString()}));
app.use('/api',routes);
app.use((_req,res)=>fail(res,'Route not found',404));
app.use(errorHandler);

export default app;

if(process.env.VERCEL!=='1'){
  const port=process.env.PORT||5000;
  connectDB().then(()=>app.listen(port,()=>console.log(`API listening on port ${port}`))).catch(e=>{console.error(e.message);process.exit(1)});
}
