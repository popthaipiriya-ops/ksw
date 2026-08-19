// HPHeader.jsx — Utility bar + main header + mega category nav
const { useState: useStateHPH } = React;

function HPUtilityBar() {
  const barStyles = { background: '#1a3d1a', color: 'rgba(255,255,255,0.8)', fontSize: '12px', padding: '6px 0' };
  const inner = { maxWidth: '1240px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
  const linkRow = { display: 'flex', alignItems: 'center', gap: '18px' };
  const link = { color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' };
  const sep = { width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' };
  return (
    <div style={barStyles}>
      <div style={inner}>
        <div style={linkRow}>
          <span style={link}>
            <img src="assets/icon-location.png" style={{ width:'13px', height:'13px', objectFit:'contain' }} />
            ค้นหาสาขาใกล้คุณ
          </span>
          <div style={sep} />
          <span style={link}>ติดตามคำสั่งซื้อ</span>
          <div style={sep} />
          <span style={link}>บริการช่าง</span>
        </div>
        <div style={linkRow}>
          <span style={link}>ขายกับเรา</span>
          <div style={sep} />
          <span style={link}>ช่วยเหลือ</span>
          <div style={sep} />
          <span style={link}>
            <img src="assets/line-icon.png" style={{ width:'15px', height:'15px', objectFit:'contain' }} />
            @thaipiriya
          </span>
          <div style={sep} />
          <span style={link}>TH | EN</span>
        </div>
      </div>
    </div>
  );
}

function HPMainHeader({ cartCount, onNavigate, onSearch }) {
  const [q, setQ] = useStateHPH('');
  return (
    <div style={{ background: '#2e6b2e', padding: '14px 0' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', gap:'24px' }}>
        <img
          src="assets/logo-thaipiriya.png"
          alt="Thaipiriya"
          style={{ height:'46px', objectFit:'contain', cursor:'pointer', filter:'brightness(0) invert(1)' }}
          onClick={() => onNavigate('home')}
        />
        <div style={{ flex:1, display:'flex', background:'#fff', borderRadius:'999px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.12)' }}>
          <input
            style={{ flex:1, border:'none', outline:'none', padding:'12px 20px', fontFamily:'Sarabun, sans-serif', fontSize:'14px', color:'#1a1a1a' }}
            placeholder="ค้นหาสินค้า เช่น สายไฟ, เบรกเกอร์, หลอด LED..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSearch(q); }}
          />
          <button
            style={{ background:'#e8551c', color:'#fff', border:'none', padding:'0 26px', fontFamily:'Sarabun, sans-serif', fontSize:'14px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}
            onClick={() => onSearch(q)}
          >
            <span style={{ fontSize:'16px' }}>🔍</span> ค้นหา
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'18px', flexShrink:0 }}>
          <div
            style={{ display:'flex', alignItems:'center', gap:'8px', color:'#fff', cursor:'pointer' }}
            onClick={() => onNavigate('account')}
          >
            <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>👤</div>
            <div style={{ lineHeight:'1.2' }}>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>บัญชีของฉัน</div>
              <div style={{ fontSize:'13px', fontWeight:'700' }}>เข้าสู่ระบบ</div>
            </div>
          </div>
          <div
            style={{ display:'flex', alignItems:'center', gap:'8px', color:'#fff', cursor:'pointer' }}
            onClick={() => onNavigate('cart')}
          >
            <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', position:'relative' }}>
              🛒
              {cartCount > 0 && (
                <span style={{ position:'absolute', top:'-4px', right:'-4px', background:'#e8551c', color:'#fff', borderRadius:'999px', minWidth:'18px', height:'18px', fontSize:'11px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px', border:'2px solid #2e6b2e' }}>{cartCount}</span>
              )}
            </div>
            <div style={{ lineHeight:'1.2' }}>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>ตะกร้า</div>
              <div style={{ fontSize:'13px', fontWeight:'700' }}>{cartCount} ชิ้น</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HPMegaNav({ onCategoryChange }) {
  const [open, setOpen] = useStateHPH(false);
  const navLinks = ['สายไฟ', 'เบรกเกอร์', 'หลอดไฟ', 'สวิตซ์,ปลั๊ก', 'ตู้ไฟฟ้า', 'ท่อ&ราง', 'บริการประกอบตู้', 'โปรโมชัน'];
  return (
    <div
      style={{ background:'#fff', borderBottom:'1px solid #e0e0e0', boxShadow:'0 2px 6px rgba(0,0,0,0.04)', position:'relative' }}
      onMouseLeave={() => setOpen(false)}
    >
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'stretch', gap:'4px' }}>
        <div
          style={{ display:'flex', alignItems:'center', gap:'8px', background:'#e8551c', color:'#fff', padding:'12px 22px', fontWeight:'700', fontSize:'14px', cursor:'pointer' }}
          onMouseEnter={() => setOpen(true)}
          onClick={() => onCategoryChange('all')}
        >
          <span style={{ fontSize:'16px' }}>☰</span> หมวดหมู่สินค้าทั้งหมด
        </div>
        {navLinks.map(l => (
          <div
            key={l}
            style={{ padding:'12px 16px', fontSize:'14px', fontWeight:'500', color:'#1a1a1a', cursor:'pointer', whiteSpace:'nowrap', borderBottom:'3px solid transparent', transition:'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#2e6b2e'; e.currentTarget.style.borderBottomColor = '#2e6b2e'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#1a1a1a'; e.currentTarget.style.borderBottomColor = 'transparent'; }}
            onClick={() => onCategoryChange('all')}
          >{l}</div>
        ))}
      </div>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:'20px', width:'260px', background:'#fff', border:'1px solid #e0e0e0', borderTop:'none', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:50, borderRadius:'0 0 8px 8px', overflow:'hidden' }}>
          {HP_CATEGORIES.map(c => (
            <div
              key={c.id}
              style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 16px', cursor:'pointer', borderBottom:'1px solid #f5f5f5' }}
              onMouseEnter={e => e.currentTarget.style.background = '#eef7ee'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              onClick={() => { onCategoryChange(c.id); setOpen(false); }}
            >
              <img src={c.img} style={{ width:'28px', height:'28px', objectFit:'contain' }} />
              <span style={{ fontSize:'13px', color:'#1a1a1a', fontWeight:'500' }}>{c.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HPHeader({ cartCount, onNavigate, onCategoryChange, onSearch }) {
  return (
    <header style={{ position:'sticky', top:0, zIndex:100 }}>
      <HPUtilityBar />
      <HPMainHeader cartCount={cartCount} onNavigate={onNavigate} onSearch={onSearch} />
      <HPMegaNav onCategoryChange={onCategoryChange} />
    </header>
  );
}

Object.assign(window, { HPHeader });
