// -- Main app source (JSX). Edit this file, then open build.html to compile into app.js --
// Do NOT edit app.js directly; it is overwritten on every build.
const { useState, useEffect } = React;

// ── Google Sign-In config ──
// ⚠ ใส่ OAuth Client ID ของคุณที่นี่ (สร้างฟรีที่ https://console.cloud.google.com → APIs & Services → Credentials)
//   ในหน้า OAuth client ต้องเพิ่ม "Authorized JavaScript origins" เป็นโดเมนเว็บคุณ เช่น http://localhost:4321 และโดเมนจริง
const HP_GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const HP_GOOGLE_READY = HP_GOOGLE_CLIENT_ID.indexOf('YOUR_GOOGLE_CLIENT_ID') === -1;

// ถอดข้อมูลผู้ใช้จาก JWT credential ของ Google (ฝั่ง client)
function hpDecodeJwt(token) {
  try {
    const base = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(base))));
  } catch (e) { return null; }
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const HP_CATEGORIES = [
  { id:'wire',       label:'สายไฟ',          img:'assets/cat-wire.jpg' },
  { id:'breaker',    label:'เบรกเกอร์',      img:'assets/cat-breaker.jpg' },
  { id:'bulb',       label:'หลอดไฟ',         img:'assets/cat-bulb.png' },
  { id:'switch',     label:'สวิตซ์,ปลั๊ก',   img:'assets/cat-switch.jpg' },
  { id:'panel',      label:'ตู้ไฟฟ้า',       img:'assets/cat-panel.png' },
  { id:'conduit',    label:'ท่อร้อยสายไฟ',   img:'assets/cat-conduit.jpg' },
  { id:'cableduct',  label:'รางเก็บสายไฟ',   img:'assets/cat-cableduct.png' },
  { id:'powerstrip', label:'ปลั๊กราง',        img:'assets/cat-powerstrip.jpg' },
  { id:'cabletie',   label:'เคเบิลไทร์',     img:'assets/cat-cabletie.jpg' },
  { id:'waterbox',   label:'กล่องกันน้ำ',     img:'assets/cat-waterbox.png' },
  { id:'block',      label:'บล็อคยาง',        img:'assets/nano/nano-408.jpg' },
  { id:'hardware',   label:'อุปกรณ์ฮาร์ดแวร์ไฟฟ้า', img:'assets/iampong/crp-115.webp' },
  { id:'grounding',  label:'สายดิน & ล่อฟ้า',  img:'assets/iampong/cgr-1058.webp' },
  { id:'fan',        label:'พัดลมดูดอากาศ',   img:'assets/sentoshi/exhaust-fan-glass.jpg' },
  { id:'misc',       label:'อุปกรณ์เบ็ดเตล็ด', img:'assets/chang-accessory-wt409.png' },
];

// จับคู่หมวดหมู่หน้าแรกกับคำในฟิลด์ cat ของสินค้าจริงทุกแบรนด์ (HP_BRAND_PRODUCTS)
// กติกา: หนึ่งสินค้าต้องอยู่หมวดเดียวเท่านั้น — ห้าม keyword ของสองหมวดจับสินค้าตัวเดียวกัน
const HP_CATEGORY_KEYWORDS = {
  breaker:    ['เบรกเกอร์', 'Breaker', 'เครื่องตัดไฟรั่ว', 'RCCB', 'คัตเอาท์', 'ฟิวส์'],
  panel:      ['ตู้โหลด', 'ตู้คอนซูมเมอร์', 'ตู้ควบคุมไฟฟ้า', 'ตู้ไฟ', 'ตู้สวิตช์บอร์ด', 'ตู้พาวเวอร์ปลั๊ก', 'ตู้คอมบายเนอร์', 'ตู้แร็ค', 'แผงไฟฟ้าพลาสติก'],
  wire:       ['สายไฟ THW', 'สายไฟ VAF', 'สายหัวหล่อ', 'สายสำเร็จพร้อมขั้ว', 'สายไฟอเนกประสงค์'],
  bulb:       ['หลอดไฟ', 'หลอดฟลูออเรสเซนต์', 'หลอดไส้', 'โคม', 'ขั้วหลอดไฟ', 'ขั้วสายห้อยระย้า', 'ไฟฉุกเฉิน', 'Bulb', 'T-Bulb', 'T8 TUBE', 'LED UFO', 'Street Light', 'Flood Light', 'Ceiling Light', 'High Bay Light', 'Solar Light', 'Panel Downlight', 'Magnetic', 'โซล่าเซลล์'],
  switch:     ['สวิตช์ไฟฟ้า', 'สวิทซ์และเต้ารับ', 'เต้ารับไฟฟ้า', 'ฝาหน้ากาก', 'เต้ารับฝัง', 'ปลั๊กและเต้ารับ', 'ปลั๊กไฟและอุปกรณ์ไฟฟ้า', 'ปลั๊กแปลงไฟ', 'switch'],
  conduit:    ['ท่อร้อยสายไฟ', 'ท่ออ่อนลายลูกฟูก', 'ท่อและอุปกรณ์เครื่องปรับอากาศ', 'ข้อต่อ'],
  cableduct:  ['รางเคเบิ้ลเทรย์', 'รางเคเบิ้ลแลดเดอร์', 'รางวายเวย์', 'รางพลาสติกเก็บสายไฟ'],
  powerstrip: ['รางปลั๊กพ่วง', 'ปลั๊กพ่วง', 'ปลั๊กรางไฟ'],
  cabletie:   ['เคเบิ้ลไทร์', 'เคเบิลไทร์'],
  waterbox:   ['กล่องกันน้ำ', 'กล่องลอย', 'กล่องเต้ารับเสียบปลั๊กกันน้ำ', 'ตู้กันน้ำพลาสติก', 'บ็อกซ์พลาสติก', 'พูลบ็อกซ์', 'ฝาครอบแผงหน้ากากกันน้ำ'],
  block:      ['บล็อคยาง', 'บล็อคฝัง'],
  hardware:   ['อุปกรณ์ฮาร์ดแวร์', 'อุปกรณ์ต่อสายไฟฟ้า', 'อุปกรณ์ไฟฟ้าใต้ดิน', 'เต๋าต่อสาย', 'ลูกถ้วยและหางหนู', 'กิ๊ปตอกสาย'],
  grounding:  ['ระบบสายดิน', 'ระบบป้องกันฟ้าผ่า'],
  fan:        ['พัดลมดูดอากาศ'],
  misc:       ['อุปกรณ์เสริม', 'อุปกรณ์ไฟฟ้าเบ็ดเตล็ด', 'งานโลหะแผ่น', 'อุปกรณ์โทรคมนาคม', 'Walkway'],
};
// หมวดหมู่ย่อยที่ลิงก์มาจาก footer คอลัมน์ "สินค้า" — keywords อ้างอิงชื่อหมวดจริงในข้อมูลสินค้า
const HP_FOOTER_CATEGORIES = [
  { id:'f-switch',     label:'สวิตช์ไฟฟ้า',           keywords:['สวิตช์ไฟฟ้า'] },
  { id:'f-socket',     label:'เต้ารับไฟฟ้า',          keywords:['เต้ารับไฟฟ้า'] },
  { id:'f-plate',      label:'ฝาหน้ากาก',             keywords:['ฝาหน้ากาก'] },
  { id:'f-consumer',   label:'ตู้คอนซูมเมอร์ ยูนิต',  keywords:['ตู้คอนซูมเมอร์'] },
  { id:'f-loadcenter', label:'ตู้โหลดเซ็นเตอร์',      keywords:['ตู้โหลดเซนเตอร์','ตู้โหลดเซ็นเตอร์'] },
  { id:'f-breaker',    label:'เบรกเกอร์',             keywords:['เบรกเกอร์'] },
  { id:'f-cutout',     label:'คัตเอาท์',              keywords:['คัตเอาท์'] },
  { id:'f-accessory',  label:'อุปกรณ์เสริม',           keywords:['อุปกรณ์เสริม'] },
];
// หมวดที่แสดงในคอลัมน์ "สินค้า" ของ footer = หมวดย่อย 8 หมวด + หมวดหลักที่เพิ่มใหม่
const HP_FOOTER_EXTRA_IDS = ['block', 'hardware', 'grounding', 'fan', 'misc'];
HP_FOOTER_CATEGORIES.forEach(c => { HP_CATEGORY_KEYWORDS[c.id] = c.keywords; });

// วงกลม "หมวดหมู่สินค้า" บนหน้าแรก — เป็นหมวดย่อยที่ละเอียดกว่าหมวดหลัก 10 หมวด
// (สินค้าชิ้นหนึ่งอยู่หมวดหลักได้หมวดเดียว แต่ยังปรากฏในหมวดย่อยของมันได้ตามลำดับชั้น)
const HP_CIRCLE_CATEGORIES = [
  { id:'all',         label:'สินค้าทั้งหมด',        img:'assets/cat-all.jpg' },
  { id:'wire',        label:'สายไฟ',                img:'assets/สายไฟ.jpg' },
  { id:'conduitpart', label:'อุปกรณ์ท่อ',            img:'assets/อุปกรณ์ท่อ.jpg',            keywords:['อุปกรณ์ท่อร้อยสายไฟฟ้า','ข้อต่อ'] },
  { id:'conduit',     label:'ท่อร้อยสายไฟ',         img:'assets/ท่อร้อยสายไฟ.jpg' },
  { id:'loadcenter',  label:'ตู้โหลดเซนเตอร์',      img:'assets/ตู้โหลดเซนเตอร์.png',       keywords:['ตู้โหลดเซนเตอร์','ตู้โหลดเซ็นเตอร์'] },
  { id:'plasticpanel',label:'แผงไฟฟ้าพลาสติก',      img:'assets/แผงไฟฟ้าพลาสติก.jpg',       keywords:['แผงไฟฟ้าพลาสติก'] },
  { id:'faceplate',   label:'ฝาครอบหน้ากาก',        img:'assets/ฝาครอบหน้ากาก.jpg',         keywords:['ฝาหน้ากาก','ฝาครอบแผงหน้ากากกันน้ำ'] },
  { id:'bulb',        label:'หลอดไฟ',               img:'assets/หลอดไฟ.jpg' },
  { id:'lamp',        label:'โคมไฟ',                img:'assets/โคมไฟ .jpg',                keywords:['โคมไฟ'] },
  { id:'switch',      label:'สวิตซ์,ปลั๊ก',         img:'assets/สวิตซ์,ปลั๊ก.png' },
  { id:'circuit',     label:'ลูกเซอร์กิต',          img:'assets/ลูกเซอร์กิต .png',          keywords:['เซอร์กิตเบรกเกอร์','เซอร์กิต เบรกเกอร์'] },
  { id:'wireway',     label:'รางวายเวย์',            img:'assets/รางวายเวย์.jpg',            keywords:['รางวายเวย์'] },
  { id:'cableladder', label:'รางเคเบิ้ลแลดเดอร์',   img:'assets/รางเคเบิ้ลแลดเดอร์.png',    keywords:['รางเคเบิ้ลแลดเดอร์'] },
  { id:'cableduct',   label:'รางเก็บสายไฟ',         img:'assets/รางเก็บสายไฟ.jpg' },
  { id:'powerstrip',  label:'ปลั๊กราง',             img:'assets/ปลั๊กราง.png' },
  { id:'breaker',     label:'เบรกเกอร์',            img:'assets/เบรกเกอร์.png' },
  { id:'floatblock',  label:'บล็อคลอย',             img:'assets/บล็อคลอย.jpg',              keywords:['กล่องลอย'] },
  { id:'waterbox',    label:'กล่องกันน้ำ',           img:'assets/กล่องกันน้ำ.jpg' },
  { id:'consumer',    label:'ตู้คอนซูมเมอร์ยูนิต',  img:'assets/ตู้คอนซูมเมอร์ยูนิต.png',   keywords:['ตู้คอนซูมเมอร์'] },
  { id:'switchboard', label:'ตู้สวิทซ์บอร์ด',       img:'assets/ตู้สวิทซ์บอร์ด.jpg',        keywords:['ตู้ไฟสวิทซ์บอร์ด','ตู้สวิตช์บอร์ด'] },
  { id:'cabletie',    label:'เคเบิลไทร์',           img:'assets/เคเบิลไทร์.png' },
  { id:'airconduit',  label:'ท่อและอุปกรณ์แอร์',    img:'assets/ท่อและอุปกรณ์แอร์.jpg',     keywords:['ท่อและอุปกรณ์เครื่องปรับอากาศ'] },
  { id:'plasticbox',  label:'ตู้กันน้ำพลาสติก',     img:'assets/ตู้กันน้ำพลาสติก.png',      keywords:['ตู้กันน้ำพลาสติก'] },
  { id:'flooroutlet', label:'เต้ารับฝังพื้น',       img:'assets/เต้ารับฝังพิ้น.jpg',        keywords:['เต้ารับฝังพื้น','เต้ารับฝังโต๊ะ'] },
  { id:'rubberblock', label:'บล็อคยาง',             img:'assets/บล็อคยาง.png',              keywords:['บล็อคยาง','บล็อคฝัง'] },
  { id:'grounding',   label:'สายดิน & ล่อฟ้า',      img:'assets/iampong/cgr-1058.webp' },
  { id:'hardware',    label:'อุปกรณ์ฮาร์ดแวร์ไฟฟ้า', img:'assets/iampong/pui-101.webp' },
];
HP_CIRCLE_CATEGORIES.forEach(c => { if (c.keywords) HP_CATEGORY_KEYWORDS[c.id] = c.keywords; });

function hpCategoryLabel(catId) {
  return HP_CATEGORIES.find(c => c.id === catId)?.label
      || HP_FOOTER_CATEGORIES.find(c => c.id === catId)?.label
      || HP_CIRCLE_CATEGORIES.find(c => c.id === catId)?.label
      || 'สินค้าทั้งหมด';
}

function hpProductsInCategory(catId) {
  if (!catId || catId === 'all') return HP_ALL_BRAND_PRODUCTS;
  const keywords = HP_CATEGORY_KEYWORDS[catId] || [];
  if (keywords.length === 0) return [];
  return HP_ALL_BRAND_PRODUCTS.filter(p => keywords.some(k => (p.cat || '').includes(k)));
}

const HP_DEFAULT_PRODUCTS = [];

// ---- product store: localStorage overrides defaults (จัดการผ่านหน้า "จัดการสินค้า") ----
// สินค้าตั้งต้นของหน้า "สินค้าของฉัน" อิงจากสินค้าตามแบรนด์ (brand-products.js) โดยตรง
function hpCatIdOf(cat) {
  const hit = HP_CATEGORIES.map(c => c.id).find(id => (HP_CATEGORY_KEYWORDS[id] || []).some(k => (cat || '').includes(k)));
  return hit || 'misc';
}
function hpBrandProductsAsAdmin() {
  if (typeof HP_ALL_BRAND_PRODUCTS === 'undefined') return [];
  return HP_ALL_BRAND_PRODUCTS.map((p, i) => ({
    id: 'B' + i,
    fromBrand: true,
    code: p.code || '',
    name: p.name || p.code || '',
    brand: p.brand || '',
    cat: hpCatIdOf(p.cat),
    catRaw: p.cat || '',
    price: '', oldPrice: '', stock: 0, sold: 0, installment: false,
    img: (p.images && p.images[0]) || p.img || '',
    images: (p.images && p.images.length) ? p.images.slice() : (p.img ? [p.img] : []),
    gtin: '', allowMarketing: true,
    description: (p.bullets && p.bullets.items) ? p.bullets.items.join('\n') : '',
    attrs: { type:'', size:'', tis:'', warranty:'', origin:'', packaging:'' },
    specs: p.specs || [],
    variations: [],
  }));
}
function hpLoadProducts() {
  const base = hpBrandProductsAsAdmin();
  let overrides = [];
  try {
    const saved = localStorage.getItem('kss_products');
    if (saved) { const list = JSON.parse(saved); if (Array.isArray(list)) overrides = list; }
  } catch (e) {}
  if (!overrides.length) return base.length ? base : HP_DEFAULT_PRODUCTS;
  // ผสาน: รายการที่แก้ไข/เพิ่มเอง ทับของเดิม ส่วนที่ไม่มีในฐาน = สินค้าที่เพิ่มเอง
  const byId = new Map(base.map(p => [p.id, p]));
  overrides.forEach(o => byId.set(o.id, o));
  return Array.from(byId.values());
}
let HP_PRODUCTS = hpLoadProducts();
// บันทึกผ่านเซิร์ฟเวอร์เท่านั้น — เซิร์ฟเวอร์จะปฏิเสธถ้าไม่ได้ล็อกอินหรือบทบาทไม่มีสิทธิ์
// (localStorage ใช้เป็นแคชสำหรับแสดงผลเท่านั้น ไม่ใช่แหล่งความจริง)
function hpSaveProducts(list) {
  HP_PRODUCTS = list;
  const overrides = list.filter(p => !p.fromBrand || p.edited);
  try { localStorage.setItem('kss_products', JSON.stringify(overrides)); } catch (e) {}
  return fetch('/api/products', {
    method:'POST', credentials:'include',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ products: overrides }),
  }).then(async r => {
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert('บันทึกขึ้นเซิร์ฟเวอร์ไม่สำเร็จ: ' + (d.error || ('HTTP ' + r.status)));
      return false;
    }
    return true;
  }).catch(() => { alert('บันทึกขึ้นเซิร์ฟเวอร์ไม่สำเร็จ: เชื่อมต่อไม่ได้'); return false; });
}
// ---- ดึงข้อมูลที่แก้ไขไว้จากเซิร์ฟเวอร์ (แหล่งความจริง) ----
fetch('/api/products').then(r => r.ok ? r.json() : null).then(res => {
  const list = res && res.products;
  if (!Array.isArray(list)) return;
  const cached = (() => {
    try { const s = localStorage.getItem('kss_products'); const l = s ? JSON.parse(s) : []; return Array.isArray(l) ? l : []; }
    catch (e) { return []; }
  })();
  if (JSON.stringify(list) !== JSON.stringify(cached)) {
    localStorage.setItem('kss_products', JSON.stringify(list));
    location.reload();
  }
}).catch(() => {});

const HP_HERO_SLIDES = [
  { layout:'video', src:'assets/hero-service.mp4', headline:'จำหน่ายอุปกรณ์ไฟฟ้าทั้งภายในและภายนอกอาคารครบครัน', sub:'จำหน่ายอุปกรณ์ไฟฟ้าทั้งปลีกและส่งในราคาเป็นมิตรและได้มาตรฐาน พร้อมมีผู้เชี่ยวชาญให้คำปรึกษาและรับบริการติดตั้งไฟฟ้า' },
];

// ─── HEADER ───────────────────────────────────────────────────────────────────

