import path from 'node:path';
import mongoose from 'mongoose';
import User from '../models/User.js';
import {Order,Message,Product} from '../models/catalog.js';
import {ok,fail} from '../middleware/core.js';

const SHIPPING_FEE=Number(process.env.SHIPPING_FEE||150);
const channels=['instapay','vodafone_cash'];

export async function createOrder(req,res){
  const {items,customerName,phone,email,governorate,shippingAddress,notes,paymentMethod,shippingFeePaymentMethod,paymentReference,shippingMethod='post_office_pickup'}=req.body;
  if(!Array.isArray(items)||!items.length||!customerName||!phone||!shippingAddress||!['cash_on_delivery','instapay','vodafone_cash'].includes(paymentMethod)||!channels.includes(shippingFeePaymentMethod)||shippingMethod!=='post_office_pickup')return fail(res,'بيانات الطلب أو طريقة الدفع غير مكتملة',422);
  if(paymentMethod!=='cash_on_delivery'&&paymentMethod!==shippingFeePaymentMethod)return fail(res,'طريقة الدفع الكاملة يجب أن تطابق قناة دفع رسوم الشحن',422);

  const session=await mongoose.startSession();
  let order;
  try{
    await session.withTransaction(async()=>{
      const products=await Product.find({_id:{$in:items.map(i=>i.product)},isActive:true}).session(session);
      const byId=new Map(products.map(p=>[String(p._id),p]));
      const normalized=[];
      for(const item of items){
        const p=byId.get(String(item.product));
        const quantity=Number(item.quantity);
        if(!p||!Number.isInteger(quantity)||quantity<1)throw Object.assign(new Error('منتج أو كمية غير صحيحة'),{statusCode:422});
        if(p.stock<quantity)throw Object.assign(new Error(`الكمية غير متاحة للمنتج ${p.name}`),{statusCode:409});
        const price=p.discountPrice??p.price;
        normalized.push({product:p._id,name:p.name,price,quantity,image:p.images?.[0]});
      }
      const subtotal=normalized.reduce((s,i)=>s+i.price*i.quantity,0);
      const totalPrice=subtotal+SHIPPING_FEE;
      const amountDueOnDelivery=paymentMethod==='cash_on_delivery'?subtotal:0;
      for(const item of normalized){
        const reserved=await Product.findOneAndUpdate({_id:item.product,stock:{$gte:item.quantity}},{$inc:{stock:-item.quantity}},{new:true,session});
        if(!reserved)throw Object.assign(new Error('تعذر حجز الكمية، حاول مرة أخرى'),{statusCode:409});
      }
      [order]=await Order.create([{user:req.user?._id,items:normalized,subtotal,shippingFee:SHIPPING_FEE,shippingMethod,totalPrice,amountDueOnDelivery,customerName,phone,email,governorate,shippingAddress,notes,paymentMethod,shippingFeePaymentMethod,shippingFeePaid:false,paymentStatus:'pending_verification',paymentReference,status:'awaiting_shipping_fee'}],{session});
    });
  }catch(error){
    return fail(res,error.statusCode?error.message:'تعذر إنشاء الطلب، حاول مرة أخرى',error.statusCode||500);
  }finally{await session.endSession();}
  return ok(res,{order,paymentInstructions:{shippingFee:SHIPPING_FEE,instapayAddress:process.env.INSTAPAY_ADDRESS||'',vodafoneCashNumber:process.env.VODAFONE_CASH_NUMBER||'',amountDueOnDelivery:order.amountDueOnDelivery}},'تم تسجيل الطلب، أرسل رسوم الشحن وانتظر التأكيد',201);
}

