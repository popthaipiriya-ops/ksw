// HPApp.jsx — Root app: routing, cart state, page assembly
const { useState: useStateApp } = React;

function HPShopPage({ activeCategory, onAddToCart }) {
  const filtered = activeCategory === 'all' ? HP_PRODUCTS : HP_PRODUCTS.filter(p => p.cat === activeCategory);
  const catLabel = HP_CATEGORIES.find(c => c.id === activeCategory)?.label || 'สินค้าทั้งหมด';
  return (
    <section style={{ background:'#f7f7f7', padding:'24px 0', minHeight:'60vh' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ fontSize:'13px', color:'#888', marginBottom:'12px' }}>
          หน้าหลัก › <span style={{ color:'#2e6b2e', fontWeight:'600' }}>{catLabel}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <h1 style={{ fontSize:'24px', fontWeight:'700', color:'#1a1a1a' }}>{catLabel}</h1>
          <span style={{ fontSize:'13px', color:'#888' }}>{filtered.length} รายการ</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'14px' }}>
          {filtered.map(p => <HPProductCard key={p.id} p={p} onAddToCart={onAddToCart} />)}
        </div>
      </div>
    </section>
  );
}

function HPCartPage({ cartItems, onClear }) {
  const total = cartItems.reduce((s, i) => s + i.price, 0);
  return (
    <section style={{ background:'#f7f7f7', padding:'32px 0', minHeight:'60vh' }}>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'0 20px' }}>
        <h1 style={{ fontSize:'24px', fontWeight:'700', color:'#1a1a1a', marginBottom:'20px' }}>ตะกร้าสินค้า ({cartItems.length})</h1>
        <div style={{ background:'#fff', borderRadius:'12px', padding:'8px 20px' }}>
          {cartItems.length === 0
            ? <div style={{ textAlign:'center', padding:'60px', color:'#aaa', fontSize:'16px' }}>ตะกร้าของคุณว่างเปล่า</div>
            : cartItems.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 0', borderBottom:'1px solid #f0f0f0' }}>
                <img src={item.img} style={{ width:'56px', height:'56px', objectFit:'contain', background:'#f7f7f7', borderRadius:'8px', padding:'4px' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>{item.name}</div>
                  <div style={{ fontSize:'12px', color:'#888' }}>{item.brand}</div>
                </div>
                <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'17px', fontWeight:'700', color:'#e8551c' }}>฿{item.price.toLocaleString()}</div>
              </div>
            ))
          }
        </div>
        {cartItems.length > 0 && (
          <div style={{ background:'#fff', borderRadius:'12px', padding:'20px', marginTop:'14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:'18px', fontWeight:'700' }}>
              ยอดรวม: <span style={{ color:'#e8551c', fontFamily:'Mitr, sans-serif' }}>฿{total.toLocaleString()}</span>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button
                onClick={onClear}
                style={{ background:'#f0f0f0', color:'#444', border:'none', borderRadius:'999px', padding:'11px 22px', fontFamily:'Sarabun, sans-serif', fontSize:'14px', cursor:'pointer' }}
              >ล้างตะกร้า</button>
              <button
                style={{ background:'#2e6b2e', color:'#fff', border:'none', borderRadius:'999px', padding:'11px 28px', fontFamily:'Sarabun, sans-serif', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}
              >ดำเนินการสั่งซื้อ →</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HPApp() {
  const [page, setPage] = useStateApp('home');
  const [activeCategory, setActiveCategory] = useStateApp('all');
  const [cart, setCart] = useStateApp([]);

  const onNavigate = (p) => {
    if (p === 'home')           { setPage('home'); window.scrollTo(0, 0); return; }
    if (p === 'cart')           { setPage('cart'); window.scrollTo(0, 0); return; }
    if (p === 'สินค้าทั้งหมด') { setActiveCategory('all'); setPage('shop'); window.scrollTo(0, 0); return; }
    setPage(p);
  };
  const onCategoryChange = (cat) => { setActiveCategory(cat); setPage('shop'); window.scrollTo(0, 0); };
  const onSearch = () => { setActiveCategory('all'); setPage('shop'); window.scrollTo(0, 0); };
  const onAddToCart = (p) => setCart(prev => [...prev, p]);

  const bestSellers = HP_PRODUCTS.slice().sort((a, b) => b.sold - a.sold).slice(0, 6);
  const newArrivals = HP_PRODUCTS.slice(6, 12);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <HPHeader
        cartCount={cart.length}
        onNavigate={onNavigate}
        onCategoryChange={onCategoryChange}
        onSearch={onSearch}
      />
      <main style={{ flex:1 }}>
        {page === 'home' && (
          <>
            <HPHero onNavigate={onNavigate} onCategoryChange={onCategoryChange} />
            <HPServiceBar />
            <HPFlashSale onAddToCart={onAddToCart} />
            <HPCategoryCircles onCategoryChange={onCategoryChange} />
            <HPProductCarousel title="สินค้าขายดี" subtitle="ยอดนิยมจากลูกค้าทั่วประเทศ" products={bestSellers} onAddToCart={onAddToCart} bg="#f7f7f7" />
            <HPPromoGrid onNavigate={onNavigate} />
            <HPProductCarousel title="สินค้ามาใหม่" subtitle="อัปเดตล่าสุดประจำสัปดาห์" products={newArrivals} onAddToCart={onAddToCart} />
            <HPBrandStrip />
          </>
        )}
        {page === 'shop' && <HPShopPage activeCategory={activeCategory} onAddToCart={onAddToCart} />}
        {page === 'cart' && <HPCartPage cartItems={cart} onClear={() => setCart([])} />}
      </main>
      <HPFooter />
    </div>
  );
}

const hpRoot = ReactDOM.createRoot(document.getElementById('root'));
hpRoot.render(<HPApp />);
