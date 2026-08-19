// HPHero.jsx — 3-column hero: category sidebar + auto-carousel + promo stack + service bar
const { useState: useStateHero, useEffect: useEffectHero } = React;

function HPCategorySidebar({ onCategoryChange }) {
  return (
    <div style={{ width:'240px', flexShrink:0, background:'#fff', border:'1px solid #e0e0e0', borderRadius:'10px', overflow:'hidden' }}>
      <div style={{ background:'#2e6b2e', color:'#fff', padding:'11px 14px', fontSize:'14px', fontWeight:'700', display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ fontSize:'15px' }}>☰</span> หมวดหมู่สินค้า
      </div>
      {HP_CATEGORIES.map(c => (
        <div
          key={c.id}
          style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 14px', cursor:'pointer', borderBottom:'1px solid #f5f5f5', fontSize:'13px', color:'#1a1a1a', fontWeight:'500', transition:'background 0.12s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#eef7ee'; e.currentTarget.style.color = '#2e6b2e'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1a1a1a'; }}
          onClick={() => onCategoryChange(c.id)}
        >
          <img src={c.img} style={{ width:'26px', height:'26px', objectFit:'contain' }} />
          <span style={{ flex:1 }}>{c.label}</span>
          <span style={{ color:'#ccc', fontSize:'14px' }}>›</span>
        </div>
      ))}
    </div>
  );
}

function HPCarousel({ onNavigate }) {
  const [i, setI] = useStateHero(0);
  const slides = HP_HERO_SLIDES;

  useEffectHero(() => {
    const t = setInterval(() => setI(p => (p + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, []);

  const s = slides[i];
  return (
    <div style={{ flex:1, borderRadius:'12px', overflow:'hidden', position:'relative', background:s.bg, minHeight:'320px', display:'flex', alignItems:'center', padding:'36px 40px', transition:'background 0.5s ease' }}>
      <div style={{ flex:1, zIndex:2 }}>
        <span style={{ display:'inline-block', background:'rgba(255,255,255,0.18)', color:'#fff', fontSize:'12px', fontWeight:'700', padding:'4px 14px', borderRadius:'999px', marginBottom:'16px' }}>{s.tag}</span>
        <div style={{ fontFamily:'Mitr, Sarabun, sans-serif', fontSize:'34px', fontWeight:'700', color:'#fff', lineHeight:'1.15', marginBottom:'6px' }}>{s.headline}</div>
        <div style={{ fontFamily:'Mitr, Sarabun, sans-serif', fontSize:'44px', fontWeight:'700', color:'#ffcf4d', lineHeight:'1.05', marginBottom:'14px' }}>{s.accent}</div>
        <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.85)', marginBottom:'24px', maxWidth:'360px', lineHeight:'1.6' }}>{s.sub}</p>
        <button
          style={{ background:'#e8551c', color:'#fff', border:'none', borderRadius:'999px', padding:'12px 30px', fontFamily:'Sarabun, sans-serif', fontSize:'15px', fontWeight:'700', cursor:'pointer' }}
          onClick={() => onNavigate('สินค้าทั้งหมด')}
        >{s.cta} →</button>
      </div>
      <div style={{ width:'300px', flexShrink:0, display:'flex', justifyContent:'center', zIndex:2 }}>
        <img src={s.img} style={{ maxHeight:'250px', maxWidth:'100%', objectFit:'contain', filter:'drop-shadow(0 10px 30px rgba(0,0,0,0.4))' }} />
      </div>
      <div style={{ position:'absolute', bottom:'18px', left:'40px', display:'flex', gap:'7px', zIndex:3 }}>
        {slides.map((_, idx) => (
          <div key={idx} onClick={() => setI(idx)} style={{ width:idx===i?'28px':'9px', height:'9px', borderRadius:'999px', background:idx===i?'#fff':'rgba(255,255,255,0.4)', cursor:'pointer', transition:'all 0.3s ease' }} />
        ))}
      </div>
    </div>
  );
}

function HPPromoStack({ onNavigate }) {
  return (
    <div style={{ width:'260px', flexShrink:0, display:'flex', flexDirection:'column', gap:'12px' }}>
      <div
        style={{ flex:1, borderRadius:'12px', padding:'20px', background:'linear-gradient(135deg, #e8551c 0%, #c44018 100%)', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden', transition:'transform 0.15s ease' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        onClick={() => onNavigate('สินค้าทั้งหมด')}
      >
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.85)', fontWeight:'600', marginBottom:'4px' }}>ดีลเด็ดประจำสัปดาห์</span>
        <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'24px', fontWeight:'700', color:'#fff', lineHeight:'1.1' }}>หลอด LED</div>
        <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'30px', fontWeight:'700', color:'#fff', lineHeight:'1' }}>เริ่ม ฿65</div>
        <span style={{ marginTop:'8px', fontSize:'13px', color:'#fff', fontWeight:'600' }}>ช้อปเลย →</span>
        <img src="assets/cat-bulb.png" style={{ position:'absolute', right:'-10px', bottom:'-10px', width:'90px', height:'90px', objectFit:'contain', opacity:0.35 }} />
      </div>
      <div
        style={{ flex:1, borderRadius:'12px', padding:'20px', background:'linear-gradient(135deg, #2e6b2e 0%, #1a3d1a 100%)', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden', transition:'transform 0.15s ease' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        onClick={() => onNavigate('ติดต่อ')}
      >
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.85)', fontWeight:'600', marginBottom:'4px' }}>บริการรับประกอบ</span>
        <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'24px', fontWeight:'700', color:'#fff', lineHeight:'1.1' }}>ตู้โหลด 3 เฟส</div>
        <div style={{ fontSize:'13px', color:'#9dd09d', fontWeight:'600', marginTop:'2px' }}>โดยช่างมืออาชีพ</div>
        <span style={{ marginTop:'8px', fontSize:'13px', color:'#fff', fontWeight:'600' }}>สอบถาม →</span>
        <img src="assets/cat-panel.png" style={{ position:'absolute', right:'-10px', bottom:'-10px', width:'90px', height:'90px', objectFit:'contain', opacity:0.3 }} />
      </div>
    </div>
  );
}

