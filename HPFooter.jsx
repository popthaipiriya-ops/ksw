// HPFooter.jsx — Rich multi-column footer with newsletter strip

function HPFooter() {
  const cols = [
    { title:'ช่วยเหลือ',          links:['วิธีการสั่งซื้อ','วิธีการชำระเงิน','การจัดส่งสินค้า','การคืนสินค้า','คำถามที่พบบ่อย'] },
    { title:'เกี่ยวกับไทยพิริยะ', links:['เกี่ยวกับเรา','สาขาของเรา','ร่วมงานกับเรา','ข่าวสารและโปรโมชัน','ติดต่อเรา'] },
    { title:'บริการ',              links:['รับประกอบตู้โหลด 3 เฟส','รับผลิตตู้ MDB','บริการติดตั้ง','งานโครงการ','ปรึกษาระบบไฟ'] },
  ];
  const colTitleStyle = { fontSize:'14px', fontWeight:'700', color:'#fff', marginBottom:'14px' };
  const linkStyle = { fontSize:'13px', color:'rgba(255,255,255,0.7)', marginBottom:'9px', cursor:'pointer', display:'block' };

  return (
    <footer style={{ background:'#1a3d1a', color:'#fff', marginTop:'8px' }}>
      {/* Newsletter strip */}
      <div style={{ background:'#143014', padding:'20px 0' }}>
        <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <span style={{ fontSize:'30px' }}>📧</span>
            <div>
              <div style={{ fontSize:'17px', fontWeight:'700' }}>รับข่าวสารโปรโมชันก่อนใคร</div>
              <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)' }}>สมัครรับข่าวสาร รับส่วนลดพิเศษทันที</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px', flex:1, maxWidth:'420px', minWidth:'280px' }}>
            <input
              placeholder="กรอกอีเมลของคุณ"
              style={{ flex:1, border:'none', borderRadius:'999px', padding:'11px 18px', fontFamily:'Sarabun, sans-serif', fontSize:'14px', outline:'none' }}
            />
            <button style={{ background:'#e8551c', color:'#fff', border:'none', borderRadius:'999px', padding:'11px 26px', fontFamily:'Sarabun, sans-serif', fontSize:'14px', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap' }}>สมัคร</button>
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'36px 20px', display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:'32px' }}>
        <div>
          <img src="assets/logo-thaipiriya.png" style={{ height:'42px', objectFit:'contain', marginBottom:'14px', filter:'brightness(0) invert(1)' }} />
          <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)', lineHeight:'1.7', marginBottom:'16px' }}>
            ครบเครื่อง เรื่องอุปกรณ์ไฟฟ้า ราคามิตรภาพ<br/>ส่งตรงถึงหน้าบ้าน จัดส่งทั่วประเทศไทย
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <img src="assets/line-icon.png" style={{ width:'30px', height:'30px', objectFit:'contain' }} />
            <div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>LINE Official</div>
              <div style={{ fontSize:'14px', fontWeight:'700' }}>@thaipiriya</div>
            </div>
          </div>
          <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>โทร. 02-xxx-xxxx (จ-ส 08:00–17:00)</div>
        </div>
        {cols.map(col => (
          <div key={col.title}>
            <div style={colTitleStyle}>{col.title}</div>
            {col.links.map(l => (
              <a
                key={l}
                style={linkStyle}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
              >{l}</a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>ช่องทางชำระเงิน:</span>
            <div style={{ background:'#fff', borderRadius:'6px', padding:'6px 10px' }}>
              <img src="assets/payment-thaipiriya.png" style={{ height:'22px', objectFit:'contain' }} />
            </div>
          </div>
          <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>
            © 2026 บริษัท ไทยพิริยะ จำกัด — THAIPIRIYA CO.,LTD. สงวนลิขสิทธิ์
          </div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { HPFooter });
