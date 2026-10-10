import app from '../server.js';
import connectDB from '../config/db.js';
import {Category} from '../models/catalog.js';

const defaultCategories=[
  {name:'أدوات اللحام',slug:'welding'},
  {name:'القطع والجلي',slug:'cutting-grinding'},
  {name:'معدات السيارات',slug:'automotive'},
  {name:'كاميرات المراقبة',slug:'surveillance-cameras'},
  {name:'أدوات الحدائق',slug:'garden-tools'},
  {name:'العدد اليدوية',slug:'hand-tools'},
  {name:'العدد الكهربائية',slug:'power-tools'},
  {name:'معدات الورش',slug:'workshop'}
];

async function ensureDefaultCategories(){
  await Promise.all(defaultCategories.map(category=>Category.findOneAndUpdate(
    {slug:category.slug},
    {$set:{name:category.name,isActive:true},$setOnInsert:category},
    {upsert:true,new:true,setDefaultsOnInsert:true}
  )));
}

export default async function handler(req,res){
  await connectDB();
  await ensureDefaultCategories();
  return app(req,res);
}
