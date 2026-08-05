// HPData.jsx — Shared data: categories, products, hero slides

const HP_CATEGORIES = [
  { id: 'wire',       label: 'สายไฟ',          img: 'assets/cat-wire.png' },
  { id: 'breaker',    label: 'เบรกเกอร์',      img: 'assets/cat-breaker.png' },
  { id: 'bulb',       label: 'หลอดไฟ',         img: 'assets/cat-bulb.png' },
  { id: 'switch',     label: 'สวิตซ์,ปลั๊ก',   img: 'assets/cat-switch.png' },
  { id: 'panel',      label: 'ตู้ไฟฟ้า',       img: 'assets/cat-panel.png' },
  { id: 'conduit',    label: 'ท่อร้อยสายไฟ',   img: 'assets/cat-conduit.png' },
  { id: 'cableduct',  label: 'รางเก็บสายไฟ',   img: 'assets/cat-cableduct.png' },
  { id: 'powerstrip', label: 'ปลั๊กราง',        img: 'assets/cat-powerstrip.png' },
  { id: 'cabletie',   label: 'เคเบิลไทร์',     img: 'assets/cat-cabletie.png' },
  { id: 'waterbox',   label: 'กล่องกันน้ำ',     img: 'assets/cat-waterbox.png' },
];

const HP_PRODUCTS = [
  { id:1,  name:'เบรกเกอร์ลูกย่อย 1P 10A',      brand:'CHANG',  cat:'breaker',    price:185,  oldPrice:240,  img:'assets/cat-breaker.png',    sold:42,  stock:100, installment:true },
  { id:2,  name:'หลอด LED 9W ขั้ว E27 เดย์ไลท์', brand:'Nano',   cat:'bulb',       price:65,   oldPrice:99,   img:'assets/cat-bulb.png',       sold:88,  stock:120, installment:false },
  { id:3,  name:'สายไฟ THW 2.5 sq.mm (100ม.)',   brand:'MISAWA', cat:'wire',       price:1190, oldPrice:1490, img:'assets/cat-wire.png',       sold:25,  stock:60,  installment:true },
  { id:4,  name:'สวิตซ์ + ปลั๊กคู่ พร้อมฝา',    brand:'CHANG',  cat:'switch',     price:95,   oldPrice:135,  img:'assets/cat-switch.png',     sold:64,  stock:90,  installment:false },
  { id:5,  name:'ปลั๊กราง 5 ช่อง สายยาว 3ม.',    brand:'Nano',   cat:'powerstrip', price:320,  oldPrice:450,  img:'assets/cat-powerstrip.png', sold:120, stock:150, installment:false },
  { id:6,  name:'ท่อร้อยสาย PVC 1/2" (3ม.)',     brand:'Nano',   cat:'conduit',    price:38,   oldPrice:55,   img:'assets/cat-conduit.png',    sold:200, stock:300, installment:false },
  { id:7,  name:'กล่องกันน้ำ IP65 ขนาด M',       brand:'Nano',   cat:'waterbox',   price:145,  oldPrice:210,  img:'assets/cat-waterbox.png',   sold:33,  stock:80,  installment:false },
  { id:8,  name:'เคเบิลไทร์ 4นิ้ว (100ชิ้น)',    brand:'',       cat:'cabletie',   price:35,   oldPrice:59,   img:'assets/cat-cabletie.png',   sold:310, stock:400, installment:false },
  { id:9,  name:'รางเก็บสายไฟ 2x4ซม. (2ม.)',     brand:'',       cat:'cableduct',  price:89,   oldPrice:120,  img:'assets/cat-cableduct.png',  sold:55,  stock:100, installment:false },
  { id:10, name:'ตู้คอนซูมเมอร์ยูนิต 10ช่อง',    brand:'CHANG',  cat:'panel',      price:1890, oldPrice:2450, img:'assets/cat-panel.png',      sold:18,  stock:40,  installment:true },
  { id:11, name:'หลอดฟลูออเรสเซนต์ LED 18W',     brand:'CHANG',  cat:'bulb',       price:145,  oldPrice:199,  img:'assets/cat-bulb.png',       sold:72,  stock:110, installment:false },
  { id:12, name:'สายไฟ VAF 2x1.5 sq.mm (100ม.)', brand:'MISAWA', cat:'wire',       price:890,  oldPrice:1150, img:'assets/cat-wire.png',       sold:41,  stock:70,  installment:true },
  { id:13, name:'เบรกเกอร์กันดูด RCBO 2P 32A',   brand:'CHANG',  cat:'breaker',    price:1290, oldPrice:1690, img:'assets/cat-breaker.png',    sold:12,  stock:30,  installment:true },
  { id:14, name:'สวิตซ์หรี่ไฟ Dimmer LED',        brand:'Nano',   cat:'switch',     price:285,  oldPrice:390,  img:'assets/cat-switch.png',     sold:29,  stock:60,  installment:false },
  { id:15, name:'ปลั๊กราง 3 ช่อง USB',           brand:'Nano',   cat:'powerstrip', price:450,  oldPrice:620,  img:'assets/cat-powerstrip.png', sold:95,  stock:130, installment:false },
];

const HP_HERO_SLIDES = [
  { bg:'linear-gradient(120deg, #1a3d1a 0%, #2e6b2e 100%)', tag:'มหกรรมลดราคา',  headline:'ครบเครื่อง เรื่องไฟฟ้า',     accent:'ลดสูงสุด 50%',     sub:'อุปกรณ์ไฟฟ้าครบวงจร ส่งตรงถึงหน้าบ้าน',                  cta:'ช้อปเลย',      img:'assets/product-display.png' },
  { bg:'linear-gradient(120deg, #7a2508 0%, #e8551c 100%)', tag:'บริการพิเศษ',    headline:'รับประกอบตู้โหลด 3 เฟส',    accent:'งานโครงการ',         sub:'LOAD CENTER • MDB ตามแบบ โดยช่างผู้เชี่ยวชาญ',            cta:'สอบถามบริการ', img:'assets/service-3phase.png' },
  { bg:'linear-gradient(120deg, #1a1a1a 0%, #2d2d2d 100%)', tag:'สมาชิกใหม่',     headline:'รับส่วนลดทันที',             accent:'ฟรีค่าจัดส่ง',       sub:'เมื่อสั่งซื้อครบ 500 บาท ทั่วประเทศไทย',                  cta:'สมัครสมาชิก',  img:'assets/product-display.png' },
];

Object.assign(window, { HP_CATEGORIES, HP_PRODUCTS, HP_HERO_SLIDES });
