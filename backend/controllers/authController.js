import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {ok,fail} from '../middleware/core.js';
const tokenFor=u=>jwt.sign({userId:u._id,role:u.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'});
export async function register(req,res){return fail(res,'Customer registration is disabled; checkout is available as a guest',403)}
export async function login(req,res){const email=String(req.body?.email||'').trim().toLowerCase();const password=String(req.body?.password||'');const configuredEmail=String(process.env.ADMIN_EMAIL||'').trim().toLowerCase();const configuredPassword=String(process.env.ADMIN_PASSWORD||'');let u=await User.findOne({email,isActive:true}).select('+password');const isConfiguredAdmin=email===configuredEmail&&configuredEmail&&password===configuredPassword;if(isConfiguredAdmin&&(!u||u.role!=='admin'||!(await bcrypt.compare(password,u.password)))){const hash=await bcrypt.hash(configuredPassword,12);u=await User.findOneAndUpdate({email},{name:'مدير مؤسسة الهنا لتجارة العدد وارد الامارات',email,phone:u?.phone||'',password:hash,role:'admin',isActive:true},{upsert:true,new:true,setDefaultsOnInsert:true}).select('+password')}if(!u||u.role!=='admin'||!(await bcrypt.compare(password,u.password)))return fail(res,'بيانات دخول المدير غير صحيحة',401);return ok(res,{token:tokenFor(u),user:{_id:u._id,name:u.name,email:u.email,phone:u.phone,role:u.role}},'Admin login successful')}
export async function me(req,res){return ok(res,{user:req.user})}
