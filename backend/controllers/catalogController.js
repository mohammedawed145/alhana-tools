import {Product,Category} from '../models/catalog.js';
import {ok,fail} from '../middleware/core.js';

const slugify=value=>String(value||'').toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/[\s_-]+/g,'-').replace(/^-+|-+$/g,'');
async function uniqueSlug(Model,value,excludeId){const base=slugify(value)||`item-${Date.now()}`;let candidate=base;let suffix=2;while(await Model.exists(excludeId?{slug:candidate,_id:{$ne:excludeId}}:{slug:candidate}))candidate=`${base}-${suffix++}`;return candidate;}
const imageData=files=>files?.map(file=>file.buffer?`data:${file.mimetype};base64,${file.buffer.toString('base64')}`:`/uploads/products/${file.filename}`);

export async function listProducts(req,res){const {page=1,limit=12,search,category,brand,minPrice,maxPrice,stock,featured,sort='-createdAt'}=req.query;const q={isActive:true};if(search)q.$text={$search:search};if(category)q.category=category;if(brand)q.brand=brand;if(featured!==undefined)q.featured=featured==='true';if(stock==='in')q.stock={$gt:0};if(minPrice||maxPrice)q.price={$gte:Number(minPrice||0),$lte:Number(maxPrice||Infinity)};const total=await Product.countDocuments(q);const products=await Product.find(q).populate('category','name slug').sort(sort).skip((page-1)*limit).limit(Number(limit));return ok(res,{products,pagination:{page:Number(page),limit:Number(limit),total,totalPages:Math.ceil(total/limit)}})}
export async function getProduct(req,res){const p=await Product.findById(req.params.id).populate('category');return p?ok(res,{product:p}):fail(res,'Product not found',404)}
export async function createProduct(req,res){const data={...req.body,slug:await uniqueSlug(Product,req.body.slug||req.body.name)};if(req.files?.length)data.images=imageData(req.files);return ok(res,{product:await Product.create(data)},'Product created',201)}
export async function updateProduct(req,res){const data={...req.body};if(data.name||data.slug)data.slug=await uniqueSlug(Product,data.slug||data.name,req.params.id);if(req.files?.length)data.images=imageData(req.files);const p=await Product.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true});return p?ok(res,{product:p}):fail(res,'Product not found',404)}
export async function deleteProduct(req,res){const p=await Product.findByIdAndUpdate(req.params.id,{isActive:false},{new:true});return p?ok(res,null,'Product deleted'):fail(res,'Product not found',404)}
export async function listCategories(req,res){return ok(res,{categories:await Category.find({isActive:true}).sort('name')})}
export async function getCategory(req,res){const category=await Category.findById(req.params.id);return category?ok(res,{category}):fail(res,'Category not found',404)}
export async function createCategory(req,res){const category=await Category.create({...req.body,slug:await uniqueSlug(Category,req.body.slug||req.body.name)});return ok(res,{category},'Category created',201)}
export async function updateCategory(req,res){const data={...req.body};if(data.name||data.slug)data.slug=await uniqueSlug(Category,data.slug||data.name,req.params.id);return ok(res,{category:await Category.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true})})}
export async function deleteCategory(req,res){return ok(res,{category:await Category.findByIdAndUpdate(req.params.id,{isActive:false},{new:true})},'Category deleted')}
