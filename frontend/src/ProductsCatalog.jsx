import {useEffect,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {ArrowLeft,ArrowRight,Boxes,Package,Search,SlidersHorizontal} from 'lucide-react';
import {api,productService} from './services/api';

const number=new Intl.NumberFormat('ar-EG');
const priceOf=p=>Number(p?.discountPrice??p?.price??0);
const imageUrl=src=>{
  if(Array.isArray(src))src=src[0];
  if(!src||typeof src!=='string')return '';
  if(src.startsWith('data:')||src.startsWith('http://')||src.startsWith('https://'))return src;
  if(src.startsWith('//'))return `https:${src}`;
  const base=(api.defaults.baseURL||'').replace(/\/api\/?$/,'');
  return `${base}/${src.replace(/^\/+/, '')}`;
};

export default function ProductsCatalog({add,Footer}){
  const location=useLocation();
  const urlCategory=new URLSearchParams(location.search).get('category')||'';
  const [categories,setCategories]=useState([]);
  const [category,setCategory]=useState('');
  const [searchInput,setSearchInput]=useState('');
  const [search,setSearch]=useState('');
  const [sort,setSort]=useState('-createdAt');
  const [page,setPage]=useState(1);
  const [products,setProducts]=useState([]);
  const [pagination,setPagination]=useState({page:1,limit:12,total:0,totalPages:0});
  const [loading,setLoading]=useState(true);
  const [failed,setFailed]=useState(false);
  const [retry,setRetry]=useState(0);

  useEffect(()=>{productService.categories().then(r=>setCategories(r.data?.data?.categories||[])).catch(()=>setCategories([]))},[]);
  useEffect(()=>{
    if(!urlCategory){setCategory('');return;}
    const match=categories.find(c=>c._id===urlCategory||c.name===urlCategory||c.slug===urlCategory);
    setCategory(match?match._id:'');
  },[urlCategory,categories]);
  useEffect(()=>{const timer=setTimeout(()=>setSearch(searchInput.trim()),250);return()=>clearTimeout(timer)},[searchInput]);
  useEffect(()=>{setPage(1)},[search,category,sort]);
  useEffect(()=>{
    let active=true;
    setLoading(true);setFailed(false);
    productService.list({page,limit:12,search:search||undefined,category:category||undefined,sort}).then(r=>{
      if(!active)return;
      setProducts(r.data?.data?.products||[]);
      setPagination(r.data?.data?.pagination||{page,limit:12,total:0,totalPages:0});
    }).catch(()=>{if(active){setProducts([]);setPagination({page,limit:12,total:0,totalPages:0});setFailed(true)}}).finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[page,search,category,sort,retry]);

  const clearFilters=()=>{setSearchInput('');setSearch('');setCategory('');setSort('-createdAt');setPage(1)};
  const totalPages=Math.max(1,Number(pagination.totalPages)||1);
  const currentPage=Math.min(Number(pagination.page)||page,totalPages);
  const categoryOptions=categories;

  return <>
    <main className="inner-page catalog-page">
      <section className="catalog-intro container">
        <div><span className="kicker">كتالوج مؤسسة الهنا لتجارة العدد وارد الإمارات</span><h1>اعثر على <em>الأداة المناسبة</em></h1><p>ابحث في المنتجات، واختر القسم أو رتّب النتائج حسب احتياجك.</p></div>
        <div className="catalog-intro-mark"><Boxes size={36}/><span>معدات للعمل اليومي</span></div>
      </section>
      <div className="container catalog-shell">
        <aside className="filters catalog-filters" aria-label="تصفية المنتجات">
          <div className="filter-title"><SlidersHorizontal size={18}/><h2>تصفية المنتجات</h2></div>
          <label>بحث في الكتالوج<div className="catalog-search"><Search size={17}/><input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="اسم المنتج أو الماركة"/></div></label>
          <label>القسم<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">كل الأقسام</option>{categoryOptions.map((c,i)=><option key={c._id||i} value={categories.length?c._id:''}>{c.name}</option>)}</select></label>
          <label>ترتيب النتائج<select value={sort} onChange={e=>setSort(e.target.value)}><option value="-createdAt">الأحدث</option><option value="price">السعر: الأقل أولاً</option><option value="-price">السعر: الأعلى أولاً</option></select></label>
          <button className="btn ghost full" type="button" onClick={clearFilters}>مسح التصفية</button>
        </aside>
        <section className="catalog-results" aria-label="قائمة المنتجات">
          <div className="catalog-toolbar"><div><span className="kicker">الكتالوج</span><h2>المنتجات المتاحة</h2></div><div className="catalog-count">{loading?'…':number.format(pagination.total)} <span>منتج</span></div></div>
          {failed?<div className="catalog-state"><Package/><h3>تعذر تحميل المنتجات</h3><p>تحقق من اتصال الإنترنت وحاول مرة أخرى.</p><button className="btn primary" onClick={()=>setRetry(value=>value+1)}>إعادة المحاولة</button></div>:null}
          {!failed&&loading?<div className="catalog-state" role="status" aria-live="polite">جارٍ تحميل المنتجات…</div>:null}
          {!failed&&!loading&&products.length>0?<div className="products-grid">{products.map(p=>{
            const unavailable=Number(p.stock??0)<=0;
            const src=imageUrl(p.images?.[0]||p.image);
            return <article className="product-card catalog-product-card" key={p._id}>
              <Link to={`/products/${p._id}`} className="product-image" aria-label={`عرض ${p.name}`}>
                <span className={`tag ${unavailable?'tag-unavailable':''}`}>{unavailable?'غير متوفر':'متوفر'}</span>
                {src?<img src={src} alt={p.name} loading="lazy" decoding="async"/>:<div className="image-placeholder"><Boxes size={34}/><span>لا توجد صورة</span></div>}
              </Link>
              <div className="product-info"><div className="product-brand"><span>{p.brand||'مؤسسة الهنا'}</span><span className="stock-label">{unavailable?'نفد المخزون':'متوفر'}</span></div>
                <Link to={`/products/${p._id}`} className="catalog-product-name"><h3>{p.name}</h3></Link>
                {p.model&&<small className="model">{p.model}</small>}
                <div className="product-bottom"><div><strong>{number.format(priceOf(p))} <small>ج.م</small></strong>{p.discountPrice&&<del>{number.format(p.price)} ج.م</del>}</div>
                  <button className="add" type="button" disabled={unavailable} onClick={()=>add(p)} aria-label={unavailable?'المنتج غير متوفر':`إضافة ${p.name} إلى السلة`}><span aria-hidden="true">+</span></button>
                </div>
              </div>
            </article>;
          })}</div>:null}
          {!failed&&!loading&&products.length===0?<div className="catalog-state"><Package/><h3>{search||category?'لا توجد نتائج مطابقة':'لا توجد منتجات منشورة'}</h3><p>{search||category?'جرّب تغيير البحث أو مسح التصفية.':'تواصل معنا للاستفسار عن المنتجات المتاحة.'}</p>{search||category?<button className="btn ghost" onClick={clearFilters}>مسح التصفية</button>:<Link className="btn primary" to="/contact">تواصل معنا</Link>}</div>:null}
          {!failed&&totalPages>1?<nav className="catalog-pagination" aria-label="صفحات المنتجات"><button className="btn ghost" type="button" disabled={currentPage<=1||loading} onClick={()=>setPage(p=>Math.max(1,p-1))}><ArrowRight size={16}/> السابق</button><span>صفحة {number.format(currentPage)} من {number.format(totalPages)}</span><button className="btn ghost" type="button" disabled={currentPage>=totalPages||loading} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>التالي <ArrowLeft size={16}/></button></nav>:null}
        </section>
      </div>
    </main>
    {Footer&&<Footer/>}
  </>;
}