export async function uploadReceipt(req,res){const order=await Order.findById(req.params.id);if(!order)return fail(res,'Order not found',404);if(req.user?.role!=='admin'&&(!order.user||!order.user.equals(req.user._id)))return fail(res,'Forbidden',403);if(!req.file)return fail(res,'Payment receipt file is required',422);order.paymentReceipt=`/uploads/receipts/${req.file.filename}`;order.paymentStatus='pending_verification';await order.save();return ok(res,{order,paymentReceipt:order.paymentReceipt},'Receipt uploaded')}
export async function myOrders(req,res){return ok(res,{orders:await Order.find({user:req.user._id}).sort('-createdAt')})}
export async function getOrder(req,res){const o=await Order.findById(req.params.id).populate('user','name email phone');if(!o)return fail(res,'Order not found',404);if(req.user?.role!=='admin'&&o.user&&(!o.user._id.equals(req.user._id)))return fail(res,'Forbidden',403);return ok(res,{order:o})}
export async function adminOrders(req,res){return ok(res,{orders:await Order.find().populate('user','name email').sort('-createdAt')})}
export async function updateOrderStatus(req,res){const allowed=['awaiting_shipping_fee','pending','confirmed','processing','shipped','delivered','cancelled'];const next=req.body.status;if(!allowed.includes(next))return fail(res,'Invalid order status',422);const order=await Order.findById(req.params.id);if(!order)return fail(res,'Order not found',404);if(['processing','shipped','delivered'].includes(next)&&!order.shippingFeePaid)return fail(res,'Confirm shipping fee payment before fulfillment',409);if(next==='shipped'&&!order.shipment?.trackingNumber)return fail(res,'Add a tracking number before shipping',422);if(next==='delivered'&&order.status!=='shipped')return fail(res,'Order must be shipped before delivery',422);order.status=next;if(next==='shipped')order.shipment.shippedAt=new Date();if(next==='delivered')order.shipment.deliveredAt=new Date();await order.save();return ok(res,{order})}
export async function updatePaymentStatus(req,res){const {shippingFeePaid,paymentStatus}=req.body;const allowed=['pending_verification','shipping_fee_paid','paid','cod_due'];if(!allowed.includes(paymentStatus))return fail(res,'Invalid payment status',422);const patch={paymentStatus,shippingFeePaid:Boolean(shippingFeePaid)};if(paymentStatus==='shipping_fee_paid')patch.status='pending';if(paymentStatus==='paid')patch.status='confirmed';const order=await Order.findByIdAndUpdate(req.params.id,patch,{new:true,runValidators:true});return order?ok(res,{order},'Payment status updated'):fail(res,'Order not found',404)}
export async function updateShipment(req,res){const {carrier,trackingNumber,trackingUrl}=req.body;const order=await Order.findByIdAndUpdate(req.params.id,{'shipment.carrier':carrier||'البريد المصري','shipment.trackingNumber':trackingNumber,'shipment.trackingUrl':trackingUrl},{new:true,runValidators:true});return order?ok(res,{order},'Shipment updated'):fail(res,'Order not found',404)}
export async function users(req,res){return ok(res,{users:await User.find().sort('-createdAt')})}
export async function updateUser(req,res){const safe={};for(const key of ['name','phone','role','isActive'])if(req.body[key]!==undefined)safe[key]=req.body[key];return ok(res,{user:await User.findByIdAndUpdate(req.params.id,safe,{new:true,runValidators:true})})}
export async function deleteUser(req,res){return ok(res,{user:await User.findByIdAndUpdate(req.params.id,{isActive:false},{new:true})},'User deactivated')}
export async function sendMessage(req,res){if(!req.body.name||!req.body.email||!req.body.message)return fail(res,'Name, email and message are required',422);return ok(res,{message:await Message.create(req.body)},'Message received',201)}
export async function messages(req,res){return ok(res,{messages:await Message.find().sort('-createdAt')})}
export async function updateMessage(req,res){return ok(res,{message:await Message.findByIdAndUpdate(req.params.id,req.body,{new:true})})}
export async function stats(req,res){const [totalProducts,totalOrders,totalUsers,pendingOrders,revenue]=await Promise.all([Product.countDocuments({isActive:true}),Order.countDocuments(),User.countDocuments(),Order.countDocuments({status:{$in:['awaiting_shipping_fee','pending']}}),Order.aggregate([{$match:{status:{$nin:['cancelled','awaiting_shipping_fee']}}},{$group:{_id:null,total:{$sum:'$totalPrice'}}}])]);return ok(res,{totalProducts,totalOrders,totalUsers,pendingOrders,totalRevenue:revenue[0]?.total||0})}
export async function downloadReceipt(req,res){const order=await Order.findById(req.params.id);if(!order?.paymentReceipt)return fail(res,'Receipt not found',404);const file=path.join(process.cwd(),order.paymentReceipt.replace(/^\/?uploads[\\/]receipts[\\/]*/,'uploads/receipts/'));return res.sendFile(file)}
