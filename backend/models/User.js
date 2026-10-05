import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true,minlength:2},email:{type:String,required:true,unique:true,lowercase:true,trim:true,match:/^\S+@\S+\.\S+$/},phone:{type:String,required:true,trim:true},password:{type:String,required:true,minlength:6,select:false},role:{type:String,enum:['user','admin'],default:'user'},isActive:{type:Boolean,default:true}},{timestamps:true});
schema.pre('save',async function(next){if(!this.isModified('password'))return next();this.password=await bcrypt.hash(this.password,12);next()});schema.methods.comparePassword=function(p){return bcrypt.compare(p,this.password)};
export default mongoose.model('User',schema);
