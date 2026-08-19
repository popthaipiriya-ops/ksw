// HPSections.jsx — Category circles, promo grid, brand strip

function HPCategoryCircles({ onCategoryChange }) {
  return (
    <section style={{ background:'#fff', padding:'24px 0' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1a1a1a', marginBottom:'18px' }}>ช้อปตามหมวดหมู่</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:'8px' }}>
          {HP_CATEGORIES.map(c => (
            <div
              key={c.id}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', cursor:'pointer' }}
              onClick={() => onCategoryChange(c.id)}
            >
              <div
                style={{ width:'74px', height:'74px', borderRadius:'50%', background:'#f7f7f7', border:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eef7ee'; e.currentTarget.style.borderColor = '#9dd09d'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f7f7f7'; e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <img src={c.img} style={{ width:'46px', height:'46px', objectFit:'contain' }} />
              </div>
              <span style={{ fontSize:'11px', color:'#444', fontWeight:'600', textAlign:'center', lineHeight:'1.3' }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HPPromoGrid({ onNavigate }) {
  const hover = {
    onMouseEnter: e => e.currentTarget.style.transform = 'scale(1.015)',
    onMouseLeave: e => e.currentTarget.style.transform = 'scale(1)',
  };
  const cardBase = { borderRadius:'12px', overflow:'hidden', padding:'26px 28px', cursor:'pointer', position:'relative', minHeight:'150px', display:'flex', flexDirection:'column', justifyContent:'center', transition:'transform 0.15s ease' };
  return (
    <section style={{ background:'#f7f7f7', padding:'8px 0 24px' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px', display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'14px' }}>
        <div style={{ ...cardBase, background:'linear-gradient(120deg, #1a3d1a, #2e6b2e)' }} {...hover} onClick={() => onNavigate('สินค้าทั้งหมด')}>
          <span style={{ fontSize:'12px', color:'#9dd09d', fontWeight:'700' }}>โปรโมชันสายไฟ</span>
          <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'30px', fontWeight:'700', color:'#fff', lineHeight:'1.1', margin:'4px 0 8px' }}>สายไฟคุณภาพ<br/>ราคาส่ง</div>
          <button style={{ alignSelf:'flex-start', background:'#e8551c', color:'#fff', border:'none', borderRadius:'999px', padding:'8px 20px', fontFamily:'Sarabun, sans-serif', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>ดูสินค้า →</button>
          <img src="assets/cat-wire.png" style={{ position:'absolute', right:'20px', bottom:'10px', width:'120px', height:'120px', objectFit:'contain', opacity:0.85 }} />
        </div>
        <div style={{ ...cardBase, background:'linear-gradient(120deg, #e8551c, #c44018)' }} {...hover} onClick={() => onNavigate('สินค้าทั้งหมด')}>
          <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.85)', fontWeight:'700' }}>ลดพิเศษ</span>
          <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'22px', fontWeight:'700', color:'#fff', lineHeight:'1.15', margin:'4px 0' }}>เบรกเกอร์</div>
          <span style={{ fontSize:'13px', color:'#fff', fontWeight:'600' }}>เริ่ม ฿185 →</span>
          <img src="assets/cat-breaker.png" style={{ position:'absolute', right:'-6px', bottom:'-6px', width:'80px', height:'80px', objectFit:'contain', opacity:0.4 }} />
        </div>
        <div style={{ ...cardBase, background:'linear-gradient(120deg, #2d2d2d, #1a1a1a)' }} {...hover} onClick={() => onNavigate('สินค้าทั้งหมด')}>
          <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', fontWeight:'700' }}>มาใหม่</span>
          <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'22px', fontWeight:'700', color:'#fff', lineHeight:'1.15', margin:'4px 0' }}>ปลั๊กราง USB</div>
          <span style={{ fontSize:'13px', color:'#ffcf4d', fontWeight:'600' }}>ดูเลย →</span>
          <img src="assets/cat-powerstrip.png" style={{ position:'absolute', right:'-6px', bottom:'-6px', width:'80px', height:'80px', objectFit:'contain', opacity:0.4 }} />
        </div>
      </div>
    </section>
  );
}

function HPBrandStrip() {
  const brands = ['banner1','banner2','banner3','banner4','banner5','banner6','banner7','banner8','banner9','banner10','banner11','banner12'];
  return (
    <section style={{ background:'#fff', padding:'24px 0', borderTop:'1px solid #f0f0f0' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1a1a1a', marginBottom:'16px' }}>แบรนด์ชั้นนำ</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'12px' }}>
          {brands.map(b => (
            <div
              key={b}
              style={{ background:'#fff', border:'1px solid #eee', borderRadius:'10px', height:'80px', display:'flex', alignItems:'center', justifyContent:'center', padding:'12px', transition:'border-color 0.15s ease', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#9dd09d'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}
            >
              <img src={`assets/${b}.png`} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HPCategoryCircles, HPPromoGrid, HPBrandStrip });