function HPHero({ onNavigate, onCategoryChange }) {
  return (
    <section style={{ background:'#f7f7f7', padding:'20px 0' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px', display:'flex', gap:'16px', alignItems:'stretch' }}>
        <HPCategorySidebar onCategoryChange={onCategoryChange} />
        <HPCarousel onNavigate={onNavigate} />
        <HPPromoStack onNavigate={onNavigate} />
      </div>
    </section>
  );
}

function HPServiceBar() {
  const services = [
    { icon:'🚚', title:'จัดส่งฟรี',       desc:'เมื่อสั่งซื้อครบ 500.-' },
    { icon:'⚡', title:'ส่งด่วน 1 ชม.',   desc:'เฉพาะเขตกรุงเทพฯ' },
    { icon:'🔧', title:'บริการติดตั้ง',    desc:'โดยช่างผู้เชี่ยวชาญ' },
    { icon:'💳', title:'ผ่อน 0%',          desc:'นานสูงสุด 10 เดือน' },
    { icon:'🏬', title:'รับที่สาขา',       desc:'Click & Collect' },
  ];
  return (
    <section style={{ background:'#fff', borderTop:'1px solid #f0f0f0', borderBottom:'1px solid #f0f0f0' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'14px 20px', display:'grid', gridTemplateColumns:'repeat(5, 1fr)' }}>
        {services.map((s, idx) => (
          <div key={idx} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'4px 16px', borderRight:idx < services.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
            <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'#eef7ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:'13px', fontWeight:'700', color:'#1a1a1a' }}>{s.title}</div>
              <div style={{ fontSize:'11px', color:'#888' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { HPHero, HPServiceBar });
