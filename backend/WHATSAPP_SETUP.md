# إعداد إشعارات الطلبات عبر WhatsApp

يرسل الخادم إشعارًا لصاحب المتجر عند إنشاء طلب جديد **فقط** بعد ضبط حساب WhatsApp Business Platform والقالب المعتمد. عند غياب الإعدادات، يُحفظ الطلب عاديًا وتُسجَّل حالة الإشعار على أنها غير مهيأة؛ فشل WhatsApp لا يلغي الطلب.

## 1. إنشاء قالب إشعار

في WhatsApp Manager أنشئ قالبًا من فئة **Utility** باللغة العربية باسم:

```text
new_order_admin_alert
```

استخدم نص الجسم التالي بترتيب المتغيرات نفسه:

```text
طلب جديد رقم {{1}} باسم {{2}}. رقم واتساب العميل: {{3}}. عنوان الاستلام: {{4}}. يرجى التواصل معه لتأكيد الطلب.
```

أرسل القالب للمراجعة وانتظر أن تصبح حالته **APPROVED**. يمكن تغيير الاسم أو لغة القالب، لكن عندها حدّث متغيري البيئة المطابقين.

## 2. إضافة متغيرات الخادم

في إعدادات مشروع API على Vercel أضف المتغيرات التالية إلى Preview أولًا، ثم إلى Production بعد التحقق:

```text
WHATSAPP_ACCESS_TOKEN=<رمز وصول دائم/مناسب للخادم>
WHATSAPP_PHONE_NUMBER_ID=<معرّف رقم الإرسال في Meta>
WHATSAPP_NOTIFICATION_TO=<رقم الاستلام الدولي، أرقام فقط مثل 2010...>
WHATSAPP_ORDER_TEMPLATE=new_order_admin_alert
WHATSAPP_TEMPLATE_LANGUAGE=ar
WHATSAPP_GRAPH_API_VERSION=v26.0
ORDER_DEPOSIT_AMOUNT=150
```

لا تضع رمز الوصول في ملفات الواجهة أو GitHub أو رسائل المحادثة. يجب أن يكون رقم الاستلام مفعّلًا على WhatsApp، وموافقًا على استقبال الرسائل من حساب الأعمال. لا تستخدم رقم الإرسال نفسه كرقم الاستلام؛ أرسل الإشعار إلى رقم المدير/الموظف الذي سيتابع الطلبات.

## 3. بيانات الدفع في الطلب

الدفعة المقدمة الافتراضية 150 جنيه **من قيمة المنتجات نفسها**، وتُدفع قبل تجهيز الطلب عبر قناة التحويل المحددة. المبلغ المتبقي من ثمن المنتجات يُدفع عند الاستلام. لا يضيف الموقع رسوم البريد إلى إجمالي المنتجات؛ يدفع العميل رسوم البريد مباشرةً لمكتب البريد عند الاستلام.

## مراجع Meta الرسمية

- [واجهة إرسال الرسائل](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api.md)
- [أساسيات القوالب وحالات الاعتماد](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview.md)
- [نافذة خدمة العملاء وقواعد الإرسال](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages.md)
