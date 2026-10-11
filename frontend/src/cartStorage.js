const STORAGE_KEY='oddatak-cart';
const MAX_INLINE_IMAGE_CHARS=120000;

export function compactCartProduct(product={}){
  const candidate=product.thumbnail||product.images?.[0]||product.image||'';
  const image=typeof candidate==='string'&&(!candidate.startsWith('data:')||candidate.length<=MAX_INLINE_IMAGE_CHARS)?candidate:'';
  return {
    _id:String(product._id||product.product||''),
    name:String(product.name||''),
    brand:String(product.brand||''),
    model:String(product.model||''),
    price:Number(product.price||0),
    discountPrice:product.discountPrice==null?null:Number(product.discountPrice),
    stock:Number(product.stock||0),
    image,
    q:Math.max(1,Number(product.q||product.quantity||1))
  };
}

export function readCart(){
  try{
    const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
    if(!Array.isArray(stored))return [];
    const items=new Map();
    for(const raw of stored){
      const item=compactCartProduct(raw);
      if(!item._id)continue;
      const existing=items.get(item._id);
      if(existing)existing.q+=item.q;
      else items.set(item._id,item);
    }
    return Array.from(items.values());
  }catch{return []}
}

export function writeCart(cart){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify((cart||[]).map(compactCartProduct).filter(item=>item._id)))}catch{}
}
