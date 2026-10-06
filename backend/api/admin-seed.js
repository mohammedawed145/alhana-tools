import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import {Category} from '../models/catalog.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({success:false,message:'Method not allowed'});
  if (!process.env.SEED_TOKEN || req.query?.token !== process.env.SEED_TOKEN) return res.status(404).json({success:false,message:'Not found'});
  await connectDB();
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return res.status(500).json({success:false,message:'Admin env is missing'});
  const hash = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate({email},{name:'مدير مؤسسة الهنا لتجارة العدد وارد الامارات',email,phone:'',password:hash,role:'admin',isActive:true},{upsert:true,new:true,setDefaultsOnInsert:true});
  for (const c of [{name:'عدد يدوية',slug:'hand-tools'},{name:'معدات كهربائية',slug:'power-tools'},{name:'معدات لحام',slug:'welding'},{name:'معدات ورش',slug:'workshop'}]) await Category.findOneAndUpdate({slug:c.slug},c,{upsert:true,new:true,setDefaultsOnInsert:true});
  return res.json({success:true,message:'Admin and starter categories seeded'});
}
