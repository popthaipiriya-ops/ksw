// HPProductCard.jsx — Product card, Flash Sale countdown, product carousels
const { useState: useStatePC, useEffect: useEffectPC } = React;

function HPProductCard({ p, onAddToCart, flash }) {
  const [added, setAdded] = useStatePC(false);
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : null;
  const soldPct = Math.min(100, Math.round((p.sold / (p.sold + p.stock)) * 100));

  const handleAdd = () => {
    setAdded(true);
    onAddToCart(p);
    setTimeout(() => setAdded(false), 1100);
  };

  return (
    <div
      style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:'10px', overflow:'hidden', display:'flex', flexDirection:'column', position:'relative', transition:'box-shadow 0.15s ease, transform 0.15s ease', minWidth:0 }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {discount && (
        <div style={{ position:'absolute', top:'8px', left:'8px', zIndex:2, background:'#e8551c', color:'#fff', fontSize:'12px', fontWeight:'700', padding:'3px 8px', borderRadius:'6px', fontFamily:'Mitr, sans-serif' }}>-{discount}%</div>
      )}
      <div style={{ height:'150px', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', borderBottom:'1px solid #f5f5f5' }}>
        <img src={p.img} style={{ maxHeight:'118px', maxWidth:'118px', objectFit:'contain' }} />
      </div>
      <div style={{ padding:'10px 12px 12px', display:'flex', flexDirection:'column', gap:'3px', flex:1 }}>
        {p.brand && <div style={{ fontSize:'10px', color:'#9e9e9e', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.04em' }}>{p.brand}</div>}
        <div style={{ fontSize:'13px', color:'#333', lineHeight:'1.4', height:'36px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.name}</div>
        <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginTop:'2px' }}>
          <span style={{ fontFamily:'Mitr, sans-serif', fontSize:'19px', fontWeight:'700', color:'#e8551c' }}>฿{p.price.toLocaleString()}</span>
          {p.oldPrice && <span style={{ fontSize:'12px', color:'#bbb', textDecoration:'line-through' }}>฿{p.oldPrice.toLocaleString()}</span>}
        </div>
        {p.installment && <div style={{ fontSize:'10px', color:'#2e6b2e', fontWeight:'600' }}>ผ่อน 0% นาน 10 เดือน</div>}
        {flash && (
          <div style={{ marginTop:'6px' }}>
            <div style={{ height:'14px', background:'#fde0d4', borderRadius:'999px', overflow:'hidden', position:'relative' }}>
              <div style={{ width:`${soldPct}%`, height:'100%', background:'linear-gradient(90deg, #e8551c, #ed6a34)', borderRadius:'999px' }} />
              <span style={{ position:'absolute', top:0, left:0, right:0, textAlign:'center', fontSize:'9px', color:'#7a2508', fontWeight:'700', lineHeight:'14px' }}>ขายแล้ว {p.sold} ชิ้น</span>
            </div>
          </div>
        )}
        <button
          style={{ marginTop:'8px', background:added ? '#357a35' : '#2e6b2e', color:'#fff', border:'none', borderRadius:'999px', padding:'8px', fontFamily:'Sarabun, sans-serif', fontSize:'13px', fontWeight:'700', cursor:'pointer', transition:'background 0.2s ease' }}
          onClick={handleAdd}
        >{added ? '✓ เพิ่มแล้ว' : 'หยิบใส่ตะกร้า'}</button>
      </div>
    </div>
  );
}

function useCountdown(initialSeconds) {
  const [t, setT] = useStatePC(initialSeconds);
  useEffectPC(() => {
    const timer = setInterval(() => setT(prev => prev > 0 ? prev - 1 : initialSeconds), 1000);
    return () => clearInterval(timer);
  }, []);
  const h = String(Math.floor(t / 3600)).padStart(2, '0');
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const s = String(t % 60).padStart(2, '0');
  return [h, m, s];
}

function HPFlashSale({ onAddToCart }) {
  const [h, m, s] = useCountdown(7 * 3600 + 42 * 60 + 18);
  const items = HP_PRODUCTS.filter(p => p.oldPrice).slice(0, 6);
  const box = { background:'#1a1a1a', color:'#fff', fontFamily:'Mitr, sans-serif', fontSize:'16px', fontWeight:'700', borderRadius:'6px', padding:'4px 8px', minWidth:'30px', textAlign:'center' };
  return (
    <section style={{ background:'#fff7f3', padding:'24px 0', borderTop:'1px solid #fde0d4' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'26px' }}>⚡</span>
            <span style={{ fontFamily:'Mitr, sans-serif', fontSize:'26px', fontWeight:'700', color:'#e8551c', letterSpacing:'0.02em' }}>FLASH SALE</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <span style={{ fontSize:'13px', color:'#666', fontWeight:'600' }}>จบใน</span>
            <div style={box}>{h}</div><span style={{ color:'#e8551c', fontWeight:'700' }}>:</span>
            <div style={box}>{m}</div><span style={{ color:'#e8551c', fontWeight:'700' }}>:</span>
            <div style={box}>{s}</div>
          </div>
          <span style={{ marginLeft:'auto', fontSize:'13px', color:'#2e6b2e', fontWeight:'700', cursor:'pointer' }}>ดูทั้งหมด →</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'12px' }}>
          {items.map(p => <HPProductCard key={p.id} p={p} onAddToCart={onAddToCart} flash={true} />)}
        </div>
      </div>
    </section>
  );
}

function HPProductCarousel({ title, subtitle, products, onAddToCart, bg }) {
  return (
    <section style={{ background:bg || '#fff', padding:'24px 0' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <div>
            <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1a1a1a', lineHeight:'1.2' }}>{title}</h2>
            {subtitle && <div style={{ fontSize:'13px', color:'#888', marginTop:'2px' }}>{subtitle}</div>}
          </div>
          <span style={{ fontSize:'13px', color:'#2e6b2e', fontWeight:'700', cursor:'pointer' }}>ดูทั้งหมด →</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'12px' }}>
          {products.map(p => <HPProductCard key={p.id} p={p} onAddToCart={onAddToCart} />)}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HPProductCard, HPFlashSale, HPProductCarousel });
