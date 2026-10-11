import {useState} from 'react';
import {ArrowLeft,Check,Clock3,Package,Search,Truck,XCircle} from 'lucide-react';
import {orderService} from './services/api';

const steps=[
  {key:'awaiting_shipping_fee',label:'في انتظار تأكيد رسوم الشحن'},
  {key:'pending',label:'تم تأكيد رسوم الشحن'},
  {key:'confirmed',label:'تم تأكيد الطلب'},
  {key:'processing',label:'جارٍ تجهيز الطلب'},
  {key:'shipped',label:'تم شحن الطلب'},
  {key:'delivered',label:'تم التسليم'}
];
const statusNames={cancelled:'تم إلغاء الطلب'};
function previousOrderId(){try{return JSON.parse(localStorage.getItem('oddatak-last-order')||'null')?._id||''}catch{return ''}}
function safeTrackingUrl(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:''}catch{return ''}}

export default function TrackOrder({Footer}){
  const [form,setForm]=useState({orderId:previousOrderId(),phone:''});
  const [order,setOrder]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const submit=async event=>{
    event.preventDefault();setLoading(true);setError('');setOrder(null);
    try{const response=await orderService.track({orderId:form.orderId.trim(),phone:form.phone.trim()});setOrder(response.data?.data?.order||null);if(!response.data?.data?.order)setError('لم يتم العثور على طلب مطابق. تحقق من رقم الطلب ورقم الهاتف.')}catch{setError('لم يتم العثور على طلب مطابق. تحقق من رقم الطلب ورقم الهاتف.')}finally{setLoading(false)}
  };
  const activeIndex=order?steps.findIndex(step=>step.key===order.status):-1;
  return <>
    <main className="inner-page tracking-page">
      <div className="container page-title"><span className="kicker">خدمة متابعة الطلبات</span><h1>تتبع <em>طلبك</em></h1><p>أدخل رقم الطلب ورقم الهاتف المستخدم عند الشراء لعرض آخر حالة.</p></div>
      <div className="container tracking-layout">
        <form className="form-card tracking-form" onSubmit={submit}>
          <h2><Package size={20}/> بيانات التحقق</h2>
          <label className="field">رقم الطلب<input value={form.orderId} onChange={e=>setForm({...form,orderId:e.target.value})} placeholder="أدخل رقم الطلب الكامل" autoComplete="off" required/></label>
          <label className="field">رقم الهاتف عند الشراء<input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="مثال: 010xxxxxxxx" required/></label>
          {error&&<div className="error-box" role="alert">{error}</div>}
          <button className="btn primary" disabled={loading}>{loading?'جارٍ البحث…':'عرض حالة الطلب'} <Search size={17}/></button>
          <small className="tracking-privacy">لن نعرض تفاصيل العنوان أو بيانات الدفع في صفحة التتبع.</small>
        </form>
        {order?<section className="tracking-result" aria-live="polite">
          <div className="tracking-result-head"><span className="tracking-icon"><Truck size={22}/></span><div><small>حالة الطلب</small><h2>{statusNames[order.status]||steps.find(step=>step.key===order.status)?.label||order.status}</h2></div></div>
          <div className="tracking-order-meta"><span>رقم الطلب</span><code>{order.id}</code><span>تاريخ التسجيل</span><b>{order.createdAt?new Date(order.createdAt).toLocaleDateString('ar-EG'):'—'}</b></div>
          {order.status==='cancelled'?<div className="tracking-cancelled"><XCircle size={20}/> تم إلغاء الطلب. يرجى التواصل معنا إذا كنت تحتاج إلى مساعدة.</div>:<ol className="tracking-steps">{steps.map((step,index)=>{
            const reached=activeIndex>=index;
            const current=activeIndex===index;
            return <li key={step.key} className={`${reached?'reached':''} ${current?'current':''}`}><span className="tracking-step-dot">{reached?<Check size={14}/>:<Clock3 size={14}/>}</span><span><b>{step.label}</b>{current&&<small>الحالة الحالية</small>}</span></li>;
          })}</ol>}
          {order.shipment?.trackingNumber&&<div className="tracking-shipment"><b>{order.shipment.carrier||'شركة الشحن'}</b><span>رقم الشحنة: <code>{order.shipment.trackingNumber}</code></span>{safeTrackingUrl(order.shipment.trackingUrl)&&<a href={safeTrackingUrl(order.shipment.trackingUrl)} target="_blank" rel="noreferrer">افتح صفحة تتبع شركة الشحن <ArrowLeft size={15}/></a>}</div>}
        </section>:<aside className="tracking-hint"><Package size={30}/><h2>تابع شحنتك خطوة بخطوة</h2><p>سنظهر حالة الطلب ورقم الشحنة عند إدخاله من فريق المتجر.</p></aside>}
      </div>
    </main>
    {Footer&&<Footer/>}
  </>;
}
