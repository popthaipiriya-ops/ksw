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
  { id:'wire',        label:'สายไฟ',                img:'assets/cat-wire-coil.jpg' },
  { id:'conduitpart', label:'อุปกรณ์ท่อ',            img:'assets/cat-pipe-fitting.jpg',            keywords:['อุปกรณ์ท่อร้อยสายไฟฟ้า','ข้อต่อ'] },
  { id:'conduit',     label:'ท่อร้อยสายไฟ',         img:'assets/cat-conduit-tube.jpg' },
  { id:'loadcenter',  label:'ตู้โหลดเซนเตอร์',      img:'assets/cat-loadcenter.png',       keywords:['ตู้โหลดเซนเตอร์','ตู้โหลดเซ็นเตอร์'] },
  { id:'plasticpanel',label:'แผงไฟฟ้าพลาสติก',      img:'assets/cat-plastic-panel.jpg',       keywords:['แผงไฟฟ้าพลาสติก'] },
  { id:'faceplate',   label:'ฝาครอบหน้ากาก',        img:'assets/cat-faceplate.jpg',         keywords:['ฝาหน้ากาก','ฝาครอบแผงหน้ากากกันน้ำ'] },
  { id:'bulb',        label:'หลอดไฟ',               img:'assets/cat-bulb.jpg' },
  { id:'lamp',        label:'โคมไฟ',                img:'assets/cat-lamp.jpg',                keywords:['โคมไฟ'] },
  { id:'switch',      label:'สวิตซ์,ปลั๊ก',         img:'assets/cat-switch-socket.png' },
  { id:'circuit',     label:'ลูกเซอร์กิต',          img:'assets/cat-mini-breaker.png',          keywords:['เซอร์กิตเบรกเกอร์','เซอร์กิต เบรกเกอร์'] },
  { id:'wireway',     label:'รางวายเวย์',            img:'assets/cat-wireway.jpg',            keywords:['รางวายเวย์'] },
  { id:'cableladder', label:'รางเคเบิ้ลแลดเดอร์',   img:'assets/cat-cable-ladder.png',    keywords:['รางเคเบิ้ลแลดเดอร์'] },
  { id:'cableduct',   label:'รางเก็บสายไฟ',         img:'assets/cat-cable-trunking.jpg' },
  { id:'powerstrip',  label:'ปลั๊กราง',             img:'assets/cat-power-strip.png' },
  { id:'breaker',     label:'เบรกเกอร์',            img:'assets/cat-breaker-icon.png' },
  { id:'floatblock',  label:'บล็อคลอย',             img:'assets/cat-surface-box.jpg',              keywords:['กล่องลอย'] },
  { id:'waterbox',    label:'กล่องกันน้ำ',           img:'assets/cat-waterproof-box.jpg' },
  { id:'consumer',    label:'ตู้คอนซูมเมอร์ยูนิต',  img:'assets/cat-consumer-unit.png',   keywords:['ตู้คอนซูมเมอร์'] },
  { id:'switchboard', label:'ตู้สวิทซ์บอร์ด',       img:'assets/cat-switchboard.jpg',        keywords:['ตู้ไฟสวิทซ์บอร์ด','ตู้สวิตช์บอร์ด'] },
  { id:'cabletie',    label:'เคเบิลไทร์',           img:'assets/cat-cable-tie.png' },
  { id:'airconduit',  label:'ท่อและอุปกรณ์แอร์',    img:'assets/cat-air-pipe-fitting.jpg',     keywords:['ท่อและอุปกรณ์เครื่องปรับอากาศ'] },
  { id:'plasticbox',  label:'ตู้กันน้ำพลาสติก',     img:'assets/cat-plastic-waterproof-cabinet.png',      keywords:['ตู้กันน้ำพลาสติก'] },
  { id:'flooroutlet', label:'เต้ารับฝังพื้น',       img:'assets/cat-floor-socket.jpg',        keywords:['เต้ารับฝังพื้น','เต้ารับฝังโต๊ะ'] },
  { id:'rubberblock', label:'บล็อคยาง',             img:'assets/cat-rubber-block.png',              keywords:['บล็อคยาง','บล็อคฝัง'] },
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

// หน้าไหนตรงกับเมนูตัวไหน — ใช้ไฮไลต์เมนูตามหน้าที่เปิดอยู่
const HP_PAGE_NAV = {
  home:'หน้าแรก', brands:'สินค้าตามแบรนด์', 'product-detail':'สินค้าตามแบรนด์', shop:'สินค้าตามแบรนด์',
  knowledge:'เกร็ดความรู้', 'mdb-article':'เกร็ดความรู้', 'loadcenter3p-article':'เกร็ดความรู้',
  catalog:'แคตตาล็อก', contact:'ติดต่อเรา',
};

