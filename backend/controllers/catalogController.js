import {Product,Category} from '../models/catalog.js';
import {ok,fail} from '../middleware/core.js';

const slugify=value=>String(value||'').toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/[\s_-]+/g,'-').replace(/^-+|-+$/g,'');
async function uniqueSlug(Model,value,excludeId){const base=slugify(value)||`item-${Date.now()}`;let candidate=base;let suffix=2;while(await Model.exists(excludeId?{slug:candidate,_id:{$ne:excludeId}}:{slug:candidate}))candidate=`${base}-${suffix++}`;return candidate;}
const imageData=files=>files?.map(file=>file.buffer?`data:${file.mimetype};base64,${file.buffer.toString('base64')}`:`/uploads/products/${file.filename}`);
const allowedSorts=new Set(['-createdAt','createdAt','price','-price','name','-name']);

const publicProduct=record=>{const product=record.toObject();const cover=product.thumbnail||product.images?.[0];product.images=cover?[cover]:[];delete product.thumbnail;return product};

export async function listProducts(req,res){
  const {page=1,limit=12,search,category,brand,minPrice,maxPrice,stock,featured,sort='-createdAt'}=req.query;
  const parsedPage=Number.parseInt(page,10);
  const parsedLimit=Number.parseInt(limit,10);
  const safePage=Number.isInteger(parsedPage)&&parsedPage>0?parsedPage:1;
  const safeLimit=Number.isInteger(parsedLimit)&&parsedLimit>0?Math.min(parsedLimit,100):12;
  const safeSort=allowedSorts.has(String(sort))?String(sort):'-createdAt';
  const q={isActive:true};
  const searchTerm=String(search||'').trim().slice(0,100);
  if(searchTerm)q.$text={$search:searchTerm};
  if(category)q.category=category;
  if(brand)q.brand=brand;
  if(featured==='true'||featured==='false')q.featured=featured==='true';
  if(stock==='in')q.stock={$gt:0};
  const priceRange={};
  const min=Number(minPrice);
  const max=Number(maxPrice);
  if(minPrice!==undefined&&minPrice!==''&&Number.isFinite(min))priceRange.$gte=Math.max(0,min);
  if(maxPrice!==undefined&&maxPrice!==''&&Number.isFinite(max))priceRange.$lte=Math.max(0,max);
  if(Object.keys(priceRange).length)q.price=priceRange;
  const total=await Product.countDocuments(q);
  const records=await Product.find(q).populate('category','name slug').sort(safeSort).skip((safePage-1)*safeLimit).limit(safeLimit);
  const products=records.map(publicProduct);
  return ok(res,{products,pagination:{page:safePage,limit:safeLimit,total,totalPages:Math.ceil(total/safeLimit)}});
}

export async function featuredProducts(req,res){
  const parsedPage=Number.parseInt(req.query.page,10);
  const parsedLimit=Number.parseInt(req.query.limit,10);
  const page=Number.isInteger(parsedPage)&&parsedPage>0?parsedPage:1;
  const limit=Number.isInteger(parsedLimit)&&parsedLimit>0?Math.min(parsedLimit,100):4;
  const featuredFilter={isActive:true,featured:true};
  const featuredTotal=await Product.countDocuments(featuredFilter);
  const filter=featuredTotal?featuredFilter:{isActive:true};
  const total=featuredTotal?featuredTotal:await Product.countDocuments(filter);
  const records=await Product.find(filter).populate('category','name slug').sort('-createdAt').skip((page-1)*limit).limit(limit);
  return ok(res,{products:records.map(publicProduct),pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}});
}

export async function getProduct(req,res){const p=await Product.findOne({_id:req.params.id,isActive:true}).populate('category');return p?ok(res,{product:p}):fail(res,'Product not found',404)}
export async function createProduct(req,res){const data={...req.body,slug:await uniqueSlug(Product,req.body.slug||req.body.name)};if(req.files?.images?.length)data.images=imageData(req.files.images);if(req.files?.thumbnail?.length)data.thumbnail=imageData(req.files.thumbnail)[0];return ok(res,{product:await Product.create(data)},'Product created',201)}
export async function updateProduct(req,res){const data={...req.body};if(data.name||data.slug)data.slug=await uniqueSlug(Product,data.slug||data.name,req.params.id);if(req.files?.images?.length)data.images=imageData(req.files.images);if(req.files?.thumbnail?.length)data.thumbnail=imageData(req.files.thumbnail)[0];const p=await Product.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true});return p?ok(res,{product:p}):fail(res,'Product not found',404)}
export async function deleteProduct(req,res){const p=await Product.findByIdAndUpdate(req.params.id,{isActive:false},{new:true});return p?ok(res,null,'Product deleted'):fail(res,'Product not found',404)}
export async function listCategories(req,res){return ok(res,{categories:await Category.find({isActive:true}).sort('name')})}
export async function getCategory(req,res){const category=await Category.findById(req.params.id);return category?ok(res,{category}):fail(res,'Category not found',404)}
export async function createCategory(req,res){const category=await Category.create({...req.body,slug:await uniqueSlug(Category,req.body.slug||req.body.name)});return ok(res,{category},'Category created',201)}
export async function updateCategory(req,res){const data={...req.body};if(data.name||data.slug)data.slug=await uniqueSlug(Category,data.slug||data.name,req.params.id);return ok(res,{category:await Category.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true})})}
export async function deleteCategory(req,res){return ok(res,{category:await Category.findByIdAndUpdate(req.params.id,{isActive:false},{new:true})},'Category deleted')}