function HPMainHeader({ cartCount, onNavigate, onSearch }) {
  const [showLine, setShowLine] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const navLinks = [
    { label:'หน้าแรก',        icon:<><path d="M3 9.5L12 3l9 6.5"/><path d="M5 9v11a1 1 0 001 1h12a1 1 0 001-1V9"/><path d="M9 21v-6h6v6"/></> },
    { label:'สินค้าตามแบรนด์', icon:<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5"/></> },
    { label:'เกร็ดความรู้',    icon:<><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
      submenu:[
        { label:'5 แนวทางการเลือกซื้ออุปกรณ์เดินระบบไฟฟ้า', target:'เกร็ดความรู้' },
        { label:'ตู้ MDB คืออะไร ?', target:'เกร็ดความรู้' },
        { label:'ความสำคัญของตู้โหลด 3 เฟส', target:'เกร็ดความรู้' },
      ] },
    { label:'แคตตาล็อก',      icon:<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
    { label:'ติดต่อเรา',       icon:<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></> },
  ];
  return (
    <>
    {showLine && <LineQRModal onClose={() => setShowLine(false)}/>}
    <div style={{ background:'#ffffff', padding:'14px 0', boxShadow:'0 2px 14px rgba(15,77,42,0.07)', borderBottom:'1px solid #eef3ef' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', gap:'14px' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'11px', cursor:'pointer', flexShrink:0 }} onClick={() => onNavigate('home')}>
          <div style={{ width:'46px', height:'46px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <img src="assets/logo-kss.jpg" alt="KSS" style={{ width:'46px', height:'46px', objectFit:'contain' }}/>
          </div>
          <div style={{ lineHeight:1.1 }}>
            <div style={{ fontWeight:800, fontSize:'17px', color:'#06352e', letterSpacing:'0.2px' }}>KiRD SAENG SAWANG</div>
            <div style={{ fontSize:'11px', color:'#8a9a90', fontWeight:400, marginTop:'2px' }}>บริษัท เกิดแสงสว่าง จำกัด</div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'2px' }}>
          {navLinks.map(n => (
            <div key={n.label} style={{ position:'relative' }}
              onMouseEnter={() => n.submenu && setOpenMenu(n.label)}
              onMouseLeave={() => n.submenu && setOpenMenu(null)}>
              <div
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', padding:'7px 12px', fontSize:'12.5px', fontWeight:'600', color:'#5a7a66', cursor:'pointer', whiteSpace:'nowrap', borderRadius:'9px', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background='#eaf6f5'; e.currentTarget.style.color='#0d5c50'; }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#5a7a66'; }}
                onClick={() => onNavigate(n.target || n.label)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{n.icon}</svg>
                {!n.hideLabel && n.label}
              </div>
              {n.submenu && openMenu === n.label && (
                <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', background:'#fff', borderRadius:'12px', boxShadow:'0 12px 30px rgba(15,77,42,0.14)', border:'1px solid #eef3ef', padding:'8px', minWidth:'260px', zIndex:50 }}>
                  {n.submenu.map(s => (
                    <div key={s.label}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px', padding:'10px 14px', fontSize:'13px', fontWeight:'600', color:'#3a4a42', cursor:'pointer', borderRadius:'8px', whiteSpace:'nowrap', textAlign:'left' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#eaf6f5'; e.currentTarget.style.color='#0d5c50'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#3a4a42'; }}
                      onClick={() => { setOpenMenu(null); onNavigate(s.target); }}>
                      <span>{s.label}</span>
                      {s.badge && (
                        <span style={{ background:'#f05a20', color:'#fff', fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'999px', flexShrink:0 }}>Member</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
          {/* LINE */}
          <div
            style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'40px', height:'40px', borderRadius:'10px', background:'#06c755', cursor:'pointer', transition:'transform 0.15s', boxShadow:'0 2px 8px rgba(6,199,85,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
            onClick={() => setShowLine(true)}
            title="แอดไลน์">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
          </div>

          {/* Admin access */}
          <div
            style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'40px', height:'40px', borderRadius:'10px', background:'#f2f6f4', border:'1px solid #e2ece7', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#eaf6f5'; e.currentTarget.style.borderColor='#0d5c50'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#f2f6f4'; e.currentTarget.style.borderColor='#e2ece7'; }}
            onClick={() => onNavigate('admin')}
            title="เข้าระบบหลังบ้าน (สำหรับผู้ดูแลระบบ)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a7a66" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3.1"/>
              <path d="M19.1 14.6a1.5 1.5 0 00.3 1.66l.05.05a1.82 1.82 0 11-2.58 2.58l-.05-.05a1.5 1.5 0 00-1.66-.3 1.5 1.5 0 00-.91 1.37v.14a1.82 1.82 0 11-3.64 0v-.07a1.5 1.5 0 00-.98-1.37 1.5 1.5 0 00-1.66.3l-.05.05a1.82 1.82 0 11-2.58-2.58l.05-.05a1.5 1.5 0 00.3-1.66 1.5 1.5 0 00-1.37-.91H4.2a1.82 1.82 0 110-3.64h.07a1.5 1.5 0 001.37-.98 1.5 1.5 0 00-.3-1.66l-.05-.05a1.82 1.82 0 112.58-2.58l.05.05a1.5 1.5 0 001.66.3h.07a1.5 1.5 0 00.91-1.37V4.2a1.82 1.82 0 113.64 0v.07a1.5 1.5 0 00.91 1.37 1.5 1.5 0 001.66-.3l.05-.05a1.82 1.82 0 112.58 2.58l-.05.05a1.5 1.5 0 00-.3 1.66v.07a1.5 1.5 0 001.37.91h.14a1.82 1.82 0 110 3.64h-.07a1.5 1.5 0 00-1.37.91z"/>
            </svg>
          </div>

        </div>

      </div>
    </div>
    </>
  );
}

function HPHeader({ cartCount, onNavigate, onCategoryChange, onSearch }) {
  return (
    <header style={{ position:'sticky', top:0, zIndex:100 }}>
      <HPMainHeader cartCount={cartCount} onNavigate={onNavigate} onSearch={onSearch} />
    </header>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function HPCategorySidebar({ onCategoryChange }) {
  return (
    <div style={{ width:'240px', flexShrink:0, background:'#fff', border:'1px solid #e0e0e0', borderRadius:'10px', overflow:'hidden' }}>
      <div style={{ background:'#0d5c50', color:'#fff', padding:'11px 14px', fontSize:'14px', fontWeight:'700', display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{fontSize:'15px'}}>☰</span> หมวดหมู่สินค้า
      </div>
      {HP_CATEGORIES.map(c => (
        <div key={c.id}
          style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 14px', cursor:'pointer', borderBottom:'1px solid #f5f5f5', fontSize:'13px', color:'#1a1a1a', fontWeight:'500', transition:'background 0.12s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background='#e6f7f5'; e.currentTarget.style.color='#0d5c50'; }}
          onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#1a1a1a'; }}
          onClick={() => onCategoryChange(c.id)}>
          <img loading="lazy" decoding="async" src={c.img} style={{ width:'26px', height:'26px', objectFit:'contain' }}/>
          <span style={{flex:1}}>{c.label}</span>
          <span style={{ color:'#ccc', fontSize:'14px' }}>›</span>
        </div>
      ))}
    </div>
  );
}

function LineQRModal({ onClose }) {
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div
        style={{ background:'#fff', borderRadius:'20px', padding:'36px 40px', maxWidth:'360px', width:'90%', textAlign:'center', boxShadow:'0 24px 60px rgba(0,0,0,0.3)', position:'relative' }}
        onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position:'absolute', top:'14px', right:'18px', background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#888', lineHeight:1 }}>✕</button>
        <div style={{ width:'52px', height:'52px', background:'#06c755', borderRadius:'14px', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 3C9.37 3 4 7.478 4 13c0 3.54 2.18 6.67 5.5 8.54L8.5 26l5.2-2.73c.75.1 1.51.16 2.3.16 6.63 0 12-4.478 12-10S22.63 3 16 3z" fill="#fff"/></svg>
        </div>
        <div style={{ fontSize:'18px', fontWeight:'700', color:'#1a1a1a', marginBottom:'4px' }}>ติดต่อขอใบเสนอราคา</div>
        <div style={{ fontSize:'13px', color:'#888', marginBottom:'20px' }}>สแกน QR Code เพื่อเพิ่มเพื่อนใน LINE</div>
        <div style={{ background:'#f8f9fa', borderRadius:'12px', padding:'16px', display:'inline-block', marginBottom:'16px' }}>
          <img loading="lazy" decoding="async" src="assets/line-qr.png" style={{ width:'180px', height:'180px', objectFit:'contain', display:'block' }}/>
        </div>
        <div style={{ fontSize:'13px', fontWeight:'700', color:'#06c755', marginBottom:'18px' }}>@kirdsaengsawang</div>
        <a href="https://lin.ee/rAFJt2QD" target="_blank"
          style={{ display:'block', background:'#06c755', color:'#fff', borderRadius:'10px', padding:'12px', fontWeight:'700', fontSize:'15px', textDecoration:'none' }}>
          เปิด LINE ทันที →
        </a>
        <div style={{ fontSize:'11px', color:'#bbb', marginTop:'12px' }}>เวลาทำการ จันทร์–ศุกร์ 08:30–17:30 น.</div>
      </div>
    </div>
  );
}

function HPCarousel({ onNavigate }) {
  const [i, setI] = useState(0);
  const [showLine, setShowLine] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % HP_HERO_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);
  const s = HP_HERO_SLIDES[i];

  // ─── dots ───────────────────────────────────────────────────────────────
  const dots = (darkMode) => (
    <div style={{ position:'absolute', bottom:'20px', left:'44px', display:'flex', gap:'7px', zIndex:3 }}>
      {HP_HERO_SLIDES.map((_, idx) => (
        <div key={idx} onClick={() => setI(idx)}
          style={{ width:idx===i?'28px':'9px', height:'9px', borderRadius:'999px',
            background: darkMode
              ? (idx===i ? '#fff' : 'rgba(255,255,255,0.4)')
              : (idx===i ? '#0d5c50' : 'rgba(0,0,0,0.2)'),
            cursor:'pointer', transition:'all 0.3s ease' }}/>
      ))}
    </div>
  );

  // ─── layout: video ────────────────────────────────────────────────────
  if (s.layout === 'video') {
    return (
      <div style={{ flex:1, overflow:'hidden', position:'relative', aspectRatio:'16/4', background:'#000' }}>
        <video src={s.src} autoPlay loop muted playsInline
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)', zIndex:2, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', left:'44px', right:'44px', bottom:'52px', zIndex:3 }}>
          {s.headline && <div style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'30px', fontWeight:'800', color:'#fff', lineHeight:'1.25', marginBottom:'8px', textShadow:'0 2px 12px rgba(0,0,0,0.5)' }}>{s.headline}</div>}
          {s.sub && <div style={{ fontSize:'15px', color:'rgba(255,255,255,0.88)', textShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>{s.sub}</div>}
        </div>
      </div>
    );
  }

  // ─── layout: service2col (EPIC ELECTRIC) ────────────────────────────────
  if (s.layout === 'service2col') {
    const sparks = (accent) => (
      <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', overflow:'hidden' }}>
        {[12,28,46,63,78,90].map((lx,k) => (
          <span key={k} className="hs-spark"
            style={{ left:lx+'%', background:accent, boxShadow:`0 0 8px ${accent}, 0 0 14px ${accent}`,
              animation:`hs-spark ${3.4 + (k%3)*0.9}s ease-in-out ${k*0.55}s infinite` }}/>
        ))}
      </div>
    );
    const col = (data, accent, accent2, rises, floatCls) => (
      <div style={{ flex:1, display:'flex', alignItems:'center', padding:'34px 26px', gap:'16px', position:'relative', zIndex:3 }}>
        {/* รูปซ้าย + spotlight */}
        <div style={{ width:'205px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          {/* rotating conic halo */}
          <div className="hs-spin" style={{ position:'absolute', width:'215px', height:'215px', borderRadius:'50%', background:`conic-gradient(from 0deg, transparent, ${accent}66, transparent 50%, ${accent2}55, transparent)`, filter:'blur(7px)', opacity:0.95 }}/>
          {/* pulsing core glow */}
          <div className="hs-pulse" style={{ position:'absolute', width:'168px', height:'168px', borderRadius:'50%', background:`radial-gradient(circle, ${accent}77 0%, transparent 66%)` }}/>
          {/* expanding rings */}
          <div className="hs-ring" style={{ position:'absolute', width:'150px', height:'150px', borderRadius:'50%', border:`2px solid ${accent}99` }}/>
          <div className="hs-ring" style={{ position:'absolute', width:'150px', height:'150px', borderRadius:'50%', border:`2px solid ${accent}66`, animationDelay:'1.7s' }}/>
          {/* glowing pedestal */}
          <div style={{ position:'absolute', bottom:'10px', width:'160px', height:'30px', borderRadius:'50%', background:`radial-gradient(ellipse, ${accent}77 0%, transparent 70%)`, filter:'blur(4px)' }}/>
          <img src={data.img} className={floatCls}
            style={{ position:'relative', maxHeight:'232px', maxWidth:'205px', objectFit:'contain', filter:`drop-shadow(0 20px 32px rgba(0,0,0,0.6)) drop-shadow(0 0 22px ${accent}77)`, zIndex:2 }}
            onError={e => e.target.style.display='none'}/>
        </div>
        {/* ข้อความขวา */}
        <div style={{ flex:1 }}>
          <span className={rises[0]} style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:`linear-gradient(120deg, ${accent}33, rgba(255,255,255,0.04))`, backdropFilter:'blur(8px)', border:`1px solid ${accent}88`, color:'#f2fffb', fontSize:'11px', fontWeight:'700', padding:'6px 16px', borderRadius:'999px', marginBottom:'14px', letterSpacing:'0.06em', boxShadow:`0 4px 18px ${accent}44` }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:accent, boxShadow:`0 0 12px ${accent}` }}/>
            {data.tag}
          </span>
          <div className={rises[1] + ' hs-sheen hs-neon'} style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'46px', fontWeight:'800', lineHeight:'1.04', whiteSpace:'pre-line', marginBottom:'16px', letterSpacing:'-1px' }}>
            {data.headline}
          </div>
          {data.bullets && (
            <ul className={rises[2]} style={{ paddingLeft:'0', marginBottom:'18px', listStyle:'none' }}>
              {data.bullets.map((b,bi) => (
                <li key={bi} style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'15px', fontWeight:'600', color:'rgba(255,255,255,0.94)', marginBottom:'10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, filter:`drop-shadow(0 0 5px ${accent}aa)` }}><circle cx="12" cy="12" r="11" fill={accent} opacity="0.26"/><circle cx="12" cy="12" r="11" stroke={accent} strokeWidth="1.3" opacity="0.65"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {b}
                </li>
              ))}
              <li style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', marginTop:'6px', fontStyle:'italic' }}>*สำหรับงานโครงการ / งานวางระบบไฟ</li>
            </ul>
          )}
          <button className={'hs-cta ' + rises[3]}
            style={{ display:'inline-flex', alignItems:'center', gap:'9px', background:'linear-gradient(120deg, #f05a20 0%, #ff7a3d 100%)', color:'#fff', border:'none', borderRadius:'12px', padding:'14px 32px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'14.5px', fontWeight:'700', cursor:'pointer', boxShadow:'0 10px 30px rgba(232,85,28,0.55), 0 0 0 1px rgba(255,255,255,0.12) inset', transition:'transform 0.15s ease, box-shadow 0.15s ease', marginTop:'4px' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px) scale(1.03)'; e.currentTarget.style.boxShadow='0 16px 38px rgba(232,85,28,0.7), 0 0 0 1px rgba(255,255,255,0.2) inset'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow='0 10px 30px rgba(232,85,28,0.55), 0 0 0 1px rgba(255,255,255,0.12) inset'; }}
            onClick={() => setShowLine(true)}>
            {data.cta}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>
    );
    return (
      <>
        {showLine && <LineQRModal onClose={() => setShowLine(false)}/>}
        <div style={{ flex:1, borderRadius:'22px', overflow:'hidden', position:'relative', background:'radial-gradient(120% 130% at 75% 10%, #0a4f44 0%, #06352e 42%, #041c19 100%)', minHeight:'340px', display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(4,28,25,0.55)', border:'1px solid rgba(110,255,225,0.12)' }}>
          {/* animated aurora blobs */}
          <div className="hs-aurora" style={{ position:'absolute', top:'-30%', left:'8%', width:'340px', height:'340px', borderRadius:'50%', background:'radial-gradient(circle, rgba(34,211,180,0.4) 0%, transparent 66%)', zIndex:1, pointerEvents:'none', filter:'blur(6px)' }}/>
          <div className="hs-aurora2" style={{ position:'absolute', bottom:'-35%', right:'6%', width:'320px', height:'320px', borderRadius:'50%', background:'radial-gradient(circle, rgba(240,90,32,0.28) 0%, transparent 68%)', zIndex:1, pointerEvents:'none', filter:'blur(6px)' }}/>
          <div className="hs-aurora2" style={{ position:'absolute', top:'20%', left:'48%', width:'260px', height:'260px', borderRadius:'50%', background:'radial-gradient(circle, rgba(95,209,194,0.22) 0%, transparent 70%)', zIndex:1, pointerEvents:'none', filter:'blur(8px)', animationDelay:'3s' }}/>
          {/* synthwave perspective grid floor */}
          <div className="hs-gridfloor"/>
          {/* dot texture */}
          <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', opacity:0.4,
            backgroundImage:'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize:'24px 24px' }}/>
          {/* rising spark particles */}
          {sparks('#6effe1')}
          {/* moving scan line */}
          <div className="hs-scanline"/>
          {/* top + bottom neon edge */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'1.5px', background:'linear-gradient(90deg, transparent, rgba(110,255,225,0.7), transparent)', zIndex:4 }}/>
          <div style={{ flex:1, display:'flex', alignItems:'stretch' }}>
            {col(s.left, '#22d3b4', '#6effe1', ['hs-rise1','hs-rise2','hs-rise3','hs-rise4'], 'hs-float')}
            <div style={{ width:'1.5px', background:'linear-gradient(to bottom, transparent, rgba(110,255,225,0.45) 30%, rgba(110,255,225,0.45) 70%, transparent)', margin:'36px 0', flexShrink:0, zIndex:3, boxShadow:'0 0 12px rgba(110,255,225,0.4)' }}/>
            {col(s.right, '#f97316', '#ffb066', ['hs-rise2','hs-rise3','hs-rise4','hs-rise4'], 'hs-float2')}
          </div>
          {dots(true)}
        </div>
      </>
    );
  }

  // ─── layout: lightcard (พื้นขาว + ป้ายเขียว + KIRD SAENG SAWANG) ─────────
  if (s.layout === 'lightcard') {
    return (
      <div style={{ flex:1, borderRadius:'18px', overflow:'hidden', position:'relative', minHeight:'320px', display:'flex', alignItems:'center', background:'#ffffff', border:'1px solid #eef2f0', boxShadow:'0 10px 30px rgba(15,77,42,0.08)' }}>
        {/* เส้นลายมุมขวาบน */}
        <svg width="120" height="90" viewBox="0 0 120 90" style={{ position:'absolute', top:'14px', right:'18px', zIndex:1, opacity:0.35 }}>
          <path d="M10 80 L60 10" stroke="#5fd1c2" strokeWidth="2"/>
          <path d="M30 85 L75 15" stroke="#5fd1c2" strokeWidth="2"/>
          <path d="M50 88 L92 20" stroke="#5fd1c2" strokeWidth="2"/>
        </svg>

        <div style={{ flex:1, zIndex:2, position:'relative', padding:'34px 20px 34px 44px', maxWidth:'42%' }}>
          <p style={{ fontSize:'13px', color:'#666', lineHeight:'1.7', marginBottom:'18px' }}>{s.sub}</p>
          <button style={{ background:'transparent', border:'1.5px solid #0d5c50', color:'#0d5c50', borderRadius:'999px', padding:'9px 22px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}
            onClick={() => onNavigate('สินค้าทั้งหมด')}>รายละเอียดเพิ่มเติม</button>
        </div>

        <div style={{ width:'420px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2, position:'relative' }}>
          <div style={{ position:'absolute', bottom:'12px', width:'260px', height:'32px', borderRadius:'50%', background:'radial-gradient(ellipse, rgba(16,185,129,0.18) 0%, transparent 72%)' }}/>
          <img src={s.img} style={{ position:'relative', maxHeight:'260px', maxWidth:'100%', objectFit:'contain', filter:'drop-shadow(0 18px 30px rgba(0,0,0,0.18))' }}/>
        </div>

        <div style={{ position:'absolute', top:'26px', right:'26px', zIndex:3, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'12px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'#e8f8f1', color:'#0d9488', fontSize:'12px', fontWeight:'700', padding:'6px 16px', borderRadius:'999px' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#0d9488' }}/> รับประกันคุณภาพ
          </span>
          <div style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'22px', fontWeight:'800', color:'#1a1a1a' }}>{s.badge}</div>
          <button
            style={{ background:'linear-gradient(120deg, #0d9488 0%, #0d5c50 100%)', color:'#fff', border:'none', borderRadius:'999px', padding:'11px 30px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'13.5px', fontWeight:'700', cursor:'pointer', boxShadow:'0 8px 20px rgba(13,148,136,0.35)' }}
            onClick={() => onNavigate('สินค้าทั้งหมด')}>{s.cta}</button>
        </div>

        <div style={{ position:'absolute', bottom:'20px', left:'44px', zIndex:3, display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ width:'22px', height:'22px', borderRadius:'50%', background:'#0d9488', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span style={{ fontSize:'12px', color:'#888', fontWeight:'600' }}>สินค้าคุณภาพ ตรวจสอบได้</span>
        </div>

        <div style={{ position:'absolute', bottom:'22px', right:'26px', zIndex:3, fontSize:'12px', color:'#999', fontWeight:'600', letterSpacing:'0.14em' }}>
          KIRD SAENG <span style={{ color:'#0d9488' }}>&</span> SAWANG
        </div>

        {dots(false)}
      </div>
    );
  }

  // ─── layout: lightpromo (พื้นขาว) ───────────────────────────────────────
  if (s.layout === 'lightpromo') {
    return (
      <div style={{ flex:1, borderRadius:'18px', overflow:'hidden', position:'relative', minHeight:'320px', display:'flex', alignItems:'center', boxShadow:'0 10px 30px rgba(15,77,42,0.12)', border:'1px solid #e2f0e8',
        background:'linear-gradient(120deg,#ffffff 0%,#f3fbf6 55%,#e6f7ec 100%)' }}>
        {/* full banner image — masked edges blend into background */}
        <img src={s.img} style={{ position:'absolute', right:'0', bottom:'0', height:'96%', width:'72%', objectFit:'contain', objectPosition:'right bottom', zIndex:1, mixBlendMode:'multiply',
          WebkitMaskImage:'linear-gradient(100deg, transparent 0%, rgba(0,0,0,0.6) 18%, #000 40%), linear-gradient(0deg, transparent 0%, #000 14%)',
          WebkitMaskComposite:'source-in', maskComposite:'intersect',
          maskImage:'linear-gradient(100deg, transparent 0%, rgba(0,0,0,0.6) 18%, #000 40%), linear-gradient(0deg, transparent 0%, #000 14%)' }} onError={e => e.target.style.display='none'}/>
        {/* gentle tint overlay to unify image with bg */}
        <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', background:'linear-gradient(95deg, #f3fbf6 0%, rgba(243,251,246,0.55) 30%, rgba(230,247,236,0.12) 50%, transparent 64%)' }}/>
        {/* soft accent glow */}
        <div style={{ position:'absolute', bottom:'-120px', left:'-60px', width:'320px', height:'320px', borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', zIndex:1, pointerEvents:'none' }}/>

        <div style={{ flex:1, zIndex:2, position:'relative', padding:'36px 0 36px 48px', maxWidth:'52%' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'rgba(16,185,129,0.12)', color:'#0d6b5c', fontSize:'12px', fontWeight:'700', padding:'6px 16px', borderRadius:'999px', marginBottom:'16px' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#5fd1c2' }}/> สินค้าคุณภาพ
          </span>
          <div style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'44px', fontWeight:'800', color:s.headlineColor || '#0d6b5c', lineHeight:'1.1', letterSpacing:'-1px', marginBottom:'14px' }}>{s.headline}</div>
          <p style={{ fontSize:'16px', color:'#f05a20', fontWeight:'700', marginBottom:'28px', letterSpacing:'0.2px' }}>{s.sub}</p>
          <button
            style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'linear-gradient(120deg, #f05a20 0%, #ff7a3d 100%)', color:'#fff', border:'none', borderRadius:'999px', padding:'14px 38px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'15px', fontWeight:'700', cursor:'pointer', boxShadow:'0 10px 26px rgba(232,85,28,0.42)', transition:'transform 0.15s ease, box-shadow 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 14px 32px rgba(232,85,28,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 10px 26px rgba(232,85,28,0.42)'; }}
            onClick={() => onNavigate('สินค้าทั้งหมด')}>{s.cta}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>

        {dots(false)}
      </div>
    );
  }

  // ─── layout: standard (EPIC) ────────────────────────────────────────────
  const glow = s.glow || '#ffffff';
  const sparksRow = (color) => (
    <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', overflow:'hidden' }}>
      {[10,24,40,58,72,86,95].map((lx,k) => (
        <span key={k} className="hs-spark"
          style={{ left:lx+'%', background:color, boxShadow:`0 0 8px ${color}, 0 0 14px ${color}`,
            animation:`hs-spark ${3.2 + (k%3)*0.8}s ease-in-out ${k*0.45}s infinite` }}/>
      ))}
    </div>
  );
  return (
    <div style={{ flex:1, borderRadius:'22px', overflow:'hidden', position:'relative', background:s.bg, minHeight:'340px', display:'flex', alignItems:'center', padding:'36px 48px', boxShadow:'0 22px 54px rgba(20,120,80,0.28)', border:'1px solid rgba(255,255,255,0.12)' }}>
      {/* dot grid texture */}
      <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', opacity:0.4,
        backgroundImage:'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize:'24px 24px' }}/>
      {/* animated aurora glow accents */}
      <div className="hs-aurora" style={{ position:'absolute', top:'-32%', right:'14%', width:'380px', height:'380px', borderRadius:'50%', background:`radial-gradient(circle, ${glow}66 0%, transparent 66%)`, zIndex:1, pointerEvents:'none', filter:'blur(8px)' }}/>
      <div className="hs-aurora2" style={{ position:'absolute', bottom:'-38%', left:'-8%', width:'340px', height:'340px', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 70%)', zIndex:1, pointerEvents:'none', filter:'blur(8px)' }}/>
      {/* synthwave grid floor */}
      <div className="hs-gridfloor" style={{ backgroundImage:`linear-gradient(${glow}3a 1px, transparent 1px), linear-gradient(90deg, ${glow}3a 1px, transparent 1px)` }}/>
      {/* sparks + scan line */}
      {sparksRow(glow)}
      <div className="hs-scanline" style={{ background:`linear-gradient(90deg, transparent, ${glow}, transparent)`, boxShadow:`0 0 14px ${glow}` }}/>
      {/* top neon edge */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'1.5px', background:`linear-gradient(90deg, transparent, ${glow}cc, transparent)`, zIndex:4 }}/>

      <div style={{ flex:1, zIndex:3, position:'relative' }}>
        {/* glass tag */}
        <span className="hs-rise1" style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:`1px solid ${glow}77`, color:'#fff', fontSize:'12px', fontWeight:'700', padding:'6px 16px', borderRadius:'999px', letterSpacing:'0.04em', marginBottom:'18px', boxShadow:`0 4px 16px ${glow}33` }}>
          <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:glow, boxShadow:`0 0 10px ${glow}` }}/>
          {s.tag}
        </span>
        <div className="hs-rise2 hs-neon" style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'42px', fontWeight:'800', color:'#fff', lineHeight:'1.08', marginBottom:'14px', letterSpacing:'-0.8px' }}>{s.headline}</div>
        <div className="hs-rise3" style={{ display:'inline-block', position:'relative', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'48px', fontWeight:'800', color:'#7a4a12', lineHeight:'1.05', letterSpacing:'-0.5px', marginBottom:'22px', background:'linear-gradient(120deg, #fff7e0 0%, #ffd982 100%)', padding:'6px 30px', borderRadius:'14px', boxShadow:'0 12px 30px rgba(255,200,90,0.5), 0 0 0 1px rgba(255,255,255,0.5) inset' }}>
          <span className="hs-cta" style={{ position:'absolute', inset:0, borderRadius:'14px', overflow:'hidden' }}/>
          {s.accent}
        </div>
        <p className="hs-rise3" style={{ fontSize:'15px', color:'rgba(255,255,255,0.88)', marginBottom:'28px', maxWidth:'370px', lineHeight:'1.65', fontWeight:'400' }}>{s.sub}</p>
        <button className="hs-cta hs-rise4"
          style={{ display:'inline-flex', alignItems:'center', gap:'9px', background:'linear-gradient(120deg, #f05a20 0%, #ff7a3d 100%)', color:'#fff', border:'none', borderRadius:'999px', padding:'14px 36px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'15px', fontWeight:'700', cursor:'pointer', boxShadow:'0 12px 32px rgba(232,85,28,0.55), 0 0 0 1px rgba(255,255,255,0.14) inset', transition:'transform 0.15s ease, box-shadow 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px) scale(1.03)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(232,85,28,0.7), 0 0 0 1px rgba(255,255,255,0.22) inset'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(232,85,28,0.55), 0 0 0 1px rgba(255,255,255,0.14) inset'; }}
          onClick={() => onNavigate('สินค้าทั้งหมด')}>{s.cta}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>

      <div style={{ width:'430px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:3, position:'relative' }}>
        {/* rotating conic halo */}
        <div className="hs-spin" style={{ position:'absolute', width:'350px', height:'350px', borderRadius:'50%', background:`conic-gradient(from 0deg, transparent, ${glow}66, transparent 52%, rgba(255,255,255,0.3), transparent)`, filter:'blur(8px)' }}/>
        {/* pulsing core */}
        <div className="hs-pulse" style={{ position:'absolute', width:'300px', height:'300px', borderRadius:'50%', background:`radial-gradient(circle, ${glow}55 0%, rgba(255,255,255,0.12) 34%, transparent 72%)` }}/>
        {/* expanding rings */}
        <div className="hs-ring" style={{ position:'absolute', width:'270px', height:'270px', borderRadius:'50%', border:`2px solid ${glow}88` }}/>
        <div className="hs-ring" style={{ position:'absolute', width:'270px', height:'270px', borderRadius:'50%', border:`2px solid ${glow}55`, animationDelay:'1.7s' }}/>
        <img src={s.img} className="hs-float" style={{ position:'relative', maxHeight:'330px', maxWidth:'100%', objectFit:'contain', filter:`drop-shadow(0 26px 46px rgba(0,0,0,0.55)) drop-shadow(0 0 26px ${glow}66)`, zIndex:2 }}/>
      </div>
      {dots(true)}
    </div>
  );
}

function HPPromoStack({ onNavigate }) {
  return (
    <div style={{ width:'260px', flexShrink:0, display:'flex', flexDirection:'column', gap:'12px' }}>
      <div
        style={{ flex:1, borderRadius:'12px', padding:'20px', background:'linear-gradient(135deg, #f05a20 0%, #c2410c 100%)', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden', transition:'transform 0.15s ease' }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
        onClick={() => onNavigate('สินค้าทั้งหมด')}>
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.85)', fontWeight:'600', marginBottom:'4px' }}>ดีลเด็ดประจำสัปดาห์</span>
        <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'24px', fontWeight:'700', color:'#fff', lineHeight:'1.1' }}>หลอด LED</div>
        <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'30px', fontWeight:'700', color:'#fff', lineHeight:'1' }}>เริ่ม ฿65</div>
        <span style={{ marginTop:'8px', fontSize:'13px', color:'#fff', fontWeight:'600' }}>ช้อปเลย →</span>
        <img loading="lazy" decoding="async" src="assets/cat-bulb.png" style={{ position:'absolute', right:'-10px', bottom:'-10px', width:'90px', height:'90px', objectFit:'contain', opacity:0.35 }}/>
      </div>
      <div
        style={{ flex:1, borderRadius:'12px', padding:'20px', background:'linear-gradient(135deg, #0d5c50 0%, #06352e 100%)', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden', transition:'transform 0.15s ease' }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
        onClick={() => onNavigate('ติดต่อ')}>
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.85)', fontWeight:'600', marginBottom:'4px' }}>บริการรับประกอบ</span>
        <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'24px', fontWeight:'700', color:'#fff', lineHeight:'1.1' }}>ตู้โหลด 3 เฟส</div>
        <div style={{ fontSize:'13px', color:'#9fe6d8', fontWeight:'600', marginTop:'2px' }}>โดยช่างมืออาชีพ</div>
        <span style={{ marginTop:'8px', fontSize:'13px', color:'#fff', fontWeight:'600' }}>สอบถาม →</span>
        <img loading="lazy" decoding="async" src="assets/cat-panel.png" style={{ position:'absolute', right:'-10px', bottom:'-10px', width:'90px', height:'90px', objectFit:'contain', opacity:0.3 }}/>
      </div>
    </div>
  );
}

function HPHero({ onNavigate, onCategoryChange }) {
  return (
    <section style={{ background:'#f9fafb', display:'flex', alignItems:'stretch' }}>
      <HPCarousel onNavigate={onNavigate}/>
    </section>
  );
}

function HPServiceBar({ onNavigate }) {
  return (
    <section style={{ background:'linear-gradient(180deg, #ffffff 0%, #f4faf8 100%)', overflow:'hidden', position:'relative', borderBottom:'1px solid #f0f0f0' }}>
      {/* decorative dot grid */}
      <div style={{ position:'absolute', top:0, right:0, width:'50%', height:'100%', opacity:0.5, backgroundImage:'radial-gradient(rgba(13,148,136,0.14) 1.5px, transparent 1.5px)', backgroundSize:'22px 22px', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'-30%', right:'4%', width:'380px', height:'380px', borderRadius:'50%', background:'radial-gradient(circle, rgba(139,200,63,0.16) 0%, transparent 70%)', pointerEvents:'none' }}/>
      {/* logo watermark */}
      <img loading="lazy" decoding="async" src="assets/logo-kss.jpg" style={{ position:'absolute', right:'2%', top:'50%', transform:'translateY(-50%)', width:'280px', height:'280px', objectFit:'contain', opacity:0.22, pointerEvents:'none' }}/>

      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'56px 20px', display:'flex', alignItems:'center', gap:'40px' }}>
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2, width:'380px' }}>
          <div style={{ position:'absolute', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 72%)' }}/>
          <img loading="lazy" decoding="async" src="assets/product-display.png" style={{ position:'relative', maxHeight:'250px', maxWidth:'100%', objectFit:'contain', filter:'drop-shadow(0 20px 28px rgba(0,0,0,0.16))' }}/>
        </div>
        <div style={{ flex:1, position:'relative', zIndex:2 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'#e8f8f1', border:'1px solid #bfe8da', color:'#0d9488', fontSize:'12px', fontWeight:'700', padding:'6px 16px', borderRadius:'999px', marginBottom:'18px' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#0d9488' }}/> ทำไมต้องซื้อกับเรา
          </span>
          <div style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'32px', fontWeight:'800', color:'#12241d', lineHeight:'1.3', letterSpacing:'-0.4px', marginBottom:'16px', maxWidth:'560px' }}>
            ซื้อกับเรา <span style={{ color:'#0d9488' }}>มั่นใจได้</span><br/>ได้รับสินค้า 100% ทางเรามีหน้าร้านจริง
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'28px' }}>
            {['สินค้าของแท้ 100%','มีหน้าร้านจริง','บริการหลังการขาย'].map((t,i) => (
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#fff', border:'1px solid #e6efe9', color:'#3a4a42', fontSize:'12.5px', fontWeight:'600', padding:'7px 14px', borderRadius:'999px', boxShadow:'0 2px 8px rgba(13,92,80,0.05)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4L19 7"/></svg>
                {t}
              </span>
            ))}
          </div>
          <button
            style={{ background:'linear-gradient(120deg, #f05a20 0%, #ff7a3d 100%)', color:'#fff', border:'none', borderRadius:'10px', padding:'13px 30px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'14px', fontWeight:'700', cursor:'pointer', boxShadow:'0 10px 26px rgba(240,90,32,0.28)' }}
            onClick={() => onNavigate && onNavigate('สินค้าทั้งหมด')}>เลือกซื้อสินค้า →</button>
        </div>
      </div>
    </section>
  );
}

function HPCategoryShowcase({ onCategoryChange }) {
  const scrollRef = React.useRef(null);
  const scrollBy = (dx) => scrollRef.current && scrollRef.current.scrollBy({ left: dx, behavior: 'smooth' });
  const cards = [
    { cat:'breaker',    tag:'ยอดนิยม',       title:'เบรกเกอร์',       desc:'ตัดไฟอัตโนมัติ ปลอดภัยได้มาตรฐาน',   price:185,  img:'assets/cat-breaker.jpg',         accent:'#0d9488' },
    { cat:'loadcenter', tag:'งานระบบไฟ',     title:'ตู้โหลดเซนเตอร์', desc:'จัดระเบียบวงจรไฟฟ้าทั้งบ้าน',       price:1890, img:'assets/ตู้โหลดเซนเตอร์.png',     accent:'#475569' },
    { cat:'consumer',   tag:'ราคาส่ง',       title:'ตู้คอนซูมเมอร์',  desc:'ครบ จบทุกไซซ์ ราคาโรงงาน',           price:1890, img:'assets/ตู้คอนซูมเมอร์ยูนิต.png', accent:'#f05a20' },
    { cat:'wire',       tag:'คุณภาพมาตรฐาน', title:'สายไฟ',           desc:'ทองแดงแท้ 100% ทุกขนาด',             price:890,  img:'assets/cat-wire.jpg',            accent:'#115e59' },
    { cat:'bulb',       tag:'ประหยัดไฟ',     title:'หลอดไฟ',          desc:'แสงสว่างคมชัด อายุการใช้งานยาวนาน',  price:65,   img:'assets/cat-bulb.png',            accent:'#ca8a04' },
    { cat:'switch',     tag:'ดีไซน์ทันสมัย', title:'สวิตช์ ปลั๊ก',    desc:'ลุคเรียบหรู ใช้งานได้ทุกพื้นที่',     price:95,   img:'assets/cat-switch.jpg',          accent:'#334155' },
  ];
  return (
    <section style={{ background:'#fff', padding:'44px 0 52px' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'22px' }}>
          <div style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'22px', color:'#1a1a1a' }}>
            <span style={{ fontWeight:'800' }}>หมวดหมู่สินค้าแนะนำ</span>{' '}
            <span style={{ fontWeight:'400', color:'#889' }}>เลือกซื้อตามที่คุณต้องการได้เลย</span>
          </div>
          <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
            <button onClick={() => scrollBy(-300)} style={{ width:'36px', height:'36px', borderRadius:'50%', border:'1px solid #e0e0e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a7a66" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={() => scrollBy(300)} style={{ width:'36px', height:'36px', borderRadius:'50%', border:'1px solid #e0e0e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a7a66" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="hp-scroll-hide" style={{ display:'flex', gap:'16px', overflowX:'auto', scrollSnapType:'x mandatory', paddingBottom:'6px' }}>
          {cards.map((c, idx) => (
            <div key={idx} onClick={() => onCategoryChange(c.cat)}
              style={{ flex:'0 0 auto', width:'250px', height:'340px', borderRadius:'22px', background:'#fff', border:'1px solid #eef0f2', boxShadow:'0 4px 16px rgba(15,77,42,0.06)', position:'relative', overflow:'hidden', cursor:'pointer', scrollSnapAlign:'start', padding:'26px 22px', display:'flex', flexDirection:'column', transition:'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 14px 30px rgba(15,77,42,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(15,77,42,0.06)'; }}>
              <span style={{ display:'inline-block', alignSelf:'flex-start', background:`${c.accent}14`, color:c.accent, fontSize:'11px', fontWeight:'700', padding:'5px 12px', borderRadius:'999px', marginBottom:'14px' }}>{c.tag}</span>
              <div style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'21px', fontWeight:'800', color:'#1a1a1a', marginBottom:'6px' }}>{c.title}</div>
              <div style={{ fontSize:'12.5px', color:'#889', lineHeight:'1.5' }}>{c.desc}</div>
              <div style={{ flex:1, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                <img loading="lazy" decoding="async" src={c.img} style={{ maxWidth:'80%', maxHeight:'140px', objectFit:'contain', mixBlendMode:'multiply' }} onError={e => e.target.style.display='none'}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRODUCT CARD & SECTIONS ──────────────────────────────────────────────────

function HPProductCard({ p, onAddToCart, flash }) {
  const [added, setAdded] = useState(false);
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : null;
  const soldPct  = Math.min(100, Math.round((p.sold / (p.sold + p.stock)) * 100));
  const handleAdd = () => { setAdded(true); onAddToCart(p); setTimeout(() => setAdded(false), 1100); };
  return (
    <div
      style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:'10px', overflow:'hidden', display:'flex', flexDirection:'column', position:'relative', transition:'box-shadow 0.15s ease, transform 0.15s ease', minWidth:0 }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.10)'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}>
      {discount && <div style={{ position:'absolute', top:'8px', left:'8px', zIndex:2, background:'#f05a20', color:'#fff', fontSize:'12px', fontWeight:'700', padding:'3px 8px', borderRadius:'6px', fontFamily:'Mitr, sans-serif' }}>-{discount}%</div>}
      <div style={{ height:'150px', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', borderBottom:'1px solid #f5f5f5' }}>
        <img loading="lazy" decoding="async" src={p.img} style={{ maxHeight:'118px', maxWidth:'118px', objectFit:'contain' }}/>
      </div>
      <div style={{ padding:'10px 12px 12px', display:'flex', flexDirection:'column', gap:'3px', flex:1 }}>
        {p.brand && <div style={{ fontSize:'10px', color:'#9e9e9e', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.04em' }}>{p.brand}</div>}
        <div style={{ fontSize:'13px', color:'#333', lineHeight:'1.4', height:'36px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.name}</div>
        <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginTop:'2px' }}>
          <span style={{ fontFamily:'Mitr, sans-serif', fontSize:'19px', fontWeight:'700', color:'#f05a20' }}>฿{p.price.toLocaleString()}</span>
          {p.oldPrice && <span style={{ fontSize:'12px', color:'#bbb', textDecoration:'line-through' }}>฿{p.oldPrice.toLocaleString()}</span>}
        </div>
        {p.installment && <div style={{ fontSize:'10px', color:'#0d5c50', fontWeight:'600' }}>ผ่อน 0% นาน 10 เดือน</div>}
        {flash && (
          <div style={{ marginTop:'6px' }}>
            <div style={{ height:'14px', background:'#ffedd5', borderRadius:'999px', overflow:'hidden', position:'relative' }}>
              <div style={{ width:`${soldPct}%`, height:'100%', background:'linear-gradient(90deg, #f05a20, #ed6a34)', borderRadius:'999px' }}/>
              <span style={{ position:'absolute', top:0, left:0, right:0, textAlign:'center', fontSize:'9px', color:'#9a3412', fontWeight:'700', lineHeight:'14px' }}>ขายแล้ว {p.sold} ชิ้น</span>
            </div>
          </div>
        )}
        <button
          style={{ marginTop:'8px', background:added?'#0e6356':'#0d5c50', color:'#fff', border:'none', borderRadius:'999px', padding:'8px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'13px', fontWeight:'700', cursor:'pointer', transition:'background 0.2s ease' }}
          onClick={handleAdd}>{added ? '✓ เพิ่มแล้ว' : 'หยิบใส่ตะกร้า'}</button>
      </div>
    </div>
  );
}

function useCountdown(initial) {
  const [t, setT] = useState(initial);
  useEffect(() => {
    const timer = setInterval(() => setT(prev => prev > 0 ? prev - 1 : initial), 1000);
    return () => clearInterval(timer);
  }, []);
  return [String(Math.floor(t/3600)).padStart(2,'0'), String(Math.floor((t%3600)/60)).padStart(2,'0'), String(t%60).padStart(2,'0')];
}

function HPFlashSale({ onAddToCart }) {
  const [h, m, s] = useCountdown(7*3600 + 42*60 + 18);
  const items = HP_PRODUCTS.filter(p => p.oldPrice).slice(0, 6);
  const box = { background:'#1a1a1a', color:'#fff', fontFamily:'Mitr, sans-serif', fontSize:'16px', fontWeight:'700', borderRadius:'6px', padding:'4px 8px', minWidth:'30px', textAlign:'center' };
  return (
    <section style={{ background:'#fff7ed', padding:'24px 0', borderTop:'1px solid #ffedd5' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{fontSize:'26px'}}>⚡</span>
            <span style={{ fontFamily:'Mitr, sans-serif', fontSize:'26px', fontWeight:'700', color:'#f05a20' }}>FLASH SALE</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <span style={{ fontSize:'13px', color:'#666', fontWeight:'600' }}>จบใน</span>
            <div style={box}>{h}</div><span style={{color:'#f05a20',fontWeight:'700'}}>:</span>
            <div style={box}>{m}</div><span style={{color:'#f05a20',fontWeight:'700'}}>:</span>
            <div style={box}>{s}</div>
          </div>
          <span style={{ marginLeft:'auto', fontSize:'13px', color:'#0d5c50', fontWeight:'700', cursor:'pointer' }}>ดูทั้งหมด →</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'12px' }}>
          {items.map(p => <HPProductCard key={p.id} p={p} onAddToCart={onAddToCart} flash={true}/>)}
        </div>
      </div>
    </section>
  );
}

function HPCategoryCircles({ onCategoryChange }) {
  const all = HP_CIRCLE_CATEGORIES;
  return (
    <section style={{ background:'#f9fafb', padding:'32px 0', borderTop:'1px solid #f0f0f0' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:'800', color:'#1a1a1a', marginBottom:'24px' }}>หมวดหมู่สินค้า</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(9, 1fr)', gap:'14px' }}>
          {all.map(c => (
            <div key={c.id}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', cursor:'pointer', background:'#fff', borderRadius:'18px', padding:'22px 10px 16px', border:'1px solid #eee', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', transition:'transform 0.15s ease, box-shadow 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='0 12px 28px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.06)'; }}
              onClick={() => onCategoryChange(c.id)}>
              <div style={{ width:'110px', height:'110px', borderRadius:'50%', background:'linear-gradient(135deg, #eaf6f5 0%, #e6f7f5 100%)', border:'2.5px solid #c2ece6', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', boxShadow:'0 6px 16px rgba(26,122,66,0.12)' }}>
                <img loading="lazy" decoding="async" src={c.img} style={{ width:'82px', height:'82px', objectFit:'contain' }}/>
              </div>
              <span style={{ fontSize:'13px', color:'#222', fontWeight:'700', textAlign:'center', lineHeight:'1.5' }}>{c.label}</span>
              <div style={{ background:'#f05a20', color:'#fff', fontSize:'12px', fontWeight:'700', padding:'6px 16px', borderRadius:'999px', cursor:'pointer', whiteSpace:'nowrap' }}>
                เพิ่มเติม →
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HPPromoGrid({ onNavigate }) {
  const hover = { onMouseEnter:e=>e.currentTarget.style.transform='scale(1.015)', onMouseLeave:e=>e.currentTarget.style.transform='scale(1)' };
  const card = (bg) => ({ borderRadius:'12px', overflow:'hidden', background:bg, padding:'26px 28px', cursor:'pointer', position:'relative', minHeight:'150px', display:'flex', flexDirection:'column', justifyContent:'center', transition:'transform 0.15s ease' });
  return (
    <section style={{ background:'#f9fafb', padding:'8px 0 24px' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px', display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'14px' }}>
        <div style={card('linear-gradient(120deg, #06352e, #0d5c50)')} {...hover} onClick={() => onNavigate('สินค้าทั้งหมด')}>
          <span style={{ fontSize:'12px', color:'#9fe6d8', fontWeight:'700' }}>โปรโมชันสายไฟ</span>
          <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'30px', fontWeight:'700', color:'#fff', lineHeight:'1.1', margin:'4px 0 8px' }}>สายไฟคุณภาพ<br/>ราคาส่ง</div>
          <button style={{ alignSelf:'flex-start', background:'#f05a20', color:'#fff', border:'none', borderRadius:'999px', padding:'8px 20px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>ดูสินค้า →</button>
          <img loading="lazy" decoding="async" src="assets/cat-wire.jpg" style={{ position:'absolute', right:'20px', bottom:'10px', width:'120px', height:'120px', objectFit:'contain', opacity:0.85 }}/>
        </div>
        <div style={card('linear-gradient(120deg, #f05a20, #c2410c)')} {...hover} onClick={() => onNavigate('สินค้าทั้งหมด')}>
          <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.85)', fontWeight:'700' }}>ลดพิเศษ</span>
          <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'22px', fontWeight:'700', color:'#fff', lineHeight:'1.15', margin:'4px 0' }}>เบรกเกอร์</div>
          <span style={{ fontSize:'13px', color:'#fff', fontWeight:'600' }}>เริ่ม ฿185 →</span>
          <img loading="lazy" decoding="async" src="assets/cat-breaker.jpg" style={{ position:'absolute', right:'-6px', bottom:'-6px', width:'80px', height:'80px', objectFit:'contain', opacity:0.4 }}/>
        </div>
        <div style={card('linear-gradient(120deg, #2d2d2d, #1a1a1a)')} {...hover} onClick={() => onNavigate('สินค้าทั้งหมด')}>
          <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', fontWeight:'700' }}>มาใหม่</span>
          <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'22px', fontWeight:'700', color:'#fff', lineHeight:'1.15', margin:'4px 0' }}>ปลั๊กราง USB</div>
          <span style={{ fontSize:'13px', color:'#ffcf4d', fontWeight:'600' }}>ดูเลย →</span>
          <img loading="lazy" decoding="async" src="assets/cat-powerstrip.jpg" style={{ position:'absolute', right:'-6px', bottom:'-6px', width:'80px', height:'80px', objectFit:'contain', opacity:0.4 }}/>
        </div>
      </div>
    </section>
  );
}

function HPProductGuide() {
  const items = [
    { cat:'bulb', num:1, title:'หลอดไฟ LED', img:'assets/nano/nl-e27-9wdl.png',
      intro:'หลอดไฟ LED เป็นอุปกรณ์ให้แสงสว่างที่ได้รับความนิยมสูงสุดในปัจจุบัน เนื่องจากใช้พลังงานน้อยกว่าหลอดไส้หรือหลอดฟลูออเรสเซนต์แบบเดิมมาก แต่ให้ความสว่างเทียบเท่าหรือมากกว่า อีกทั้งยังไม่มีสารปรอทเจือปนและมีอายุการใช้งานยาวนานกว่า 15,000–25,000 ชั่วโมง' },
    { cat:'breaker', num:2, title:'เบรกเกอร์', img:'assets/เบรกเกอร์.png',
      intro:'เบรกเกอร์ทำหน้าที่เหมือนหัวใจของระบบไฟฟ้าในบ้าน เป็นอุปกรณ์ที่ตัดกระแสไฟฟ้าโดยอัตโนมัติเมื่อเกิดกระแสไฟเกินหรือไฟฟ้าลัดวงจร ช่วยป้องกันอัคคีภัยและความเสียหายต่อเครื่องใช้ไฟฟ้า การเลือกขนาดเบรกเกอร์ (แอมป์) ให้เหมาะสมกับโหลดการใช้งานจึงเป็นเรื่องสำคัญมาก' },
    { cat:'wire', num:3, title:'สายไฟ', img:'assets/สายไฟ.jpg',
      intro:'สายไฟเป็นตัวนำกระแสไฟฟ้าจากแหล่งจ่ายไปยังจุดใช้งานต่างๆ ทำจากทองแดงแท้หุ้มด้วยฉนวน PVC การเลือกขนาดสายไฟ (ตารางมิลลิเมตร) ให้เหมาะสมกับปริมาณกระแสไฟที่ใช้งานเป็นสิ่งสำคัญ เพราะหากใช้สายไฟขนาดเล็กเกินไปอาจทำให้สายร้อนจัดจนเกิดอัคคีภัยได้' },
    { cat:'panel', num:4, title:'ตู้ไฟ', img:'assets/ตู้คอนซูมเมอร์ยูนิต.png',
      intro:'ตู้ไฟหรือตู้คอนซูมเมอร์ยูนิต ทำหน้าที่เป็นศูนย์กลางควบคุมวงจรไฟฟ้าทั้งหมดภายในบ้าน ภายในติดตั้งเบรกเกอร์ย่อยแยกตามวงจรการใช้งาน ช่วยให้สามารถตัดไฟเฉพาะจุดได้สะดวกเวลาเกิดปัญหาหรือซ่อมบำรุง' },
    { cat:'conduit', num:5, title:'ท่อร้อยสายไฟ', img:'assets/ท่อร้อยสายไฟ.jpg',
      intro:'ท่อร้อยสายไฟใช้สำหรับป้องกันสายไฟจากความเสียหายทางกายภาพ ความชื้น และสัตว์กัดแทะ อีกทั้งยังช่วยให้เดินสายไฟเป็นระเบียบและซ่อมบำรุงในภายหลังได้ง่ายขึ้น มีทั้งแบบท่อ PVC สำหรับงานทั่วไป และแบบโลหะสำหรับงานที่ต้องการความแข็งแรงเป็นพิเศษ' },
    { cat:'switch', num:6, title:'สวิตช์และปลั๊ก', img:'assets/สวิตซ์,ปลั๊ก.png',
      intro:'สวิตช์และปลั๊กเป็นจุดเชื่อมต่อระหว่างระบบไฟฟ้ากับการใช้งานจริงในชีวิตประจำวัน ควรเลือกใช้ผลิตภัณฑ์ที่ได้มาตรฐาน มอก. มีวัสดุทนความร้อนและรับกระแสไฟได้เพียงพอกับเครื่องใช้ไฟฟ้าที่เชื่อมต่อ เพื่อความปลอดภัยในระยะยาว' },
  ];
  return (
    <section style={{ background:'#fff', padding:'52px 0' }}>
      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'0 20px' }}>
        <h2 style={{ fontSize:'26px', fontWeight:'800', color:'#06352e', marginBottom:'8px', textAlign:'center' }}>อุปกรณ์ไฟฟ้า ที่แนะนำ</h2>
        <div style={{ width:'46px', height:'4px', background:'#f5a623', borderRadius:'3px', margin:'0 auto 36px' }}/>

        {items.map((it, idx) => (
          <div key={it.cat} style={{ marginBottom: idx < items.length - 1 ? '44px' : 0, paddingBottom: idx < items.length - 1 ? '44px' : 0, borderBottom: idx < items.length - 1 ? '1px solid #eef0f2' : 'none' }}>
            <h3 style={{ fontSize:'19px', fontWeight:'800', color:'#0d5c50', marginBottom:'12px' }}>{it.num}. {it.title}</h3>
            <p style={{ fontSize:'14px', color:'#3a4a42', lineHeight:'1.85', textAlign:'justify', marginBottom:'18px' }}>{it.intro}</p>

            <div style={{ display:'flex', justifyContent:'center' }}>
              <div style={{ width:'100%', maxWidth:'340px', height:'220px', background:'#f9fafb', border:'1px solid #eef0f2', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
                <img loading="lazy" decoding="async" src={it.img} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', mixBlendMode:'multiply' }} onError={e => e.target.style.display='none'}/>
              </div>
            </div>
            <div style={{ textAlign:'center', fontSize:'12px', color:'#aab4ae', fontStyle:'italic' }}>รูปภาพนี้เป็นเพียงตัวอย่างประกอบคำอธิบาย</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HPBrandStrip() {
  const brands = [
    { key:'nano',       src:'assets/banner11.png' },
    { key:'chang',      src:'assets/banner2.png' },
    { key:'sentoshi',   src:'assets/banner10.png' },
    { key:'zeberg',     src:'assets/banner9.png' },
    { key:'iwachi',     src:'assets/banner7.png' },
    { key:'vena',       src:'assets/banner12.png' },
    { key:'thonamthai', src:'assets/banner8.png' },
    { key:'daiichi',    src:'assets/logo - daiichi.png' },
    { key:'misawa',     src:'assets/banner1.png' },
    { key:'daishida',   src:'assets/banner4.png' },
    { key:'kjl',         src:'assets/kjl-logo-text.webp' },
    { key:'schneider',  src:'assets/schneider-electric.svg' },
  ];
  const track = [...brands, ...brands];
  return (
    <section style={{ background:'#fff', padding:'52px 0', overflow:'hidden' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ textAlign:'center', marginBottom:'34px' }}>
          <h2 style={{ fontSize:'30px', fontWeight:'800', color:'#06352e', letterSpacing:'0.01em' }}>แบรนด์สินค้าที่เราจำหน่าย</h2>
          <div style={{ width:'46px', height:'4px', background:'#f5a623', borderRadius:'3px', margin:'14px auto 16px' }}/>
          <p style={{ fontSize:'15px', color:'#7a8a82', fontWeight:'500' }}>จำหน่ายอุปกรณ์ไฟฟ้า แบรนด์สินค้าคุณภาพต่างๆ</p>
        </div>
      </div>
      <div style={{ position:'relative', WebkitMaskImage:'linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)', maskImage:'linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)' }}>
        <div className="hp-brand-track" style={{ display:'flex', alignItems:'center', width:'max-content', gap:'64px' }}>
          {track.map((b, idx) => (
            <div key={b.key + idx}
              style={{ height:'100px', width:'200px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'transform 0.15s ease, opacity 0.15s ease', opacity:0.85 }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.opacity='1'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.opacity='0.85'; }}>
              <img loading="lazy" decoding="async" src={b.src} alt={b.key} style={{ maxHeight:'90px', maxWidth:'200px', objectFit:'contain' }}/>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function HPFooter({ onCategoryChange }) {
  const serviceCol = { title:'บริการของเรา', links:['รับประกอบตู้โหลด 3 เฟส','รับผลิตตู้ MDB','บริการติดตั้ง','งานโครงการ','ปรึกษาระบบไฟ'] };
  const productLinks = [
    ...HP_FOOTER_CATEGORIES.map(c => ({ id: c.id, label: c.label })),
    ...HP_FOOTER_EXTRA_IDS.map(id => ({ id, label: hpCategoryLabel(id) })),
  ];
  const half = Math.ceil(productLinks.length / 2);
  const productCols = [productLinks.slice(0, half), productLinks.slice(half)];
  const ColHead = ({ children }) => (
    <div style={{ fontSize:'15px', fontWeight:'700', color:'#fff', marginBottom:'18px' }}>{children}</div>
  );
  const linkStyle = { fontSize:'13.5px', color:'rgba(255,255,255,0.65)', marginBottom:'11px', cursor:'pointer', display:'flex', alignItems:'center', gap:'9px', transition:'all 0.15s', width:'fit-content' };
  return (
    <footer style={{ background:'#004E3D', color:'#fff', marginTop:'8px', position:'relative' }}>
      {/* top accent line */}
      <div style={{ height:'4px', background:'linear-gradient(90deg,#0d5c50 0%,#b6e34f 35%,#f05a20 100%)' }}/>

      {/* centered brand block */}
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'44px 24px 0', textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'11px', marginBottom:'10px' }}>
          <img loading="lazy" decoding="async" src="assets/logo-kss-trans.png" style={{ width:'34px', height:'34px', objectFit:'contain', filter:'brightness(0) invert(1)' }}/>
          <span style={{ color:'#fff', fontWeight:800, fontSize:'22px', letterSpacing:'0.3px' }}>KiRD SAENG SAWANG</span>
        </div>
        <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.6)', marginBottom:'26px' }}>บริษัท เกิดแสงสว่าง จำกัด</div>
      </div>

      {/* main grid */}
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'32px 24px 32px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr 1.1fr', gap:'32px' }}>
        {/* col 2: สินค้า — 2 sub-lists */}
        <div>
          <ColHead>สินค้า</ColHead>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px' }}>
            {productCols.map((sub, si) => (
              <div key={si}>
                {sub.map(c => (
                  <a key={c.id} style={linkStyle}
                    onClick={() => onCategoryChange(c.id)}
                    onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.paddingLeft='4px'; }}
                    onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.65)'; e.currentTarget.style.paddingLeft='0'; }}>
                    <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#5fd1c2', flexShrink:0 }}/>{c.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* col 3: บริการของเรา */}
        <div>
          <ColHead>{serviceCol.title}</ColHead>
          {serviceCol.links.map(l => (
            <a key={l} style={linkStyle}
              onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.paddingLeft='4px'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.65)'; e.currentTarget.style.paddingLeft='0'; }}>
              <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#5fd1c2', flexShrink:0 }}/>{l}
            </a>
          ))}
        </div>

        {/* col 4: ติดต่อเรา — address */}
        <div>
          <ColHead>ติดต่อเรา</ColHead>
          <div style={{ display:'flex', alignItems:'flex-start', gap:'9px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b6e34f" strokeWidth="2.2" style={{ flexShrink:0, marginTop:'2px' }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2"/></svg>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.72)', lineHeight:'1.7' }}>
              87/11-12 ซอยเอกชัย 76 แยก 2<br/>แขวงคลองบางพราน เขตบางบอน<br/>กรุงเทพมหานคร 10150
            </p>
          </div>
        </div>

        {/* col 5: phone + LINE + socials */}
        <div>
          <a href="tel:028944007" style={{ display:'flex', alignItems:'center', gap:'10px', textDecoration:'none', marginBottom:'12px' }}>
            <span style={{ width:'32px', height:'32px', borderRadius:'9px', background:'rgba(34,197,94,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#22c55e"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/></svg>
            </span>
            <div style={{ lineHeight:1.3 }}>
              <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>02-894-4007 <span style={{ fontSize:'11px', fontWeight:'500', color:'rgba(255,255,255,0.5)' }}>(ฝ่ายขาย)</span></div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>จ–ส 08:30–17:30 น.</div>
            </div>
          </a>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'10px', marginBottom:'14px' }}>
            <img loading="lazy" decoding="async" src="assets/line-qr.png" style={{ width:'64px', height:'64px', objectFit:'contain', borderRadius:'8px', background:'#fff', padding:'3px', flexShrink:0 }}/>
            <div style={{ lineHeight:1.4 }}>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.5)' }}>LINE Official</div>
              <div style={{ fontSize:'13px', fontWeight:'700', color:'#b6e34f' }}>@kirdsaengsawang</div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.45)', marginTop:'2px' }}>สแกนเพื่อแอดเพื่อน</div>
            </div>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <span style={{ fontSize:'13.5px', fontWeight:'600', color:'rgba(255,255,255,0.65)' }}>ช่องทางชำระเงิน:</span>
            <div style={{ background:'#fff', borderRadius:'10px', padding:'10px 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.18)' }}>
              <img loading="lazy" decoding="async" src="assets/payment-thaipiriya.jpg" style={{ height:'34px', objectFit:'contain' }}/>
            </div>
          </div>
          <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>
            © 2026 บริษัท เกิดแสงสว่าง จำกัด — KIRD SAENG SAWANG CO.,LTD. สงวนลิขสิทธิ์
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── PAGES & APP ──────────────────────────────────────────────────────────────

function HPWholesalePage() {
  const benefits = [
    { title:'ราคาขายส่งพิเศษ', desc:'ยิ่งสั่งมาก ยิ่งคุ้ม ราคาต่อหน่วยถูกลง', c1:'#5fd1c2', c2:'#9fe6d8', icon:<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5"/></> },
    { title:'สต็อกพร้อมส่ง', desc:'สินค้าครบวงจร มีของพร้อมจัดส่งทันที', c1:'#2dd4bf', c2:'#5eead4', icon:<><path d="M3 9h18M3 9l2-5h14l2 5M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9"/><path d="M9 13h6"/></> },
    { title:'จัดส่งทั่วประเทศ', desc:'บริการขนส่งถึงหน้างาน ทุกจังหวัด', c1:'#fbbf24', c2:'#fcd34d', icon:<><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7M5.5 19a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 19a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></> },
    { title:'ทีมงานดูแลเฉพาะ', desc:'มีเจ้าหน้าที่ดูแลลูกค้าองค์กรโดยตรง', c1:'#60a5fa', c2:'#93c5fd', icon:<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></> },
  ];
  const steps = [
    { n:'1', title:'แจ้งรายการสินค้า', desc:'ส่งรายการสินค้าที่ต้องการผ่าน LINE หรือโทร' },
    { n:'2', title:'รับใบเสนอราคา', desc:'ทีมงานจัดทำใบเสนอราคาให้ภายในวันทำการ' },
    { n:'3', title:'ยืนยันสั่งซื้อ', desc:'ยืนยันออเดอร์และชำระเงินตามเงื่อนไข' },
    { n:'4', title:'จัดส่งถึงมือ', desc:'จัดส่งสินค้าถึงหน้างานทั่วประเทศ' },
  ];
  return (
    <section style={{ background:'#f9fafb', padding:'28px 0 48px', minHeight:'70vh' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px' }}>
        {/* breadcrumb */}
        <div style={{ fontSize:'13px', color:'#888', marginBottom:'18px' }}>หน้าหลัก › <span style={{ color:'#0d5c50', fontWeight:'600' }}>ค้าส่ง / ลูกค้าองค์กร</span></div>

        {/* HERO banner */}
        <div style={{ borderRadius:'20px', overflow:'hidden', position:'relative', minHeight:'300px', display:'flex', alignItems:'center', background:'linear-gradient(120deg,#073d35 0%,#0e6356 55%,#1f8a78 100%)', boxShadow:'0 12px 34px rgba(15,77,42,0.24)', marginBottom:'26px' }}>
          <div style={{ position:'absolute', inset:0, opacity:0.4, backgroundImage:'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize:'20px 20px' }}/>
          <div style={{ position:'absolute', top:'-110px', right:'4%', width:'340px', height:'340px', borderRadius:'50%', background:'radial-gradient(circle, rgba(180,255,210,0.22) 0%, transparent 70%)' }}/>
          {/* electrical products image (right) */}
          <div style={{ position:'absolute', top:0, right:0, bottom:0, width:'46%', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ position:'absolute', width:'320px', height:'320px', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 68%)' }}/>
            <img loading="lazy" decoding="async" src="assets/product-display.png" style={{ position:'relative', maxHeight:'300px', maxWidth:'94%', objectFit:'contain', filter:'drop-shadow(0 18px 36px rgba(0,0,0,0.4))' }} onError={e => e.target.style.display='none'}/>
          </div>
          <div style={{ position:'relative', zIndex:2, padding:'40px 48px', maxWidth:'620px' }}>
            <span style={{ display:'inline-block', background:'#f05a20', color:'#fff', fontSize:'12px', fontWeight:'700', padding:'5px 16px', borderRadius:'999px', marginBottom:'14px' }}>WHOLESALE &amp; CORPORATE CUSTOMER</span>
            <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'30px', fontWeight:'800', color:'#fff', lineHeight:'1.25', letterSpacing:'-0.4px', marginBottom:'10px' }}>
              ลูกค้าองค์กร · ค้าส่ง · ตัวแทนจำหน่าย<br/>และสั่งซื้อจำนวนมาก
            </h1>
            <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.88)', marginBottom:'20px', lineHeight:'1.6' }}>
              แจ้งขอใบเสนอราคา และรายละเอียดสินค้า โทร. <span style={{ fontWeight:'800', color:'#fde047' }}>02-894-4007</span>
            </p>
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              <a href="https://lin.ee/rAFJt2QD" target="_blank" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#06c755', color:'#fff', fontWeight:'700', fontSize:'14px', padding:'12px 26px', borderRadius:'10px', textDecoration:'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
                ขอใบเสนอราคาทาง LINE
              </a>
              <a href="tel:028944007" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#fff', color:'#06352e', fontWeight:'700', fontSize:'14px', padding:'12px 26px', borderRadius:'10px', textDecoration:'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/></svg>
                โทรเลย
              </a>
            </div>
            {/* stat chips */}
            <div style={{ display:'flex', gap:'10px', marginTop:'22px', flexWrap:'wrap' }}>
              {[['10,000+','รายการสินค้า'],['77','จังหวัดทั่วไทย']].map((st,i)=>(
                <div key={i} style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'12px', padding:'10px 18px', backdropFilter:'blur(6px)' }}>
                  <div style={{ fontSize:'20px', fontWeight:'800', color:'#fde047', fontFamily:'Inter, Noto Sans Thai, sans-serif', lineHeight:1.1 }}>{st[0]}</div>
                  <div style={{ fontSize:'11.5px', color:'rgba(255,255,255,0.85)' }}>{st[1]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BENEFITS */}
        <div style={{ marginBottom:'34px' }}>
          <div style={{ textAlign:'center', marginBottom:'24px' }}>
            <span style={{ display:'inline-block', background:'#e6f7f5', color:'#8bc83f', fontSize:'13px', fontWeight:'800', padding:'6px 18px', borderRadius:'999px', marginBottom:'12px', letterSpacing:'0.5px' }}>WHY CHOOSE US</span>
            <h2 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'28px', fontWeight:'800', color:'#0f3d24', letterSpacing:'-0.5px', marginBottom:'6px' }}>สิทธิพิเศษสำหรับลูกค้าค้าส่ง</h2>
            <p style={{ fontSize:'15px', color:'#5a7a66' }}>ครบ จบ คุ้ม ในที่เดียว สำหรับการสั่งซื้อปริมาณมาก</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px' }}>
            {benefits.map((b,i) => (
              <div key={i} style={{ background:'#fff', borderRadius:'22px', padding:'28px 24px', position:'relative', overflow:'hidden', border:'1px solid #eef1ee', transition:'all 0.22s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow=`0 20px 40px ${b.c1}22`; e.currentTarget.style.borderColor=`${b.c1}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='#eef1ee'; }}>
                {/* big ghost number */}
                <div style={{ position:'absolute', top:'8px', right:'14px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'72px', fontWeight:'800', color:`${b.c1}12`, lineHeight:1, pointerEvents:'none' }}>{String(i+1).padStart(2,'0')}</div>
                {/* icon */}
                <div style={{ position:'relative', width:'54px', height:'54px', borderRadius:'15px', background:`${b.c1}14`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'40px' }}>
                  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke={b.c1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{b.icon}</svg>
                </div>
                <div style={{ position:'relative', fontSize:'17px', fontWeight:'800', color:'#16261d', marginBottom:'9px', letterSpacing:'-0.2px' }}>{b.title}</div>
                <div style={{ position:'relative', fontSize:'13px', color:'#8a948e', lineHeight:'1.65' }}>{b.desc}</div>
                {/* bottom accent line on hover area */}
                <div style={{ position:'absolute', left:'24px', bottom:'0', width:'30px', height:'3px', borderRadius:'2px', background:`linear-gradient(90deg, ${b.c1}, ${b.c2})` }}/>
              </div>
            ))}
          </div>
        </div>

        {/* STEPS */}
        <div style={{ background:'linear-gradient(135deg, #0e6356 0%, #1f8a78 55%, #3aa896 100%)', borderRadius:'24px', padding:'38px 36px', marginBottom:'30px', position:'relative', overflow:'hidden', boxShadow:'0 14px 36px rgba(28,160,106,0.22)' }}>
          <div style={{ position:'absolute', inset:0, opacity:0.3, pointerEvents:'none', backgroundImage:'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize:'20px 20px' }}/>
          <div style={{ position:'absolute', top:'-110px', right:'-40px', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(180,255,210,0.18) 0%, transparent 70%)', pointerEvents:'none' }}/>
          <div style={{ position:'relative', zIndex:1, textAlign:'center', marginBottom:'30px' }}>
            <span style={{ display:'inline-block', background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.22)', color:'#fff', fontSize:'13px', fontWeight:'800', padding:'6px 18px', borderRadius:'999px', marginBottom:'12px', letterSpacing:'0.5px' }}>HOW TO ORDER</span>
            <h2 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'28px', fontWeight:'800', color:'#fff', letterSpacing:'-0.5px', marginBottom:'4px' }}>ขั้นตอนการสั่งซื้อ</h2>
            <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.8)' }}>ง่ายๆ เพียง 4 ขั้นตอน รับสินค้าถึงหน้างาน</p>
          </div>
          <div style={{ position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px' }}>
            {/* connector line */}
            <div style={{ position:'absolute', top:'34px', left:'12.5%', right:'12.5%', height:'2px', background:'rgba(255,255,255,0.25)', zIndex:0 }}/>
            {steps.map((s,i) => (
              <div key={i} style={{ textAlign:'center', position:'relative', zIndex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:'18px', padding:'22px 14px 20px', backdropFilter:'blur(6px)' }}>
                <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:`linear-gradient(135deg, ${i===0?'#b6e34f,#86efac':i===1?'#2dd4bf,#5eead4':i===2?'#38bdf8,#7dd3fc':'#fbbf24,#fcd34d'})`, color:'#0f3d24', fontSize:'22px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontFamily:'Inter, Noto Sans Thai, sans-serif', boxShadow:'0 8px 20px rgba(0,0,0,0.18)', border:'3px solid rgba(255,255,255,0.9)' }}>{s.n}</div>
                <div style={{ fontSize:'15px', fontWeight:'800', color:'#fff', marginBottom:'6px' }}>{s.title}</div>
                <div style={{ fontSize:'12.5px', color:'rgba(255,255,255,0.78)', lineHeight:'1.55' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT */}
        <div style={{ background:'#fff', borderRadius:'18px', padding:'30px 32px', border:'1px solid #eee' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'4px' }}>
            <img loading="lazy" decoding="async" src="assets/logo-kss.jpg" style={{ width:'40px', height:'40px', objectFit:'contain' }}/>
            <h2 style={{ fontSize:'19px', fontWeight:'800', color:'#1a1a1a' }}>เกิดแสงสว่างการไฟฟ้า — บริษัท เกิดแสงสว่าง จำกัด</h2>
          </div>
          <p style={{ fontSize:'14px', color:'#666', marginBottom:'22px', paddingLeft:'52px' }}>ตัวแทนจำหน่ายอุปกรณ์ไฟฟ้า · บ้าน — โรงงาน — สำนักงาน — อาคาร</p>
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'stretch', gap:'18px' }}>
            {/* LINE block */}
            <div style={{ display:'flex', alignItems:'center', gap:'16px', background:'#eaf6f5', border:'1.5px solid #a9ddd6', borderRadius:'14px', padding:'18px 22px', flex:'1 1 360px' }}>
              <img loading="lazy" decoding="async" src="assets/line-qr.png" style={{ width:'100px', height:'100px', objectFit:'contain', borderRadius:'10px', background:'#fff', padding:'4px', flexShrink:0, border:'1px solid #e5e7eb' }}/>
              <div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', marginBottom:'6px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#06c755"><path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
                  <span style={{ fontSize:'17px', fontWeight:'800', color:'#06c755' }}>@kirdsaengsawang</span>
                </div>
                <div style={{ fontSize:'13.5px', color:'#444', fontWeight:'600', lineHeight:'1.5' }}>ขอใบเสนอราคา & สอบถามสินค้า<br/>สแกน QR หรือแอดไลน์ได้เลย</div>
                <a href="https://lin.ee/rAFJt2QD" target="_blank"
                  style={{ display:'inline-block', marginTop:'10px', background:'#06c755', color:'#fff', fontWeight:'700', fontSize:'13px', padding:'9px 22px', borderRadius:'8px', textDecoration:'none' }}>เปิด LINE →</a>
              </div>
            </div>
            {/* Phone block */}
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:'8px', background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:'14px', padding:'18px 24px', flex:'1 1 240px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <span style={{ width:'44px', height:'44px', borderRadius:'12px', background:'#f05a20', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/></svg>
                </span>
                <div style={{ lineHeight:1.35 }}>
                  <div style={{ fontSize:'11px', color:'#999', fontWeight:'600' }}>โทรสอบถาม</div>
                  <div style={{ fontSize:'21px', fontWeight:'800', color:'#1a1a1a' }}>02-894-4007</div>
                </div>
              </div>
              <div style={{ fontSize:'12px', color:'#888', paddingLeft:'56px' }}>จันทร์ – เสาร์ 08:30 – 17:30 น.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HPKnowledgePage() {
  const steps = [
    { n:'1', icon:'🏅', c1:'#8bc83f', c2:'#8bc83f', title:'เลือกอุปกรณ์ที่ผ่านมาตรฐานสากล', desc:'ควรเลือกอุปกรณ์ไฟฟ้าที่ได้รับการรับรองมาตรฐาน เช่น มอก. (มาตรฐานผลิตภัณฑ์อุตสาหกรรม) หรือ IEC (มาตรฐานสากล) เพื่อความปลอดภัยและความน่าเชื่อถือ มั่นใจได้ว่าอุปกรณ์ผ่านการทดสอบคุณภาพมาแล้ว' },
    { n:'2', icon:'🎯', c1:'#0d9488', c2:'#14b8a6', title:'คำนึงถึงความเหมาะสมกับการใช้งาน', desc:'เลือกอุปกรณ์ให้เหมาะกับลักษณะงานและปริมาณการใช้ไฟฟ้า เช่น ขนาดของเบรกเกอร์ ชนิดของสายไฟ และพิกัดกระแส ให้สอดคล้องกับโหลดที่ใช้จริง เพื่อประสิทธิภาพและความปลอดภัยสูงสุด' },
    { n:'3', icon:'⚡', c1:'#ca8a04', c2:'#eab308', title:'ประหยัดพลังงานด้วยอุปกรณ์ที่มีประสิทธิภาพสูง', desc:'เลือกใช้อุปกรณ์ประหยัดพลังงาน เช่น หลอด LED หรืออุปกรณ์ที่มีฉลากประหยัดไฟเบอร์ 5 ช่วยลดการใช้พลังงานและความร้อน ลดค่าไฟในระยะยาว และเป็นมิตรต่อสิ่งแวดล้อม' },
    { n:'4', icon:'🛡️', c1:'#ea580c', c2:'#fb923c', title:'ตรวจสอบความปลอดภัยในการติดตั้ง', desc:'ก่อนติดตั้งควรตรวจสอบสภาพอุปกรณ์และระบบสายดินให้เรียบร้อย และควรให้ช่างไฟฟ้าที่มีใบอนุญาตเป็นผู้ติดตั้ง เพื่อป้องกันไฟฟ้าลัดวงจรและอุบัติเหตุ' },
    { n:'5', icon:'🛠️', c1:'#2563eb', c2:'#3b82f6', title:'การบำรุงรักษาอุปกรณ์เดินระบบไฟฟ้า', desc:'ตรวจเช็คและบำรุงรักษาอุปกรณ์ไฟฟ้าเป็นประจำ เช่น ทำความสะอาด ตรวจจุดต่อสายไฟ และเช็คความร้อนผิดปกติ จะช่วยยืดอายุการใช้งานและลดความเสี่ยงในการเกิดปัญหา' },
  ];
  const more = [
    { title:'ตู้ MDB คืออะไร ?', excerpt:'ตู้ MDB (Main Distribution Board) คือตู้จ่ายไฟหลักของอาคาร ทำหน้าที่รับไฟจากการไฟฟ้าแล้วกระจายไปยังตู้ย่อยต่างๆ อย่างปลอดภัย', c1:'#0d9488', c2:'#14b8a6', icon:'🗄️' },
    { title:'ความสำคัญของตู้โหลด 3 เฟส', excerpt:'ตู้โหลด 3 เฟสช่วยกระจายโหลดไฟฟ้าให้สมดุล รองรับเครื่องจักรและอุปกรณ์กำลังสูง เหมาะกับโรงงานและอาคารขนาดใหญ่', c1:'#2563eb', c2:'#3b82f6', icon:'⚡' },
  ];
  return (
    <section style={{ background:'#eef8f7', padding:'30px 0 56px', minHeight:'75vh' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>หน้าหลัก › <span style={{ color:'#8bc83f', fontWeight:'700' }}>เกร็ดความรู้</span></div>

        {/* hero — article cover image */}
        <div style={{ borderRadius:'24px', overflow:'hidden', position:'relative', boxShadow:'0 14px 38px rgba(10,70,40,0.18)', marginBottom:'28px', border:'1px solid #eaf3ed' }}>
          <img loading="lazy" decoding="async" src="assets/article-5guidelines.jpg" alt="5 แนวทาง การเลือกซื้ออุปกรณ์ เดินระบบไฟฟ้า"
            style={{ width:'100%', display:'block', objectFit:'cover' }}/>
        </div>
        <div style={{ marginBottom:'24px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'linear-gradient(120deg,#f7b733,#ee9b1c)', color:'#3a2400', fontSize:'14px', fontWeight:'800', padding:'7px 22px', borderRadius:'999px', marginBottom:'14px' }}>📖 บทความน่ารู้</span>
          <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'40px', fontWeight:'800', color:'#06352e', letterSpacing:'-0.5px', lineHeight:'1.2', marginBottom:'8px' }}>5 แนวทาง การเลือกซื้ออุปกรณ์ เดินระบบไฟฟ้า</h1>
          <p style={{ fontSize:'18px', color:'#5a7a66' }}>คำแนะนำในการเลือกอุปกรณ์ไฟฟ้าให้ปลอดภัย คุ้มค่า และใช้งานได้ยาวนาน</p>
        </div>

        {/* intro */}
        <p style={{ fontSize:'18px', color:'#3a4a42', lineHeight:'2', marginBottom:'30px' }}>
          การเดินระบบไฟฟ้าในอาคารหรือโรงงานเป็นสิ่งสำคัญที่ไม่สามารถละเลยได้ เพราะส่งผลโดยตรงต่อความปลอดภัย ประสิทธิภาพการใช้งาน และค่าใช้จ่ายในระยะยาว ต่อไปนี้คือ <span style={{ fontWeight:'700', color:'#8bc83f' }}>5 แนวทางสำคัญ</span> ที่ควรพิจารณาก่อนเลือกซื้ออุปกรณ์ไฟฟ้า
        </p>

        {/* 5 steps */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px', marginBottom:'40px' }}>
          {steps.map((s,i) => (
            <div key={i} style={{ position:'relative', display:'flex', gap:'22px', background:'#fff', borderRadius:'20px', padding:'28px 30px 28px 32px', border:'1px solid #f0f0f0', boxShadow:'0 4px 18px rgba(15,77,42,0.05)', overflow:'hidden', transition:'transform 0.18s ease, box-shadow 0.18s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 14px 30px ${s.c1}1f`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 18px rgba(15,77,42,0.05)'; }}>
              {/* left accent bar */}
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'6px', background:`linear-gradient(${s.c1},${s.c2})` }}/>
              {/* giant ghost number */}
              <div style={{ position:'absolute', right:'18px', bottom:'-22px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'120px', fontWeight:'800', color:`${s.c1}0f`, lineHeight:1, pointerEvents:'none' }}>{s.n}</div>
              {/* number badge */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', flexShrink:0 }}>
                <div style={{ width:'58px', height:'58px', borderRadius:'16px', background:`linear-gradient(135deg, ${s.c1}, ${s.c2})`, color:'#fff', fontSize:'26px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, Noto Sans Thai, sans-serif', boxShadow:`0 8px 18px ${s.c1}45` }}>{s.n}</div>
                <span style={{ fontSize:'26px' }}>{s.icon}</span>
              </div>
              <div style={{ position:'relative', zIndex:1 }}>
                <h3 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'22px', fontWeight:'800', color:s.c1, marginBottom:'10px', lineHeight:'1.4', letterSpacing:'-0.3px' }}>{s.title}</h3>
                <p style={{ fontSize:'16.5px', color:'#555', lineHeight:'1.9' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* closing */}
        <div style={{ background:'linear-gradient(120deg,#eaf6f5,#d8eeec)', border:'1.5px solid #a9ddd6', borderRadius:'18px', padding:'24px 28px', marginBottom:'40px' }}>
          <p style={{ fontSize:'17px', color:'#6ea832', lineHeight:'1.9', fontWeight:'600' }}>
            💡 การเลือกซื้ออุปกรณ์ไฟฟ้าที่มีคุณภาพและเหมาะสมกับการใช้งาน จะช่วยให้ระบบไฟฟ้าปลอดภัย ประหยัดพลังงาน และใช้งานได้ยาวนาน — บริษัท เกิดแสงสว่าง จำกัด พร้อมให้คำปรึกษาและจำหน่ายอุปกรณ์ไฟฟ้าครบวงจร ราคาส่ง
          </p>
        </div>

        {/* more articles */}
        <h2 style={{ fontSize:'24px', fontWeight:'800', color:'#06352e', marginBottom:'18px' }}>บทความอื่นๆ ที่น่าสนใจ</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px' }}>
          {more.map((a,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:'14px', overflow:'hidden', border:'1px solid #eaf3ed', cursor:'pointer', display:'flex', flexDirection:'column', padding:'24px', transition:'box-shadow 0.18s ease' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 10px 26px ${a.c1}1a`; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; }}>
              <div style={{ width:'52px', height:'52px', borderRadius:'12px', background:`${a.c1}14`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'18px' }}>
                <span style={{ fontSize:'24px' }}>{a.icon}</span>
              </div>
              <div style={{ fontSize:'19px', fontWeight:'800', color:'#1a1a1a', marginBottom:'10px' }}>{a.title}</div>
              <p style={{ fontSize:'14.5px', color:'#777', lineHeight:'1.7', marginBottom:'16px', flex:1 }}>{a.excerpt}</p>
              <span style={{ color:a.c1, fontWeight:'700', fontSize:'14px' }}>อ่านต่อ →</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ดูรูปสินค้าแบบธรรมดา — ซูม เลื่อนดู และเปลี่ยนรูปได้
function HPImageZoomRotateModal({ src, frames, title, onClose }) {
  const list = ((frames && frames.length ? frames : [src]) || []).filter(Boolean);
  const multi = list.length > 1;
  const [idx, setIdx]   = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = React.useRef(null);

  const zoomIn  = () => setZoom(z => Math.min(4, Math.round((z + 0.25) * 100) / 100));
  const zoomOut = () => setZoom(z => { const n = Math.max(1, Math.round((z - 0.25) * 100) / 100); if (n === 1) setPan({ x:0, y:0 }); return n; });
  const reset   = () => { setZoom(1); setPan({ x:0, y:0 }); };
  const go = (d) => { setIdx(i => ((i + d) % list.length + list.length) % list.length); reset(); };

  useEffect(() => { list.forEach(u => { const i = new Image(); i.src = u; }); }, [list.join('|')]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (multi && e.key === 'ArrowLeft')  go(-1);
      if (multi && e.key === 'ArrowRight') go(1);
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [multi, list.length]);

  const pos = (e) => (e.touches ? e.touches[0] : e);
  const onDown = (e) => { if (zoom <= 1) return; const p = pos(e); drag.current = { x: p.clientX - pan.x, y: p.clientY - pan.y }; setDragging(true); };
  const onMove = (e) => { if (!drag.current) return; const p = pos(e); setPan({ x: p.clientX - drag.current.x, y: p.clientY - drag.current.y }); };
  const onUp   = () => { drag.current = null; setDragging(false); };
  const onWheel = (e) => { e.preventDefault(); (e.deltaY < 0 ? zoomIn : zoomOut)(); };

  const btn = { width:'40px', height:'40px', borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.14)', color:'#fff', fontSize:'18px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(6,20,16,0.93)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}
      onClick={onClose}>

      <div style={{ position:'absolute', top:'20px', right:'24px', zIndex:5 }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} title="ปิด (Esc)" style={{ ...btn, width:'42px', height:'42px' }}>✕</button>
      </div>

      {/* รูปสินค้า */}
      <div
        style={{ width:'90vw', maxWidth:'860px', height:'72vh', display:'flex', alignItems:'center', justifyContent:'center',
                 position:'relative', overflow:'hidden', userSelect:'none',
                 cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
        onClick={e => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
        <img src={list[idx]} draggable={false} alt={title || ''}
             style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', background:'#fff', borderRadius:'10px',
                      transform:`translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transition: dragging ? 'none' : 'transform 0.18s ease', pointerEvents:'none' }}
             onError={e => e.target.style.visibility='hidden'}/>

        {multi && (
          <React.Fragment>
            <button onClick={() => go(-1)} title="รูปก่อนหน้า"
              style={{ ...btn, position:'absolute', left:'6px', top:'50%', transform:'translateY(-50%)', width:'44px', height:'44px', background:'rgba(0,0,0,0.45)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={() => go(1)} title="รูปถัดไป"
              style={{ ...btn, position:'absolute', right:'6px', top:'50%', transform:'translateY(-50%)', width:'44px', height:'44px', background:'rgba(0,0,0,0.45)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <div style={{ position:'absolute', top:'10px', right:'10px', background:'rgba(0,0,0,0.5)', color:'#fff', fontSize:'12px', fontWeight:'700', padding:'6px 12px', borderRadius:'999px' }}>
              {idx + 1}/{list.length}
            </div>
          </React.Fragment>
        )}
      </div>

      {/* แถบล่าง */}
      <div style={{ position:'absolute', bottom:'22px', left:0, right:0, display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }} onClick={e => e.stopPropagation()}>
        {multi && (
          <div style={{ display:'flex', gap:'8px' }}>
            {list.map((u, i) => (
              <div key={i} onClick={() => { setIdx(i); reset(); }}
                style={{ width:'50px', height:'50px', borderRadius:'8px', overflow:'hidden', cursor:'pointer', background:'#fff',
                         border: i === idx ? '2px solid #5fd1c2' : '2px solid rgba(255,255,255,0.2)', opacity: i === idx ? 1 : 0.65 }}>
                <img loading="lazy" decoding="async" src={u} style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={e => e.target.style.visibility='hidden'}/>
              </div>
            ))}
          </div>
        )}
        {title && <div style={{ color:'#fff', fontSize:'13px', fontWeight:'600', textAlign:'center', padding:'0 20px' }}>{title}</div>}
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <button onClick={zoomOut} title="ย่อ" style={btn}>−</button>
          <span style={{ fontSize:'12.5px', color:'#fff', fontWeight:'600', minWidth:'46px', textAlign:'center' }}>{Math.round(zoom*100)}%</span>
          <button onClick={zoomIn} title="ขยาย" style={btn}>+</button>
          {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
            <button onClick={reset} style={{ marginLeft:'4px', fontSize:'12px', color:'#ffb066', fontWeight:'700', background:'none', border:'none', cursor:'pointer' }}>รีเซ็ต</button>
          )}
        </div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>
          ล้อเมาส์เพื่อซูม{zoom > 1 ? ' · ลากเพื่อเลื่อนดู' : ''}{multi ? ' · ลูกศรซ้าย/ขวาเปลี่ยนรูป' : ''} · Esc เพื่อปิด
        </div>
      </div>
    </div>
  );
}

function HPProductGallery({ images, title }) {
  const list = images && images.length ? images : [];
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const prev = () => setIdx(i => (i - 1 + list.length) % list.length);
  const next = () => setIdx(i => (i + 1) % list.length);
  return (
    <div>
      <div
        style={{ height:'380px', background:'#f9fafb', border:'1px solid #eef0f2', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', cursor:'zoom-in', position:'relative' }}
        onClick={() => setOpen(true)}>
        <img loading="lazy" decoding="async" src={list[idx]} style={{ maxWidth:'78%', maxHeight:'78%', objectFit:'contain' }} onError={e => e.target.style.display='none'}/>
        <div style={{ position:'absolute', top:'12px', left:'14px', display:'flex', alignItems:'center', gap:'6px', background:'rgba(13,92,80,0.9)', color:'#fff', fontSize:'11px', fontWeight:'600', padding:'6px 12px', borderRadius:'999px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6"/><path d="M21 21l-4.35-4.35"/></svg>
          คลิกเพื่อดูรูปขนาดใหญ่
        </div>
        {list.length > 1 && <>
          <button onClick={e => { e.stopPropagation(); prev(); }}
            style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', width:'34px', height:'34px', borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.92)', boxShadow:'0 2px 10px rgba(0,0,0,0.15)', cursor:'pointer', fontSize:'16px', fontWeight:'700', color:'#0d5c50' }}>‹</button>
          <button onClick={e => { e.stopPropagation(); next(); }}
            style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', width:'34px', height:'34px', borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.92)', boxShadow:'0 2px 10px rgba(0,0,0,0.15)', cursor:'pointer', fontSize:'16px', fontWeight:'700', color:'#0d5c50' }}>›</button>
        </>}
      </div>
      {list.length > 1 && (
        <div style={{ display:'flex', gap:'10px', marginTop:'12px' }}>
          {list.map((src, i) => (
            <div key={i} onClick={() => setIdx(i)}
              style={{ width:'64px', height:'64px', borderRadius:'10px', border: i===idx ? '2px solid #0d9488' : '1px solid #eef0f2', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', flexShrink:0 }}>
              <img loading="lazy" decoding="async" src={src} style={{ maxWidth:'82%', maxHeight:'82%', objectFit:'contain' }} onError={e => e.target.style.display='none'}/>
            </div>
          ))}
        </div>
      )}
      {open && <HPImageZoomRotateModal frames={list} src={list[idx]} title={title} onClose={() => setOpen(false)}/>}
    </div>
  );
}

function HPProductDetailPage({ product, onBack, onSelectProduct, onNavigate }) {
  if (!product) return null;
  const images = product.images && product.images.length ? product.images : (product.img ? [product.img] : []);
  const related = HP_ALL_BRAND_PRODUCTS.filter(p => p.brand === product.brand && p.code !== product.code);
  return (
    <section style={{ background:'#fff', padding:'30px 0 56px', minHeight:'75vh' }}>
      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>
          หน้าหลัก › <span style={{ cursor:'pointer', color:'#0d5c50', fontWeight:'600' }} onClick={onBack}>สินค้าตามแบรนด์</span> › <span style={{ color:'#8bc83f', fontWeight:'700' }}>{product.code}</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'44px', alignItems:'start' }}>
          <HPProductGallery images={images} title={`${product.code} · ${product.name}`}/>

          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'12px', color:'#0d9488', fontWeight:'700', background:'#e8f8f1', padding:'4px 12px', borderRadius:'999px' }}>{product.cat}</span>
              {product.series && <span style={{ fontSize:'12px', color:'#f05a20', fontWeight:'700', background:'#fff1eb', padding:'4px 12px', borderRadius:'999px' }}>{product.series}</span>}
              {product.badges && product.badges.map((b, i) => (
                <span key={i} style={{ fontSize:'12px', color:'#5a6b63', fontWeight:'700', background:'#f2f4f2', padding:'4px 12px', borderRadius:'999px' }}>{b}</span>
              ))}
            </div>
            <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'26px', fontWeight:'800', color:'#1a1a1a', marginBottom:'6px' }}>{product.code}</h1>
            <p style={{ fontSize:'15px', color:'#556', lineHeight:'1.7', marginBottom:'22px' }}>{product.subtitle || product.name}</p>

            {product.bullets && (
              <div style={{ border:'1px solid #eef0f2', borderRadius:'14px', padding:'20px 22px', marginBottom:'22px' }}>
                <div style={{ fontSize:'15px', fontWeight:'800', color:'#06352e', marginBottom:'12px' }}>{product.bullets.heading}</div>
                <ul style={{ margin:0, paddingLeft:'20px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {product.bullets.items.map((it, i) => (
                    <li key={i} style={{ fontSize:'13.5px', color:'#3a4a44', lineHeight:'1.6' }}>{it}</li>
                  ))}
                </ul>
              </div>
            )}

            {product.specs && product.specs.length > 0 && (
              <div style={{ border:'1px solid #eef0f2', borderRadius:'14px', padding:'20px 22px', marginBottom:'22px' }}>
                <div style={{ fontSize:'15px', fontWeight:'800', color:'#06352e', marginBottom:'14px' }}>ข้อมูลทางเทคนิค</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {product.specs.map((s, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:'12px', fontSize:'13.5px', paddingBottom:'8px', borderBottom: i < product.specs.length-1 ? '1px dashed #f0f0f0' : 'none' }}>
                      <span style={{ color:'#9aa8a0' }}>{s.l}</span>
                      <span style={{ color:'#1a1a1a', fontWeight:'700' }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              <a href="https://lin.ee/rAFJt2QD" target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:'9px', background:'#06c755', color:'#fff', fontWeight:'700', fontSize:'14.5px', padding:'13px 28px', borderRadius:'999px', textDecoration:'none', boxShadow:'0 6px 18px rgba(6,199,85,0.3)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
                สอบถามราคา/สั่งซื้อทาง LINE
              </a>
              <button onClick={() => onNavigate && onNavigate('แคตตาล็อก')}
                style={{ display:'inline-flex', alignItems:'center', gap:'9px', background:'#fff', color:'#0d5c50', fontWeight:'700', fontSize:'14.5px', padding:'13px 28px', borderRadius:'999px', border:'1.5px solid #0d5c50', cursor:'pointer' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0d5c50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                ขอข้อมูลแคตตาล็อก
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop:'56px' }}>
            <div style={{ fontSize:'19px', fontWeight:'800', color:'#06352e', marginBottom:'18px' }}>สินค้าแบรนด์ {product.brand} รุ่นอื่นๆ</div>
            <div className="hp-scroll-hide" style={{ display:'flex', gap:'16px', overflowX:'auto', paddingBottom:'8px' }}>
              {related.map((p, i) => (
                <div key={i} onClick={() => onSelectProduct && onSelectProduct(p)}
                  style={{ minWidth:'200px', maxWidth:'200px', border:'1px solid #eef0f2', borderRadius:'12px', overflow:'hidden', cursor:'pointer', flexShrink:0 }}>
                  <div style={{ height:'140px', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', padding:'12px' }}>
                    <img loading="lazy" decoding="async" src={(p.images && p.images[0]) || p.img} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} onError={e => e.target.style.display='none'}/>
                  </div>
                  <div style={{ padding:'10px 12px' }}>
                    <div style={{ fontSize:'12.5px', fontWeight:'700', color:'#1a1a1a' }}>{p.code}</div>
                    <div style={{ fontSize:'11.5px', color:'#778', marginTop:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


function HPBrandProductsPage({ onSelectProduct }) {
  const [zoomProduct, setZoomProduct] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [collapsed, setCollapsed] = useState({});
  const toggleCat = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  const visibleBrands = selectedBrand === 'all' ? HP_BRAND_TABS : HP_BRAND_TABS.filter(t => t.key === selectedBrand);
  const radioRow = (checked, label, onClick, logo) => (
    <label onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'8px', cursor:'pointer', background: checked ? '#e8f8f1' : 'transparent' }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.background='#f7f9f8'; }}
      onMouseLeave={e => { if (!checked) e.currentTarget.style.background='transparent'; }}>
      <span style={{ width:'16px', height:'16px', borderRadius:'50%', border: checked ? '5px solid #0d5c50' : '1.5px solid #cbd5d1', flexShrink:0 }}/>
      {logo && <img loading="lazy" decoding="async" src={logo} style={{ height:'20px', objectFit:'contain', flexShrink:0 }}/>}
      <span style={{ fontSize:'13px', fontWeight: checked ? '700' : '600', color: checked ? '#0d5c50' : '#445' }}>{label}</span>
    </label>
  );
  return (
    <section style={{ background:'#fff', padding:'30px 0 56px', minHeight:'75vh' }}>
      <div style={{ maxWidth:'1320px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>หน้าหลัก › <span style={{ color:'#8bc83f', fontWeight:'700' }}>สินค้าตามแบรนด์</span></div>

        <div style={{ display:'flex', gap:'28px', alignItems:'flex-start' }}>
          <div style={{ width:'250px', flexShrink:0, border:'1px solid #eef0f2', borderRadius:'12px', overflow:'hidden', position:'sticky', top:'20px' }}>
            <div style={{ background:'#06352e', color:'#fff', fontSize:'14.5px', fontWeight:'700', padding:'14px 18px' }}>หมวดหมู่สินค้า</div>
            <div style={{ padding:'16px 14px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                <span style={{ fontSize:'12px', fontWeight:'700', color:'#556', textTransform:'uppercase', letterSpacing:'0.03em' }}>ชื่อบริษัท / แบรนด์</span>
                <span onClick={() => setSelectedBrand('all')} style={{ fontSize:'12px', color:'#0d9488', fontWeight:'700', cursor:'pointer' }}>รีเซ็ต</span>
              </div>
              {radioRow(selectedBrand === 'all', `แบรนด์ทั้งหมด (${HP_BRAND_TABS.length})`, () => setSelectedBrand('all'))}
              <div style={{ height:'1px', background:'#f0f2f1', margin:'8px 0' }}/>
              {HP_BRAND_TABS.map(t => (
                <React.Fragment key={t.key}>
                  {radioRow(selectedBrand === t.key, t.fullName || t.label, () => setSelectedBrand(t.key), t.logo)}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'26px' }}>
              <div style={{ width:'4px', height:'22px', background:'#f5a623', borderRadius:'2px' }}/>
              <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'22px', fontWeight:'800', color:'#06352e' }}>สินค้าตามแบรนด์</h1>
              <span style={{ fontSize:'12px', color:'#0d9488', fontWeight:'700', background:'#e8f8f1', padding:'4px 12px', borderRadius:'999px' }}>{visibleBrands.length} แบรนด์</span>
            </div>

            {visibleBrands.map((brandTab, bi) => {
              const products = HP_BRAND_PRODUCTS[brandTab.key];
              const categories = [];
              products.forEach(p => { if (!categories.includes(p.cat)) categories.push(p.cat); });
              return (
                <div key={brandTab.key} id={`brand-${brandTab.key}`} style={{ marginTop: bi === 0 ? 0 : '44px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', border:'1.5px solid #e3ede9', borderRadius:'12px', padding:'16px 22px', marginBottom:'24px', background:'#fafcfb' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                      <img loading="lazy" decoding="async" src={brandTab.logo} style={{ height:'38px', objectFit:'contain' }}/>
                      <div>
                        <div style={{ fontWeight:'800', fontSize:'14.5px', color:'#12241d' }}>{brandTab.fullName}</div>
                        <div style={{ fontSize:'12.5px', color:'#889', marginTop:'2px' }}>{brandTab.desc}</div>
                      </div>
                    </div>
                    {selectedBrand === 'all' && (
                      <button onClick={() => setSelectedBrand(brandTab.key)}
                        style={{ fontSize:'13px', fontWeight:'700', color:'#0d5c50', background:'#fff', border:'1.5px solid #0d5c50', borderRadius:'999px', padding:'8px 18px', cursor:'pointer', whiteSpace:'nowrap' }}>
                        ดูสินค้าทั้งหมด →
                      </button>
                    )}
                  </div>

                  {categories.map((cat, ci) => {
                    const catKey = `${brandTab.key}-${cat}`;
                    const isCollapsed = !!collapsed[catKey];
                    const catProducts = products.filter(p => p.cat === cat);
                    return (
                      <div key={cat} style={{ marginTop: ci === 0 ? 0 : '18px' }}>
                        <div onClick={() => toggleCat(catKey)}
                          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', background:'#f7f9f8', border:'1px solid #eef0f2', borderRadius:'10px', padding:'12px 18px', marginBottom:'16px', cursor:'pointer' }}>
                          <span style={{ fontSize:'14.5px', fontWeight:'800', color:'#06352e' }}>{cat} <span style={{ color:'#9aa8a0', fontWeight:'600' }}>({catProducts.length} รายการ)</span></span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a6b63" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition:'transform 0.15s ease' }}><path d="M6 9l6 6 6-6"/></svg>
                        </div>
                        {!isCollapsed && (
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'16px', marginBottom:'8px' }}>
                            {catProducts.map((p, i) => {
                              const thumb = (p.images && p.images[0]) || p.img;
                              return (
                              <div key={i} style={{ background:'#fff', border:'1px solid #eef0f2', borderRadius:'12px', overflow:'hidden', display:'flex', flexDirection:'column', cursor:'pointer', transition:'box-shadow 0.18s ease, transform 0.18s ease' }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 10px 22px rgba(0,0,0,0.09)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}
                                onClick={() => onSelectProduct(p)}>
                                <div style={{ height:'140px', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', padding:'12px', position:'relative' }}>
                                  <img loading="lazy" decoding="async" src={thumb} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} onError={e => e.target.style.display='none'}/>
                                  <div onClick={e => { e.stopPropagation(); setZoomProduct(p); }} title="ดูรูปขนาดใหญ่"
                                    style={{ position:'absolute', bottom:'6px', right:'6px', width:'26px', height:'26px', borderRadius:'50%', background:'rgba(13,92,80,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6"/><path d="M21 21l-4.35-4.35"/></svg>
                                  </div>
                                </div>
                                <div style={{ padding:'11px 12px 13px', borderTop:'1px solid #f2f4f2' }}>
                                  <div style={{ fontSize:'12.5px', fontWeight:'800', color:'#0d9488', marginBottom:'3px' }}>{p.code}</div>
                                  <div style={{ fontSize:'11.5px', color:'#667', lineHeight:'1.4', marginBottom:'8px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.name}</div>
                                  <span style={{ fontSize:'11.5px', color:'#0d5c50', fontWeight:'700' }}>ดูรายละเอียด →</span>
                                </div>
                              </div>
                            );})}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {zoomProduct && <HPImageZoomRotateModal frames={(zoomProduct.images && zoomProduct.images.length ? zoomProduct.images : [zoomProduct.img])} title={`${zoomProduct.code} · ${zoomProduct.name}`} onClose={() => setZoomProduct(null)}/>}
    </section>
  );
}

function HPCatalogPage() {
  const brands = [
    { name:'เกิดแสงสว่าง', color:'#0d5c50', img:'assets/kerd-cat.jpg', product:'assets/kerd-cat.jpg', hideLogoBar:true },
    { name:'Nano',       color:'#0d5c50', img:'assets/banner11.png',        product:'assets/nano.jpg.jpg', hideLogoBar:true },
    { name:'CHANG',      color:'#1e3a8a', img:'assets/banner2.png',         product:'assets/chang.png', hideLogoBar:true },
    { name:'Reckon',     color:'#29abe2', img:'assets/reckon.png',          product:'assets/reckon.png', hideLogoBar:true },
    { name:'AP',         color:'#e2231a', img:'assets/ap.png',              product:'assets/ap.png', hideLogoBar:true },
    { name:'Zeberg',     color:'#c2410c', img:'assets/zeberg.png',          product:'assets/zeberg.png', hideLogoBar:true },
    { name:'Sentoshi',   color:'#9a3412', img:'assets/sentoshi.png',        product:'assets/sentoshi.png', hideLogoBar:true },
    { name:'ท่อน้ำไทย',  color:'#1e40af', img:'assets/ท่อน้ำไทย.jpg',       product:'assets/ท่อน้ำไทย.jpg', hideLogoBar:true },
    { name:'Vena',       color:'#1e3a8a', img:'assets/วีน่า.png',           product:'assets/วีน่า.png', hideLogoBar:true },
    { name:'Sonic',      color:'#b91c1c', img:'assets/sonic.png',           product:'assets/sonic.png', hideLogoBar:true },
    { name:'SOKAWA',     color:'#1e3a8a', img:'assets/sokawa.png',          product:'assets/sokawa.png', hideLogoBar:true },
    { name:'GL',         color:'#8bc83f', img:'assets/จีแอล เอ็นจิเนียริ่ง.jpg', product:'assets/จีแอล เอ็นจิเนียริ่ง.jpg', hideLogoBar:true },
    { name:'Panasonic',  color:'#1e40af', img:'assets/panasonic.png',       product:'assets/panasonic.png', hideLogoBar:true },
    { name:'KJL',        color:'#1e3a8a', img:'assets/เคเจแอล.jpg',         product:'assets/เคเจแอล.jpg', hideLogoBar:true },
    { name:'SAFE-T-CUT', color:'#dc2626', img:'assets/safe-tcut.jpg',       product:'assets/safe-tcut.jpg', hideLogoBar:true },
    { name:'Lucky Misu', color:'#f59e0b', img:'assets/lucky misu.jpg',      product:'assets/lucky misu.jpg', hideLogoBar:true },
    { name:'iwachi',     color:'#3b5bdb', img:'assets/iwachi.jpg',          product:'assets/iwachi.jpg', hideLogoBar:true },
    { name:'Thongthai Bakelite', color:'#f97316', img:'assets/thongthai bikelite.png', product:'assets/thongthai bikelite.png', hideLogoBar:true },
    { name:'สายไฟ',      color:'#374151', img:'assets/สายไฟ.jpg',       product:'assets/สายไฟ.jpg', hideLogoBar:true },
    { name:'Nano LED',   color:'#8bc83f', img:'assets/nano led.png',        product:'assets/nano led.png', hideLogoBar:true },
  ];
  const [page, setPage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const total = brands.length;
  const goTo = (n) => setPage((n + total) % total);
  const b = brands[page];
  return (
    <section style={{ background:'#eef1ee', padding:'30px 0 56px', minHeight:'75vh' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>หน้าหลัก › <span style={{ color:'#0d5c50', fontWeight:'700' }}>แคตตาล็อก</span></div>

        {/* title */}
        <div style={{ textAlign:'center', marginBottom:'30px' }}>
          <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'32px', fontWeight:'800', color:'#0d5c50', letterSpacing:'-0.3px', marginBottom:'4px' }}>แคตตาล็อกสินค้า</h1>
          <div style={{ fontSize:'14px', color:'#999', fontWeight:'600', letterSpacing:'1px' }}>Catalog Product</div>
        </div>

        {/* book viewer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'18px' }}>
          <button onClick={() => goTo(page - 1)}
            style={{ flexShrink:0, width:'46px', height:'46px', borderRadius:'50%', border:'1px solid #dfe3e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 10px rgba(0,0,0,0.06)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d5c50" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          {/* the page */}
          <div key={page} className="hp-page-flip" style={{ position:'relative', width:'100%', maxWidth:'640px', aspectRatio:'3/4', background:'#fff', borderRadius:'4px 14px 14px 4px', boxShadow:'0 18px 40px rgba(0,0,0,0.16), inset -1px 0 0 rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* spine shadow */}
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'18px', background:'linear-gradient(90deg, rgba(0,0,0,0.14), transparent)', zIndex:3 }}/>
            {/* page-curl corner */}
            <div style={{ position:'absolute', right:0, bottom:0, width:'34px', height:'34px', background:'linear-gradient(135deg, transparent 50%, #e9ece9 50%)', boxShadow:'-2px -2px 6px rgba(0,0,0,0.06)', zIndex:3 }}/>
            {/* page number ribbon */}
            <div style={{ position:'absolute', top:'14px', right:'18px', fontSize:'12px', fontWeight:'700', color:'#9aa39c', zIndex:3, fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>หน้า {page + 1} / {total}</div>

            <div style={{ flex:1, minHeight:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'18px', position:'relative', zIndex:2, cursor:'zoom-in' }}
              onClick={() => setZoomOpen(true)}>
              <img loading="lazy" decoding="async" src={b.product} style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={e => e.target.style.display='none'}/>
              <div style={{ position:'absolute', bottom:'8px', right:'8px', width:'32px', height:'32px', borderRadius:'50%', background:'rgba(13,92,80,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
            </div>
            {!b.hideLogoBar && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'0 18px 14px', position:'relative', zIndex:2 }}>
                <div style={{ background:b.color, borderRadius:'8px', padding:'6px 14px' }}>
                  <img loading="lazy" decoding="async" src={b.img} style={{ maxHeight:'20px', maxWidth:'110px', objectFit:'contain' }} onError={e => e.target.style.display='none'}/>
                </div>
              </div>
            )}

            {/* footer strip */}
            <div style={{ background:'#0d5c50', color:'#fff', textAlign:'center', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'13px', fontWeight:'600', padding:'12px', letterSpacing:'0.03em', position:'relative', zIndex:2 }}>
              KiRD SAENG SAWANG · CATALOG
            </div>
          </div>

          <button onClick={() => goTo(page + 1)}
            style={{ flexShrink:0, width:'46px', height:'46px', borderRadius:'50%', border:'1px solid #dfe3e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 10px rgba(0,0,0,0.06)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d5c50" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* thumbnail strip */}
        <div className="hp-scroll-hide" style={{ display:'flex', gap:'10px', overflowX:'auto', justifyContent:'flex-start', margin:'28px auto 0', maxWidth:'900px', padding:'6px' }}>
          {brands.map((t, i) => (
            <div key={i} onClick={() => goTo(i)}
              style={{ flexShrink:0, width:'52px', height:'52px', borderRadius:'8px', border: i===page ? '2px solid #0d5c50' : '1px solid #e2e6e3', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: i===page ? 1 : 0.65, transition:'opacity 0.15s, border-color 0.15s' }}>
              <img loading="lazy" decoding="async" src={t.product} style={{ maxWidth:'80%', maxHeight:'80%', objectFit:'contain' }} onError={e => e.target.style.display='none'}/>
            </div>
          ))}
        </div>

        {/* contact CTA */}
        <div style={{ marginTop:'36px', textAlign:'center', background:'#fff', borderRadius:'12px', border:'1px solid #eee', padding:'26px' }}>
          <div style={{ fontSize:'18px', fontWeight:'800', color:'#0d5c50', marginBottom:'6px' }}>ต้องการแคตตาล็อกฉบับเต็ม หรือสอบถามสินค้าแบรนด์อื่นๆ</div>
          <div style={{ fontSize:'14.5px', color:'#777', marginBottom:'16px' }}>ติดต่อทีมงานได้เลย ยินดีให้บริการ</div>
          <a href="https://lin.ee/rAFJt2QD" target="_blank"
            style={{ display:'inline-flex', alignItems:'center', gap:'9px', background:'#06c755', color:'#fff', fontWeight:'700', fontSize:'15px', padding:'12px 30px', borderRadius:'999px', textDecoration:'none', boxShadow:'0 6px 18px rgba(6,199,85,0.35)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
            สอบถามทาง LINE
          </a>
        </div>
      </div>
      {zoomOpen && <HPImageZoomRotateModal src={b.product} title={b.name} onClose={() => setZoomOpen(false)}/>}
    </section>
  );
}

function HPContactPage() {
  const mapUrl = 'https://www.google.com/maps/place/%E0%B9%84%E0%B8%97%E0%B8%A2%E0%B8%9E%E0%B8%B4%E0%B8%A3%E0%B8%B4%E0%B8%A2%E0%B8%B0/data=!4m2!3m1!1s0x30e2bd6acd643603:0x9149d67fc97ac02b!18m1!1e1?utm_source=mstt_1&entry=gps';
  const items = [
    { label:'โทรศัพท์', value:<a href="tel:028944007" style={{ color:'#1a1a1a', textDecoration:'none' }}>02-894-4007</a>, c:'#ea580c',
      icon:<path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/> },
    { label:'LINE Official', value:'@kirdsaengsawang', c:'#06c755',
      icon:<path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/> },
    { label:'เวลาทำการ', value:'จันทร์ – เสาร์   08:30 – 17:30 น.', c:'#2563eb',
      icon:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></> },
  ];
  return (
    <section style={{ background:'#ffffff', padding:'30px 0 56px', minHeight:'75vh' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 20px' }}>
        {/* breadcrumb */}
        <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>หน้าหลัก › <span style={{ color:'#8bc83f', fontWeight:'700' }}>ติดต่อเรา</span></div>

        {/* hero header — centered white banner */}
        <div style={{ borderRadius:'20px', overflow:'hidden', position:'relative', background:'#ffffff', marginBottom:'2px', padding:'48px 40px 20px', textAlign:'center' }}>
          {/* dot texture */}
          <div style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none', opacity:0.5, backgroundImage:'radial-gradient(rgba(13,107,92,0.06) 1px, transparent 1px)', backgroundSize:'22px 22px' }}/>
          {/* soft glow */}
          <div style={{ position:'absolute', top:'-120px', left:'50%', transform:'translateX(-50%)', width:'420px', height:'320px', borderRadius:'50%', background:'radial-gradient(circle, rgba(34,211,180,0.10) 0%, transparent 68%)', zIndex:0, pointerEvents:'none' }}/>
          <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
            {/* logo — transparent background, blends fully */}
            <img loading="lazy" decoding="async" src="assets/logo-kss-trans.png" style={{ width:'96px', height:'96px', objectFit:'contain', marginBottom:'18px' }}/>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'9px', background:'#eaf6f5', border:'1px solid #c2ece6', color:'#0d6b5c', fontSize:'13px', fontWeight:'700', letterSpacing:'3px', padding:'5px 18px', borderRadius:'999px', marginBottom:'18px', textTransform:'uppercase' }}>
              ติดต่อเรา
            </span>
            <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'46px', fontWeight:'800', color:'#0f3d24', letterSpacing:'-1px', lineHeight:'1.2', marginBottom:'10px' }}>
              บริษัท <span style={{ color:'#0d6b5c' }}>เกิดแสงสว่าง</span> จำกัด
            </h1>
            <div style={{ fontSize:'14px', color:'#9aa8a0', fontWeight:'600', letterSpacing:'3px', marginBottom:'14px' }}>KiRD SAENG SAWANG CO., LTD.</div>
            <p style={{ fontSize:'16px', color:'#5a7a66', fontWeight:'500' }}>ยินดีให้บริการ พร้อมตอบทุกคำถาม</p>
          </div>
        </div>

        {/* contact details — การ์ดกริด */}
        {(() => {
          const card = {
            display:'flex', gap:'14px', alignItems:'flex-start', textDecoration:'none',
            background:'#fff', border:'1px solid #e8f0ec', borderRadius:'16px', padding:'22px 22px',
            boxShadow:'0 2px 10px rgba(15,77,42,0.05)', transition:'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
          };
          const tile = (bg) => ({ width:'46px', height:'46px', borderRadius:'13px', background:bg, display:'flex',
                                  alignItems:'center', justifyContent:'center', flexShrink:0 });
          const label = { fontSize:'11.5px', color:'#9aa8a0', fontWeight:'700', letterSpacing:'0.08em', marginBottom:'5px', textTransform:'uppercase' };
          const lift = (e, on, color) => {
            e.currentTarget.style.transform = on ? 'translateY(-3px)' : 'translateY(0)';
            e.currentTarget.style.boxShadow = on ? '0 12px 26px rgba(15,77,42,0.13)' : '0 2px 10px rgba(15,77,42,0.05)';
            e.currentTarget.style.borderColor = on ? color : '#e8f0ec';
          };
          return (
            <div style={{ maxWidth:'880px', margin:'6px auto 30px', display:'grid',
                          gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'14px' }}>

              {/* ที่อยู่ — เต็มความกว้าง */}
              <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                style={{ ...card, gridColumn:'1 / -1' }}
                onMouseEnter={e => lift(e, true, '#8bc83f')} onMouseLeave={e => lift(e, false)}>
                <div style={tile('#f1f9e8')}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6ba52e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={label}>ที่อยู่บริษัท</div>
                  <div style={{ fontSize:'15.5px', fontWeight:'600', color:'#1a1a1a', lineHeight:'1.65' }}>
                    87/11-12 ซอยเอกชัย 76 แยก 2 แขวงคลองบางพราน<br/>เขตบางบอน กรุงเทพมหานคร 10150
                  </div>
                  <div style={{ fontSize:'12.5px', color:'#6ba52e', fontWeight:'700', marginTop:'9px' }}>ดูเส้นทางบนแผนที่ →</div>
                </div>
              </a>

              {/* โทรศัพท์ */}
              <a href="tel:028944007" style={card}
                onMouseEnter={e => lift(e, true, '#f05a20')} onMouseLeave={e => lift(e, false)}>
                <div style={tile('#fff0e8')}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="#f05a20"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/></svg>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={label}>โทรศัพท์</div>
                  <div style={{ fontSize:'21px', fontWeight:'800', color:'#1a1a1a', letterSpacing:'-0.3px', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>02-894-4007</div>
                  <div style={{ fontSize:'12.5px', color:'#f05a20', fontWeight:'700', marginTop:'7px' }}>กดเพื่อโทรออก →</div>
                </div>
              </a>

              {/* LINE */}
              <a href="https://lin.ee/rAFJt2QD" target="_blank" rel="noopener noreferrer" style={card}
                onMouseEnter={e => lift(e, true, '#06c755')} onMouseLeave={e => lift(e, false)}>
                <div style={tile('#e8fbef')}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#06c755"><path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={label}>LINE Official</div>
                  <div style={{ fontSize:'17px', fontWeight:'800', color:'#06c755', wordBreak:'break-all' }}>@kirdsaengsawang</div>
                  <div style={{ fontSize:'12.5px', color:'#06c755', fontWeight:'700', marginTop:'7px' }}>กดเพื่อเพิ่มเพื่อน →</div>
                </div>
              </a>

              {/* เวลาทำการ */}
              <div style={{ ...card, cursor:'default' }}
                onMouseEnter={e => lift(e, true, '#2563eb')} onMouseLeave={e => lift(e, false)}>
                <div style={tile('#eaf1fe')}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={label}>เวลาทำการ</div>
                  <div style={{ fontSize:'15.5px', fontWeight:'700', color:'#1a1a1a' }}>จันทร์ – เสาร์</div>
                  <div style={{ fontSize:'15.5px', fontWeight:'700', color:'#1a1a1a', marginTop:'2px' }}>08:30 – 17:30 น.</div>
                  <div style={{ fontSize:'12.5px', color:'#94a3b8', fontWeight:'600', marginTop:'7px' }}>หยุดวันอาทิตย์และวันหยุดนักขัตฤกษ์</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* map */}
        <div style={{ borderRadius:'18px', overflow:'hidden', boxShadow:'0 8px 26px rgba(15,77,42,0.12)', border:'1px solid #eaf3ed', background:'#fff', marginBottom:'24px' }}>
          <iframe title="แผนที่บริษัท เกิดแสงสว่าง จำกัด"
            src="https://maps.google.com/maps?q=13.6732332,100.4165502&z=17&output=embed"
            style={{ border:0, width:'100%', display:'block', minHeight:'440px' }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"/>
          <a href={mapUrl} target="_blank" rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'#8bc83f', color:'#fff', fontSize:'14px', fontWeight:'700', padding:'13px', textDecoration:'none' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2"/></svg>
            เปิดแผนที่ใน Google Maps →
          </a>
        </div>

      </div>
    </section>
  );
}

function HPCategoryProductsPage({ activeCategory, onSelectProduct }) {
  const [zoomProduct, setZoomProduct] = useState(null);
  const filtered  = hpProductsInCategory(activeCategory);
  const catLabel  = hpCategoryLabel(activeCategory);
  return (
    <section style={{ background:'#f9fafb', padding:'24px 0 56px', minHeight:'60vh' }}>
      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ fontSize:'13px', color:'#888', marginBottom:'12px' }}>หน้าหลัก › <span style={{ color:'#0d5c50', fontWeight:'600' }}>{catLabel}</span></div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
          <h1 style={{ fontSize:'24px', fontWeight:'700', color:'#1a1a1a' }}>{catLabel}</h1>
          <span style={{ fontSize:'13px', color:'#0d9488', fontWeight:'700', background:'#e8f8f1', padding:'4px 12px', borderRadius:'999px' }}>{filtered.length} รายการ</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#aaa', fontSize:'15px', background:'#fff', borderRadius:'12px' }}>ยังไม่มีสินค้าในหมวดหมู่นี้</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'16px' }}>
            {filtered.map((p, i) => {
              const thumb = (p.images && p.images[0]) || p.img;
              return (
                <div key={`${p.brand}-${p.code}-${i}`} style={{ background:'#fff', border:'1px solid #eef0f2', borderRadius:'12px', overflow:'hidden', display:'flex', flexDirection:'column', cursor:'pointer', transition:'box-shadow 0.18s ease, transform 0.18s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow='0 10px 22px rgba(0,0,0,0.09)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}
                  onClick={() => onSelectProduct(p)}>
                  <div style={{ height:'140px', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', padding:'12px', position:'relative' }}>
                    <img loading="lazy" decoding="async" src={thumb} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} onError={e => e.target.style.display='none'}/>
                    <div onClick={e => { e.stopPropagation(); setZoomProduct(p); }} title="ดูรูปขนาดใหญ่"
                      style={{ position:'absolute', bottom:'6px', right:'6px', width:'26px', height:'26px', borderRadius:'50%', background:'rgba(13,92,80,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6"/><path d="M21 21l-4.35-4.35"/></svg>
                    </div>
                  </div>
                  <div style={{ padding:'11px 12px 13px', borderTop:'1px solid #f2f4f2' }}>
                    <div style={{ fontSize:'10px', color:'#9e9e9e', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'2px' }}>{p.brand}</div>
                    <div style={{ fontSize:'12.5px', fontWeight:'800', color:'#0d9488', marginBottom:'3px' }}>{p.code}</div>
                    <div style={{ fontSize:'11.5px', color:'#667', lineHeight:'1.4', marginBottom:'8px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.name}</div>
                    <span style={{ fontSize:'11.5px', color:'#0d5c50', fontWeight:'700' }}>ดูรายละเอียด →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {zoomProduct && <HPImageZoomRotateModal frames={(zoomProduct.images && zoomProduct.images.length ? zoomProduct.images : [zoomProduct.img])} title={`${zoomProduct.code} · ${zoomProduct.name}`} onClose={() => setZoomProduct(null)}/>}
    </section>
  );
}

function HPCartPage({ cartItems, onClear }) {
  const total = cartItems.reduce((s, i) => s + i.price, 0);
  return (
    <section style={{ background:'#f9fafb', padding:'32px 0', minHeight:'60vh' }}>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'0 20px' }}>
        <h1 style={{ fontSize:'24px', fontWeight:'700', color:'#1a1a1a', marginBottom:'20px' }}>ตะกร้าสินค้า ({cartItems.length})</h1>
        <div style={{ background:'#fff', borderRadius:'12px', padding:'8px 20px' }}>
          {cartItems.length === 0
            ? <div style={{ textAlign:'center', padding:'60px', color:'#aaa', fontSize:'16px' }}>ตะกร้าของคุณว่างเปล่า</div>
            : cartItems.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 0', borderBottom:'1px solid #f0f0f0' }}>
                <img loading="lazy" decoding="async" src={item.img} style={{ width:'56px', height:'56px', objectFit:'contain', background:'#f9fafb', borderRadius:'8px', padding:'4px' }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>{item.name}</div>
                  <div style={{ fontSize:'12px', color:'#888' }}>{item.brand}</div>
                </div>
                <div style={{ fontFamily:'Mitr, sans-serif', fontSize:'17px', fontWeight:'700', color:'#f05a20' }}>฿{item.price.toLocaleString()}</div>
              </div>
            ))
          }
        </div>
        {cartItems.length > 0 && (
          <div style={{ background:'#fff', borderRadius:'12px', padding:'20px', marginTop:'14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:'18px', fontWeight:'700' }}>ยอดรวม: <span style={{ color:'#f05a20', fontFamily:'Mitr, sans-serif' }}>฿{total.toLocaleString()}</span></div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={onClear} style={{ background:'#f0f0f0', color:'#444', border:'none', borderRadius:'999px', padding:'11px 22px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'14px', cursor:'pointer' }}>ล้างตะกร้า</button>
              <button style={{ background:'#0d5c50', color:'#fff', border:'none', borderRadius:'999px', padding:'11px 28px', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>ดำเนินการสั่งซื้อ →</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HPMemberPage({ onNavigate }) {
  const [mode, setMode] = useState('login');
  const [member, setMember] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kss_member') || 'null'); } catch (e) { return null; }
  });
  const gbtnRef = React.useRef(null);

  // เข้าสู่ระบบสำเร็จด้วย Google
  const onGoogleCredential = (resp) => {
    const info = hpDecodeJwt(resp.credential);
    if (!info) return;
    const m = { name: info.name, email: info.email, picture: info.picture, provider: 'google' };
    localStorage.setItem('kss_member', JSON.stringify(m));
    setMember(m);
    window.scrollTo(0, 0);
  };
  const onLogoutMember = () => { localStorage.removeItem('kss_member'); setMember(null); };

  // โหมดเดโม: ใช้เมื่อยังไม่ได้ตั้งค่า Google Client ID — กดแล้วล็อกอินได้ทันที
  const demoGoogleLogin = () => {
    const email = window.prompt('เข้าสู่ระบบด้วย Google (โหมดเดโม)\nกรอกอีเมลของคุณ:', 'example@gmail.com');
    if (!email || !email.trim()) return;
    const clean = email.trim();
    const name = clean.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const m = { name, email: clean, picture: '', provider: 'google-demo' };
    localStorage.setItem('kss_member', JSON.stringify(m));
    setMember(m);
    window.scrollTo(0, 0);
  };

  // เรนเดอร์ปุ่ม Google เมื่อสคริปต์โหลดเสร็จและยังไม่ล็อกอิน
  useEffect(() => {
    if (member || !HP_GOOGLE_READY) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (window.google && window.google.accounts && window.google.accounts.id && gbtnRef.current) {
        clearInterval(timer);
        window.google.accounts.id.initialize({ client_id: HP_GOOGLE_CLIENT_ID, callback: onGoogleCredential });
        window.google.accounts.id.renderButton(gbtnRef.current, { theme:'outline', size:'large', width:396, text: mode==='register' ? 'signup_with' : 'signin_with', shape:'rectangular', logo_alignment:'center' });
      }
      if (tries > 40) clearInterval(timer);
    }, 150);
    return () => clearInterval(timer);
  }, [member, mode]);

  // ── มุมมองเมื่อล็อกอินสมาชิกแล้ว ──
  if (member) {
    return (
      <section style={{ background:'#eef8f7', padding:'30px 0 56px', minHeight:'75vh' }}>
        <div style={{ maxWidth:'460px', margin:'0 auto', padding:'0 20px' }}>
          <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>หน้าหลัก › <span style={{ color:'#8bc83f', fontWeight:'700' }}>Member</span></div>
          <div style={{ background:'#fff', borderRadius:'18px', border:'1px solid #eaf3ed', boxShadow:'0 4px 16px rgba(15,77,42,0.06)', padding:'40px 32px', textAlign:'center' }}>
            {member.picture
              ? <img loading="lazy" decoding="async" src={member.picture} referrerPolicy="no-referrer" style={{ width:'84px', height:'84px', borderRadius:'50%', objectFit:'cover', margin:'0 auto 16px', border:'3px solid #d8eeec' }}/>
              : <div style={{ width:'84px', height:'84px', borderRadius:'50%', background:'#0d5c50', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'34px', fontWeight:'800', margin:'0 auto 16px' }}>{(member.name||'?').charAt(0)}</div>}
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#eafef0', color:'#0d8a4f', fontSize:'12px', fontWeight:'700', padding:'4px 12px', borderRadius:'999px', marginBottom:'12px' }}>
              <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#0d8a4f' }}/> เข้าสู่ระบบแล้ว
            </div>
            <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'23px', fontWeight:'800', color:'#06352e' }}>สวัสดี, {member.name}</h1>
            <p style={{ fontSize:'14px', color:'#888', marginTop:'6px' }}>{member.email}</p>
            <div style={{ display:'flex', gap:'10px', marginTop:'26px' }}>
              <button onClick={() => onNavigate && onNavigate('สินค้าทั้งหมด')} style={{ flex:1, background:'#0d5c50', color:'#fff', border:'none', borderRadius:'10px', padding:'13px 0', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'15px', fontWeight:'700', cursor:'pointer' }}>เลือกซื้อสินค้า</button>
              <button onClick={onLogoutMember} style={{ flex:1, background:'#fff', color:'#0d5c50', border:'1px solid #cfe3df', borderRadius:'10px', padding:'13px 0', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'15px', fontWeight:'700', cursor:'pointer' }}>ออกจากระบบ</button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ background:'#eef8f7', padding:'30px 0 56px', minHeight:'75vh' }}>
      <div style={{ maxWidth:'460px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>หน้าหลัก › <span style={{ color:'#8bc83f', fontWeight:'700' }}>Member</span></div>

        <div style={{ background:'#fff', borderRadius:'18px', border:'1px solid #eaf3ed', boxShadow:'0 4px 16px rgba(15,77,42,0.06)', padding:'36px 32px' }}>
          <div style={{ textAlign:'center', marginBottom:'26px' }}>
            <img loading="lazy" decoding="async" src="assets/logo-kss.jpg" style={{ width:'56px', height:'56px', objectFit:'contain', marginBottom:'10px' }}/>
            <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'24px', fontWeight:'800', color:'#06352e' }}>
              {mode === 'login' ? 'เข้าสู่ระบบสมาชิก' : 'สมัครสมาชิก'}
            </h1>
            <p style={{ fontSize:'14px', color:'#888', marginTop:'6px' }}>รับสิทธิพิเศษและส่วนลดสำหรับสมาชิก</p>
          </div>

          <div style={{ display:'flex', gap:'8px', background:'#eef8f7', borderRadius:'999px', padding:'4px', marginBottom:'24px' }}>
            <button onClick={() => setMode('login')}
              style={{ flex:1, border:'none', borderRadius:'999px', padding:'9px 0', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'14px', fontWeight:'700', cursor:'pointer', background: mode==='login' ? '#0d5c50' : 'transparent', color: mode==='login' ? '#fff' : '#5a7a66' }}>
              เข้าสู่ระบบ
            </button>
            <button onClick={() => setMode('register')}
              style={{ flex:1, border:'none', borderRadius:'999px', padding:'9px 0', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'14px', fontWeight:'700', cursor:'pointer', background: mode==='register' ? '#0d5c50' : 'transparent', color: mode==='register' ? '#fff' : '#5a7a66' }}>
              สมัครสมาชิก
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {mode === 'register' && (
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'700', color:'#3a4a42', marginBottom:'6px' }}>ชื่อ-นามสกุล</label>
                <input type="text" placeholder="กรอกชื่อ-นามสกุล" style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:'1px solid #d8eeec', fontSize:'14px', fontFamily:'Inter, Noto Sans Thai, sans-serif', boxSizing:'border-box' }}/>
              </div>
            )}
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'700', color:'#3a4a42', marginBottom:'6px' }}>อีเมล</label>
              <input type="email" placeholder="example@email.com" style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:'1px solid #d8eeec', fontSize:'14px', fontFamily:'Inter, Noto Sans Thai, sans-serif', boxSizing:'border-box' }}/>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'700', color:'#3a4a42', marginBottom:'6px' }}>รหัสผ่าน</label>
              <input type="password" placeholder="••••••••" style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:'1px solid #d8eeec', fontSize:'14px', fontFamily:'Inter, Noto Sans Thai, sans-serif', boxSizing:'border-box' }}/>
            </div>
            <button style={{ marginTop:'8px', background:'#0d5c50', color:'#fff', border:'none', borderRadius:'10px', padding:'13px 0', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'15px', fontWeight:'700', cursor:'pointer' }}>
              {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>

            {/* ตัวคั่น หรือ */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'6px 0 2px' }}>
              <div style={{ flex:1, height:'1px', background:'#e4efea' }}/>
              <span style={{ fontSize:'13px', color:'#aaa' }}>หรือ</span>
              <div style={{ flex:1, height:'1px', background:'#e4efea' }}/>
            </div>

            {/* ปุ่ม Google */}
            {HP_GOOGLE_READY ? (
              <div ref={gbtnRef} style={{ display:'flex', justifyContent:'center', minHeight:'44px' }}/>
            ) : (
              <>
                <button type="button" onClick={demoGoogleLogin}
                  onMouseEnter={e => e.currentTarget.style.background='#f7f8f8'}
                  onMouseLeave={e => e.currentTarget.style.background='#fff'}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', width:'100%', background:'#fff', border:'1px solid #dadce0', borderRadius:'10px', padding:'12px 0', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'15px', fontWeight:'600', color:'#3c4043', cursor:'pointer', transition:'background 0.15s' }}>
                  <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  {mode === 'register' ? 'สมัครด้วย Google' : 'เข้าสู่ระบบด้วย Google'}
                </button>
                <div style={{ fontSize:'11.5px', color:'#aaa', textAlign:'center', lineHeight:'1.5' }}>
                  โหมดเดโม · เมื่อใส่ <code>HP_GOOGLE_CLIENT_ID</code> จริงในไฟล์ ระบบจะสลับไปใช้ Google จริงอัตโนมัติ
                </div>
              </>
            )}
          </div>
        </div>

        {/* ทางเข้าระบบหลังบ้านสำหรับผู้ดูแล/ผู้ขาย */}
        <button onClick={() => onNavigate && onNavigate('admin')}
          style={{ width:'100%', marginTop:'16px', background:'#fff', border:'1px solid #cfe3df', borderRadius:'12px', padding:'15px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif', boxShadow:'0 2px 8px rgba(15,77,42,0.05)', transition:'border-color 0.15s, background 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='#0d6b5c'; e.currentTarget.style.background='#f6fcfb'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#cfe3df'; e.currentTarget.style.background='#fff'; }}>
          <span style={{ display:'flex', alignItems:'center', gap:'11px' }}>
            <span style={{ width:'34px', height:'34px', borderRadius:'9px', background:'linear-gradient(135deg,#073d35,#0e6356)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9fe6d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </span>
            <span style={{ textAlign:'left' }}>
              <span style={{ display:'block', fontSize:'14.5px', fontWeight:'700', color:'#06352e' }}>เข้าสู่ระบบด้วยบัญชีผู้ดูแล / ผู้ขาย</span>
              <span style={{ display:'block', fontSize:'12px', color:'#8aa399', fontWeight:'500', marginTop:'1px' }}>สำหรับจัดการสินค้าระบบหลังบ้าน</span>
            </span>
          </span>
          <span style={{ color:'#0d6b5c', fontSize:'18px', fontWeight:'700' }}>›</span>
        </button>
      </div>
    </section>
  );
}

// ================= ADMIN: จัดการสินค้า (สไตล์ Shopee Seller Centre) =================
// ============ ระบบผู้ใช้หลังบ้าน: แอดมินหลัก / แอดมินรอง / เซลล์ ============
// การตรวจสอบสิทธิ์ทั้งหมดอยู่ที่เซิร์ฟเวอร์ (netlify/functions/api.mjs)
// โค้ดฝั่งนี้แค่ "ซ่อนเมนูที่ไม่เกี่ยว" เพื่อความสะดวก — แก้ค่าในเบราว์เซอร์แล้วไม่มีผล
// เพราะทุกคำสั่งถูกตรวจซ้ำที่เซิร์ฟเวอร์เสมอ และเซสชันเก็บใน HttpOnly cookie ที่ JS อ่านไม่ได้
const HP_ROLES = {
  super: { key:'super', label:'แอดมินหลัก', color:'#b3261e', bg:'#fdecea',
           desc:'จัดการสินค้า จัดการผู้ใช้ และใช้ระบบเซลล์ได้ทั้งหมด' },
  admin: { key:'admin', label:'แอดมินรอง', color:'#0d6b5c', bg:'#e7f5f1',
           desc:'จัดการสินค้าได้ แต่ลบสินค้า/คืนค่าเริ่มต้น/จัดการผู้ใช้ ไม่ได้' },
  sales: { key:'sales', label:'เซลล์', color:'#1d4ed8', bg:'#e8effd',
           desc:'ดูสินค้าและสต๊อก ออกใบเสนอราคา บันทึกการขาย (แก้ไขสินค้าไม่ได้)' },
};

// เรียก API หลังบ้าน — ส่ง cookie ไปด้วยเสมอ
async function hpApi(path, options = {}) {
  const res = await fetch('/api' + path, {
    method: options.method || 'GET',
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    const err = new Error((data && data.error) || ('เรียกเซิร์ฟเวอร์ไม่สำเร็จ (HTTP ' + res.status + ')'));
    err.status = res.status;
    throw err;
  }
  return data || {};
}
// สิทธิ์ที่เซิร์ฟเวอร์ส่งกลับมาตอนล็อกอิน (ใช้ซ่อน/แสดงเมนูเท่านั้น)
function hpCan(user, what) { return !!(user && user.can && user.can[what]); }

function HPRoleBadge({ role, small }) {
  const r = HP_ROLES[role] || HP_ROLES.sales;
  return (
    <span style={{ display:'inline-block', background:r.bg, color:r.color, border:`1px solid ${r.color}33`,
                   fontSize: small ? '10.5px' : '12px', fontWeight:'700', padding: small ? '2px 8px' : '4px 11px', borderRadius:'999px', whiteSpace:'nowrap' }}>
      {r.label}
    </span>
  );
}

function HPAdminLogin({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [pass,  setPass]  = useState('');
  const [show,  setShow]  = useState(false);
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);

  const submit = async () => {
    if (busy) return;
    const u = username.trim().toLowerCase();
    if (!u || !pass) { setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'); return; }
    setBusy(true);
    try {
      // เซิร์ฟเวอร์เป็นผู้ตรวจรหัสผ่านและออกเซสชันเป็น HttpOnly cookie
      await hpApi('/auth/login', { method:'POST', body:{ username:u, password:pass } });
      const me = await hpApi('/auth/me');
      onSuccess({ ...me.user, can: me.can });
    } catch (e) {
      setError(e.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
      setPass(''); setBusy(false);
    }
  };

  const [focus, setFocus] = useState('');
  const fieldWrap = (name) => ({
    display:'flex', alignItems:'center', gap:'11px',
    border:'1.5px solid ' + (error ? '#ee4d2d' : (focus === name ? '#12866b' : '#e3eae7')),
    background: focus === name ? '#fff' : '#f8faf9',
    borderRadius:'11px', padding:'0 14px', transition:'border-color 0.15s, background 0.15s, box-shadow 0.15s',
    boxShadow: focus === name ? '0 0 0 4px rgba(18,134,107,0.10)' : 'none',
  });
  const fieldInput = { flex:1, border:'none', background:'transparent', outline:'none', padding:'14px 0',
    fontSize:'15px', fontFamily:'Inter, Noto Sans Thai, sans-serif', color:'#12241f', minWidth:0 };
  const fieldLabel = { fontSize:'12.5px', fontWeight:'700', color:'#5a7a66', marginBottom:'7px', display:'block' };

  return (
    <section style={{ background:'linear-gradient(160deg,#f2f7f5 0%,#e9f2ef 55%,#f6f8f7 100%)', minHeight:'82vh',
                      display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 20px' }}>
      <div style={{ width:'100%', maxWidth:'880px', background:'#fff', borderRadius:'22px', overflow:'hidden',
                    boxShadow:'0 24px 60px rgba(6,53,46,0.16)', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))' }}>

        {/* ── ฝั่งแบรนด์ ── */}
        <div style={{ position:'relative', background:'linear-gradient(155deg,#0e6356 0%,#06352e 60%,#04231e 100%)',
                      padding:'44px 38px', color:'#fff', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'center', minHeight:'380px' }}>
          {/* แสงพื้นหลัง */}
          <div style={{ position:'absolute', top:'-90px', right:'-70px', width:'260px', height:'260px', borderRadius:'50%',
                        background:'radial-gradient(circle, rgba(95,209,194,0.34), transparent 68%)', filter:'blur(10px)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:'-110px', left:'-80px', width:'280px', height:'280px', borderRadius:'50%',
                        background:'radial-gradient(circle, rgba(139,200,63,0.20), transparent 68%)', filter:'blur(10px)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', inset:0, opacity:0.28, pointerEvents:'none',
                        backgroundImage:'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize:'34px 34px' }}/>

          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'11px', marginBottom:'26px' }}>
              <img loading="lazy" decoding="async" src="assets/logo-kss-trans.png" alt="" style={{ width:'38px', height:'38px', objectFit:'contain', filter:'brightness(0) invert(1)' }}/>
              <div>
                <div style={{ fontSize:'15px', fontWeight:'800', letterSpacing:'0.4px' }}>KiRD SAENG SAWANG</div>
                <div style={{ fontSize:'11.5px', color:'rgba(255,255,255,0.55)' }}>บริษัท เกิดแสงสว่าง จำกัด</div>
              </div>
            </div>
            <h2 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'27px', fontWeight:'800', lineHeight:'1.35', marginBottom:'10px' }}>
              ระบบหลังบ้าน
            </h2>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.62)', lineHeight:'1.75' }}>
              จัดการสินค้า ออกใบเสนอราคา และดูแลทีมงาน<br/>ในที่เดียว
            </p>
          </div>

        </div>

        {/* ── ฝั่งฟอร์ม ── */}
        <div style={{ padding:'46px 42px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ marginBottom:'26px' }}>
            <div style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'23px', fontWeight:'800', color:'#12241f', marginBottom:'6px' }}>เข้าสู่ระบบ</div>
            <div style={{ fontSize:'13.5px', color:'#8b9c95' }}>กรอกชื่อผู้ใช้และรหัสผ่านที่ได้รับจากแอดมินหลัก</div>
          </div>

          <label style={fieldLabel}>ชื่อผู้ใช้</label>
          <div style={{ ...fieldWrap('u'), marginBottom:'16px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={focus === 'u' ? '#12866b' : '#a8bab3'} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <input value={username} autoFocus autoComplete="username" style={fieldInput}
              onFocus={() => setFocus('u')} onBlur={() => setFocus('')}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder="เช่น admin"/>
          </div>

          <label style={fieldLabel}>รหัสผ่าน</label>
          <div style={{ ...fieldWrap('p'), marginBottom:'14px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={focus === 'p' ? '#12866b' : '#a8bab3'} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <input type={show ? 'text' : 'password'} value={pass} autoComplete="current-password" style={fieldInput}
              onFocus={() => setFocus('p')} onBlur={() => setFocus('')}
              onChange={e => { setPass(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder="••••••••"/>
            <button onClick={() => setShow(s => !s)} title={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', flexShrink:0 }}>
              {show ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7d918a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><path d="M1 1l22 22"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7d918a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          {error && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:'8px', background:'#fdecea', border:'1px solid #f5c6c0',
                          color:'#b3261e', fontSize:'13px', padding:'11px 13px', borderRadius:'9px', marginBottom:'14px', lineHeight:'1.6' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink:0, marginTop:'1px' }}><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
              <span>{error}</span>
            </div>
          )}

          <button onClick={submit} disabled={busy}
            style={{ width:'100%', background: busy ? '#a7c5bd' : 'linear-gradient(120deg,#12866b,#0b5f4d)', border:'none',
                     borderRadius:'11px', padding:'15px 0', fontSize:'15.5px', fontWeight:'800', color:'#fff',
                     cursor: busy ? 'default' : 'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif',
                     boxShadow: busy ? 'none' : '0 8px 20px rgba(18,134,107,0.32)', transition:'transform 0.15s, box-shadow 0.15s',
                     display:'flex', alignItems:'center', justifyContent:'center', gap:'9px' }}
            onMouseEnter={e => { if (!busy) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 26px rgba(18,134,107,0.4)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow = busy ? 'none' : '0 8px 20px rgba(18,134,107,0.32)'; }}>
            {busy ? 'กำลังตรวจสอบ…' : <>เข้าสู่ระบบ
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
            </>}
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#a8b5af', marginTop:'20px', lineHeight:'1.6' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2cec9" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <span>ลืมรหัสผ่าน? กรุณาติดต่อแอดมินหลักเพื่อตั้งรหัสใหม่</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- จัดการผู้ใช้ (เฉพาะแอดมินหลัก) ----------
function HPUsersManager({ me }) {
  const [users, setUsers] = useState([]);
  const [form, setForm]   = useState({ username:'', name:'', role:'sales', pass:'' });
  const [msg, setMsg]     = useState('');
  const [pwFor, setPwFor] = useState(null);
  const [newPw, setNewPw] = useState('');
  const [editFor, setEditFor] = useState(null);
  const [editDraft, setEditDraft] = useState({ username:'', name:'' });
  const [uq, setUq] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [busy, setBusy] = useState(false);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3200); };
  // ทุกคำสั่งส่งไปให้เซิร์ฟเวอร์ตัดสิน แล้วรับรายชื่อล่าสุดกลับมา
  const call = async (body, okMsg) => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await hpApi('/users', { method:'POST', body });
      if (r.users) setUsers(r.users);
      if (okMsg) flash('✓ ' + okMsg);
    } catch (e) { flash('⚠ ' + e.message); }
    setBusy(false);
  };

  useEffect(() => {
    hpApi('/users').then(r => setUsers(r.users || [])).catch(e => flash('⚠ ' + e.message));
  }, []);

  const addUser = async () => {
    await call({ action:'create', username:form.username, name:form.name, role:form.role, password:form.pass }, 'เพิ่มผู้ใช้เรียบร้อย');
    setForm({ username:'', name:'', role:'sales', pass:'' });
  };
  const changeRole   = (id, role) => call({ action:'setRole', id, role }, 'เปลี่ยนบทบาทแล้ว');
  const toggleActive = (id) => call({ action:'toggleActive', id }, 'อัปเดตสถานะแล้ว');
  const removeUser   = (id) => {
    const t = users.find(x => x.id === id);
    if (!window.confirm('ลบผู้ใช้ "' + t.name + '" (' + t.username + ') ใช่หรือไม่?')) return;
    call({ action:'delete', id }, 'ลบผู้ใช้แล้ว');
  };
  const resetPw = async () => {
    await call({ action:'resetPassword', id:pwFor.id, password:newPw }, 'ตั้งรหัสผ่านใหม่แล้ว');
    setPwFor(null); setNewPw('');
  };
  const saveEdit = async () => {
    await call({ action:'edit', id:editFor.id, username:editDraft.username, name:editDraft.name }, 'บันทึกข้อมูลผู้ใช้แล้ว');
    setEditFor(null);
  };

  const roleCount = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
  const kw = uq.trim().toLowerCase();
  const shown = users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (!kw || (u.username || '').toLowerCase().includes(kw) || (u.name || '').toLowerCase().includes(kw)));

  const inp = { border:'1px solid #ddd', borderRadius:'6px', padding:'10px 12px', fontSize:'14px', fontFamily:'Inter, Noto Sans Thai, sans-serif', outline:'none', boxSizing:'border-box' };
  const th  = { textAlign:'left', padding:'12px 14px', fontSize:'12.5px', fontWeight:'700', color:'#777', borderBottom:'1px solid #f0f0f0', whiteSpace:'nowrap' };
  const td  = { padding:'13px 14px', fontSize:'13.5px', color:'#333', borderBottom:'1px solid #f6f6f6', verticalAlign:'middle' };

  return (
    <div>
      {msg && <div style={{ background:'#fff8e6', border:'1px solid #ffe0a3', color:'#8a6100', padding:'11px 16px', borderRadius:'6px', marginBottom:'14px', fontSize:'13.5px' }}>{msg}</div>}

      <div style={{ background:'#fff', borderRadius:'6px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', padding:'22px 24px', marginBottom:'16px' }}>
        <div style={{ fontSize:'17px', fontWeight:'700', color:'#222', marginBottom:'4px' }}>เพิ่มผู้ใช้ใหม่</div>
        <div style={{ fontSize:'12.5px', color:'#999', marginBottom:'16px' }}>รหัสผ่านจะถูกเก็บเป็นแฮช SHA-256 ไม่เก็บรหัสตรงๆ</div>
        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1.3fr 1fr 1.2fr auto', gap:'10px', alignItems:'center' }}>
          <input placeholder="ชื่อผู้ใช้ (ภาษาอังกฤษ)" value={form.username} onChange={e => setForm(f => ({ ...f, username:e.target.value }))} style={inp}/>
          <input placeholder="ชื่อ-นามสกุล" value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} style={inp}/>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role:e.target.value }))} style={{ ...inp, cursor:'pointer' }}>
            {Object.values(HP_ROLES).map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <input type="password" placeholder="รหัสผ่าน (6 ตัวขึ้นไป)" value={form.pass} onChange={e => setForm(f => ({ ...f, pass:e.target.value }))} style={inp}/>
          <button onClick={addUser} style={{ background:'#0d6b5c', border:'none', borderRadius:'6px', padding:'11px 22px', color:'#fff', fontWeight:'700', fontSize:'14px', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif', whiteSpace:'nowrap' }}>+ เพิ่ม</button>
        </div>
        <div style={{ fontSize:'12.5px', color:'#888', marginTop:'14px', lineHeight:'1.9' }}>
          {Object.values(HP_ROLES).map(r => (
            <div key={r.key}><HPRoleBadge role={r.key} small/> <span style={{ marginLeft:'6px' }}>{r.desc}</span></div>
          ))}
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:'6px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        <div style={{ padding:'18px 24px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'14px', flexWrap:'wrap' }}>
          <div style={{ fontSize:'17px', fontWeight:'700', color:'#222' }}>
            ผู้ใช้ทั้งหมด ({users.length})
            {shown.length !== users.length && <span style={{ fontSize:'13px', fontWeight:'500', color:'#888', marginLeft:'8px' }}>· แสดง {shown.length} รายการ</span>}
          </div>
          <div style={{ display:'flex', gap:'9px', alignItems:'center', flexWrap:'wrap' }}>
            <input value={uq} onChange={e => setUq(e.target.value)} placeholder="ค้นหาชื่อผู้ใช้ / ชื่อ-นามสกุล"
              style={{ ...inp, padding:'9px 12px', fontSize:'13.5px', width:'240px' }}/>
            {[['all','ทั้งหมด',users.length], ...Object.values(HP_ROLES).map(r => [r.key, r.label, roleCount[r.key] || 0])].map(([k, l, n]) => (
              <button key={k} onClick={() => setRoleFilter(k)}
                style={{ background: roleFilter === k ? '#0d6b5c' : '#fff', color: roleFilter === k ? '#fff' : '#666',
                         border: '1px solid ' + (roleFilter === k ? '#0d6b5c' : '#ddd'), borderRadius:'999px', padding:'7px 14px',
                         fontSize:'12.5px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                {l} ({n})
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'760px' }}>
            <thead><tr><th style={th}>ชื่อผู้ใช้</th><th style={th}>ชื่อ-นามสกุล</th><th style={th}>บทบาท</th><th style={th}>สถานะ</th><th style={th}>จัดการ</th></tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan="5" style={{ ...td, textAlign:'center', color:'#bbb', padding:'34px 0' }}>ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข</td></tr>}
              {shown.map(u => (
                <tr key={u.id} style={{ background: u.id === me.id ? '#f7fbfa' : '#fff' }}>
                  <td style={{ ...td, fontWeight:'700' }}>{u.username}{u.id === me.id && <span style={{ color:'#0d6b5c', fontSize:'11.5px', marginLeft:'7px' }}>(คุณ)</span>}</td>
                  <td style={td}>{u.name}</td>
                  <td style={td}>
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} disabled={u.id === me.id}
                      style={{ ...inp, padding:'7px 10px', fontSize:'13px', cursor: u.id === me.id ? 'not-allowed' : 'pointer', opacity: u.id === me.id ? 0.55 : 1 }}>
                      {Object.values(HP_ROLES).map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize:'12.5px', fontWeight:'700', color: u.active === false ? '#b3261e' : '#0d6b5c' }}>
                      {u.active === false ? '● ระงับ' : '● ใช้งาน'}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
                      <button onClick={() => { setEditFor(u); setEditDraft({ username:u.username, name:u.name }); }} style={{ background:'#fff', border:'1px solid #cfe3df', borderRadius:'5px', padding:'6px 11px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', color:'#0d6b5c', fontWeight:'600' }}>แก้ไขข้อมูล</button>
                      <button onClick={() => { setPwFor(u); setNewPw(''); }} style={{ background:'#fff', border:'1px solid #ddd', borderRadius:'5px', padding:'6px 11px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', color:'#555' }}>ตั้งรหัสใหม่</button>
                      <button onClick={() => toggleActive(u.id)} disabled={u.id === me.id} style={{ background:'#fff', border:'1px solid #ddd', borderRadius:'5px', padding:'6px 11px', fontSize:'12.5px', cursor: u.id === me.id ? 'not-allowed' : 'pointer', fontFamily:'inherit', color:'#555', opacity: u.id === me.id ? 0.45 : 1 }}>{u.active === false ? 'เปิดใช้' : 'ระงับ'}</button>
                      <button onClick={() => removeUser(u.id)} disabled={u.id === me.id} style={{ background:'#fff', border:'1px solid #f0c4ba', borderRadius:'5px', padding:'6px 11px', fontSize:'12.5px', cursor: u.id === me.id ? 'not-allowed' : 'pointer', fontFamily:'inherit', color:'#ee4d2d', opacity: u.id === me.id ? 0.45 : 1 }}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editFor && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={() => setEditFor(null)}>
          <div style={{ background:'#fff', borderRadius:'12px', padding:'28px', width:'100%', maxWidth:'400px' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:'17px', fontWeight:'700', marginBottom:'6px' }}>แก้ไขข้อมูลผู้ใช้</div>
            <div style={{ fontSize:'13px', color:'#888', marginBottom:'16px' }}>
              <HPRoleBadge role={editFor.role} small/>{editFor.id === me.id && <span style={{ marginLeft:'7px', color:'#0d6b5c' }}>บัญชีของคุณ</span>}
            </div>
            <label style={{ display:'block', fontSize:'12.5px', color:'#777', marginBottom:'5px' }}>ชื่อผู้ใช้ (ใช้ตอนเข้าสู่ระบบ)</label>
            <input value={editDraft.username} autoFocus onChange={e => setEditDraft(d => ({ ...d, username:e.target.value }))}
              placeholder="เช่น pop" style={{ ...inp, width:'100%', marginBottom:'12px' }}/>
            <label style={{ display:'block', fontSize:'12.5px', color:'#777', marginBottom:'5px' }}>ชื่อ-นามสกุล (แสดงบนแถบและใบเสนอราคา)</label>
            <input value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name:e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); }}
              placeholder="เช่น สมชาย ใจดี" style={{ ...inp, width:'100%', marginBottom:'16px' }}/>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => setEditFor(null)} style={{ flex:1, background:'#fff', border:'1px solid #ddd', borderRadius:'6px', padding:'11px 0', cursor:'pointer', fontFamily:'inherit', fontSize:'14px', color:'#666' }}>ยกเลิก</button>
              <button onClick={saveEdit} style={{ flex:1, background:'#0d6b5c', border:'none', borderRadius:'6px', padding:'11px 0', cursor:'pointer', fontFamily:'inherit', fontSize:'14px', fontWeight:'700', color:'#fff' }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {pwFor && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={() => setPwFor(null)}>
          <div style={{ background:'#fff', borderRadius:'12px', padding:'28px', width:'100%', maxWidth:'380px' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:'17px', fontWeight:'700', marginBottom:'6px' }}>ตั้งรหัสผ่านใหม่</div>
            <div style={{ fontSize:'13px', color:'#888', marginBottom:'16px' }}>{pwFor.name} ({pwFor.username})</div>
            <input type="password" value={newPw} autoFocus onChange={e => setNewPw(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') resetPw(); }}
              placeholder="รหัสผ่านใหม่ (6 ตัวขึ้นไป)" style={{ ...inp, width:'100%', marginBottom:'14px' }}/>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => setPwFor(null)} style={{ flex:1, background:'#fff', border:'1px solid #ddd', borderRadius:'6px', padding:'11px 0', cursor:'pointer', fontFamily:'inherit', fontSize:'14px', color:'#666' }}>ยกเลิก</button>
              <button onClick={resetPw} style={{ flex:1, background:'#0d6b5c', border:'none', borderRadius:'6px', padding:'11px 0', cursor:'pointer', fontFamily:'inherit', fontSize:'14px', fontWeight:'700', color:'#fff' }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- ระบบเซลล์: ใบเสนอราคา / บันทึกการขาย ----------
function HPSalesModule({ me }) {
  const [quotes, setQuotes] = useState([]);
  useEffect(() => { hpApi('/quotes').then(r => setQuotes(r.quotes || [])).catch(() => {}); }, []);
  const [tab, setTab]       = useState('new');   // new | history
  const [q, setQ]           = useState('');
  const [items, setItems]   = useState([]);
  const [cust, setCust]     = useState({ name:'', phone:'', note:'' });
  const [msg, setMsg]       = useState('');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2600); };
  const results = q.trim().length < 2 ? [] : HP_ALL_BRAND_PRODUCTS.filter(p =>
    (p.code || '').toLowerCase().includes(q.trim().toLowerCase()) ||
    (p.name || '').toLowerCase().includes(q.trim().toLowerCase())).slice(0, 12);

  const addItem = (p) => {
    if (items.some(i => i.code === p.code && i.brand === p.brand)) { flash('⚠ สินค้านี้อยู่ในรายการแล้ว'); return; }
    setItems(list => [...list, { code:p.code, brand:p.brand, name:p.name, cat:p.cat, img:p.img, qty:1, price:'' }]);
    setQ('');
  };
  const setItem = (i, patch) => setItems(list => list.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const delItem = (i) => setItems(list => list.filter((_, idx) => idx !== i));
  const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0) * (parseInt(i.qty) || 0), 0);

  const saveQuote = async () => {
    if (!cust.name.trim()) { flash('⚠ กรุณากรอกชื่อลูกค้า'); return; }
    if (!items.length) { flash('⚠ ยังไม่มีสินค้าในใบเสนอราคา'); return; }
    try {
      // เลขที่ใบและชื่อผู้ออกใบ กำหนดโดยเซิร์ฟเวอร์ ปลอมจากเบราว์เซอร์ไม่ได้
      const r = await hpApi('/quotes', { method:'POST', body:{ action:'create', quote:{ cust:{ ...cust }, items:items.slice(), total } } });
      setQuotes(r.quotes || []);
      setItems([]); setCust({ name:'', phone:'', note:'' });
      flash('✓ บันทึกใบเสนอราคา ' + r.created + ' แล้ว');
    } catch (e) { flash('⚠ ' + e.message); }
  };
  const delQuote = async (no) => {
    if (!window.confirm('ลบใบเสนอราคา ' + no + ' ใช่หรือไม่?')) return;
    try { const r = await hpApi('/quotes', { method:'POST', body:{ action:'delete', no } }); setQuotes(r.quotes || []); }
    catch (e) { flash('⚠ ' + e.message); }
  };
  const money = (n) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const inp = { border:'1px solid #ddd', borderRadius:'6px', padding:'10px 12px', fontSize:'14px', fontFamily:'Inter, Noto Sans Thai, sans-serif', outline:'none', boxSizing:'border-box' };
  const th  = { textAlign:'left', padding:'11px 12px', fontSize:'12.5px', fontWeight:'700', color:'#777', borderBottom:'1px solid #f0f0f0' };
  const td  = { padding:'11px 12px', fontSize:'13.5px', color:'#333', borderBottom:'1px solid #f6f6f6', verticalAlign:'middle' };

  return (
    <div>
      {msg && <div style={{ background:'#fff8e6', border:'1px solid #ffe0a3', color:'#8a6100', padding:'11px 16px', borderRadius:'6px', marginBottom:'14px', fontSize:'13.5px' }}>{msg}</div>}

      <div style={{ display:'flex', gap:'26px', borderBottom:'1px solid #eee', marginBottom:'18px' }}>
        {[['new','สร้างใบเสนอราคา'],['history','ประวัติ (' + quotes.length + ')']].map(([k, l]) => (
          <div key={k} onClick={() => setTab(k)}
            style={{ padding:'0 2px 12px', cursor:'pointer', fontSize:'14.5px', fontWeight: tab === k ? '700' : '500',
                     color: tab === k ? '#0d6b5c' : '#888', borderBottom: tab === k ? '2px solid #0d6b5c' : '2px solid transparent', marginBottom:'-1px' }}>{l}</div>
        ))}
      </div>

      {tab === 'new' ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'16px', alignItems:'start' }}>
          <div style={{ background:'#fff', borderRadius:'6px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', padding:'20px 22px' }}>
            <div style={{ fontSize:'16px', fontWeight:'700', marginBottom:'12px' }}>ค้นหาสินค้าเพื่อเพิ่มลงใบเสนอราคา</div>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="พิมพ์รหัสสินค้าหรือชื่อสินค้า (อย่างน้อย 2 ตัวอักษร)" style={{ ...inp, width:'100%' }}/>
            {results.length > 0 && (
              <div style={{ border:'1px solid #eee', borderRadius:'6px', marginTop:'8px', maxHeight:'240px', overflowY:'auto' }}>
                {results.map((p, i) => (
                  <div key={i} onClick={() => addItem(p)}
                    style={{ display:'flex', alignItems:'center', gap:'11px', padding:'9px 12px', cursor:'pointer', borderBottom:'1px solid #f6f6f6' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f7fbfa'} onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                    <img loading="lazy" decoding="async" src={p.img} style={{ width:'34px', height:'34px', objectFit:'contain', flexShrink:0 }} onError={e => e.target.style.visibility='hidden'}/>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'13.5px', fontWeight:'700', color:'#0d6b5c' }}>{p.code}</div>
                      <div style={{ fontSize:'12px', color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.brand} · {p.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop:'18px', overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'560px' }}>
                <thead><tr><th style={th}>สินค้า</th><th style={{ ...th, width:'90px' }}>จำนวน</th><th style={{ ...th, width:'130px' }}>ราคา/หน่วย</th><th style={{ ...th, width:'120px' }}>รวม</th><th style={{ ...th, width:'50px' }}></th></tr></thead>
                <tbody>
                  {items.length === 0 && <tr><td colSpan="5" style={{ ...td, textAlign:'center', color:'#bbb', padding:'30px 0' }}>ยังไม่มีสินค้าในใบเสนอราคา</td></tr>}
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td style={td}>
                        <div style={{ fontWeight:'700', color:'#0d6b5c', fontSize:'13px' }}>{it.code}</div>
                        <div style={{ fontSize:'12px', color:'#888' }}>{it.brand} · {it.name}</div>
                      </td>
                      <td style={td}><input type="number" min="1" value={it.qty} onChange={e => setItem(i, { qty:e.target.value })} style={{ ...inp, width:'100%', padding:'7px 9px' }}/></td>
                      <td style={td}><input type="number" min="0" step="0.01" value={it.price} placeholder="0.00" onChange={e => setItem(i, { price:e.target.value })} style={{ ...inp, width:'100%', padding:'7px 9px' }}/></td>
                      <td style={{ ...td, fontWeight:'700' }}>{money((parseFloat(it.price)||0) * (parseInt(it.qty)||0))}</td>
                      <td style={td}><button onClick={() => delItem(i)} style={{ background:'none', border:'none', color:'#ee4d2d', cursor:'pointer', fontSize:'16px' }}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:'6px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', padding:'20px 22px' }}>
            <div style={{ fontSize:'16px', fontWeight:'700', marginBottom:'12px' }}>ข้อมูลลูกค้า</div>
            <input value={cust.name} onChange={e => setCust(c => ({ ...c, name:e.target.value }))} placeholder="ชื่อลูกค้า / บริษัท *" style={{ ...inp, width:'100%', marginBottom:'9px' }}/>
            <input value={cust.phone} onChange={e => setCust(c => ({ ...c, phone:e.target.value }))} placeholder="เบอร์ติดต่อ" style={{ ...inp, width:'100%', marginBottom:'9px' }}/>
            <textarea value={cust.note} onChange={e => setCust(c => ({ ...c, note:e.target.value }))} placeholder="หมายเหตุ" rows="3" style={{ ...inp, width:'100%', marginBottom:'14px', resize:'vertical' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderTop:'1px solid #eee', marginBottom:'12px' }}>
              <span style={{ fontSize:'14px', color:'#666' }}>ยอดรวม</span>
              <span style={{ fontSize:'21px', fontWeight:'800', color:'#ee4d2d' }}>฿{money(total)}</span>
            </div>
            <button onClick={saveQuote} style={{ width:'100%', background:'#0d6b5c', border:'none', borderRadius:'6px', padding:'13px 0', color:'#fff', fontWeight:'700', fontSize:'15px', cursor:'pointer', fontFamily:'inherit', marginBottom:'8px' }}>บันทึกใบเสนอราคา</button>
            <button onClick={() => window.print()} style={{ width:'100%', background:'#fff', border:'1px solid #ddd', borderRadius:'6px', padding:'12px 0', color:'#555', fontWeight:'600', fontSize:'14px', cursor:'pointer', fontFamily:'inherit' }}>พิมพ์ / บันทึกเป็น PDF</button>
            <div style={{ fontSize:'11.5px', color:'#aaa', marginTop:'12px', lineHeight:'1.6' }}>ผู้ออก: {me.name} ({me.username})</div>
          </div>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:'6px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'720px' }}>
              <thead><tr><th style={th}>เลขที่</th><th style={th}>วันที่</th><th style={th}>ลูกค้า</th><th style={th}>รายการ</th><th style={th}>ยอดรวม</th><th style={th}>ผู้ออก</th><th style={th}></th></tr></thead>
              <tbody>
                {quotes.length === 0 && <tr><td colSpan="7" style={{ ...td, textAlign:'center', color:'#bbb', padding:'36px 0' }}>ยังไม่มีใบเสนอราคา</td></tr>}
                {quotes.map(qt => (
                  <tr key={qt.no}>
                    <td style={{ ...td, fontWeight:'700', color:'#0d6b5c' }}>{qt.no}</td>
                    <td style={td}>{new Date(qt.at).toLocaleDateString('th-TH')}</td>
                    <td style={td}>{qt.cust.name}{qt.cust.phone ? <div style={{ fontSize:'12px', color:'#999' }}>{qt.cust.phone}</div> : null}</td>
                    <td style={td}>{qt.items.length} รายการ</td>
                    <td style={{ ...td, fontWeight:'700' }}>฿{money(qt.total)}</td>
                    <td style={{ ...td, fontSize:'12.5px', color:'#888' }}>{qt.by}</td>
                    <td style={td}><button onClick={() => delQuote(qt.no)} style={{ background:'none', border:'none', color:'#ee4d2d', cursor:'pointer', fontSize:'13px' }}>ลบ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function HPAdminPage({ onNavigate }) {
  const [user,    setUser]    = useState(null);
  const [tab,     setTab]     = useState('products');
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);

  // ถามเซิร์ฟเวอร์ว่าเซสชันปัจจุบันเป็นใคร (cookie เป็น HttpOnly — JS อ่านเองไม่ได้)
  useEffect(() => {
    hpApi('/auth/me')
      .then(r => { const u = { ...r.user, can:r.can }; setUser(u); setTab(hpCan(u,'products') ? 'products' : 'sales'); })
      .catch(e => { if (e.status !== 401) setApiDown(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section style={{ background:'#f6f6f6', minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#8b9c95', fontSize:'15px' }}>
      กำลังตรวจสอบสิทธิ์…
    </section>
  );
  if (apiDown) return (
    <section style={{ background:'#f6f6f6', minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'34px 32px', maxWidth:'460px', textAlign:'center', boxShadow:'0 10px 36px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:'34px', marginBottom:'12px' }}>🔌</div>
        <div style={{ fontSize:'18px', fontWeight:'800', color:'#b3261e', marginBottom:'10px' }}>เชื่อมต่อระบบหลังบ้านไม่ได้</div>
        <div style={{ fontSize:'13.5px', color:'#7d918a', lineHeight:'1.9' }}>
          ระบบหลังบ้านต้องรันบน Netlify (มี Functions) จึงจะใช้งานได้<br/>
          ถ้ากำลังเปิดจาก <b>serve.ps1</b> บนเครื่อง จะเข้าส่วนนี้ไม่ได้เพราะไม่มีเซิร์ฟเวอร์ตรวจสิทธิ์
        </div>
      </div>
    </section>
  );
  if (!user) return <HPAdminLogin onSuccess={(s) => { setUser(s); setTab(hpCan(s,'products') ? 'products' : 'sales'); }}/>;

  const logout = () => { hpApi('/auth/logout', { method:'POST' }).catch(() => {}).then(() => setUser(null)); };
  const role = HP_ROLES[user.role] || HP_ROLES.sales;
  const tabs = [
    hpCan(user, 'products') && ['products', 'จัดการสินค้า'],
    hpCan(user, 'sales')    && ['sales',    'ระบบเซลล์'],
    hpCan(user, 'users')    && ['users',    'จัดการผู้ใช้'],
  ].filter(Boolean);

  return (
    <section style={{ background:'#f6f6f6', minHeight:'80vh' }}>
      {/* แถบผู้ใช้ */}
      <div style={{ background:'#fff', borderBottom:'1px solid #eee' }}>
        <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'14px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:role.bg, color:role.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', fontSize:'15px' }}>
              {(user.name || user.username).slice(0, 1)}
            </div>
            <div>
              <div style={{ fontSize:'14.5px', fontWeight:'700', color:'#222' }}>{user.name} <HPRoleBadge role={user.role} small/></div>
              <div style={{ fontSize:'12px', color:'#999' }}>{role.desc}</div>
            </div>
          </div>
          <button onClick={logout} style={{ background:'#fff', border:'1px solid #f0c4ba', borderRadius:'5px', padding:'9px 16px', fontSize:'13.5px', fontWeight:'600', color:'#ee4d2d', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>ออกจากระบบ</button>
        </div>
        <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 24px', display:'flex', gap:'26px' }}>
          {tabs.map(([k, l]) => (
            <div key={k} onClick={() => setTab(k)}
              style={{ padding:'0 2px 13px', cursor:'pointer', fontSize:'14.5px', fontWeight: tab === k ? '700' : '500',
                       color: tab === k ? '#0d6b5c' : '#888', borderBottom: tab === k ? '2px solid #0d6b5c' : '2px solid transparent', marginBottom:'-1px' }}>{l}</div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'22px 24px 60px' }}>
        {tab === 'products' && hpCan(user, 'products') && <HPAdminPanel user={user} onNavigate={onNavigate} onLogout={logout} embedded/>}
        {tab === 'sales'    && hpCan(user, 'sales')    && <HPSalesModule me={user}/>}
        {tab === 'users'    && hpCan(user, 'users')    && <HPUsersManager me={user}/>}
      </div>
    </section>
  );
}

function HPAdminPanel({ onLogout, onNavigate, user, embedded }) {
  const canDelete = hpCan(user, 'deleteProduct');
  const canReset  = hpCan(user, 'resetAll');
  const emptyForm = {
    id:null, name:'', brand:'', cat:'wire',
    price:'', oldPrice:'', stock:'', sold:0, installment:false,
    images:[],            // อาเรย์ของรูป (รูปแรก = รูปปก)
    gtin:'',              // รหัสสินค้าสากล (GTIN/บาร์โค้ด)
    allowMarketing:true,  // อนุญาตให้นำรูป/เนื้อหาไปใช้โปรโมท
    description:'',
    attrs:{ type:'', size:'', tis:'', warranty:'', origin:'', packaging:'' },
    variations:[],        // [{ name, price, stock, sku }]
  };
  const [products, setProducts] = useState(() => HP_PRODUCTS.slice());
  const [view,     setView]     = useState('list');   // 'list' | 'form'
  const [form,     setForm]     = useState(emptyForm);
  const [search,   setSearch]   = useState('');
  const [draftSearch, setDraftSearch] = useState('');  // ช่องค้นหา (กดยืนยันถึงจะค้น)
  const [statusTab, setStatusTab]     = useState('all'); // all | selling | unlisted
  const [page,     setPage]     = useState(1);
  const [catFilter, setCatFilter]     = useState('all');
  const [toast,    setToast]    = useState('');

  const catLabel = (id) => { const c = HP_CATEGORIES.find(c => c.id === id); return c ? c.label : id; };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200); };
  const persist = (list) => { hpSaveProducts(list); setProducts(list.slice()); };

  const MAX_IMAGES = 9;
  // ย่อรูปก่อนเก็บ เพื่อไม่ให้ localStorage เต็ม
  const resizeToDataURL = (file, cb) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgEl = new Image();
      imgEl.onload = () => {
        const max = 600, scale = Math.min(1, max / Math.max(imgEl.width, imgEl.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(imgEl.width * scale); cv.height = Math.round(imgEl.height * scale);
        cv.getContext('2d').drawImage(imgEl, 0, 0, cv.width, cv.height);
        cb(cv.toDataURL('image/jpeg', 0.82));
      };
      imgEl.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  const onPickImages = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => resizeToDataURL(file, (url) => setForm(f => f.images.length >= MAX_IMAGES ? f : ({ ...f, images:[...f.images, url] }))));
    e.target.value = '';
  };
  const delImage    = (i) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  const makeCover   = (i) => setForm(f => { const a = f.images.slice(); const [m] = a.splice(i, 1); return { ...f, images:[m, ...a] }; });
  const setAttr     = (k, v) => setForm(f => ({ ...f, attrs:{ ...f.attrs, [k]:v } }));
  // ตัวเลือกสินค้า (variations)
  const addVariation = () => setForm(f => ({ ...f, variations:[...f.variations, { name:'', price:'', stock:'', sku:'' }] }));
  const updVariation = (i, k, v) => setForm(f => ({ ...f, variations: f.variations.map((x, idx) => idx === i ? { ...x, [k]:v } : x) }));
  const delVariation = (i) => setForm(f => ({ ...f, variations: f.variations.filter((_, idx) => idx !== i) }));

  const openAdd  = ()  => { setForm(emptyForm); setView('form'); window.scrollTo(0,0); };
  const openEdit = (p) => {
    setForm({
      ...emptyForm, ...p,
      price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : '', stock: String(p.stock),
      images: (p.images && p.images.length) ? p.images.slice() : (p.img ? [p.img] : []),
      gtin: p.gtin || '',
      allowMarketing: p.allowMarketing !== false,
      description: p.description || '',
      attrs: { ...emptyForm.attrs, ...(p.attrs || {}) },
      variations: (p.variations || []).map(v => ({ name:v.name||'', price:String(v.price||''), stock:String(v.stock||''), sku:v.sku||'' })),
    });
    setView('form'); window.scrollTo(0,0);
  };
  const onDelete = (p) => {
    if (!canDelete) { showToast('บทบาทของคุณไม่มีสิทธิ์ลบสินค้า'); return; }
    if (!window.confirm('ลบสินค้า "' + p.name + '" ใช่หรือไม่?')) return;
    persist(products.filter(x => x.id !== p.id));
    showToast('ลบสินค้าเรียบร้อยแล้ว');
  };
  const onSave = () => {
    if (!form.name.trim()) { alert('กรุณากรอกชื่อสินค้า'); return; }
    const hasVar = form.variations.length > 0;
    let price, stock;
    if (hasVar) {
      for (let i = 0; i < form.variations.length; i++) {
        const v = form.variations[i];
        if (!v.name.trim())                            { alert('กรุณากรอกชื่อตัวเลือกสินค้าที่ ' + (i+1)); return; }
        if (!v.price || isNaN(+v.price) || +v.price <= 0) { alert('กรุณากรอกราคาของตัวเลือก "' + (v.name||('ที่ '+(i+1))) + '" ให้ถูกต้อง'); return; }
      }
      price = Math.min(...form.variations.map(v => +v.price));
      stock = form.variations.reduce((s, v) => s + Math.max(0, Math.floor(+v.stock || 0)), 0);
    } else {
      if (!form.price || isNaN(+form.price) || +form.price <= 0) { alert('กรุณากรอกราคาให้ถูกต้อง'); return; }
      price = +form.price;
      stock = form.stock ? Math.max(0, Math.floor(+form.stock)) : 0;
    }
    const imgs = form.images.length ? form.images : (form.img ? [form.img] : []);
    const item = {
      id: form.id != null ? form.id : ('N' + Date.now()),
      fromBrand: !!form.fromBrand, edited: true, code: form.code || '',
      name: form.name.trim(), brand: form.brand.trim(), cat: form.cat,
      price, oldPrice: form.oldPrice && +form.oldPrice > price ? +form.oldPrice : null,
      stock, sold: form.sold || 0, installment: !!form.installment,
      img: imgs[0] || 'assets/cat-bulb.png',
      images: imgs,
      gtin: form.gtin.trim(),
      allowMarketing: !!form.allowMarketing,
      description: form.description.trim(),
      attrs: { ...form.attrs },
      variations: hasVar ? form.variations.map(v => ({ name:v.name.trim(), price:+v.price, stock:Math.max(0,Math.floor(+v.stock||0)), sku:(v.sku||'').trim() })) : [],
    };
    const exists = products.some(p => p.id === item.id);
    persist(exists ? products.map(p => p.id === item.id ? item : p) : [...products, item]);
    setView('list');
    // เด้งไปหน้าร้าน "สินค้าทั้งหมด" เพื่อดูสินค้าที่เพิ่ง บันทึก
    if (onNavigate) onNavigate('สินค้าทั้งหมด');
    else { window.scrollTo(0,0); showToast(exists ? 'อัปเดตสินค้าเรียบร้อยแล้ว' : 'เพิ่มสินค้าเรียบร้อยแล้ว'); }
  };
  const onResetAll = () => {
    if (!canReset) { showToast('บทบาทของคุณไม่มีสิทธิ์คืนค่าเริ่มต้น'); return; }
    if (!window.confirm('คืนค่าสินค้าทั้งหมดกลับเป็นค่าเริ่มต้น? ข้อมูลที่แก้ไขจะหายทั้งหมด')) return;
    localStorage.removeItem('kss_products');
    HP_PRODUCTS = HP_DEFAULT_PRODUCTS;
    setProducts(HP_DEFAULT_PRODUCTS.slice());
    showToast('คืนค่าเริ่มต้นเรียบร้อยแล้ว');
  };

  const sellingCount  = products.filter(p => p.stock > 0).length;
  const unlistedCount = products.filter(p => p.stock <= 0).length;
  const filtered = products.filter(p => {
    if (statusTab === 'selling'  && p.stock <= 0) return false;
    if (statusTab === 'unlisted' && p.stock >  0) return false;
    if (catFilter !== 'all' && p.cat !== catFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && !(p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q) || (p.gtin||'').toLowerCase().includes(q))) return false;
    return true;
  });
  useEffect(() => { setPage(1); }, [search, statusTab, catFilter]);
  const pgBtn = (dis) => ({ background:'#fff', border:'1px solid #ddd', borderRadius:'4px', padding:'7px 12px', fontSize:'13px',
                            color: dis ? '#ccc' : '#555', cursor: dis ? 'default' : 'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' });
  const PER_PAGE = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const curPage   = Math.min(page, pageCount);
  const pageItems = filtered.slice((curPage - 1) * PER_PAGE, curPage * PER_PAGE);
  const priceText = (p) => {
    if (p.variations && p.variations.length) {
      const ps = p.variations.map(v => v.price);
      const lo = Math.min(...ps), hi = Math.max(...ps);
      return lo === hi ? ('฿' + lo.toLocaleString()) : ('฿' + lo.toLocaleString() + ' - ฿' + hi.toLocaleString());
    }
    return '฿' + p.price.toLocaleString();
  };
  const applySearch = () => setSearch(draftSearch);
  const resetFilter = () => { setDraftSearch(''); setSearch(''); setCatFilter('all'); };

  const label    = { fontSize:'13.5px', fontWeight:'700', color:'#333', display:'flex', alignItems:'center', gap:'4px', justifyContent:'flex-end' };
  const reqStar  = <span style={{ color:'#ee4d2d' }}>*</span>;
  const inputSt  = { width:'100%', border:'1px solid #e0e0e0', borderRadius:'4px', padding:'10px 12px', fontSize:'14px', fontFamily:'Inter, Noto Sans Thai, sans-serif', outline:'none', boxSizing:'border-box', background:'#fff' };
  const row      = { display:'grid', gridTemplateColumns:'140px 1fr', gap:'18px', alignItems:'center', marginBottom:'18px' };

  return (
    <section style={{ background:'#f6f6f6', padding:'24px 0 60px', minHeight:'70vh' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 24px' }}>

        {toast && (
          <div style={{ position:'fixed', top:'90px', left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.78)', color:'#fff', padding:'12px 26px', borderRadius:'6px', fontSize:'14.5px', fontWeight:'600', zIndex:99 }}>
            ✓ {toast}
          </div>
        )}

        {view === 'list' && (
          <div>
            {/* แถบแจ้งเตือนด้านบน */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'#e9f3ff', border:'1px solid #cfe2fb', borderRadius:'6px', padding:'12px 16px', marginBottom:'14px', fontSize:'13.5px', color:'#2a5b9c' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#2a7de1" style={{ flexShrink:0 }}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              <span>สินค้าทั้งหมด <b>{products.length.toLocaleString('th-TH')}</b> รายการ (อิงจากสินค้าตามแบรนด์) · ระบุสต๊อกแล้ว <b>{sellingCount.toLocaleString('th-TH')}</b> รายการ · การแก้ไขจัดเก็บในเบราว์เซอร์เครื่องนี้</span>
            </div>

            <div style={{ background:'#fff', borderRadius:'6px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              {/* header bar */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', flexWrap:'wrap', gap:'12px' }}>
                <div style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'20px', fontWeight:'700', color:'#222' }}>สินค้าของฉัน</div>
                <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
                  {canReset && <button onClick={onResetAll} style={{ background:'#fff', border:'1px solid #e0e0e0', borderRadius:'4px', padding:'9px 16px', fontSize:'13.5px', fontWeight:'600', color:'#666', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>คืนค่าเริ่มต้น</button>}
                  {!embedded && <button onClick={onLogout} style={{ background:'#fff', border:'1px solid #f0c4ba', borderRadius:'4px', padding:'9px 16px', fontSize:'13.5px', fontWeight:'600', color:'#ee4d2d', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif', display:'flex', alignItems:'center', gap:'6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
                    ออกจากระบบ
                  </button>}
                  <button onClick={openAdd} style={{ background:'#ee4d2d', border:'none', borderRadius:'4px', padding:'9px 20px', fontSize:'14px', fontWeight:'700', color:'#fff', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif', display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'17px', lineHeight:1 }}>+</span> เพิ่มสินค้าใหม่
                  </button>
                </div>
              </div>

              {/* แท็บสถานะ */}
              <div style={{ display:'flex', gap:'28px', padding:'0 24px', borderBottom:'1px solid #f0f0f0' }}>
                {[['all','ทั้งหมด',products.length],['selling','มีสต๊อก',sellingCount],['unlisted','ยังไม่ระบุสต๊อก',unlistedCount]].map(([key,lbl,cnt]) => (
                  <div key={key} onClick={() => setStatusTab(key)} style={{ padding:'12px 2px', fontSize:'14px', fontWeight:'700', cursor:'pointer', color: statusTab===key ? '#ee4d2d' : '#666', borderBottom: statusTab===key ? '2px solid #ee4d2d' : '2px solid transparent' }}>
                    {lbl} {key!=='all' && <span style={{ color: statusTab===key ? '#ee4d2d' : '#aaa' }}>({cnt})</span>}
                  </div>
                ))}
              </div>

              {/* แถบกรอง */}
              <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap', padding:'16px 24px', background:'#fcfcfc', borderBottom:'1px solid #f0f0f0' }}>
                <input value={draftSearch} onChange={e => setDraftSearch(e.target.value)} onKeyDown={e => { if (e.key==='Enter') applySearch(); }} placeholder="ค้นหาด้วย ชื่อสินค้า, แบรนด์, รหัสสินค้า" style={{ ...inputSt, width:'300px' }}/>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inputSt, width:'200px', cursor:'pointer' }}>
                  <option value="all">หมวดหมู่ทั้งหมด</option>
                  {HP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <button onClick={applySearch} style={{ background:'#ee4d2d', border:'none', borderRadius:'4px', padding:'10px 24px', fontSize:'14px', fontWeight:'700', color:'#fff', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>ยืนยัน</button>
                <button onClick={resetFilter} style={{ background:'#fff', border:'1px solid #e0e0e0', borderRadius:'4px', padding:'10px 20px', fontSize:'14px', fontWeight:'600', color:'#666', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>รีเซ็ต</button>
              </div>

              {/* จำนวนรายการ */}
              <div style={{ padding:'14px 24px 0', fontSize:'14px', fontWeight:'700', color:'#333' }}>
                สินค้า {filtered.length.toLocaleString('th-TH')} รายการ
                {pageCount > 1 && <span style={{ fontWeight:'500', color:'#888', marginLeft:'8px' }}>· หน้า {curPage}/{pageCount}</span>}
              </div>

              {/* table */}
              <div style={{ overflowX:'auto', padding:'8px 0 4px' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
                  <thead>
                    <tr style={{ color:'#888', fontSize:'12.5px', borderBottom:'1px solid #f0f0f0' }}>
                      <th style={{ textAlign:'left',  padding:'12px 16px 12px 24px', fontWeight:'700' }}>สินค้า</th>
                      <th style={{ textAlign:'right', padding:'12px 16px', fontWeight:'700' }}>ราคา</th>
                      <th style={{ textAlign:'right', padding:'12px 16px', fontWeight:'700' }}>คลัง</th>
                      <th style={{ textAlign:'right', padding:'12px 16px', fontWeight:'700' }}>ประสิทธิภาพ</th>
                      <th style={{ textAlign:'center', padding:'12px 24px 12px 16px', fontWeight:'700' }}>การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map(p => {
                      const hasVar = p.variations && p.variations.length;
                      return (
                      <React.Fragment key={p.id}>
                        <tr style={{ borderTop:'8px solid #f6f6f6' }}>
                          <td style={{ padding:'14px 16px 14px 24px' }}>
                            <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                              <img loading="lazy" decoding="async" src={p.img} style={{ width:'54px', height:'54px', objectFit:'contain', borderRadius:'4px', border:'1px solid #f0f0f0', background:'#fff', flexShrink:0 }}/>
                              <div>
                                <div style={{ fontWeight:'600', color:'#222', lineHeight:'1.4', maxWidth:'340px' }}>{p.name}</div>
                                <div style={{ fontSize:'12px', color:'#aaa', marginTop:'4px' }}>
                                  {p.brand ? <span style={{ color:'#0d6b5c', fontWeight:'600' }}>{p.brand}</span> : 'Parent SKU: -'}
                                  {p.catRaw && <span> · {p.catRaw}</span>}
                                </div>
                                <div style={{ fontSize:'12px', color:'#aaa' }}>รหัสสินค้า: {p.code || p.gtin || p.id}</div>
                                {p.installment && <span style={{ display:'inline-block', fontSize:'11px', color:'#ee4d2d', marginTop:'4px', border:'1px solid #f5c6b8', borderRadius:'3px', padding:'1px 6px' }}>ผ่อน 0%</span>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:'14px 16px', textAlign:'right' }}>
                            <div style={{ fontWeight:'700', color:'#222' }}>{priceText(p)}</div>
                            {p.oldPrice && <div style={{ fontSize:'12px', color:'#bbb', textDecoration:'line-through' }}>฿{p.oldPrice.toLocaleString()}</div>}
                          </td>
                          <td style={{ padding:'14px 16px', textAlign:'right', color: p.stock < 20 ? '#ee4d2d' : '#333', fontWeight: p.stock < 20 ? '700' : '400' }}>{p.stock.toLocaleString()}</td>
                          <td style={{ padding:'14px 16px', textAlign:'right', color:'#555' }}>
                            <div style={{ fontSize:'12px', color:'#aaa' }}>ยอดขาย</div>
                            <div style={{ fontWeight:'600', color:'#333' }}>{p.sold.toLocaleString()}</div>
                          </td>
                          <td style={{ padding:'14px 24px 14px 16px', textAlign:'center', whiteSpace:'nowrap', verticalAlign:'top' }}>
                            <button onClick={() => openEdit(p)} style={{ display:'block', background:'none', border:'none', color:'#1976d2', fontSize:'13.5px', fontWeight:'600', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif', padding:'2px 8px', margin:'0 auto' }}>แก้ไข</button>
                            <button onClick={() => onDelete(p)} style={{ display:'block', background:'none', border:'none', color:'#ee4d2d', fontSize:'13.5px', fontWeight:'600', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif', padding:'2px 8px', margin:'0 auto' }}>ลบ</button>
                          </td>
                        </tr>
                        {hasVar && p.variations.map((v, vi) => (
                          <tr key={vi} style={{ background:'#fbfbfb', borderTop:'1px solid #f3f3f3' }}>
                            <td style={{ padding:'10px 16px 10px 24px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'12px', paddingLeft:'30px' }}>
                                <img loading="lazy" decoding="async" src={p.img} style={{ width:'40px', height:'40px', objectFit:'contain', borderRadius:'4px', border:'1px solid #f0f0f0', background:'#fff', flexShrink:0 }}/>
                                <div>
                                  <div style={{ fontWeight:'600', color:'#444', fontSize:'13.5px' }}>{v.name}</div>
                                  <div style={{ fontSize:'11.5px', color:'#aaa', marginTop:'2px' }}>เลข SKU: {v.sku || '-'}</div>
                                  <div style={{ fontSize:'11.5px', color:'#aaa' }}>Model ID: {p.id}{String(vi+1).padStart(3,'0')}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:'10px 16px', textAlign:'right', fontWeight:'600', color:'#333' }}>฿{v.price.toLocaleString()}</td>
                            <td style={{ padding:'10px 16px', textAlign:'right', color: v.stock < 20 ? '#ee4d2d' : '#555' }}>{v.stock.toLocaleString()}</td>
                            <td style={{ padding:'10px 16px', textAlign:'right', color:'#bbb', fontSize:'13px' }}>—</td>
                            <td style={{ padding:'10px 24px 10px 16px' }}></td>
                          </tr>
                        ))}
                      </React.Fragment>
                      );
                    })}
                    {!filtered.length && (
                      <tr><td colSpan="5" style={{ padding:'48px', textAlign:'center', color:'#aaa' }}>ไม่พบสินค้า</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pageCount > 1 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'18px 24px 24px', flexWrap:'wrap' }}>
                  <button onClick={() => setPage(1)} disabled={curPage === 1} style={pgBtn(curPage === 1)}>« แรก</button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={curPage === 1} style={pgBtn(curPage === 1)}>ก่อนหน้า</button>
                  {Array.from({ length: pageCount }).map((_, i) => i + 1)
                    .filter(n => n === 1 || n === pageCount || Math.abs(n - curPage) <= 2)
                    .map((n, idx, arr) => (
                      <React.Fragment key={n}>
                        {idx > 0 && n - arr[idx-1] > 1 && <span style={{ color:'#bbb', padding:'0 2px' }}>…</span>}
                        <button onClick={() => setPage(n)}
                          style={{ ...pgBtn(false), background: n === curPage ? '#ee4d2d' : '#fff', color: n === curPage ? '#fff' : '#555',
                                   border: '1px solid ' + (n === curPage ? '#ee4d2d' : '#ddd'), fontWeight: n === curPage ? '700' : '500', minWidth:'38px' }}>{n}</button>
                      </React.Fragment>
                    ))}
                  <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={curPage === pageCount} style={pgBtn(curPage === pageCount)}>ถัดไป</button>
                  <button onClick={() => setPage(pageCount)} disabled={curPage === pageCount} style={pgBtn(curPage === pageCount)}>ท้ายสุด »</button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'form' && (() => {
          const hasVar   = form.variations.length > 0;
          const card     = { background:'#fff', borderRadius:'6px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:'16px' };
          const secHead  = { fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'17px', fontWeight:'700', color:'#222', padding:'18px 32px', borderBottom:'1px solid #f4f4f4' };
          const body     = { padding:'24px 32px 10px' };
          const attrLbl  = { fontSize:'13px', color:'#555', marginBottom:'6px', fontWeight:'600' };
          const priceBox = (val, on, ph) => (
            <div style={{ display:'flex', border:'1px solid #e0e0e0', borderRadius:'4px', overflow:'hidden', background:'#fff' }}>
              <span style={{ padding:'10px 12px', background:'#fafafa', borderRight:'1px solid #e0e0e0', fontSize:'14px', color:'#777' }}>฿</span>
              <input type="number" min="0" value={val} onChange={on} placeholder={ph} style={{ ...inputSt, border:'none', borderRadius:0 }}/>
            </div>
          );
          const goTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }); };
          return (
          <div>
            {/* page title + section tabs */}
            <div style={{ ...card, position:'sticky', top:0, zIndex:5 }}>
              <div style={{ padding:'16px 32px 0' }}>
                <div style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'19px', fontWeight:'700', color:'#222' }}>
                  {form.id != null ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                </div>
                <div style={{ fontSize:'13px', color:'#999', marginTop:'5px', lineHeight:'1.5' }}>
                  การอัปโหลดรูปภาพ ชื่อ หรือรหัสสินค้า จะช่วยให้ระบบจับคู่สินค้าของคุณกับฐานข้อมูลมาตรฐาน เพื่อทำการแนะนำหรือกรอกข้อมูลสินค้าล่วงหน้า
                </div>
              </div>
              <div style={{ display:'flex', gap:'28px', padding:'10px 32px 0' }}>
                {[['ข้อมูลทั่วไป','sec-general'],['คุณลักษณะของสินค้า','sec-attrs'],['รายละเอียด','sec-detail'],['ข้อมูลการขาย','sec-sales']].map(([t,id], i) => (
                  <div key={id} onClick={() => goTo(id)} style={{ padding:'12px 2px', fontSize:'14px', fontWeight:'700', color: i===0 ? '#ee4d2d' : '#777', borderBottom: i===0 ? '3px solid #ee4d2d' : '3px solid transparent', cursor:'pointer' }}>{t}</div>
                ))}
              </div>
            </div>

            {/* ── ข้อมูลทั่วไป ── */}
            <div id="sec-general" style={card}>
              <div style={secHead}>ข้อมูลทั่วไป</div>
              <div style={body}>
                {/* รูปสินค้า — หลายรูป */}
                <div style={{ ...row, alignItems:'flex-start' }}>
                  <div style={{ ...label, marginTop:'6px' }}>{reqStar} ภาพสินค้า</div>
                  <div>
                    <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-start' }}>
                      {form.images.map((src, i) => (
                        <div key={i} style={{ position:'relative' }}>
                          <img loading="lazy" decoding="async" src={src} style={{ width:'90px', height:'90px', objectFit:'contain', border: i===0 ? '2px solid #ee4d2d' : '1px solid #e8e8e8', borderRadius:'4px', background:'#fff' }}/>
                          {i===0 && <span style={{ position:'absolute', bottom:0, left:0, right:0, background:'#ee4d2d', color:'#fff', fontSize:'10px', textAlign:'center', padding:'2px 0', borderRadius:'0 0 3px 3px' }}>ปก</span>}
                          {i!==0 && <button onClick={() => makeCover(i)} title="ตั้งเป็นรูปปก" style={{ position:'absolute', bottom:'2px', left:'2px', background:'rgba(0,0,0,0.55)', color:'#fff', border:'none', borderRadius:'3px', fontSize:'10px', padding:'2px 5px', cursor:'pointer' }}>ตั้งเป็นปก</button>}
                          <button onClick={() => delImage(i)} style={{ position:'absolute', top:'-8px', right:'-8px', width:'22px', height:'22px', borderRadius:'50%', background:'#000', opacity:0.6, color:'#fff', border:'none', cursor:'pointer', fontSize:'12px', lineHeight:1 }}>✕</button>
                        </div>
                      ))}
                      {form.images.length < MAX_IMAGES && (
                        <label style={{ width:'90px', height:'90px', border:'1px dashed #ee4d2d', borderRadius:'4px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'5px', cursor:'pointer', color:'#ee4d2d', background:'#fffaf9' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ee4d2d" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                          <span style={{ fontSize:'11px', fontWeight:'600' }}>เพิ่มรูป ({form.images.length}/{MAX_IMAGES})</span>
                          <input type="file" accept="image/*" multiple onChange={onPickImages} style={{ display:'none' }}/>
                        </label>
                      )}
                    </div>
                    <div style={{ fontSize:'12px', color:'#aaa', marginTop:'8px' }}>รูปแรกคือรูปปก · รองรับสูงสุด {MAX_IMAGES} รูป (อัตราส่วน 1:1)</div>
                  </div>
                </div>

                {/* อนุญาตใช้เนื้อหา — แถบสลับ */}
                <div style={{ ...row, alignItems:'flex-start' }}>
                  <div style={{ ...label, marginTop:'4px' }}></div>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', background:'#fafafa', border:'1px solid #f0f0f0', borderRadius:'6px', padding:'14px 16px' }}>
                    <div>
                      <div style={{ fontSize:'13.5px', fontWeight:'700', color:'#444', marginBottom:'3px' }}>อนุญาตให้นำเนื้อหาของคุณไปใช้</div>
                      <div style={{ fontSize:'12px', color:'#999', lineHeight:'1.5' }}>ยินยอมให้บริษัทนำรูปภาพ ชื่อ และรายละเอียดสินค้าไปใช้ในสื่อโปรโมท เพื่อช่วยให้สินค้าของคุณเข้าถึงลูกค้าได้มากขึ้น</div>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, allowMarketing: !f.allowMarketing }))}
                      style={{ flexShrink:0, width:'44px', height:'24px', borderRadius:'999px', border:'none', cursor:'pointer', position:'relative', background: form.allowMarketing ? '#ee4d2d' : '#ccc', transition:'background 0.15s' }}>
                      <span style={{ position:'absolute', top:'2px', left: form.allowMarketing ? '22px' : '2px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', transition:'left 0.15s' }}/>
                    </button>
                  </div>
                </div>

                {/* ชื่อสินค้า */}
                <div style={row}>
                  <div style={label}>{reqStar} ชื่อสินค้า</div>
                  <div style={{ position:'relative' }}>
                    <input value={form.name} maxLength={120} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} placeholder="ชื่อแบรนด์ + ประเภทสินค้า + คุณลักษณะหลัก (วัสดุ สี ไซส์ เป็นต้น)" style={{ ...inputSt, paddingRight:'70px' }}/>
                    <span style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'#bbb' }}>{form.name.length}/120</span>
                  </div>
                </div>

                {/* รหัสสินค้า GTIN */}
                <div style={row}>
                  <div style={label}>รหัสสินค้า</div>
                  <div style={{ display:'flex', border:'1px solid #e0e0e0', borderRadius:'4px', overflow:'hidden', background:'#fff' }}>
                    <span style={{ padding:'10px 14px', background:'#fafafa', borderRight:'1px solid #e0e0e0', fontSize:'13px', color:'#777', fontWeight:'600', display:'flex', alignItems:'center' }}>GTIN</span>
                    <input value={form.gtin} onChange={e => setForm(f => ({ ...f, gtin:e.target.value }))} placeholder="โปรดกรอกรหัสผลิตภัณฑ์ / บาร์โค้ดสากล เพื่อระบุสินค้ามาตรฐาน" style={{ ...inputSt, border:'none', borderRadius:0 }}/>
                  </div>
                </div>

                {/* หมวดหมู่ */}
                <div style={row}>
                  <div style={label}>{reqStar} หมวดหมู่</div>
                  <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat:e.target.value }))} style={{ ...inputSt, cursor:'pointer' }}>
                    {HP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ── คุณลักษณะของสินค้า ── */}
            <div id="sec-attrs" style={card}>
              <div style={secHead}>คุณลักษณะของสินค้า</div>
              <div style={{ padding:'24px 32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px 28px' }}>
                <div>
                  <div style={attrLbl}>แบรนด์</div>
                  <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand:e.target.value }))} placeholder="เช่น CHANG, Nano, MISAWA" style={inputSt}/>
                </div>
                <div>
                  <div style={attrLbl}>ประเภท / รุ่น</div>
                  <input value={form.attrs.type} onChange={e => setAttr('type', e.target.value)} placeholder="เช่น ปลั๊กกราวด์เดี่ยว 3 ขา" style={inputSt}/>
                </div>
                <div>
                  <div style={attrLbl}>ขนาด (กว้าง×ยาว×สูง)</div>
                  <input value={form.attrs.size} onChange={e => setAttr('size', e.target.value)} placeholder="เช่น 2.3 x 4.38 x 3.48 cm" style={inputSt}/>
                </div>
                <div>
                  <div style={attrLbl}>หมายเลข มอก. (TIS)</div>
                  <input value={form.attrs.tis} onChange={e => setAttr('tis', e.target.value)} placeholder="เช่น มอก. 166-2549" style={inputSt}/>
                </div>
                <div>
                  <div style={attrLbl}>ระยะเวลาการรับประกัน</div>
                  <input value={form.attrs.warranty} onChange={e => setAttr('warranty', e.target.value)} placeholder="เช่น 1 ปี" style={inputSt}/>
                </div>
                <div>
                  <div style={attrLbl}>ประเทศต้นกำเนิดสินค้า</div>
                  <input value={form.attrs.origin} onChange={e => setAttr('origin', e.target.value)} placeholder="เช่น ไทย" style={inputSt}/>
                </div>
                <div>
                  <div style={attrLbl}>ขนาดบรรจุ</div>
                  <input value={form.attrs.packaging} onChange={e => setAttr('packaging', e.target.value)} placeholder="เช่น 1 ชิ้น / กล่อง" style={inputSt}/>
                </div>
              </div>
            </div>

            {/* ── รายละเอียด ── */}
            <div id="sec-detail" style={card}>
              <div style={secHead}>รายละเอียดสินค้า</div>
              <div style={{ padding:'24px 32px' }}>
                <div style={{ position:'relative' }}>
                  <textarea value={form.description} maxLength={5000} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} rows={9}
                    placeholder={'อธิบายคุณสมบัติ จุดเด่น วิธีใช้งาน เงื่อนไขการรับประกัน ฯลฯ\n\nเช่น\n- ปลั๊กขนาด 1 ช่อง\n- ผ่านมาตรฐาน มอก. 166-2549\n- สามารถรับไฟได้ 16A 250V~ / 50Hz'}
                    style={{ ...inputSt, resize:'vertical', lineHeight:'1.6', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}/>
                  <span style={{ position:'absolute', right:'12px', bottom:'10px', fontSize:'12px', color:'#bbb' }}>{form.description.length}/5000</span>
                </div>
              </div>
            </div>

            {/* ── ข้อมูลการขาย ── */}
            <div id="sec-sales" style={card}>
              <div style={secHead}>ข้อมูลการขาย</div>
              <div style={body}>

                {!hasVar && (
                  <>
                    <div style={row}>
                      <div style={label}>{reqStar} ราคาขาย</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                        {priceBox(form.price, e => setForm(f => ({ ...f, price:e.target.value })), 'ราคาขายจริง')}
                        {priceBox(form.oldPrice, e => setForm(f => ({ ...f, oldPrice:e.target.value })), 'ราคาก่อนลด (ถ้ามี)')}
                      </div>
                    </div>
                    <div style={row}>
                      <div style={label}>{reqStar} คลังสินค้า</div>
                      <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock:e.target.value }))} placeholder="จำนวนสินค้าในคลัง" style={{ ...inputSt, width:'240px' }}/>
                    </div>
                  </>
                )}

                {/* ตัวเลือกสินค้า (variations) */}
                <div style={{ ...row, alignItems:'flex-start' }}>
                  <div style={{ ...label, marginTop:'10px' }}>ตัวเลือกสินค้า</div>
                  <div>
                    {!hasVar && (
                      <button onClick={addVariation} style={{ background:'#fff', border:'1px dashed #ee4d2d', color:'#ee4d2d', borderRadius:'4px', padding:'11px 18px', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif', display:'inline-flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ fontSize:'16px', lineHeight:1 }}>+</span> เปิดใช้ตัวเลือกสินค้า (เช่น สี / รุ่น)
                      </button>
                    )}
                    {hasVar && (
                      <div style={{ border:'1px solid #eee', borderRadius:'6px', overflow:'hidden' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 0.9fr 1fr 44px', gap:'10px', padding:'11px 14px', background:'#fafafa', fontSize:'12.5px', fontWeight:'700', color:'#888' }}>
                          <div>ชื่อตัวเลือก <span style={{ color:'#ee4d2d' }}>*</span></div>
                          <div>ราคา <span style={{ color:'#ee4d2d' }}>*</span></div>
                          <div>คลัง</div>
                          <div>เลข SKU</div>
                          <div></div>
                        </div>
                        {form.variations.map((v, i) => (
                          <div key={i} style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 0.9fr 1fr 44px', gap:'10px', padding:'12px 14px', borderTop:'1px solid #f3f3f3', alignItems:'center' }}>
                            <input value={v.name} onChange={e => updVariation(i, 'name', e.target.value)} placeholder="เช่น สีขาว" style={inputSt}/>
                            {priceBox(v.price, e => updVariation(i, 'price', e.target.value), 'ราคา')}
                            <input type="number" min="0" value={v.stock} onChange={e => updVariation(i, 'stock', e.target.value)} placeholder="คลัง" style={inputSt}/>
                            <input value={v.sku} onChange={e => updVariation(i, 'sku', e.target.value)} placeholder="SKU" style={inputSt}/>
                            <button onClick={() => delVariation(i)} title="ลบตัวเลือก" style={{ background:'none', border:'none', color:'#bbb', cursor:'pointer', fontSize:'18px', lineHeight:1 }}>✕</button>
                          </div>
                        ))}
                        <div style={{ padding:'12px 14px', borderTop:'1px solid #f3f3f3', display:'flex', gap:'14px', alignItems:'center' }}>
                          <button onClick={addVariation} style={{ background:'#fff', border:'1px dashed #ee4d2d', color:'#ee4d2d', borderRadius:'4px', padding:'9px 16px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>+ เพิ่มตัวเลือก</button>
                          <button onClick={() => setForm(f => ({ ...f, variations:[] }))} style={{ background:'none', border:'none', color:'#999', fontSize:'13px', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif', textDecoration:'underline' }}>ยกเลิกตัวเลือก (ใช้ราคาเดียว)</button>
                        </div>
                        <div style={{ padding:'0 14px 12px', fontSize:'12px', color:'#aaa' }}>ราคาที่แสดงหน้าเว็บจะใช้ราคาต่ำสุด · คลังรวม = ผลรวมของทุกตัวเลือก</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ราคาก่อนลด (กรณีมีตัวเลือก) */}
                {hasVar && (
                  <div style={row}>
                    <div style={label}>ราคาก่อนลด</div>
                    <div style={{ width:'240px' }}>{priceBox(form.oldPrice, e => setForm(f => ({ ...f, oldPrice:e.target.value })), 'ราคาก่อนลด (ถ้ามี)')}</div>
                  </div>
                )}

                {/* ผ่อน */}
                <div style={row}>
                  <div style={label}>ผ่อนชำระ</div>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:'9px', cursor:'pointer', fontSize:'14px', color:'#444', userSelect:'none' }}>
                    <input type="checkbox" checked={!!form.installment} onChange={e => setForm(f => ({ ...f, installment:e.target.checked }))} style={{ width:'17px', height:'17px', accentColor:'#ee4d2d', cursor:'pointer' }}/>
                    รองรับผ่อน 0% นาน 10 เดือน
                  </label>
                </div>
              </div>
            </div>

            {/* bottom action bar */}
            <div style={{ ...card, position:'sticky', bottom:0, display:'flex', justifyContent:'flex-end', gap:'12px', padding:'16px 32px', marginBottom:0 }}>
              <button onClick={() => { setView('list'); window.scrollTo(0,0); }} style={{ background:'#fff', border:'1px solid #ddd', borderRadius:'4px', padding:'10px 26px', fontSize:'14px', fontWeight:'600', color:'#555', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>ยกเลิก</button>
              <button onClick={onSave} style={{ background:'#ee4d2d', border:'none', borderRadius:'4px', padding:'10px 30px', fontSize:'14px', fontWeight:'700', color:'#fff', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>
                {form.id != null ? 'อัปเดต' : 'บันทึก'}
              </button>
            </div>
          </div>
          );
        })()}
      </div>
    </section>
  );
}

function HPApp() {
  const [page,           setPage]          = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart,           setCart]           = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [zoom, setZoom] = useState(() => {
    const saved = parseFloat(localStorage.getItem('kss_zoom'));
    return (!isNaN(saved) && saved >= 0.7 && saved <= 1.5) ? saved : 1;
  });
  useEffect(() => {
    document.documentElement.style.zoom = zoom;
    localStorage.setItem('kss_zoom', String(zoom));
  }, [zoom]);
  const zoomIn    = () => setZoom(z => Math.min(1.5, Math.round((z + 0.1) * 10) / 10));
  const zoomOut   = () => setZoom(z => Math.max(0.7, Math.round((z - 0.1) * 10) / 10));
  const zoomReset = () => setZoom(1);

  const onNavigate = (p) => {
    if (p === 'home' || p === 'หน้าแรก') { setPage('home'); window.scrollTo(0,0); return; }
    if (p === 'cart')           { setPage('cart'); window.scrollTo(0,0); return; }
    if (p === 'สินค้าทั้งหมด') { setActiveCategory('all'); setPage('shop'); window.scrollTo(0,0); return; }
    if (p === 'ค้าส่ง')         { setPage('wholesale'); window.scrollTo(0,0); return; }
    if (p === 'ติดต่อเรา' || p === 'ติดต่อ') { setPage('contact'); window.scrollTo(0,0); return; }
    if (p === 'เกร็ดความรู้') { setPage('knowledge'); window.scrollTo(0,0); return; }
    if (p === 'แคตตาล็อก') { setPage('catalog'); window.scrollTo(0,0); return; }
    if (p === 'สินค้าตามแบรนด์') { setPage('brands'); window.scrollTo(0,0); return; }
    if (p === 'member') { setPage('member'); window.scrollTo(0,0); return; }
    if (p === 'admin' || p === 'จัดการสินค้า') { setPage('admin'); window.scrollTo(0,0); return; }
    setPage(p);
  };
  const onCategoryChange = (cat) => { setActiveCategory(cat); setPage('shop'); window.scrollTo(0,0); };
  const onSearch         = ()    => { setActiveCategory('all'); setPage('shop'); window.scrollTo(0,0); };
  const onAddToCart      = (p)   => setCart(prev => [...prev, p]);
  const onSelectProduct  = (p)   => { setSelectedProduct(p); setPage('product-detail'); window.scrollTo(0,0); };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <HPHeader cartCount={cart.length} onNavigate={onNavigate} onCategoryChange={onCategoryChange} onSearch={onSearch}/>
      <main style={{ flex:1 }}>
        {page === 'home' && <>
          <HPHero onNavigate={onNavigate} onCategoryChange={onCategoryChange}/>
          <HPServiceBar onNavigate={onNavigate}/>
          <HPCategoryShowcase onCategoryChange={onCategoryChange}/>
          <HPProductGuide/>
          <HPBrandStrip/>
        </>}
        {page === 'shop' && <HPCategoryProductsPage activeCategory={activeCategory} onSelectProduct={onSelectProduct}/>}
        {page === 'wholesale' && <HPWholesalePage/>}
        {page === 'contact' && <HPContactPage/>}
        {page === 'knowledge' && <HPKnowledgePage/>}
        {page === 'catalog' && <HPCatalogPage/>}
        {page === 'brands' && <HPBrandProductsPage onSelectProduct={onSelectProduct}/>}
        {page === 'product-detail' && <HPProductDetailPage product={selectedProduct} onBack={() => onNavigate('สินค้าตามแบรนด์')} onSelectProduct={onSelectProduct} onNavigate={onNavigate}/>}
        {page === 'member' && <HPMemberPage onNavigate={onNavigate}/>}
        {page === 'cart' && <HPCartPage cartItems={cart} onClear={() => setCart([])}/>}
        {page === 'admin' && <HPAdminPage onNavigate={onNavigate}/>}
      </main>
      <HPFooter onCategoryChange={onCategoryChange}/>
      <div style={{ position:'fixed', right:'18px', bottom:'18px', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', background:'#fff', borderRadius:'12px', boxShadow:'0 6px 20px rgba(0,0,0,0.18)', padding:'8px', zIndex:9999 }}>
        <button onClick={zoomIn} title="ซูมเข้า" style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'18px', fontWeight:'700', color:'#06352e', cursor:'pointer' }}>+</button>
        <button onClick={zoomReset} title="รีเซ็ตขนาด" style={{ width:'36px', height:'28px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'11px', fontWeight:'700', color:'#7a8a82', cursor:'pointer' }}>{Math.round(zoom * 100)}%</button>
        <button onClick={zoomOut} title="ซูมออก" style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'18px', fontWeight:'700', color:'#06352e', cursor:'pointer' }}>−</button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<HPApp/>);