function HPMainHeader({ page, cartCount, onNavigate, onSearch }) {
  const [showLine, setShowLine] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSub, setMobileSub]   = useState(null);
  const [scrolled, setScrolled]     = useState(false);
  // กดเมนูบนมือถือแล้วต้องปิดแผงเสมอ ไม่งั้นแผงจะค้างทับหน้าใหม่
  const goMobile = (t) => { setMobileOpen(false); setMobileSub(null); onNavigate(t); };
  useEffect(() => {
    // แถบเมนูติดขอบบนอยู่แล้ว (sticky) — พอเลื่อนลงให้หดตัวลงนิดและเพิ่มเงา
    // จะได้รู้สึกว่าแถบลอยอยู่เหนือเนื้อหา ไม่ใช่ส่วนหนึ่งของหน้า
    // setState เฉพาะตอนข้ามเส้น 24px เท่านั้น จะได้ไม่ re-render ทุกครั้งที่เลื่อน
    const onScroll = () => setScrolled(prev => {
      const now = window.scrollY > 24;
      return now === prev ? prev : now;
    });
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ไฮไลต์เมนูตามส่วนที่กำลังดูอยู่ (เฉพาะหน้าแรกที่มีหลายส่วนในหน้าเดียว)
  // หน้าอื่นไฮไลต์ตามหน้าที่เปิดอยู่ตรงๆ ไม่ต้องเฝ้าดูการเลื่อน
  const [spyNav, setSpyNav] = useState('');
  useEffect(() => {
    setSpyNav('');
    if (page !== 'home') return;
    const zones = [...document.querySelectorAll('[data-hpnav]')];
    if (!zones.length) return;
    // เทียบจากเส้นใต้แถบเมนูลงมา 1 ส่วน 3 ของจอ — ตรงกับจุดที่สายตาคนอ่านอยู่
    const pick = () => {
      // เลื่อนสุดหน้าแล้วให้ไฮไลต์ส่วนสุดท้าย เพราะเส้นเทียบจะไปไม่ถึง
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const line = window.innerHeight / 3;
      let found = atBottom ? zones[zones.length - 1].dataset.hpnav : '';
      if (!found) {
        for (const z of zones) {
          const r = z.getBoundingClientRect();
          if (r.top <= line && r.bottom > line) { found = z.dataset.hpnav; break; }
        }
      }
      setSpyNav(prev => (found && found !== prev) ? found : prev);
    };
    pick();
    window.addEventListener('scroll', pick, { passive:true });
    window.addEventListener('resize', pick);
    return () => { window.removeEventListener('scroll', pick); window.removeEventListener('resize', pick); };
  }, [page]);
  // ใช้ค่าจากการเลื่อนเฉพาะตอนอยู่หน้าแรกเท่านั้น
  // ถ้าเช็คแค่ spyNav ค่าจากหน้าแรกจะค้างมาไฮไลต์ผิดเมนูตอนเปลี่ยนหน้า
  // (เกิดจากจังหวะที่ scroll event ของ scrollTo(0,0) มาถึงก่อน effect จะถอด listener)
  const activeNav = (page === 'home' ? spyNav : '') || HP_PAGE_NAV[page] || '';
  useEffect(() => {
    // ปิดแผงอัตโนมัติถ้าผู้ใช้ขยายจอกลับเป็นเดสก์ท็อป ไม่งั้นแผงจะค้างอยู่ทั้งที่เมนูปกติกลับมาแล้ว
    const onResize = () => { if (window.innerWidth > 980) { setMobileOpen(false); setMobileSub(null); } };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const navLinks = [
    { label:'หน้าแรก',        icon:<><path d="M3 9.5L12 3l9 6.5"/><path d="M5 9v11a1 1 0 001 1h12a1 1 0 001-1V9"/><path d="M9 21v-6h6v6"/></> },
    { label:'สินค้าตามแบรนด์', icon:<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5"/></> },
    { label:'เกร็ดความรู้',    icon:<><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
      submenu:[
        { label:'5 แนวทางการเลือกซื้ออุปกรณ์เดินระบบไฟฟ้า', target:'เกร็ดความรู้' },
        { label:'ตู้ MDB คืออะไร ?', target:'mdb-article' },
        { label:'ความสำคัญของตู้โหลด 3 เฟส', target:'loadcenter3p-article' },
      ] },
    { label:'แคตตาล็อก',      icon:<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
    { label:'ติดต่อเรา',       icon:<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></> },
  ];
  return (
    <>
    {showLine && <LineQRModal onClose={() => setShowLine(false)}/>}
    <div style={{ background:'#ffffff', padding: scrolled ? '7px 0' : '14px 0',
                  boxShadow: scrolled ? '0 4px 20px rgba(15,77,42,0.14)' : '0 2px 14px rgba(15,77,42,0.07)',
                  borderBottom:'1px solid #eef3ef', transition:'padding 0.22s ease, box-shadow 0.22s ease' }}>
      {/* กริด 3 ช่อง (ซ้าย-กลาง-ขวา) เพื่อให้เมนูกลางอยู่กึ่งกลางหน้าจริงๆ
          ไม่ขึ้นกับว่าโลโก้ซ้ายหรือปุ่มขวากว้างเท่าไร */}
      <div className="hp-header-row" style={{ maxWidth:'1240px', margin:'0 auto', padding:'0 20px', display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:'14px' }}>

        {/* Logo — ต้องย่อได้เมื่อจอแคบ ไม่งั้นจะดันปุ่มขวาจนล้นออกนอกจอ */}
        <div style={{ display:'flex', alignItems:'center', gap:'11px', cursor:'pointer', minWidth:0 }} onClick={() => onNavigate('home')}>
          <div style={{ width: scrolled ? '38px' : '46px', height: scrolled ? '38px' : '46px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'width 0.22s ease, height 0.22s ease' }}>
            <img src="assets/logo-kss.jpg" alt="KSS" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
          </div>
          <div style={{ lineHeight:1.1, minWidth:0 }}>
            <div className="hp-brand-name" style={{ fontWeight:800, fontSize:'17px', color:'#06352e', letterSpacing:'0.2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>KiRD SAENG SAWANG</div>
            <div className="hp-brand-sub" style={{ fontSize:'11px', color:'#8a9a90', fontWeight:400, marginTop:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>บริษัท เกิดแสงสว่าง จำกัด</div>
          </div>
        </div>

        {/* Nav links — ซ่อนเมื่อจอแคบ แล้วใช้ปุ่ม ☰ แทน */}
        <nav className="hp-nav-desktop" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'2px' }}>
          {navLinks.map(n => {
            const isActive = activeNav === n.label;
            return (
            <div key={n.label} style={{ position:'relative' }}
              onMouseEnter={() => n.submenu && setOpenMenu(n.label)}
              onMouseLeave={() => n.submenu && setOpenMenu(null)}>
              <div
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: scrolled ? '2px' : '5px', padding: scrolled ? '3px 12px' : '7px 12px', fontSize:'12.5px', fontWeight: isActive ? '700' : '600', color: isActive ? '#0d5c50' : '#5a7a66', background: isActive ? '#eaf6f5' : 'transparent', boxShadow: isActive ? 'inset 0 -2.5px 0 #8bc83f' : 'none', cursor:'pointer', whiteSpace:'nowrap', borderRadius:'9px', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background='#eaf6f5'; e.currentTarget.style.color='#0d5c50'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? '#eaf6f5' : 'transparent'; e.currentTarget.style.color = isActive ? '#0d5c50' : '#5a7a66'; }}
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
            );
          })}
        </nav>

        {/* Right actions — ยึดคอลัมน์ขวาเสมอ (marginLeft:auto ไว้เผื่อจอแคบที่สลับกลับเป็น flex) */}
        <div style={{ gridColumn:'3', marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
          {/* ปุ่มเมนูสำหรับจอแคบ */}
          <div className="hp-burger"
            style={{ alignItems:'center', justifyContent:'center', width:'40px', height:'40px', borderRadius:'10px', background:'#f2f6f4', border:'1px solid #e2ece7', cursor:'pointer' }}
            role="button" tabIndex={0} aria-label="เปิดเมนู" aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(o => !o)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMobileOpen(o => !o); } }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#0d5c50" strokeWidth="2.2" strokeLinecap="round">
              {mobileOpen ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></> : <><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>}
            </svg>
          </div>

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

      {/* แผงเมนูสำหรับจอแคบ */}
      {mobileOpen && (
        <div style={{ borderTop:'1px solid #eef3ef', background:'#fff', maxHeight:'70vh', overflowY:'auto' }}>
          <div style={{ maxWidth:'1240px', margin:'0 auto', padding:'8px 12px 14px' }}>
            {navLinks.map(n => (
              <div key={n.label}>
                <div
                  role="button" tabIndex={0}
                  style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 12px', fontSize:'15px', fontWeight: activeNav === n.label ? '800' : '600', color: activeNav === n.label ? '#0d5c50' : '#3a4a42', background: activeNav === n.label ? '#eaf6f5' : 'transparent', cursor:'pointer', borderRadius:'10px' }}
                  onClick={() => n.submenu ? setMobileSub(s => s === n.label ? null : n.label) : goMobile(n.target || n.label)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); n.submenu ? setMobileSub(s => s === n.label ? null : n.label) : goMobile(n.target || n.label); } }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>{n.icon}</svg>
                  <span style={{ flex:1 }}>{n.label}</span>
                  {n.submenu && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa8a0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: mobileSub === n.label ? 'rotate(180deg)' : 'none', transition:'transform 0.18s' }}><path d="M6 9l6 6 6-6"/></svg>
                  )}
                </div>
                {n.submenu && mobileSub === n.label && n.submenu.map(s => (
                  <div key={s.label}
                    role="button" tabIndex={0}
                    style={{ padding:'11px 12px 11px 44px', fontSize:'14px', color:'#5a7a66', cursor:'pointer', borderRadius:'10px' }}
                    onClick={() => goMobile(s.target)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goMobile(s.target); } }}>
                    • {s.label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function HPHeader({ page, cartCount, onNavigate, onCategoryChange, onSearch }) {
  return (
    <header style={{ position:'sticky', top:0, zIndex:100 }}>
      <HPMainHeader page={page} cartCount={cartCount} onNavigate={onNavigate} onSearch={onSearch} />
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

      {/* จอแคบกว่า 820px จะสลับเป็นเรียงซ้อนแนวตั้งแทน (ดู .hp-service-row ใน index.html)
          เดิมคอลัมน์รูปกว้างตายตัว 380px กว้างกว่าจอมือถือทั่วไปเอง เลยไปเบียดข้อความจนบีบจนดูเหมือนว่างเปล่า */}
      <div className="hp-service-row" style={{ maxWidth:'1240px', margin:'0 auto', padding:'56px 20px', display:'flex', alignItems:'center', gap:'40px' }}>
        <div className="hp-service-media" style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2, width:'380px' }}>
          <div style={{ position:'absolute', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 72%)' }}/>
          <img loading="lazy" decoding="async" src="assets/product-display.png" style={{ position:'relative', maxHeight:'250px', maxWidth:'100%', objectFit:'contain', filter:'drop-shadow(0 20px 28px rgba(0,0,0,0.16))' }}/>
        </div>
        <div className="hp-service-text" style={{ flex:1, minWidth:0, position:'relative', zIndex:2 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'#e8f8f1', border:'1px solid #bfe8da', color:'#0d9488', fontSize:'12px', fontWeight:'700', padding:'6px 16px', borderRadius:'999px', marginBottom:'18px' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#0d9488' }}/> ทำไมต้องซื้อกับเรา
          </span>
          <div style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'32px', fontWeight:'800', color:'#12241d', lineHeight:'1.3', letterSpacing:'-0.4px', marginBottom:'16px', maxWidth:'560px' }}>
            ซื้อกับเรา <span style={{ color:'#0d9488' }}>มั่นใจได้</span><br/>ได้รับสินค้า 100% ทางเรามีหน้าร้านจริง
          </div>
          <div className="hp-service-tags" style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'28px' }}>
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
    { cat:'loadcenter', tag:'งานระบบไฟ',     title:'ตู้โหลดเซนเตอร์', desc:'จัดระเบียบวงจรไฟฟ้าทั้งบ้าน',       price:1890, img:'assets/cat-loadcenter.png',     accent:'#475569' },
    { cat:'consumer',   tag:'ราคาส่ง',       title:'ตู้คอนซูมเมอร์',  desc:'ครบ จบทุกไซซ์ ราคาโรงงาน',           price:1890, img:'assets/cat-consumer-unit.png', accent:'#f05a20' },
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
    { cat:'breaker', num:2, title:'เบรกเกอร์', img:'assets/cat-breaker-icon.png',
      intro:'เบรกเกอร์ทำหน้าที่เหมือนหัวใจของระบบไฟฟ้าในบ้าน เป็นอุปกรณ์ที่ตัดกระแสไฟฟ้าโดยอัตโนมัติเมื่อเกิดกระแสไฟเกินหรือไฟฟ้าลัดวงจร ช่วยป้องกันอัคคีภัยและความเสียหายต่อเครื่องใช้ไฟฟ้า การเลือกขนาดเบรกเกอร์ (แอมป์) ให้เหมาะสมกับโหลดการใช้งานจึงเป็นเรื่องสำคัญมาก' },
    { cat:'wire', num:3, title:'สายไฟ', img:'assets/cat-wire-coil.jpg',
      intro:'สายไฟเป็นตัวนำกระแสไฟฟ้าจากแหล่งจ่ายไปยังจุดใช้งานต่างๆ ทำจากทองแดงแท้หุ้มด้วยฉนวน PVC การเลือกขนาดสายไฟ (ตารางมิลลิเมตร) ให้เหมาะสมกับปริมาณกระแสไฟที่ใช้งานเป็นสิ่งสำคัญ เพราะหากใช้สายไฟขนาดเล็กเกินไปอาจทำให้สายร้อนจัดจนเกิดอัคคีภัยได้' },
    { cat:'panel', num:4, title:'ตู้ไฟ', img:'assets/cat-consumer-unit.png',
      intro:'ตู้ไฟหรือตู้คอนซูมเมอร์ยูนิต ทำหน้าที่เป็นศูนย์กลางควบคุมวงจรไฟฟ้าทั้งหมดภายในบ้าน ภายในติดตั้งเบรกเกอร์ย่อยแยกตามวงจรการใช้งาน ช่วยให้สามารถตัดไฟเฉพาะจุดได้สะดวกเวลาเกิดปัญหาหรือซ่อมบำรุง' },
    { cat:'conduit', num:5, title:'ท่อร้อยสายไฟ', img:'assets/cat-conduit-tube.jpg',
      intro:'ท่อร้อยสายไฟใช้สำหรับป้องกันสายไฟจากความเสียหายทางกายภาพ ความชื้น และสัตว์กัดแทะ อีกทั้งยังช่วยให้เดินสายไฟเป็นระเบียบและซ่อมบำรุงในภายหลังได้ง่ายขึ้น มีทั้งแบบท่อ PVC สำหรับงานทั่วไป และแบบโลหะสำหรับงานที่ต้องการความแข็งแรงเป็นพิเศษ' },
    { cat:'switch', num:6, title:'สวิตช์และปลั๊ก', img:'assets/cat-switch-socket.png',
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
    { key:'racer',      src:'assets/brand-racer.png' },
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
        <div className="hp-brand-track" style={{ display:'flex', alignItems:'center', width:'max-content', gap:'72px' }}>
          {track.map((b, idx) => (
            <div key={b.key + idx} className="hp-brand-item"
              style={{ height:'150px', width:'290px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'transform 0.15s ease, opacity 0.15s ease', opacity:0.85 }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.opacity='1'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.opacity='0.85'; }}>
              <img loading="lazy" decoding="async" src={b.src} alt={b.key} style={{ maxHeight:'140px', maxWidth:'290px', objectFit:'contain' }}/>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function HPFooter({ onCategoryChange, onNavigate }) {
  // แต่ละบริการต้องกดแล้วไปที่ไหนสักที่ — ก่อนหน้านี้กดแล้วไม่มีอะไรเกิดขึ้น
  const serviceCol = { title:'บริการของเรา', links:[
    { label:'รับประกอบตู้โหลด 3 เฟส', go:'loadcenter3p-article' },
    { label:'รับผลิตตู้ MDB',          go:'mdb-article' },
    { label:'บริการติดตั้ง',            go:'ติดต่อเรา' },
    { label:'งานโครงการ',              go:'ติดต่อเรา' },
    { label:'ปรึกษาระบบไฟ',            go:'ติดต่อเรา' },
  ] };
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
  // <a> ที่ไม่มี href จะกด Tab ไปไม่ถึงและโปรแกรมอ่านหน้าจอไม่รู้ว่าเป็นลิงก์ — เพิ่มให้กดด้วยคีย์บอร์ดได้
  const linkA11y = (fn) => ({ role:'link', tabIndex:0, onClick:fn, onKeyDown:(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } } });
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
      <div className="hp-footer-grid" style={{ maxWidth:'1240px', margin:'0 auto', padding:'32px 24px 32px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr 1.1fr', gap:'32px' }}>
        {/* col 2: สินค้า — 2 sub-lists */}
        <div>
          <ColHead>สินค้า</ColHead>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px' }}>
            {productCols.map((sub, si) => (
              <div key={si}>
                {sub.map(c => (
                  <a key={c.id} style={linkStyle} {...linkA11y(() => onCategoryChange(c.id))}
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
            <a key={l.label} style={linkStyle} {...linkA11y(() => onNavigate(l.go))}
              onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.paddingLeft='4px'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.65)'; e.currentTarget.style.paddingLeft='0'; }}>
              <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#5fd1c2', flexShrink:0 }}/>{l.label}
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

// embedded = ถูกวางอยู่ในหน้าเดียว (one-page) จึงไม่ต้องมีเบรดครัมบ์ "หน้าหลัก ›"
function HPKnowledgePage({ onCategoryChange, onNavigate, embedded }) {
  const KI = {
    award:  <><circle cx="12" cy="8" r="6"/><path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></>,
    bolt:   <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z"/>,
    shield: <><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"/><path d="M9 12l2 2 4-4"/></>,
    wrench: <path d="M14.7 6.3a4 4 0 10-5.4 5.4L3 18.6V21h2.4l6.3-6.3a4 4 0 005.4-5.4l-2.8 2.8-2.1-2.1 2.8-2.8z"/>,
    panel:  <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
  };
  const KIcon = ({ name, size }) => (
    <svg width={size||24} height={size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{KI[name]}</svg>
  );
  const steps = [
    { n:'1', icon:'award',  c1:'#8bc83f', c2:'#5f9c2b', title:'เลือกอุปกรณ์ที่ผ่านมาตรฐานสากล', desc:'ควรเลือกอุปกรณ์ไฟฟ้าที่ได้รับการรับรองมาตรฐาน เช่น มอก. (มาตรฐานผลิตภัณฑ์อุตสาหกรรม) หรือ IEC (มาตรฐานสากล) เพื่อความปลอดภัยและความน่าเชื่อถือ มั่นใจได้ว่าอุปกรณ์ผ่านการทดสอบคุณภาพมาแล้ว' },
    { n:'2', icon:'target', c1:'#14b8a6', c2:'#0d9488', title:'คำนึงถึงความเหมาะสมกับการใช้งาน', desc:'เลือกอุปกรณ์ให้เหมาะกับลักษณะงานและปริมาณการใช้ไฟฟ้า เช่น ขนาดของเบรกเกอร์ ชนิดของสายไฟ และพิกัดกระแส ให้สอดคล้องกับโหลดที่ใช้จริง เพื่อประสิทธิภาพและความปลอดภัยสูงสุด' },
    { n:'3', icon:'bolt',   c1:'#eab308', c2:'#ca8a04', title:'ประหยัดพลังงานด้วยอุปกรณ์ที่มีประสิทธิภาพสูง', desc:'เลือกใช้อุปกรณ์ประหยัดพลังงาน เช่น หลอด LED หรืออุปกรณ์ที่มีฉลากประหยัดไฟเบอร์ 5 ช่วยลดการใช้พลังงานและความร้อน ลดค่าไฟในระยะยาว และเป็นมิตรต่อสิ่งแวดล้อม' },
    { n:'4', icon:'shield', c1:'#fb923c', c2:'#ea580c', title:'ตรวจสอบความปลอดภัยในการติดตั้ง', desc:'ก่อนติดตั้งควรตรวจสอบสภาพอุปกรณ์และระบบสายดินให้เรียบร้อย และควรให้ช่างไฟฟ้าที่มีใบอนุญาตเป็นผู้ติดตั้ง เพื่อป้องกันไฟฟ้าลัดวงจรและอุบัติเหตุ' },
    { n:'5', icon:'wrench', c1:'#3b82f6', c2:'#2563eb', title:'การบำรุงรักษาอุปกรณ์เดินระบบไฟฟ้า', desc:'ตรวจเช็คและบำรุงรักษาอุปกรณ์ไฟฟ้าเป็นประจำ เช่น ทำความสะอาด ตรวจจุดต่อสายไฟ และเช็คความร้อนผิดปกติ จะช่วยยืดอายุการใช้งานและลดความเสี่ยงในการเกิดปัญหา' },
  ];
  const more = [
    { title:'ตู้ MDB คืออะไร ?', excerpt:'ตู้ MDB (Main Distribution Board) คือตู้จ่ายไฟหลักของอาคาร ทำหน้าที่รับไฟจากการไฟฟ้าแล้วกระจายไปยังตู้ย่อยต่างๆ อย่างปลอดภัย เกิดแสงสว่างรับผลิตและจำหน่ายตู้ MDB ตามสเปกงาน', c1:'#14b8a6', c2:'#0d9488', icon:'panel', img:'assets/kjl-more/kjl-customcabinet-1.webp', article:'mdb-article', cta:'อ่านบทความ' },
    { title:'ความสำคัญของตู้โหลด 3 เฟส', excerpt:'ตู้โหลด 3 เฟสช่วยกระจายโหลดไฟฟ้าให้สมดุล รองรับเครื่องจักรและอุปกรณ์กำลังสูง เหมาะกับโรงงานและอาคารขนาดใหญ่', c1:'#3b82f6', c2:'#2563eb', icon:'bolt', img:'assets/kjl-more/kjl-elecservice-1.webp', article:'loadcenter3p-article', cta:'อ่านบทความ' },
  ];
  return (
    <section style={{ background:'#eef8f7', padding:'30px 0 56px', minHeight:'75vh' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 20px' }}>
        {!embedded && <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>หน้าหลัก › <span style={{ color:'#8bc83f', fontWeight:'700' }}>เกร็ดความรู้</span></div>}

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

        {/* 5 steps — ไทม์ไลน์เชื่อมต่อ */}
        <div style={{ position:'relative', marginBottom:'40px' }}>
          <div style={{ position:'absolute', left:'31px', top:'34px', bottom:'34px', width:'2px', background:'linear-gradient(180deg,#8bc83f,#0d9488,#ca8a04,#ea580c,#2563eb)', opacity:0.22 }}/>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {steps.map((s,i) => (
              <div key={i} style={{ position:'relative', display:'flex', gap:'26px', paddingBottom: i < steps.length-1 ? '22px' : 0 }}>
                <div style={{ position:'relative', flexShrink:0, width:'64px', height:'64px' }}>
                  <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:`linear-gradient(135deg, ${s.c1}, ${s.c2})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 10px 22px ${s.c1}55`, position:'relative', zIndex:1 }}>
                    <KIcon name={s.icon}/>
                  </div>
                  <div style={{ position:'absolute', top:'-5px', right:'-5px', width:'25px', height:'25px', borderRadius:'50%', background:'#fff', border:`2px solid ${s.c2}`, color:s.c2, fontSize:'12.5px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, Noto Sans Thai, sans-serif', zIndex:2 }}>{s.n}</div>
                </div>
                <div style={{ flex:1, background:'#fff', borderRadius:'18px', padding:'22px 26px', border:'1px solid #f0f0f0', boxShadow:'0 4px 16px rgba(15,77,42,0.05)', transition:'transform 0.18s ease, box-shadow 0.18s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 14px 28px ${s.c1}25`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(15,77,42,0.05)'; }}>
                  <h3 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'21px', fontWeight:'800', color:s.c2, marginBottom:'9px', lineHeight:'1.4', letterSpacing:'-0.3px' }}>{s.title}</h3>
                  <p style={{ fontSize:'16px', color:'#555', lineHeight:'1.9' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* closing */}
        <div style={{ background:'linear-gradient(120deg,#eaf6f5,#d8eeec)', border:'1.5px solid #a9ddd6', borderRadius:'18px', padding:'24px 28px', marginBottom:'40px' }}>
          <p style={{ fontSize:'17px', color:'#6ea832', lineHeight:'1.9', fontWeight:'600' }}>
            💡 การเลือกซื้ออุปกรณ์ไฟฟ้าที่มีคุณภาพและเหมาะสมกับการใช้งาน จะช่วยให้ระบบไฟฟ้าปลอดภัย ประหยัดพลังงาน และใช้งานได้ยาวนาน — บริษัท เกิดแสงสว่าง จำกัด พร้อมให้คำปรึกษาและจำหน่ายอุปกรณ์ไฟฟ้าครบวงจร ราคาส่ง
          </p>
        </div>

        {/* more articles */}
        <h2 style={{ fontSize:'24px', fontWeight:'800', color:'#06352e', marginBottom:'18px' }}>บทความอื่นๆ ที่น่าสนใจ</h2>
        <div className="hp-more-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px' }}>
          {more.map((a,i) => {
            const clickable = !!(a.cat || a.article);
            const handleClick = a.article ? () => onNavigate(a.article) : a.cat ? () => onCategoryChange(a.cat) : undefined;
            return (
            <div key={i} onClick={handleClick} style={{ background:'#fff', borderRadius:'16px', overflow:'hidden', border:'1px solid #eaf3ed', cursor: clickable ? 'pointer' : 'default', display:'flex', flexDirection:'column', transition:'transform 0.18s ease, box-shadow 0.18s ease' }}
              onMouseEnter={e => { if (!clickable) return; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 14px 28px ${a.c1}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
              <div style={{ height:'150px', background:'#f4f7f6', position:'relative', overflow:'hidden' }}>
                <img loading="lazy" decoding="async" src={a.img} alt={a.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'}/>
                <div style={{ position:'absolute', top:'12px', left:'12px', width:'36px', height:'36px', borderRadius:'10px', background:`linear-gradient(135deg, ${a.c1}, ${a.c2})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 6px 14px ${a.c1}55` }}>
                  <KIcon name={a.icon} size={18}/>
                </div>
              </div>
              <div style={{ padding:'22px 24px', display:'flex', flexDirection:'column', flex:1 }}>
                <div style={{ fontSize:'19px', fontWeight:'800', color:'#1a1a1a', marginBottom:'10px' }}>{a.title}</div>
                <p style={{ fontSize:'14.5px', color:'#777', lineHeight:'1.7', marginBottom:'16px', flex:1 }}>{a.excerpt}</p>
                {clickable && <span style={{ color:a.c1, fontWeight:'700', fontSize:'14px' }}>{a.cta || 'ดูเพิ่มเติม'} →</span>}
              </div>
            </div>
          );})}
        </div>

      </div>
    </section>
  );
}

// บทความ "ตู้ MDB คืออะไร ?" — เนื้อหาของเกิดแสงสว่างเอง
function HPMdbArticlePage({ onNavigate, onCategoryChange }) {
  const H2 = ({ children }) => (
    <h2 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'25px', fontWeight:'800', color:'#0d9488', letterSpacing:'-0.3px', margin:'34px 0 14px' }}>{children}</h2>
  );
  const P = ({ children }) => (
    <p style={{ fontSize:'17px', color:'#3a4a42', lineHeight:'2', marginBottom:'14px' }}>{children}</p>
  );
  const numbered = [
    { n:'1', title:'พิจารณาปริมาณการใช้งานไฟฟ้า (Load Demand)', items:[
      'ตรวจสอบว่ามีการใช้งานไฟฟ้าจำนวนเท่าใดในพื้นที่ เช่น 100A, 250A หรือ 400A',
      'หากมีการใช้งานมากขึ้นในอนาคต อาจต้องเผื่อขนาดให้ใหญ่ขึ้น',
    ]},
    { n:'2', title:'การแบ่งเบรกเกอร์ย่อย (Sub Breaker)', items:[
      'ควรแบ่งเบรกเกอร์ย่อยให้สอดคล้องกับแผนการเดินสายไฟของพื้นที่',
    ]},
    { n:'3', title:'วัสดุและการออกแบบ', items:[
      'เลือกตู้ที่ทำจากวัสดุคุณภาพ เช่น เหล็กพ่นสีป้องกันสนิม หรือสแตนเลสสำหรับพื้นที่ที่มีความชื้นสูง',
    ]},
  ];
  const features = [
    { title:'ระบบควบคุมอัจฉริยะ (Smart Control)', desc:'ใช้เซ็นเซอร์ตรวจจับกระแสไฟฟ้าเพื่อการควบคุมและวิเคราะห์การใช้งาน' },
    { title:'อุปกรณ์ป้องกันไฟฟ้าลัดวงจร', desc:'เช่น เบรกเกอร์ที่มีระบบป้องกันกระแสไฟฟ้าเกิน (Overload Protection)' },
    { title:'ช่องสำรอง (Spare Space)', desc:'เพื่อการติดตั้งอุปกรณ์เพิ่มเติมในอนาคต' },
  ];
  const steps = [
    { n:'1', title:'ออกแบบตามความต้องการ', desc:'ลูกค้าสามารถระบุขนาด, ฟังก์ชัน และวัสดุที่ต้องการ' },
    { n:'2', title:'การผลิตด้วยเทคโนโลยีทันสมัย', desc:'ใช้เครื่องจักรที่มีความแม่นยำสูงและผ่านการตรวจสอบคุณภาพทุกขั้นตอน' },
    { n:'3', title:'การทดสอบคุณภาพก่อนส่งมอบ', desc:'เช่น การทดสอบโหลดไฟฟ้า (Load Test) และความทนทานของตู้' },
  ];
  return (
    <section style={{ background:'#eef8f7', padding:'30px 0 56px', minHeight:'75vh' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>
          <span style={{ cursor:'pointer' }} onClick={() => onNavigate('หน้าแรก')}>หน้าหลัก</span> › <span style={{ cursor:'pointer' }} onClick={() => onNavigate('เกร็ดความรู้')}>เกร็ดความรู้</span> › <span style={{ color:'#8bc83f', fontWeight:'700' }}>ตู้ MDB คืออะไร ?</span>
        </div>

        {/* hero */}
        <div style={{ borderRadius:'24px', overflow:'hidden', position:'relative', boxShadow:'0 14px 38px rgba(10,70,40,0.18)', marginBottom:'28px', border:'1px solid #eaf3ed' }}>
          <img loading="lazy" decoding="async" src="assets/kjl-more/mdb-article-1-full.png" alt="ตู้ MDB คืออะไร ?"
            style={{ width:'100%', display:'block', objectFit:'contain' }}/>
        </div>
        <div style={{ marginBottom:'24px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'linear-gradient(120deg,#5ee7c8,#0d9488)', color:'#04352c', fontSize:'14px', fontWeight:'800', padding:'7px 22px', borderRadius:'999px', marginBottom:'14px' }}>📖 บทความน่ารู้</span>
          <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'38px', fontWeight:'800', color:'#06352e', letterSpacing:'-0.5px', lineHeight:'1.2', marginBottom:'8px' }}>ทุกเรื่องที่ควรรู้เกี่ยวกับตู้ MDB</h1>
          <p style={{ fontSize:'18px', color:'#5a7a66' }}>เลือกตู้ MDB อย่างไรให้เหมาะกับงานของคุณ — โดยเกิดแสงสว่าง ผู้ผลิตและจำหน่ายตู้ไฟฟ้าตามสเปกงาน</p>
        </div>

        <P>ในระบบไฟฟ้า ตู้ MDB (Main Distribution Board) ถือเป็นหัวใจสำคัญของการจัดการและกระจายพลังงานไฟฟ้าอย่างปลอดภัยและมีประสิทธิภาพ การเลือกใช้ตู้ MDB ที่เหมาะสมกับความต้องการไม่เพียงช่วยเพิ่มความปลอดภัย แต่ยังช่วยลดต้นทุนและเพิ่มประสิทธิภาพในการใช้งานอีกด้วย มาดูกันว่าควรเลือกตู้ MDB อย่างไรให้เหมาะกับงานของคุณ!</P>

        <H2>ตู้ MDB คืออะไร ?</H2>
        <P>ตู้ MDB คือ แผงควบคุมหลักที่ใช้สำหรับการกระจายพลังงานไฟฟ้าจากแหล่งจ่ายไฟไปยังส่วนต่าง ๆ ของอาคารหรือโรงงาน โดยตู้ MDB จะเป็นจุดรวมของเบรกเกอร์และอุปกรณ์ไฟฟ้าสำคัญ เช่น หม้อแปลงไฟฟ้า, เบรกเกอร์หลัก (Main Breaker) และเบรกเกอร์ย่อย</P>

        <H2>ขนาดของตู้ MDB เลือกอย่างไรให้เหมาะสม ?</H2>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'18px' }}>
          {numbered.map(g => (
            <div key={g.n} style={{ background:'#fff', borderRadius:'16px', padding:'20px 24px', border:'1px solid #eaf3ed', boxShadow:'0 4px 16px rgba(15,77,42,0.05)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
                <span style={{ width:'28px', height:'28px', flexShrink:0, borderRadius:'50%', background:'#0d9488', color:'#fff', fontSize:'14px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center' }}>{g.n}</span>
                <span style={{ fontSize:'17px', fontWeight:'700', color:'#06352e' }}>{g.title}</span>
              </div>
              <ul style={{ margin:0, paddingLeft:'40px', color:'#555', fontSize:'15.5px', lineHeight:'1.9' }}>
                {g.items.map((it,idx) => <li key={idx}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderRadius:'20px', overflow:'hidden', boxShadow:'0 10px 26px rgba(10,70,40,0.14)', marginBottom:'30px', border:'1px solid #eaf3ed' }}>
          <img loading="lazy" decoding="async" src="assets/kjl-more/mdb-article-2.png" alt="ขนาดของตู้ MDB เลือกอย่างไรให้เหมาะสม"
            style={{ width:'100%', display:'block', objectFit:'cover' }}/>
        </div>

        <H2>ฟังก์ชันเสริมที่ควรมีในตู้ MDB</H2>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'8px' }}>
          {features.map((f,i) => (
            <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
              <span style={{ color:'#0d9488', fontSize:'20px', lineHeight:'1.6' }}>•</span>
              <p style={{ fontSize:'16px', color:'#3a4a42', lineHeight:'1.9' }}><span style={{ fontWeight:'700', color:'#06352e' }}>{f.title}</span> — {f.desc}</p>
            </div>
          ))}
        </div>

        <H2>ขั้นตอนการผลิตตู้ MDB ตามสั่ง</H2>
        <div style={{ position:'relative', marginBottom:'30px' }}>
          <div style={{ position:'absolute', left:'19px', top:'6px', bottom:'6px', width:'2px', background:'#0d9488', opacity:0.22 }}/>
          <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
            {steps.map(s => (
              <div key={s.n} style={{ position:'relative', display:'flex', gap:'20px' }}>
                <span style={{ position:'relative', zIndex:1, flexShrink:0, width:'40px', height:'40px', borderRadius:'50%', background:'#0d9488', color:'#fff', fontSize:'16px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center' }}>{s.n}</span>
                <div>
                  <div style={{ fontSize:'17px', fontWeight:'700', color:'#06352e', marginBottom:'4px' }}>{s.title}</div>
                  <p style={{ fontSize:'15.5px', color:'#555', lineHeight:'1.8' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* closing / CTA */}
        <div style={{ background:'linear-gradient(120deg,#eaf6f5,#d8eeec)', border:'1.5px solid #a9ddd6', borderRadius:'18px', padding:'24px 28px', marginBottom:'22px' }}>
          <p style={{ fontSize:'17px', color:'#0d9488', lineHeight:'1.9', fontWeight:'600', marginBottom:'16px' }}>
            💡 การเลือกตู้ MDB ที่เหมาะสมกับความต้องการ จะช่วยให้ระบบไฟฟ้าปลอดภัย ประหยัดต้นทุน และใช้งานได้ยาวนาน — เกิดแสงสว่างรับผลิตและจำหน่ายตู้ MDB ตามสเปกงาน พร้อมให้คำปรึกษาโดยทีมงานผู้เชี่ยวชาญ
          </p>
          <button onClick={() => onCategoryChange('panel')} style={{ background:'#0d9488', color:'#fff', border:'none', borderRadius:'999px', padding:'12px 28px', fontSize:'15px', fontWeight:'700', cursor:'pointer' }}>ดูตู้ไฟฟ้าของเรา →</button>
        </div>
      </div>
    </section>
  );
}

// บทความ "ความสำคัญของตู้โหลด 3 เฟส" — เนื้อหาของเกิดแสงสว่างเอง
function HPLoadCenter3PArticlePage({ onNavigate, onCategoryChange }) {
  const H2 = ({ children }) => (
    <h2 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'25px', fontWeight:'800', color:'#2563eb', letterSpacing:'-0.3px', margin:'34px 0 14px' }}>{children}</h2>
  );
  const P = ({ children }) => (
    <p style={{ fontSize:'17px', color:'#3a4a42', lineHeight:'2', marginBottom:'14px' }}>{children}</p>
  );
  const pros = [
    { title:'รองรับพลังงานสูง', desc:'สามารถจ่ายไฟได้มากกว่าระบบ 1 เฟส เหมาะสำหรับพื้นที่ที่ต้องใช้ไฟฟ้าหนัก เช่น เครื่องจักรขนาดใหญ่' },
    { title:'ลดความเสี่ยงการโอเวอร์โหลด', desc:'การจ่ายไฟในระบบ 3 เฟสช่วยกระจายโหลดไฟฟ้าให้สมดุล' },
    { title:'ประสิทธิภาพสูง', desc:'ใช้พลังงานอย่างมีประสิทธิภาพและลดการสูญเสียพลังงานในสายไฟ' },
  ];
  const choose = [
    { n:'1', title:'ขนาดของเบรกเกอร์หลัก (Main Breaker)', items:[
      'เลือกขนาดที่รองรับกระแสไฟฟ้าสูงสุดที่ระบบต้องการ เช่น 63A, 100A หรือ 250A',
    ]},
    { n:'2', title:'จำนวนช่องเบรกเกอร์ย่อย (Sub Breaker)', items:[
      'พิจารณาจำนวนช่องเบรกเกอร์ที่เหมาะสมกับอุปกรณ์ไฟฟ้าที่ต้องการควบคุม',
    ]},
    { n:'3', title:'วัสดุและโครงสร้าง', items:[
      'เลือกตู้ที่ทำจากวัสดุคุณภาพ เช่น เหล็กเคลือบป้องกันสนิม หรือสแตนเลส',
      'ต้องสามารถป้องกันฝุ่นและน้ำได้ตามมาตรฐาน IP',
    ]},
  ];
  const assemble = [
    { n:'1', title:'การเลือกอุปกรณ์ไฟฟ้า', items:[
      'ใช้เบรกเกอร์และสายไฟที่ได้มาตรฐาน เช่น IEC หรือ TIS',
      'เพิ่มอุปกรณ์ป้องกัน เช่น Surge Protector หากจำเป็น',
    ]},
    { n:'2', title:'การประกอบโดยมืออาชีพ', items:[
      'การเชื่อมต่อสายไฟฟ้าภายในตู้โหลดต้องแม่นยำและปลอดภัย',
      'ทดสอบระบบไฟฟ้าหลังประกอบเสร็จ',
    ]},
    { n:'3', title:'การติดตั้งในสถานที่', items:[
      'ติดตั้งในจุดที่เข้าถึงง่ายสำหรับการบำรุงรักษา',
      'หลีกเลี่ยงพื้นที่ที่มีความชื้นสูงหรือแสงแดดจัด',
    ]},
  ];
  const caution = [
    'หลีกเลี่ยงการต่อโหลดไฟฟ้าเกินขนาดที่ตู้รองรับ',
    'ตรวจสอบระบบสายดินและเบรกเกอร์ให้อยู่ในสภาพพร้อมใช้งาน',
    'บำรุงรักษาและตรวจเช็กระบบไฟฟ้าเป็นประจำ',
  ];
  return (
    <section style={{ background:'#eef8f7', padding:'30px 0 56px', minHeight:'75vh' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>
          <span style={{ cursor:'pointer' }} onClick={() => onNavigate('หน้าแรก')}>หน้าหลัก</span> › <span style={{ cursor:'pointer' }} onClick={() => onNavigate('เกร็ดความรู้')}>เกร็ดความรู้</span> › <span style={{ color:'#8bc83f', fontWeight:'700' }}>ความสำคัญของตู้โหลด 3 เฟส</span>
        </div>

        {/* hero */}
        <div style={{ borderRadius:'24px', overflow:'hidden', position:'relative', boxShadow:'0 14px 38px rgba(10,70,40,0.18)', marginBottom:'28px', border:'1px solid #eaf3ed' }}>
          <img loading="lazy" decoding="async" src="assets/kjl-more/loadcenter3p-1.png" alt="ความสำคัญของตู้โหลด 3 เฟส"
            style={{ width:'100%', display:'block', objectFit:'contain' }}/>
        </div>
        <div style={{ marginBottom:'24px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'linear-gradient(120deg,#7fb2ff,#2563eb)', color:'#04204a', fontSize:'14px', fontWeight:'800', padding:'7px 22px', borderRadius:'999px', marginBottom:'14px' }}>📖 บทความน่ารู้</span>
          <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'38px', fontWeight:'800', color:'#06352e', letterSpacing:'-0.5px', lineHeight:'1.2', marginBottom:'8px' }}>ความสำคัญของตู้โหลด 3 เฟส</h1>
          <p style={{ fontSize:'18px', color:'#5a7a66' }}>ตู้โหลด 3 เฟสมีความสำคัญอย่างไร และควรเลือกใช้อย่างไรให้ตอบโจทย์ — โดยเกิดแสงสว่าง ผู้ผลิตและจำหน่ายตู้ไฟฟ้าตามสเปกงาน</p>
        </div>

        <P>ในระบบไฟฟ้าสำหรับบ้านหรืออาคารขนาดใหญ่ ตู้โหลด 3 เฟส เป็นองค์ประกอบสำคัญที่ช่วยควบคุมและกระจายไฟฟ้าได้อย่างมีประสิทธิภาพ หากเลือกและประกอบตู้โหลดได้อย่างเหมาะสม นอกจากจะช่วยเพิ่มความปลอดภัย ยังช่วยยืดอายุการใช้งานของระบบไฟฟ้าทั้งหมดอีกด้วย มาดูกันว่า ตู้โหลด 3 เฟสมีความสำคัญอย่างไร และควรเลือกใช้อย่างไรให้ตอบโจทย์!</P>

        <H2>ตู้โหลด 3 เฟส คืออะไร?</H2>
        <P>ตู้โหลด 3 เฟส (Three-Phase Load Center) คือ แผงควบคุมไฟฟ้าที่ใช้ในระบบไฟฟ้า 3 เฟส ซึ่งเหมาะสำหรับอาคาร โรงงาน หรือพื้นที่ที่ต้องการใช้พลังงานไฟฟ้าปริมาณมาก ตู้โหลดนี้ทำหน้าที่กระจายพลังงานไปยังเครื่องใช้ไฟฟ้าหรืออุปกรณ์ต่าง ๆ ได้อย่างสมดุล ลดความเสี่ยงของกระแสไฟฟ้าเกินหรือไม่สม่ำเสมอ</P>

        <H2>ข้อดีของการใช้ตู้โหลด 3 เฟส</H2>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'8px' }}>
          {pros.map((f,i) => (
            <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
              <span style={{ width:'26px', height:'26px', flexShrink:0, borderRadius:'50%', background:'#2563eb', color:'#fff', fontSize:'13px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</span>
              <p style={{ fontSize:'16px', color:'#3a4a42', lineHeight:'1.9' }}><span style={{ fontWeight:'700', color:'#06352e' }}>{f.title}</span> — {f.desc}</p>
            </div>
          ))}
        </div>

        <H2>วิธีเลือกตู้โหลด 3 เฟสให้เหมาะสม</H2>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'18px' }}>
          {choose.map(g => (
            <div key={g.n} style={{ background:'#fff', borderRadius:'16px', padding:'20px 24px', border:'1px solid #eaf3ed', boxShadow:'0 4px 16px rgba(15,77,42,0.05)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
                <span style={{ width:'28px', height:'28px', flexShrink:0, borderRadius:'50%', background:'#2563eb', color:'#fff', fontSize:'14px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center' }}>{g.n}</span>
                <span style={{ fontSize:'17px', fontWeight:'700', color:'#06352e' }}>{g.title}</span>
              </div>
              <ul style={{ margin:0, paddingLeft:'40px', color:'#555', fontSize:'15.5px', lineHeight:'1.9' }}>
                {g.items.map((it,idx) => <li key={idx}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderRadius:'20px', overflow:'hidden', boxShadow:'0 10px 26px rgba(10,70,40,0.14)', marginBottom:'30px', border:'1px solid #eaf3ed' }}>
          <img loading="lazy" decoding="async" src="assets/kjl-more/loadcenter3p-2.png" alt="วิธีเลือกตู้โหลด 3 เฟสให้เหมาะสม"
            style={{ width:'100%', display:'block', objectFit:'contain', background:'#f4f7f6' }}/>
        </div>

        <H2>ขั้นตอนการประกอบตู้โหลด 3 เฟส</H2>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'18px' }}>
          {assemble.map(g => (
            <div key={g.n} style={{ background:'#fff', borderRadius:'16px', padding:'20px 24px', border:'1px solid #eaf3ed', boxShadow:'0 4px 16px rgba(15,77,42,0.05)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
                <span style={{ width:'28px', height:'28px', flexShrink:0, borderRadius:'50%', background:'#2563eb', color:'#fff', fontSize:'14px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center' }}>{g.n}</span>
                <span style={{ fontSize:'17px', fontWeight:'700', color:'#06352e' }}>{g.title}</span>
              </div>
              <ul style={{ margin:0, paddingLeft:'40px', color:'#555', fontSize:'15.5px', lineHeight:'1.9' }}>
                {g.items.map((it,idx) => <li key={idx}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:'18px', padding:'22px 26px', marginBottom:'30px' }}>
          <div style={{ fontSize:'17px', fontWeight:'800', color:'#c2410c', marginBottom:'10px' }}>⚠️ ข้อควรระวัง ในการใช้งานตู้โหลด 3 เฟส</div>
          <ul style={{ margin:0, paddingLeft:'22px', color:'#7c4a1e', fontSize:'15.5px', lineHeight:'1.9' }}>
            {caution.map((c,i) => <li key={i}>{c}</li>)}
          </ul>
        </div>

        {/* closing / CTA */}
        <div style={{ background:'linear-gradient(120deg,#eaf2fe,#dbe9fc)', border:'1.5px solid #a9c8f5', borderRadius:'18px', padding:'24px 28px', marginBottom:'22px' }}>
          <p style={{ fontSize:'17px', color:'#2563eb', lineHeight:'1.9', fontWeight:'600', marginBottom:'16px' }}>
            💡 การเลือกและประกอบตู้โหลด 3 เฟสอย่างเหมาะสม จะช่วยให้ระบบไฟฟ้าปลอดภัย ประหยัดพลังงาน และใช้งานได้ยาวนาน — เกิดแสงสว่างรับประกอบตู้โหลด 3 เฟส พร้อมให้คำปรึกษาโดยทีมงานผู้เชี่ยวชาญ
          </p>
          <button onClick={() => onCategoryChange('loadcenter')} style={{ background:'#2563eb', color:'#fff', border:'none', borderRadius:'999px', padding:'12px 28px', fontSize:'15px', fontWeight:'700', cursor:'pointer' }}>ดูตู้โหลดเซนเตอร์ของเรา →</button>
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
  const drag  = React.useRef(null);
  const stage = React.useRef(null);

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
  // ต้องผูก wheel เองแบบ passive:false — ถ้าใช้ onWheel ของ React จะเป็น passive
  // ทำให้ preventDefault ไม่ทำงาน แล้วหน้าเว็บด้านหลังจะเลื่อนตามไปด้วยตอนหมุนล้อซูมรูป
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const handler = (e) => { e.preventDefault(); (e.deltaY < 0 ? zoomIn : zoomOut)(); };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const btn = { width:'40px', height:'40px', borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.14)', color:'#fff', fontSize:'18px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(6,20,16,0.93)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}
      onClick={onClose}>

      <div style={{ position:'absolute', top:'20px', right:'24px', zIndex:5 }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} title="ปิด (Esc)" style={{ ...btn, width:'42px', height:'42px' }}>✕</button>
      </div>

      {/* รูปสินค้า */}
      <div
        ref={stage}
        style={{ width:'90vw', maxWidth:'860px', height:'72vh', display:'flex', alignItems:'center', justifyContent:'center',
                 position:'relative', overflow:'hidden', userSelect:'none', touchAction:'none',
                 cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
        onClick={e => e.stopPropagation()}
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

const HP_LINE_URL = 'https://lin.ee/rAFJt2QD';

function hpCopyText(text) {
  if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).catch(() => {}); return; }
  // clipboard API ใช้ไม่ได้ถ้าไม่ได้เปิดผ่าน https (เช่นตอนทดสอบในเครื่อง)
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
}

// lin.ee ส่งข้อความล่วงหน้าไม่ได้ จึงคัดลอกข้อมูลสินค้าไว้ให้ลูกค้าวางในไลน์แทน
function hpProductLineText(p) {
  return 'สวัสดีครับ สนใจสินค้าจากหน้าเว็บครับ\n'
    + 'รุ่น: ' + p.code + '\n'
    + (p.name ? p.name + '\n' : '')
    + (p.brand ? 'แบรนด์: ' + p.brand + '\n' : '')
    + 'รบกวนขอราคาและรายละเอียดครับ';
}

// เปิดผู้ช่วย AI พร้อมบริบทสินค้า — วิดเจ็ตแชทถูกเรนเดอร์ที่ระดับ HPApp จึงสื่อสารผ่าน event
function hpAskAboutProduct(p) {
  window.dispatchEvent(new CustomEvent('hp-ask-product', { detail: p }));
}

function HPProductLineButton({ product }) {
  return (
    <a href={HP_LINE_URL} target="_blank" rel="noopener noreferrer"
      onClick={e => { e.stopPropagation(); hpCopyText(hpProductLineText(product)); }}
      title={`ทักไลน์เรื่อง ${product.code}`}
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'9px',
               background:'#06c755', color:'#fff', fontWeight:'700', textDecoration:'none',
               fontSize:'14.5px', padding:'13px 28px',
               borderRadius:'999px', boxShadow:'0 6px 18px rgba(6,199,85,0.3)' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
      สอบถามราคา/สั่งซื้อทาง LINE
    </a>
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
              <HPProductLineButton product={product}/>
              <button onClick={() => hpAskAboutProduct(product)}
                style={{ display:'inline-flex', alignItems:'center', gap:'9px', background:'#0d6b5c', color:'#fff', fontWeight:'700', fontSize:'14.5px', padding:'13px 28px', borderRadius:'999px', border:'none', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                สอบถามสินค้านี้
              </button>
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


// embedded = อยู่ในหน้าเดียว จึงโชว์ตัวอย่างแบรนด์ละไม่กี่รายการ
// ถ้าเทสินค้าทั้ง 6,000 รายการลงหน้าแรก หน้าจะยาว 400,000 px เลื่อนผ่านไปส่วนอื่นไม่ไหว
const HP_BRAND_PREVIEW_COUNT = 5;

function HPBrandProductsPage({ onSelectProduct, embedded, onViewAll, initialBrand }) {
  const [zoomProduct, setZoomProduct] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand || 'all');
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
        {!embedded && <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>หน้าหลัก › <span style={{ color:'#8bc83f', fontWeight:'700' }}>สินค้าตามแบรนด์</span></div>}

        <div className="hp-brand-layout" style={{ display:'flex', gap:'28px', alignItems:'flex-start' }}>
          {/* ตัวกรองแบรนด์เป็นของหน้าเต็ม ในหน้าเดียวไม่ต้องมี */}
          {!embedded && <div className="hp-brand-sidebar" style={{ width:'250px', flexShrink:0, border:'1px solid #eef0f2', borderRadius:'12px', overflow:'hidden', position:'sticky', top:'20px' }}>
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
          </div>}

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
              const card = (p, i) => {
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
                    {/* ปุ่มไลน์บนการ์ดถูกตัดออก — ผู้ช่วยมีปุ่มส่งต่อไลน์อยู่แล้ว ไม่ต้องซ้ำ */}
                    <button onClick={e => { e.stopPropagation(); hpAskAboutProduct(p); }}
                      style={{ width:'100%', marginTop:'10px', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px', background:'#fff', color:'#0d6b5c', border:'1px solid #cfe3dc', borderRadius:'999px', padding:'7px 8px', fontSize:'11.5px', fontWeight:'700', cursor:'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                      สอบถาม
                    </button>
                  </div>
                </div>
                );
              };
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
                    {(embedded || selectedBrand === 'all') && (
                      <button onClick={() => embedded ? (onViewAll && onViewAll(brandTab.key)) : setSelectedBrand(brandTab.key)}
                        style={{ fontSize:'13px', fontWeight:'700', color:'#0d5c50', background:'#fff', border:'1.5px solid #0d5c50', borderRadius:'999px', padding:'8px 18px', cursor:'pointer', whiteSpace:'nowrap' }}>
                        ดูสินค้าทั้งหมด {embedded ? `(${products.length} รายการ)` : ''} →
                      </button>
                    )}
                  </div>

                  {/* ในหน้าเดียวโชว์แค่ตัวอย่าง กดปุ่มด้านบนเพื่อดูครบทุกรายการในหน้าของแบรนด์ */}
                  {embedded ? (
                    <div className="hp-product-grid" style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'16px' }}>
                      {products.slice(0, HP_BRAND_PREVIEW_COUNT).map(card)}
                    </div>
                  ) : categories.map((cat, ci) => {
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
                          <div className="hp-product-grid" style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'16px', marginBottom:'8px' }}>
                            {catProducts.map(card)}
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

// รายชื่อแบรนด์ในแคตตาล็อก — ใช้ร่วมกันทั้งหน้าแคตตาล็อกและหน้าตั้งค่าเว็บไซต์ในระบบหลังบ้าน
const HP_CATALOG_BRANDS = [
    { name:'เกิดแสงสว่าง', color:'#0d5c50', img:'assets/kerd-cat.jpg', product:'assets/kerd-cat.jpg', hideLogoBar:true },
    { name:'Nano',       color:'#0d5c50', img:'assets/banner11.png',        product:'assets/nano.jpg.jpg', hideLogoBar:true },
    { name:'CHANG',      color:'#1e3a8a', img:'assets/banner2.png',         product:'assets/chang.png', hideLogoBar:true },
    { name:'Reckon',     color:'#29abe2', img:'assets/reckon.png',          product:'assets/reckon.png', hideLogoBar:true },
    { name:'AP',         color:'#e2231a', img:'assets/ap.png',              product:'assets/ap.png', hideLogoBar:true },
    { name:'Zeberg',     color:'#c2410c', img:'assets/zeberg.png',          product:'assets/zeberg.png', hideLogoBar:true },
    { name:'Sentoshi',   color:'#9a3412', img:'assets/sentoshi.png',        product:'assets/sentoshi.png', hideLogoBar:true },
    { name:'ท่อน้ำไทย',  color:'#1e40af', img:'assets/brand-thonamthai.jpg',       product:'assets/brand-thonamthai.jpg', hideLogoBar:true },
    { name:'Vena',       color:'#1e3a8a', img:'assets/brand-vena-cat.png',           product:'assets/brand-vena-cat.png', hideLogoBar:true },
    { name:'Sonic',      color:'#b91c1c', img:'assets/sonic.png',           product:'assets/sonic.png', hideLogoBar:true },
    { name:'SOKAWA',     color:'#1e3a8a', img:'assets/sokawa.png',          product:'assets/sokawa.png', hideLogoBar:true },
    { name:'GL',         color:'#8bc83f', img:'assets/brand-gl-engineering.jpg', product:'assets/brand-gl-engineering.jpg', hideLogoBar:true },
    { name:'Panasonic',  color:'#1e40af', img:'assets/panasonic.png',       product:'assets/panasonic.png', hideLogoBar:true },
    { name:'KJL',        color:'#1e3a8a', img:'assets/brand-kjl-cat.jpg',         product:'assets/brand-kjl-cat.jpg', hideLogoBar:true },
    { name:'SAFE-T-CUT', color:'#dc2626', img:'assets/safe-tcut.jpg',       product:'assets/safe-tcut.jpg', hideLogoBar:true },
    { name:'Lucky Misu', color:'#f59e0b', img:'assets/lucky misu.jpg',      product:'assets/lucky misu.jpg', hideLogoBar:true },
    { name:'iwachi',     color:'#3b5bdb', img:'assets/iwachi.jpg',          product:'assets/iwachi.jpg', hideLogoBar:true },
    { name:'Thongthai Bakelite', color:'#f97316', img:'assets/thongthai bikelite.png', product:'assets/thongthai bikelite.png', hideLogoBar:true },
    { name:'สายไฟ',      color:'#374151', img:'assets/cat-wire-coil.jpg',       product:'assets/cat-wire-coil.jpg', hideLogoBar:true },
    { name:'Nano LED',   color:'#8bc83f', img:'assets/nano led.png',        product:'assets/nano led.png', hideLogoBar:true },
];

function HPCatalogPage({ embedded }) {
  const [page, setPage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  // แคตตาล็อกตั้งค่าได้จากระบบหลังบ้าน (หน้า "ตั้งค่าเว็บไซต์") ไม่ต้องแก้โค้ด
  const [cfg, setCfg] = useState({});          // { ชื่อแบรนด์: { url, label, cta, hidden } }
  const [footerTxt, setFooterTxt] = useState('');
  useEffect(() => {
    hpApi('/settings').then(r => {
      const s = r.settings || {};
      let cat = s.catalog;
      // รองรับข้อมูลรูปแบบเดิมที่เก็บแค่ลิงก์
      if (!cat || !Object.keys(cat).length) {
        cat = {};
        for (const [k, v] of Object.entries(s.catalogUrls || {})) cat[k] = { url: v };
      }
      setCfg(cat);
      setFooterTxt(s.catalogFooter || '');
    }).catch(() => {});
  }, []);

  // แบรนด์ที่ตั้งให้ซ่อนจะไม่ถูกนับเป็นหน้าในแคตตาล็อกเลย
  const brands = HP_CATALOG_BRANDS.filter(x => !(cfg[x.name] && cfg[x.name].hidden));
  const total = brands.length;
  // ถ้าซ่อนจนหน้าที่เปิดอยู่หายไป ให้ถอยมาหน้าสุดท้ายที่ยังมี
  const idx = total ? Math.min(page, total - 1) : 0;
  const goTo = (n) => setPage(total ? ((n % total) + total) % total : 0);

  if (!total) {
    return (
      <section style={{ background:'#eef1ee', padding:'30px 0 56px', minHeight:'75vh' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 20px', textAlign:'center' }}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'60px 24px', color:'#8a9a92', fontSize:'15px' }}>
            ยังไม่มีหน้าแคตตาล็อกที่เปิดแสดงอยู่
          </div>
        </div>
      </section>
    );
  }

  const base = brands[idx];
  const set  = cfg[base.name] || {};
  const b = { ...base, url: set.url || '', name: set.label || base.name, cta: set.cta || '' };
  // แบรนด์ที่ใส่ลิงก์ไว้ กดที่รูปแล้วเปิดเว็บแบรนด์ในแท็บใหม่ / ที่ยังไม่ใส่ กดแล้วซูมดูรูปเหมือนเดิม
  const openBrandSite = () => window.open(b.url, '_blank', 'noopener,noreferrer');
  return (
    <section style={{ background:'#eef1ee', padding:'30px 0 56px', minHeight:'75vh' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 20px' }}>
        {!embedded && <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>หน้าหลัก › <span style={{ color:'#0d5c50', fontWeight:'700' }}>แคตตาล็อก</span></div>}

        {/* title */}
        <div style={{ textAlign:'center', marginBottom:'30px' }}>
          <h1 style={{ fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'32px', fontWeight:'800', color:'#0d5c50', letterSpacing:'-0.3px', marginBottom:'4px' }}>แคตตาล็อกสินค้า</h1>
          <div style={{ fontSize:'14px', color:'#999', fontWeight:'600', letterSpacing:'1px' }}>Catalog Product</div>
        </div>

        {/* book viewer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'18px' }}>
          <button onClick={() => goTo(idx - 1)}
            style={{ flexShrink:0, width:'46px', height:'46px', borderRadius:'50%', border:'1px solid #dfe3e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 10px rgba(0,0,0,0.06)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d5c50" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          {/* the page */}
          <div key={idx} className="hp-page-flip" style={{ position:'relative', width:'100%', maxWidth:'640px', aspectRatio:'3/4', background:'#fff', borderRadius:'4px 14px 14px 4px', boxShadow:'0 18px 40px rgba(0,0,0,0.16), inset -1px 0 0 rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* spine shadow */}
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'18px', background:'linear-gradient(90deg, rgba(0,0,0,0.14), transparent)', zIndex:3 }}/>
            {/* page-curl corner */}
            <div style={{ position:'absolute', right:0, bottom:0, width:'34px', height:'34px', background:'linear-gradient(135deg, transparent 50%, #e9ece9 50%)', boxShadow:'-2px -2px 6px rgba(0,0,0,0.06)', zIndex:3 }}/>
            {/* page number ribbon */}
            <div style={{ position:'absolute', top:'14px', right:'18px', fontSize:'12px', fontWeight:'700', color:'#9aa39c', zIndex:3, fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>หน้า {idx + 1} / {total}</div>

            <div style={{ flex:1, minHeight:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'18px', position:'relative', zIndex:2, cursor: b.url ? 'pointer' : 'zoom-in' }}
              title={b.url ? `เปิดเว็บไซต์ ${b.name}` : 'คลิกเพื่อขยายรูป'}
              onClick={() => b.url ? openBrandSite() : setZoomOpen(true)}>
              <img loading="lazy" decoding="async" src={b.product} style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={e => e.target.style.display='none'}/>
              {/* ปุ่มขยายรูป — แยกจากการกดรูป เพื่อให้ยังซูมดูได้แม้แบรนด์นั้นมีลิงก์เว็บ */}
              <div title="ขยายรูป" style={{ position:'absolute', bottom:'8px', right:'8px', width:'32px', height:'32px', borderRadius:'50%', background:'rgba(13,92,80,0.85)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-in' }}
                onClick={e => { e.stopPropagation(); setZoomOpen(true); }}>
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

            {/* footer strip — เป็นลิงก์ไปเว็บแบรนด์ถ้ามี url */}
            {b.url ? (
              <a href={b.url} target="_blank" rel="noopener noreferrer"
                style={{ background:'#0d5c50', color:'#fff', textAlign:'center', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'13px', fontWeight:'700', padding:'12px', letterSpacing:'0.03em', position:'relative', zIndex:2, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'background-color 0.18s ease' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0a4a40'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0d5c50'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>
                {b.cta || `เยี่ยมชมเว็บไซต์ ${b.name}`}
              </a>
            ) : (
              <div style={{ background:'#0d5c50', color:'#fff', textAlign:'center', fontFamily:'Inter, Noto Sans Thai, sans-serif', fontSize:'13px', fontWeight:'600', padding:'12px', letterSpacing:'0.03em', position:'relative', zIndex:2 }}>
                {footerTxt || 'KiRD SAENG SAWANG · CATALOG'}
              </div>
            )}
          </div>

          <button onClick={() => goTo(idx + 1)}
            style={{ flexShrink:0, width:'46px', height:'46px', borderRadius:'50%', border:'1px solid #dfe3e0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 10px rgba(0,0,0,0.06)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d5c50" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* thumbnail strip */}
        <div className="hp-scroll-hide" style={{ display:'flex', gap:'10px', overflowX:'auto', justifyContent:'flex-start', margin:'28px auto 0', maxWidth:'900px', padding:'6px' }}>
          {brands.map((t, i) => (
            <div key={i} onClick={() => goTo(i)} title={(cfg[t.name] && cfg[t.name].label) || t.name}
              style={{ flexShrink:0, width:'52px', height:'52px', borderRadius:'8px', border: i===idx ? '2px solid #0d5c50' : '1px solid #e2e6e3', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: i===idx ? 1 : 0.65, transition:'opacity 0.15s, border-color 0.15s' }}>
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

function HPContactPage({ embedded }) {
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
        {!embedded && <div style={{ fontSize:'14px', color:'#888', marginBottom:'22px' }}>หน้าหลัก › <span style={{ color:'#8bc83f', fontWeight:'700' }}>ติดต่อเรา</span></div>}

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

        {/* contact details — ข้อความกึ่งกลาง เรียบง่าย */}
        <div style={{ maxWidth:'720px', margin:'0 auto 40px', textAlign:'center' }}>
          <div style={{ fontSize:'15.5px', color:'#5a6a62', lineHeight:'1.8', marginBottom:'18px' }}>
            87/11-12 ซอยเอกชัย 76 แยก 2 แขวงคลองบางพราน เขตบางบอน กรุงเทพมหานคร 10150
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'8px 34px', fontSize:'15.5px', color:'#3a4a42' }}>
            <span>โทร. : <a href="tel:028944007" style={{ color:'#f05a20', fontWeight:'700', textDecoration:'none' }}>02-894-4007</a></span>
            <span>LINE : <a href="https://lin.ee/rAFJt2QD" target="_blank" rel="noopener noreferrer" style={{ color:'#06c755', fontWeight:'700', textDecoration:'none' }}>@kirdsaengsawang</a></span>
            <span>เวลาทำการ : <span style={{ fontWeight:'700', color:'#1a1a1a' }}>จันทร์ – เสาร์ 08:30 – 17:30 น.</span></span>
          </div>
        </div>

        {/* map — ขยายให้กว้างกว่าคอลัมน์ข้อความ (จัดกึ่งกลางหน้าจอ ไม่ทำให้เกิดสกรอลล์แนวนอน) */}
        <div style={{ position:'relative', left:'50%', transform:'translateX(-50%)', width:'min(1400px, 94vw)',
                      borderRadius:'18px', overflow:'hidden', boxShadow:'0 8px 26px rgba(15,77,42,0.12)', border:'1px solid #eaf3ed', background:'#fff', marginBottom:'24px' }}>
          <iframe title="แผนที่บริษัท เกิดแสงสว่าง จำกัด"
            src="https://maps.google.com/maps?q=13.6732332,100.4165502&z=17&output=embed"
            style={{ border:0, width:'100%', display:'block', height:'min(70vh, 640px)', minHeight:'440px' }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"/>
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
          <div className="hp-product-grid" style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'16px' }}>
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
    hpCan(user, 'products')    && ['products', 'จัดการสินค้า'],
    hpCan(user, 'sales')       && ['sales',    'ระบบเซลล์'],
    hpCan(user, 'editProduct') && ['settings', 'ตั้งค่าเว็บไซต์'],
    hpCan(user, 'users')       && ['users',    'จัดการผู้ใช้'],
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
        {tab === 'products' && hpCan(user, 'products')    && <HPAdminPanel user={user} onNavigate={onNavigate} onLogout={logout} embedded/>}
        {tab === 'sales'    && hpCan(user, 'sales')       && <HPSalesModule me={user}/>}
        {tab === 'settings' && hpCan(user, 'editProduct') && <HPSiteSettings/>}
        {tab === 'users'    && hpCan(user, 'users')       && <HPUsersManager me={user}/>}
      </div>
    </section>
  );
}

// ตั้งค่าเว็บไซต์ — แก้แคตตาล็อกและข้อมูลติดต่อได้เองจากหลังบ้าน โดยไม่ต้องแก้โค้ด
function HPSiteSettings() {
  const [catalog, setCatalog] = useState({});   // { ชื่อแบรนด์: { url, label, cta, hidden } }
  const [footer, setFooter]   = useState('');
  const [contact, setContact] = useState({ phone:'', lineId:'', lineUrl:'', hours:'', address:'' });
  const [openRow, setOpenRow] = useState(null);  // แบรนด์ที่กางอยู่
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [err, setErr]         = useState('');

  useEffect(() => {
    hpApi('/settings')
      .then(r => {
        const s = r.settings || {};
        // รองรับข้อมูลรูปแบบเดิมที่เก็บแค่ลิงก์ ให้ย้ายมาเป็นรูปแบบใหม่อัตโนมัติ
        let cat = s.catalog;
        if (!cat || !Object.keys(cat).length) {
          cat = {};
          for (const [k, v] of Object.entries(s.catalogUrls || {})) cat[k] = { url: v };
        }
        setCatalog(cat);
        setFooter(s.catalogFooter || '');
        setContact({ phone:'', lineId:'', lineUrl:'', hours:'', address:'', ...(s.contact || {}) });
      })
      .catch(e => setErr('โหลดการตั้งค่าไม่สำเร็จ: ' + e.message))
      .then(() => setLoading(false));
  }, []);

  const setField = (name, key, v) =>
    setCatalog(prev => ({ ...prev, [name]: { ...(prev[name] || {}), [key]: v } }));
  const rec = (name) => catalog[name] || {};

  const save = async () => {
    setErr(''); setMsg('');
    // ตรวจรูปแบบลิงก์ก่อนส่ง เพื่อบอกทันทีว่าช่องไหนผิด (เซิร์ฟเวอร์ตรวจซ้ำอีกชั้น)
    const badUrl = (v) => v && v.trim() && !/^https?:\/\//i.test(v.trim());
    const bad = Object.entries(catalog).find(([, v]) => badUrl(v.url));
    if (bad) { setOpenRow(bad[0]); setErr(`ลิงก์ของ ${bad[0]} ต้องขึ้นต้นด้วย https:// (หรือ http://)`); return; }
    if (badUrl(contact.lineUrl)) { setErr('ลิงก์ไลน์ต้องขึ้นต้นด้วย https:// (หรือ http://)'); return; }

    setSaving(true);
    try {
      const r = await hpApi('/settings', { method:'POST', body:{ settings:{ catalog, catalogFooter: footer, contact } } });
      const s = r.settings || {};
      setCatalog(s.catalog || {});
      setFooter(s.catalogFooter || '');
      setContact({ phone:'', lineId:'', lineUrl:'', hours:'', address:'', ...(s.contact || {}) });
      setMsg('✔ บันทึกแล้ว — กด Ctrl+F5 ที่หน้าเว็บเพื่อดูผล');
      setTimeout(() => setMsg(''), 4000);
    } catch (e) { setErr(e.message); }
    setSaving(false);
  };

  const inputCss = { width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #e2e6e3', borderRadius:'7px', outline:'none', fontFamily:'Inter, Noto Sans Thai, sans-serif' };
  const labelCss = { fontSize:'12.5px', fontWeight:'700', color:'#667', marginBottom:'5px', display:'block' };
  const cardCss  = { background:'#fff', borderRadius:'10px', border:'1px solid #eee', padding:'22px 24px', marginBottom:'16px' };

  const Field = ({ label, hint, children }) => (
    <div style={{ marginBottom:'14px' }}>
      <label style={labelCss}>{label}</label>
      {children}
      {hint && <div style={{ fontSize:'11.5px', color:'#9aa8a0', marginTop:'4px' }}>{hint}</div>}
    </div>
  );

  const filled = Object.values(catalog).filter(v => v && v.url && v.url.trim()).length;
  const hiddenCount = Object.values(catalog).filter(v => v && v.hidden).length;

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#888' }}>กำลังโหลดการตั้งค่า…</div>;

  return (
    <div>
      {err && <div style={{ background:'#fdecea', border:'1px solid #f5c6cb', color:'#b3261e', borderRadius:'8px', padding:'12px 16px', marginBottom:'14px', fontSize:'14px' }}>{err}</div>}
      {msg && <div style={{ background:'#e8f7ee', border:'1px solid #b7e4c7', color:'#0d6b3f', borderRadius:'8px', padding:'12px 16px', marginBottom:'14px', fontSize:'14px' }}>{msg}</div>}

      {/* ── หน้าแคตตาล็อก ── */}
      <div style={cardCss}>
        <div style={{ fontSize:'18px', fontWeight:'800', color:'#222', marginBottom:'6px' }}>หน้าแคตตาล็อก</div>
        <p style={{ fontSize:'14px', color:'#777', lineHeight:'1.8' }}>
          กดที่ชื่อแบรนด์เพื่อกางออกมาแก้ไข — ตั้งลิงก์เว็บไซต์ เปลี่ยนชื่อที่แสดง แก้ข้อความปุ่ม หรือซ่อนหน้านั้นออกจากแคตตาล็อกก็ได้
        </p>
        <div style={{ marginTop:'12px', fontSize:'13.5px', color:'#0d6b5c', fontWeight:'700' }}>
          ใส่ลิงก์แล้ว {filled} / {HP_CATALOG_BRANDS.length} แบรนด์
          {hiddenCount > 0 && <span style={{ color:'#c2410c' }}> · ซ่อนอยู่ {hiddenCount} หน้า</span>}
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:'10px', border:'1px solid #eee', overflow:'hidden', marginBottom:'16px' }}>
        {HP_CATALOG_BRANDS.map((b, i) => {
          const r = rec(b.name);
          const open = openRow === b.name;
          const url = r.url || '';
          const invalid = url.trim() && !/^https?:\/\//i.test(url.trim());
          return (
            <div key={b.name} style={{ borderTop: i ? '1px solid #f2f2f2' : 'none' }}>
              {/* แถวหัว — กดเพื่อกาง */}
              <div role="button" tabIndex={0}
                onClick={() => setOpenRow(open ? null : b.name)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenRow(open ? null : b.name); } }}
                style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 20px', cursor:'pointer', background: open ? '#f7fbf9' : 'transparent' }}>
                <span style={{ width:'8px', height:'8px', borderRadius:'50%', flexShrink:0, background: url.trim() ? '#22c55e' : '#d8dcd9' }}/>
                <span style={{ flex:1, minWidth:0, fontSize:'14.5px', fontWeight:'700', color: r.hidden ? '#aab' : '#333', textDecoration: r.hidden ? 'line-through' : 'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.label || b.name}
                  {r.label && r.label !== b.name && <span style={{ color:'#9aa8a0', fontWeight:'500' }}> (เดิม: {b.name})</span>}
                </span>
                {r.hidden && <span style={{ flexShrink:0, fontSize:'11.5px', fontWeight:'700', color:'#c2410c', background:'#fff1e8', borderRadius:'999px', padding:'3px 10px' }}>ซ่อนอยู่</span>}
                <span style={{ flexShrink:0, fontSize:'12.5px', color:'#0d6b5c', fontWeight:'700' }}>{open ? 'ปิด' : 'แก้ไข'}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa8a0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink:0, transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.18s' }}><path d="M6 9l6 6 6-6"/></svg>
              </div>

              {/* ฟอร์มแก้ไข */}
              {open && (
                <div style={{ padding:'4px 20px 20px', background:'#f7fbf9' }}>
                  <Field label="ลิงก์เว็บไซต์แบรนด์" hint="เว้นว่างได้ — ถ้าไม่ใส่ กดที่รูปจะเป็นการขยายดูรูปเหมือนเดิม">
                    <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                      <input value={url} onChange={e => setField(b.name, 'url', e.target.value)}
                        placeholder="https://www.example.com"
                        style={{ ...inputCss, borderColor: invalid ? '#e57373' : '#e2e6e3' }}/>
                      {url.trim() && !invalid && (
                        <a href={url.trim()} target="_blank" rel="noopener noreferrer" title="ทดสอบเปิดลิงก์"
                          style={{ flexShrink:0, fontSize:'13px', fontWeight:'700', color:'#0d6b5c', textDecoration:'none', whiteSpace:'nowrap' }}>ทดสอบ ↗</a>
                      )}
                    </div>
                  </Field>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                    <Field label="ชื่อที่แสดง" hint={`เว้นว่าง = ใช้ "${b.name}"`}>
                      <input value={r.label || ''} onChange={e => setField(b.name, 'label', e.target.value)}
                        placeholder={b.name} maxLength={60} style={inputCss}/>
                    </Field>
                    <Field label="ข้อความปุ่มด้านล่าง" hint={`เว้นว่าง = "เยี่ยมชมเว็บไซต์ ${r.label || b.name}"`}>
                      <input value={r.cta || ''} onChange={e => setField(b.name, 'cta', e.target.value)}
                        placeholder="เยี่ยมชมเว็บไซต์" maxLength={40} style={inputCss}/>
                    </Field>
                  </div>

                  <label style={{ display:'flex', alignItems:'center', gap:'9px', fontSize:'14px', color:'#444', cursor:'pointer', marginTop:'4px' }}>
                    <input type="checkbox" checked={!!r.hidden} onChange={e => setField(b.name, 'hidden', e.target.checked)}
                      style={{ width:'16px', height:'16px', cursor:'pointer' }}/>
                    ซ่อนหน้านี้ไม่ให้แสดงในแคตตาล็อก
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── แถบล่างแคตตาล็อก ── */}
      <div style={cardCss}>
        <div style={{ fontSize:'16px', fontWeight:'800', color:'#222', marginBottom:'12px' }}>แถบล่างหน้ากระดาษแคตตาล็อก</div>
        <Field label="ข้อความบนแถบเขียว" hint='เว้นว่าง = "KiRD SAENG SAWANG · CATALOG" (แถบนี้จะแสดงเฉพาะแบรนด์ที่ไม่ได้ใส่ลิงก์)'>
          <input value={footer} onChange={e => setFooter(e.target.value)}
            placeholder="KiRD SAENG SAWANG · CATALOG" maxLength={80} style={inputCss}/>
        </Field>
      </div>

      {/* ── ข้อมูลติดต่อ ── */}
      <div style={cardCss}>
        <div style={{ fontSize:'16px', fontWeight:'800', color:'#222', marginBottom:'6px' }}>ข้อมูลติดต่อ</div>
        <p style={{ fontSize:'13.5px', color:'#777', lineHeight:'1.8', marginBottom:'16px' }}>
          ใช้ร่วมกันในหน้า “ติดต่อเรา” และฟุตเตอร์ท้ายเว็บ — เว้นว่างช่องไหนไว้ ช่องนั้นจะใช้ค่าเดิมที่ตั้งไว้ในเว็บ
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <Field label="เบอร์โทรศัพท์">
            <input value={contact.phone} onChange={e => setContact(c => ({ ...c, phone:e.target.value }))}
              placeholder="02-894-4007" maxLength={60} style={inputCss}/>
          </Field>
          <Field label="เวลาทำการ">
            <input value={contact.hours} onChange={e => setContact(c => ({ ...c, hours:e.target.value }))}
              placeholder="จันทร์ – เสาร์ 08:30 – 17:30 น." maxLength={120} style={inputCss}/>
          </Field>
          <Field label="LINE ID">
            <input value={contact.lineId} onChange={e => setContact(c => ({ ...c, lineId:e.target.value }))}
              placeholder="@kirdsaengsawang" maxLength={60} style={inputCss}/>
          </Field>
          <Field label="ลิงก์เพิ่มเพื่อนไลน์">
            <input value={contact.lineUrl} onChange={e => setContact(c => ({ ...c, lineUrl:e.target.value }))}
              placeholder="https://lin.ee/..." maxLength={300} style={inputCss}/>
          </Field>
        </div>
        <Field label="ที่อยู่บริษัท">
          <textarea value={contact.address} onChange={e => setContact(c => ({ ...c, address:e.target.value }))}
            placeholder="87/11-12 ซอยเอกชัย 76 แยก 2 แขวงคลองบางพราน เขตบางบอน กรุงเทพมหานคร 10150"
            maxLength={300} rows={2} style={{ ...inputCss, resize:'vertical', lineHeight:'1.7' }}/>
        </Field>
      </div>

      <button onClick={save} disabled={saving}
        style={{ background: saving ? '#9bb8b1' : '#0d6b5c', color:'#fff', border:'none', borderRadius:'7px', padding:'12px 30px', fontSize:'15px', fontWeight:'700', cursor: saving ? 'default' : 'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>
        {saving ? 'กำลังบันทึก…' : 'บันทึกการตั้งค่า'}
      </button>
    </div>
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

// ผู้ช่วย AI รับเรื่องลูกค้า — ถามความต้องการ แล้วส่งต่อให้ทีมงานทางไลน์ OA
// มาสคอตผู้ช่วย — ช่างไฟใส่หมวกวิศวกร (วาดเป็น SVG จะได้คมทุกขนาดและไม่ต้องโหลดรูปเพิ่ม)
function HPEngineerIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" style={{ flexShrink:0, display:'block' }}>
      {/* กรอบวงกลมขาวแบบรูปโปรไฟล์ — ตัดตัวมาสคอตให้อยู่ในวง แล้วขยายหน้าให้ใหญ่เต็มวง */}
      <defs>
        <clipPath id="hpEngRing"><circle cx="24" cy="24" r="23"/></clipPath>
      </defs>
      <circle cx="24" cy="24" r="23" fill="#fff"/>
      <g clipPath="url(#hpEngRing)" transform="translate(2.4 2.6) scale(0.9)">
      {/* ไหล่ — เสื้อกรมท่า ปกแดง (โผล่แค่ช่วงล่างเพื่อให้ใบหน้าใหญ่ อ่านออกตอนย่อเหลือ 28px) */}
      <path d="M4 48c0-7.8 9-12.4 20-12.4S44 40.2 44 48z" fill="#22314e"/>
      <path d="M17.6 36.2 24 43.6l6.4-7.4c1.8.4 3.4 1 4.8 1.7L24 48 12.8 37.9c1.4-.7 3-1.3 4.8-1.7z" fill="#e0433a"/>
      {/* คอ */}
      <path d="M19.6 30h8.8v7.6c0 2.4-8.8 2.4-8.8 0z" fill="#e8ab7d"/>
      {/* ใบหู */}
      <ellipse cx="9.6" cy="25.6" rx="2.8" ry="3.5" fill="#f3c096"/>
      <ellipse cx="38.4" cy="25.6" rx="2.8" ry="3.5" fill="#f3c096"/>
      {/* ผมข้างหู */}
      <path d="M9.6 15h3.6v11a1.8 1.8 0 0 1-3.6 0z" fill="#33261e"/>
      <path d="M34.8 15h3.6v11a1.8 1.8 0 0 1-3.6 0z" fill="#33261e"/>
      {/* ใบหน้า */}
      <ellipse cx="24" cy="24" rx="13.2" ry="14" fill="#f6c9a0"/>
      {/* ตา */}
      <ellipse cx="18.4" cy="24.6" rx="4.1" ry="4.6" fill="#fff"/>
      <ellipse cx="29.6" cy="24.6" rx="4.1" ry="4.6" fill="#fff"/>
      <circle cx="19" cy="25" r="2.5" fill="#2b2118"/>
      <circle cx="30.2" cy="25" r="2.5" fill="#2b2118"/>
      <circle cx="19.9" cy="23.9" r="0.9" fill="#fff"/>
      <circle cx="31.1" cy="23.9" r="0.9" fill="#fff"/>
      {/* จมูกและปากยิ้ม */}
      <path d="M24 27.4v2.2" stroke="#d9a075" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M17.8 32c1.7 3.4 10.7 3.4 12.4 0z" fill="#7a2f2a"/>
      <path d="M19 32h10c-1.2 2.9-8.8 2.9-10 0z" fill="#fff"/>
      {/* หมวกนิรภัย */}
      <path d="M12.6 13.4C12.6 6 17.7 0.4 24 0.4S35.4 6 35.4 13.4z" fill="#f7b93f"/>
      <path d="M24 0.9v12.5M17.6 2.6c-1.7 3-2.5 7-2.5 11M30.4 2.6c1.7 3 2.5 7 2.5 11" stroke="#e0921a" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="2.6" y="12.4" width="42.8" height="5.4" rx="2.7" fill="#f5a623"/>
      <rect x="2.6" y="15.2" width="42.8" height="2.6" rx="1.3" fill="#e0921a"/>
      </g>
    </svg>
  );
}

function HPChatWidget() {
  const LINE = HP_LINE_URL;
  const SUMMARY_TAG = 'สรุปให้ทีมงาน:';
  const GREET = 'สวัสดีครับ 👋 ผมเป็นผู้ช่วยของเกิดแสงสว่าง\nไม่ทราบว่าวันนี้ต้องการอะไรครับ? บอกมาคร่าวๆ ได้เลย เดี๋ยวผมสรุปส่งให้ทีมงานดูแลต่อทางไลน์ครับ';
  const SUGGEST = ['อยากได้ราคา/ใบเสนอราคา', 'หาสินค้าอยู่', 'ปรึกษาเรื่องระบบไฟ'];
  const SUGGEST_PRODUCT = ['อยากได้ราคารุ่นนี้', 'ต้องการหลายชิ้น', 'มีของพร้อมส่งไหม'];
  const FORM_STEPS = [
    { key:'item',  label:'สินค้า/รุ่น',   q:'ต้องการสินค้าอะไรครับ? บอกรุ่นหรือลักษณะงานคร่าวๆ ได้เลยครับ' },
    { key:'qty',   label:'จำนวน',        q:'ต้องการจำนวนเท่าไรครับ?' },
    { key:'usage', label:'ใช้กับงาน',     q:'เอาไปใช้กับงานแบบไหนครับ เช่น บ้าน อาคาร โรงงาน' },
    { key:'name',  label:'ชื่อผู้ติดต่อ', q:'ขอชื่อผู้ติดต่อด้วยครับ' },
    { key:'tel',   label:'เบอร์/ไลน์',    q:'ขอเบอร์โทรหรือไอดีไลน์ไว้ติดต่อกลับครับ (ถ้าไม่สะดวก พิมพ์ว่า ข้าม ได้เลย)' },
  ];

  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState([{ role:'assistant', content: GREET, intro:true }]);
  const [input, setInput]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [copied, setCopied]   = useState(false);
  const [product, setProduct] = useState(null);
  // โหมดเก็บข้อมูลสำรอง — ใช้เมื่อผู้ช่วย AI ไม่พร้อม (ยังไม่ได้ตั้งคีย์ / โควตาหมด / เน็ตล่ม)
  // ถามทีละข้อจนครบแล้วสร้างลิสต์รูปแบบเดียวกับที่ AI สร้าง ปุ่มส่งไลน์จึงทำงานได้เหมือนกัน
  const [form, setForm]       = useState(null);   // { step, data }
  const bodyRef = React.useRef(null);

  // เปิดแชทจากหน้าสินค้า — เริ่มบทสนทนาใหม่โดยผูกกับสินค้าตัวที่ลูกค้ากดมา
  useEffect(() => {
    const onAsk = (e) => {
      const p = e.detail;
      if (!p) return;
      setProduct(p);
      setInput(''); setForm(null);
      setMsgs([{ role:'assistant', intro:true, content:
        'สวัสดีครับ 👋 สนใจ ' + p.code + (p.name ? ' (' + p.name + ')' : '') + ' ใช่ไหมครับ\n' +
        'ไม่ทราบว่าต้องการแบบไหนครับ? บอกจำนวนที่ต้องการหรืองานที่จะเอาไปใช้คร่าวๆ ได้เลย เดี๋ยวผมสรุปส่งให้ทีมงานดูแลต่อทางไลน์ครับ' }]);
      setOpen(true);
    };
    window.addEventListener('hp-ask-product', onAsk);
    return () => window.removeEventListener('hp-ask-product', onAsk);
  }, []);

  // ดึงลิสต์สรุปจากข้อความล่าสุดของผู้ช่วย (ทุกบรรทัดหลังหัวข้อ "สรุปให้ทีมงาน:")
  // ลิสต์นี้คือสิ่งที่จะยิงเข้าไลน์บริษัท ทีมงานจะได้เห็นครบโดยไม่ต้องเริ่มถามใหม่
  const summary = (() => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m.role !== 'assistant') continue;
      const at = m.content.indexOf(SUMMARY_TAG);
      if (at >= 0) return m.content.slice(at + SUMMARY_TAG.length).trim();
    }
    return '';
  })();

  // '' = ยังไม่ได้ส่ง · 'sent' = เข้าไลน์บริษัทแล้ว · 'copy' = ส่งเองไม่ได้ คัดลอกไว้ให้วางแทน
  const [sendState, setSendState] = useState('');
  const [sending, setSending]     = useState(false);
  useEffect(() => { setSendState(''); }, [summary]);

  const leadText = () => 'สวัสดีครับ ผมคุยกับผู้ช่วยหน้าเว็บมาแล้ว\n'
    + (product ? 'สินค้าที่สนใจ: ' + product.code + (product.name ? ' · ' + product.name : '') + '\n' : '')
    + summary;

  const sendLead = async () => {
    if (sending || !summary) return;
    setSending(true);
    let sent = false;
    try {
      const r = await fetch('/api/lead', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          summary,
          product: product ? { code:product.code, name:product.name } : undefined,
        }),
      });
      const data = await r.json().catch(() => ({}));
      sent = !!(r.ok && data.sent);
    } catch {}
    // ส่งเข้าไลน์ไม่ได้ (ยังไม่ได้ตั้งค่า หรือเน็ตล่ม) — คัดลอกไว้ให้ลูกค้าวางเองแทน จะได้ไม่เสียเรื่อง
    if (!sent) { hpCopyText(leadText()); setCopied(true); }
    setSendState(sent ? 'sent' : 'copy');
    setSending(false);
  };

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, busy, open]);

  // ---- โหมดเก็บข้อมูลสำรอง (ไม่ต้องพึ่ง AI) ----
  const formValue = (v) => {
    const s = (v || '').trim();
    return (!s || /^(ข้าม|ไม่ระบุ|ไม่มี|-|—)$/i.test(s)) ? 'ไม่ได้ระบุ' : s;
  };
  const askStep = (data, step) => {
    while (step < FORM_STEPS.length && data[FORM_STEPS[step].key]) step++;
    if (step < FORM_STEPS.length) {
      setForm({ step, data });
      setMsgs(m => [...m, { role:'assistant', content: FORM_STEPS[step].q }]);
      return;
    }
    // ครบแล้ว — สร้างลิสต์รูปแบบเดียวกับที่ AI สร้าง ปุ่มส่งไลน์จะจับได้เหมือนกัน
    setForm(null);
    const list = FORM_STEPS.map(s => `- ${s.label}: ${formValue(data[s.key])}`).join('\n');
    setMsgs(m => [...m, { role:'assistant', content:
      'ขอบคุณครับ 🙏 ผมสรุปตามนี้นะครับ กดปุ่มสีเขียวด้านล่างเพื่อส่งให้ทีมงานได้เลย\n\n' + SUMMARY_TAG + '\n' + list }]);
  };
  const startForm = (firstText) => {
    const data = {};
    if (product) data.item = product.code + (product.name ? ' · ' + product.name : '');
    else if (firstText && !SUGGEST.includes(firstText) && !SUGGEST_PRODUCT.includes(firstText)) data.item = firstText;
    setMsgs(m => [...m, { role:'assistant', content:
      'ขออภัยครับ ตอนนี้ผู้ช่วยอัจฉริยะไม่พร้อมใช้งาน ผมขอเก็บข้อมูลสั้นๆ แทน แล้วส่งให้ทีมงานดูแลต่อทางไลน์นะครับ' }]);
    askStep(data, 0);
  };

  const send = async (text) => {
    const q = (text != null ? text : input).trim();
    if (!q || busy) return;
    setInput('');
    // ส่งเฉพาะบทสนทนาจริง ไม่รวมข้อความทักทายที่ฝั่งเราสร้างเอง
    const next = [...msgs, { role:'user', content:q }];
    setMsgs(next);

    // อยู่ในโหมดเก็บข้อมูลอยู่แล้ว — ไม่ต้องยิงไปหลังบ้าน เก็บคำตอบแล้วถามข้อถัดไป
    if (form) {
      askStep({ ...form.data, [FORM_STEPS[form.step].key]: q }, form.step + 1);
      return;
    }

    setBusy(true);
    try {
      const r = await fetch('/api/chat', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          messages: next.filter(m => !m.intro).map(m => ({ role:m.role, content:m.content })),
          product: product ? { code:product.code, name:product.name, brand:product.brand, cat:product.cat, series:product.series } : undefined,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'ระบบขัดข้องชั่วคราว');
      setMsgs(m => [...m, { role:'assistant', content: data.reply }]);
    } catch (e) {
      // ผู้ช่วย AI ใช้ไม่ได้ ไม่ปล่อยให้ลูกค้าเจอทางตัน — สลับไปเก็บข้อมูลเองแทน
      startForm(q);
    }
    setBusy(false);
  };

  const bubble = (m, i) => (
    <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom:'10px' }}>
      <div style={{ maxWidth:'82%', padding:'10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: m.role === 'user' ? '#0d6b5c' : '#f1f5f3', color: m.role === 'user' ? '#fff' : '#26332e',
                    fontSize:'14.5px', lineHeight:'1.75', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
        {m.content}
      </div>
    </div>
  );

  return (
    <>
      {/* ปุ่มเปิดแชท */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="คุยกับผู้ช่วย"
          style={{ position:'fixed', left:'18px', bottom:'18px', zIndex:9998, display:'flex', alignItems:'center', gap:'9px',
                   background:'#0d6b5c', color:'#fff', border:'none', borderRadius:'999px', padding:'13px 20px',
                   fontSize:'14.5px', fontWeight:'700', cursor:'pointer', boxShadow:'0 8px 24px rgba(13,107,92,0.4)',
                   fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>
          <HPEngineerIcon size={28}/>
          สอบถามข้อมูล
        </button>
      )}

      {/* หน้าต่างแชท */}
      {open && (
        <div style={{ position:'fixed', left:'18px', bottom:'18px', zIndex:9998, width:'min(380px, calc(100vw - 36px))',
                      height:'min(560px, calc(100vh - 100px))', background:'#fff', borderRadius:'18px',
                      boxShadow:'0 18px 48px rgba(6,53,46,0.28)', border:'1px solid #e4ede9',
                      display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* หัวหน้าต่าง */}
          <div style={{ background:'#0d6b5c', color:'#fff', padding:'14px 16px', display:'flex', alignItems:'center', gap:'11px', flexShrink:0 }}>
            <img src="assets/logo-kss-trans.png" alt="" style={{ width:'30px', height:'30px', objectFit:'contain', filter:'brightness(0) invert(1)' }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'14.5px', fontWeight:'800' }}>ผู้ช่วยเกิดแสงสว่าง</div>
              <div style={{ fontSize:'11.5px', opacity:0.85 }}>ตอบคำถามเรื่องอุปกรณ์ไฟฟ้า</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="ปิด"
              style={{ background:'transparent', border:'none', color:'#fff', fontSize:'20px', cursor:'pointer', lineHeight:1, padding:'2px 4px' }}>✕</button>
          </div>

          {/* สินค้าที่กำลังคุยถึง — ลูกค้ากดมาจากหน้าสินค้าตามแบรนด์ */}
          {product && (
            <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:'9px', background:'#eef7f4', borderBottom:'1px solid #dcebe5', padding:'8px 12px' }}>
              <img src={(product.images && product.images[0]) || product.img} alt=""
                style={{ width:'30px', height:'30px', objectFit:'contain', background:'#fff', borderRadius:'6px', flexShrink:0 }}
                onError={e => { e.target.style.display = 'none'; }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'12px', fontWeight:'800', color:'#0d5c50', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.code}</div>
                <div style={{ fontSize:'11px', color:'#6b7f77', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</div>
              </div>
              <button onClick={() => setProduct(null)} aria-label="ล้างสินค้าที่เลือก"
                style={{ background:'transparent', border:'none', color:'#6b7f77', fontSize:'15px', cursor:'pointer', lineHeight:1, padding:'2px 4px' }}>✕</button>
            </div>
          )}

          {/* ข้อความ */}
          <div ref={bodyRef} style={{ flex:1, overflowY:'auto', padding:'16px', background:'#fbfdfc' }}>
            {msgs.map(bubble)}
            {busy && (
              <div style={{ fontSize:'13px', color:'#8fa39a', padding:'4px 2px' }}>กำลังพิมพ์…</div>
            )}
            {/* คำถามยอดฮิต — แสดงเฉพาะตอนยังไม่ได้เริ่มคุย */}
            {msgs.length === 1 && !busy && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', marginTop:'6px' }}>
                {(product ? SUGGEST_PRODUCT : SUGGEST).map(s => (
                  <button key={s} onClick={() => send(s)}
                    style={{ background:'#fff', border:'1px solid #cfe3dc', color:'#0d6b5c', borderRadius:'999px',
                             padding:'7px 13px', fontSize:'12.5px', fontWeight:'600', cursor:'pointer',
                             fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>{s}</button>
                ))}
              </div>
            )}
          </div>

          {/* ลิสต์ความต้องการที่ผู้ช่วยเก็บได้ — กดปุ่มเดียวยิงเข้าไลน์บริษัท */}
          {summary && (
            <div style={{ flexShrink:0, background:'#fff8e8', borderTop:'1px solid #f2e3bf', padding:'11px 13px', maxHeight:'42%', overflowY:'auto' }}>
              <div style={{ fontSize:'11.5px', fontWeight:'700', color:'#9a6b00', marginBottom:'5px' }}>ลิสต์ที่จะส่งให้ทีมงาน</div>
              <div style={{ fontSize:'12.5px', color:'#4a3a10', lineHeight:'1.65', marginBottom:'9px', whiteSpace:'pre-wrap' }}>{summary}</div>

              {sendState === 'sent' ? (
                <div>
                  <div style={{ background:'#e8f8f1', border:'1px solid #b9e4d3', color:'#0d6b5c', borderRadius:'8px', padding:'9px 10px', fontSize:'12.5px', fontWeight:'700', textAlign:'center', marginBottom:'7px' }}>
                    ✔ ส่งลิสต์เข้าไลน์บริษัทแล้ว ทีมงานจะติดต่อกลับครับ
                  </div>
                  <a href={LINE} target="_blank" rel="noopener noreferrer"
                    style={{ display:'block', textAlign:'center', fontSize:'12.5px', fontWeight:'700', color:'#06c755', textDecoration:'none' }}>
                    เปิดไลน์เพื่อคุยกับทีมงานต่อ →
                  </a>
                </div>
              ) : sendState === 'copy' ? (
                <div>
                  <div style={{ fontSize:'12px', color:'#8a6a10', lineHeight:'1.6', marginBottom:'7px' }}>
                    {copied ? 'คัดลอกลิสต์ไว้ให้แล้ว' : ''} กดเปิดไลน์แล้ววางในแชทได้เลยครับ
                  </div>
                  <a href={LINE} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'#06c755', color:'#fff',
                             borderRadius:'8px', padding:'10px', fontSize:'13px', fontWeight:'700', textDecoration:'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
                    เปิดไลน์แล้ววางลิสต์
                  </a>
                </div>
              ) : (
                <button onClick={sendLead} disabled={sending}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                           background: sending ? '#8ed9b0' : '#06c755', color:'#fff', border:'none', borderRadius:'8px', padding:'11px',
                           fontSize:'13.5px', fontWeight:'700', cursor: sending ? 'default' : 'pointer', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
                  {sending ? 'กำลังส่ง…' : 'ส่งลิสต์นี้ให้ทีมงานทางไลน์'}
                </button>
              )}
            </div>
          )}

          {/* ยังคุยไม่จบก็ทักไลน์เองได้ตลอด — ซ่อนตอนมีลิสต์แล้ว จะได้ไม่มีปุ่มเขียวซ้อนกันสองปุ่ม */}
          {!summary && (
            <a href={LINE} target="_blank" rel="noopener noreferrer"
              onClick={() => { if (product) hpCopyText(hpProductLineText(product)); }}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'#06c755', color:'#fff',
                       padding:'11px', fontSize:'13.5px', fontWeight:'700', textDecoration:'none', flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.27 1.96 6.16 4.95 7.87L6 21l3.24-1.62c.88.24 1.81.37 2.76.37 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/></svg>
              คุยกับทีมงานทางไลน์
            </a>
          )}

          {/* ช่องพิมพ์ */}
          <div style={{ display:'flex', gap:'8px', padding:'11px', borderTop:'1px solid #eef3f0', background:'#fff', flexShrink:0 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              maxLength={1000} placeholder="พิมพ์คำถามที่นี่…" disabled={busy}
              style={{ flex:1, minWidth:0, padding:'10px 13px', fontSize:'14px', border:'1px solid #dde7e2',
                       borderRadius:'999px', outline:'none', fontFamily:'Inter, Noto Sans Thai, sans-serif' }}/>
            <button onClick={() => send()} disabled={busy || !input.trim()} aria-label="ส่ง"
              style={{ width:'40px', height:'40px', flexShrink:0, borderRadius:'50%', border:'none',
                       background: (busy || !input.trim()) ? '#c3d4cd' : '#0d6b5c', color:'#fff',
                       cursor: (busy || !input.trim()) ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>

          <div style={{ fontSize:'10.5px', color:'#9fb0a8', textAlign:'center', padding:'0 12px 9px', background:'#fff', lineHeight:'1.5' }}>
            ผู้ช่วย AI อาจตอบผิดพลาดได้ · ราคาและสต็อกกรุณาสอบถามทางไลน์
          </div>
        </div>
      )}
    </>
  );
}

// ─── หน้าเดียวจบ (one-page) ───────────────────────────────────────────────────
// แต่ละส่วนถูกวางเรียงในหน้าแรก เลื่อนลงไล่ได้ตั้งแต่ต้นจนจบ
const HP_SECTIONS = {
  'หน้าแรก':'sec-home', 'home':'sec-home',
  'สินค้าตามแบรนด์':'sec-brands',
  'เกร็ดความรู้':'sec-knowledge',
  'แคตตาล็อก':'sec-catalog',
  'ติดต่อเรา':'sec-contact', 'ติดต่อ':'sec-contact',
};

// เดิมรอ IntersectionObserver บอกว่า "เลื่อนมาถึงแล้ว" ค่อยเรนเดอร์ + เฟดขึ้น
// แต่เบราว์เซอร์ในแอปไลน์ (และ WebView บางตัว) ไม่ยิงสัญญาณนี้ให้ตามปกติ
// เนื้อหาเลยค้างว่างถาวร — ตัดการพึ่งพา IntersectionObserver ทิ้ง
// เรนเดอร์เนื้อหาทันทีตอนหน้าโหลดเสร็จเสมอ ยังเฟดขึ้นได้เหมือนเดิมแค่ไม่ผูกกับการเลื่อน
// (เนื้อหาส่วนนี้เป็นแค่ตัวอย่างสินค้าไม่กี่ชิ้นต่อแบรนด์ ไม่ใช่ทั้ง 6,000 รายการ จึงเบาพอเรนเดอร์รวดเดียวได้)
function HPRevealSection({ id, nav, children }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div id={id} data-hpnav={nav}
      style={{ scrollMarginTop:'86px', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(18px)',
               transition:'opacity 0.45s ease, transform 0.45s ease' }}>
      {children}
    </div>
  );
}

function HPApp() {
  const [page,           setPage]          = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart,           setCart]           = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [brandFilter,    setBrandFilter]    = useState('all');   // แบรนด์ที่เลือกมาจากหน้าเดียว
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

  // เลื่อนไปยังส่วนในหน้าเดียว — ถ้ายังไม่เรนเดอร์ (ส่วนหนักถูกหน่วงไว้) ให้ลองซ้ำจนกว่าจะเจอ
  const scrollToSection = (id, tries = 0) => {
    const el = document.getElementById(id);
    if (!el) { if (tries < 20) setTimeout(() => scrollToSection(id, tries + 1), 80); return; }
    el.scrollIntoView({ behavior: tries ? 'auto' : 'smooth', block:'start' });
    // ส่วนล่างๆ อาจขยับหลังเนื้อหาโหลดเสร็จ เลยเล็งซ้ำอีกรอบให้ตรงหัวข้อ
    if (tries < 6) setTimeout(() => {
      const r = el.getBoundingClientRect();
      if (Math.abs(r.top - 86) > 40) scrollToSection(id, tries + 1);
    }, 260);
  };

  const onNavigate = (p) => {
    // เมนูหลัก 5 ตัวอยู่ในหน้าเดียวกันหมดแล้ว กดแล้วเลื่อนไปหาส่วนนั้นแทนการเปลี่ยนหน้า
    const secId = HP_SECTIONS[p];
    if (secId) {
      if (page !== 'home') { setPage('home'); setTimeout(() => scrollToSection(secId), 60); }
      else if (secId === 'sec-home') window.scrollTo({ top:0, behavior:'smooth' });
      else scrollToSection(secId);
      return;
    }
    if (p === 'home' || p === 'หน้าแรก') { setPage('home'); window.scrollTo(0,0); return; }
    if (p === 'cart')           { setPage('cart'); window.scrollTo(0,0); return; }
    if (p === 'สินค้าทั้งหมด') { setActiveCategory('all'); setPage('shop'); window.scrollTo(0,0); return; }
    if (p === 'ค้าส่ง')         { setPage('wholesale'); window.scrollTo(0,0); return; }
    if (p === 'ติดต่อเรา' || p === 'ติดต่อ') { setPage('contact'); window.scrollTo(0,0); return; }
    if (p === 'เกร็ดความรู้') { setPage('knowledge'); window.scrollTo(0,0); return; }
    if (p === 'mdb-article') { setPage('mdb-article'); window.scrollTo(0,0); return; }
    if (p === 'loadcenter3p-article') { setPage('loadcenter3p-article'); window.scrollTo(0,0); return; }
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
      <HPHeader page={page} cartCount={cart.length} onNavigate={onNavigate} onCategoryChange={onCategoryChange} onSearch={onSearch}/>
      <main style={{ flex:1 }}>
        {/* หน้าเดียวจบ — เลื่อนลงไล่ได้ครบทั้ง 5 ส่วน เมนูด้านบนไฮไลต์ตามส่วนที่ดูอยู่
            (data-hpnav = ชื่อเมนูที่จะไฮไลต์ · id = จุดที่เมนูเลื่อนมาหา) */}
        {page === 'home' && <>
          <div id="sec-home" data-hpnav="หน้าแรก" style={{ scrollMarginTop:'86px' }}>
            <HPHero onNavigate={onNavigate} onCategoryChange={onCategoryChange}/>
            <HPServiceBar onNavigate={onNavigate}/>
            <HPCategoryShowcase onCategoryChange={onCategoryChange}/>
            <HPProductGuide/>
            <HPBrandStrip/>
          </div>
          <HPRevealSection id="sec-brands" nav="สินค้าตามแบรนด์">
            <HPBrandProductsPage onSelectProduct={onSelectProduct} embedded
              onViewAll={(brandKey) => {
                setBrandFilter(brandKey); setPage('brands');
                // เลื่อนขึ้นบนสุดซ้ำหลังเรนเดอร์ด้วย ไม่งั้นเบราว์เซอร์จะยึดตำแหน่งเดิมไว้ (scroll anchoring)
                window.scrollTo(0,0);
                requestAnimationFrame(() => window.scrollTo(0,0));
                setTimeout(() => window.scrollTo(0,0), 120);
              }}/>
          </HPRevealSection>
          <HPRevealSection id="sec-knowledge" nav="เกร็ดความรู้">
            <HPKnowledgePage onCategoryChange={onCategoryChange} onNavigate={onNavigate} embedded/>
          </HPRevealSection>
          <HPRevealSection id="sec-catalog" nav="แคตตาล็อก">
            <HPCatalogPage embedded/>
          </HPRevealSection>
          <HPRevealSection id="sec-contact" nav="ติดต่อเรา">
            <HPContactPage embedded/>
          </HPRevealSection>
        </>}
        {page === 'shop' && <HPCategoryProductsPage activeCategory={activeCategory} onSelectProduct={onSelectProduct}/>}
        {page === 'wholesale' && <HPWholesalePage/>}
        {page === 'contact' && <HPContactPage/>}
        {page === 'knowledge' && <HPKnowledgePage onCategoryChange={onCategoryChange} onNavigate={onNavigate}/>}
        {page === 'mdb-article' && <HPMdbArticlePage onNavigate={onNavigate} onCategoryChange={onCategoryChange}/>}
        {page === 'loadcenter3p-article' && <HPLoadCenter3PArticlePage onNavigate={onNavigate} onCategoryChange={onCategoryChange}/>}
        {page === 'catalog' && <HPCatalogPage/>}
        {page === 'brands' && <HPBrandProductsPage key={brandFilter} onSelectProduct={onSelectProduct} initialBrand={brandFilter}/>}
        {page === 'product-detail' && <HPProductDetailPage product={selectedProduct} onBack={() => onNavigate('สินค้าตามแบรนด์')} onSelectProduct={onSelectProduct} onNavigate={onNavigate}/>}
        {page === 'member' && <HPMemberPage onNavigate={onNavigate}/>}
        {page === 'cart' && <HPCartPage cartItems={cart} onClear={() => setCart([])}/>}
        {page === 'admin' && <HPAdminPage onNavigate={onNavigate}/>}
      </main>
      <HPFooter onCategoryChange={onCategoryChange} onNavigate={onNavigate}/>
      <HPChatWidget/>
      <div className="hp-zoom-ctrl" style={{ position:'fixed', right:'18px', bottom:'18px', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', background:'#fff', borderRadius:'12px', boxShadow:'0 6px 20px rgba(0,0,0,0.18)', padding:'8px', zIndex:9999 }}>
        <button onClick={zoomIn} title="ซูมเข้า" style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'18px', fontWeight:'700', color:'#06352e', cursor:'pointer' }}>+</button>
        <button onClick={zoomReset} title="รีเซ็ตขนาด" style={{ width:'36px', height:'28px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'11px', fontWeight:'700', color:'#7a8a82', cursor:'pointer' }}>{Math.round(zoom * 100)}%</button>
        <button onClick={zoomOut} title="ซูมออก" style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'18px', fontWeight:'700', color:'#06352e', cursor:'pointer' }}>−</button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<HPApp/>);
