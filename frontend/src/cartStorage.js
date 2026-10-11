const STORAGE_KEY='oddatak-cart';
const MAX_INLINE_IMAGE_CHARS=120000;
const numberOr=(value,fallback=0)=>{const number=Number(value);return Number.isFinite(number)?number:fallback};

export function compactCartProduct(product={}){
  const candidates=[product.thumbnail,product.images?.[0],product.image];
  const image=candidates.find(value=>typeof value==='string'&&value&&(!value.startsWith('data:')||value.length<=MAX_INLINE_IMAGE_CHARS))||'';
  const rawQuantity=numberOr(product.q??product.quantity,1);
  const discountPrice=product.discountPrice==null?null:Math.max(0,numberOr(product.discountPrice,numberOr(product.price,0)));
  return {
    _id:String(product._id||product.product||''),
    name:String(product.name||''),
    brand:String(product.brand||''),
    model:String(product.model||''),
    price:Math.max(0,numberOr(product.price,0)),
    discountPrice,
    stock:Math.max(0,numberOr(product.stock,0)),
    image,
    q:Math.max(1,Math.floor(rawQuantity))
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
