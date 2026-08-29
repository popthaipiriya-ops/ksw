// ============================================================================
//  ระบบหลังบ้าน — ตรวจสอบสิทธิ์ฝั่งเซิร์ฟเวอร์ทั้งหมด
//  เบราว์เซอร์แก้ค่าอะไรก็ไม่มีผล เพราะทุกคำสั่งถูกตรวจซ้ำที่นี่
// ============================================================================
import { getStore } from '@netlify/blobs';
import Anthropic from '@anthropic-ai/sdk';

const STORE   = 'kss-admin';
const COOKIE  = 'kss_sess';
const TTL_SEC = 60 * 60 * 8;           // เซสชันอายุ 8 ชั่วโมง
const PBKDF2_ITER = 150000;

// ---------- ผู้ช่วย AI ตอบลูกค้า ----------
// endpoint นี้เปิดสาธารณะและมีค่าใช้จ่ายต่อข้อความ จึงต้องจำกัดปริมาณให้รัดกุม
const CHAT_MODEL      = 'claude-opus-5';
const CHAT_MAX_CHARS  = 1000;   // ความยาวข้อความลูกค้าต่อครั้ง
const CHAT_MAX_TURNS  = 20;     // จำนวนข้อความย้อนหลังที่ส่งเข้าโมเดล
const CHAT_RATE_MAX   = 30;     // จำนวนข้อความต่อ IP
const CHAT_RATE_WIN   = 60 * 60 * 1000;  // ต่อ 1 ชั่วโมง

const LINE_URL = 'https://lin.ee/rAFJt2QD';

const CHAT_SYSTEM = `คุณคือผู้ช่วยตอบคำถามลูกค้าของ "บริษัท เกิดแสงสว่าง จำกัด" (KiRD SAENG SAWANG CO.,LTD.)
ร้านจำหน่ายอุปกรณ์ไฟฟ้าครบวงจร ทั้งปลีกและส่ง ย่านบางบอน กรุงเทพฯ

ข้อมูลร้าน
- ที่อยู่: 87/11-12 ซอยเอกชัย 76 แยก 2 แขวงคลองบางพราน เขตบางบอน กรุงเทพมหานคร 10150
- โทร: 02-894-4007, 02-894-4008
- LINE Official: @kirdsaengsawang
- เวลาทำการ: จันทร์–เสาร์ 08:30–17:30 น. (หยุดวันอาทิตย์และวันหยุดนักขัตฤกษ์)

สินค้าที่จำหน่าย
เบรกเกอร์ · ตู้โหลดเซนเตอร์ · ตู้คอนซูมเมอร์ยูนิต · ตู้ MDB · ตู้สวิตช์บอร์ด · สายไฟ ·
หลอดไฟ/โคมไฟ LED · สวิตช์และเต้ารับ · ฝาหน้ากาก · คัตเอาท์ · ท่อร้อยสายไฟ · รางไฟ ·
บล็อคยาง · สายดินและล่อฟ้า · พัดลมดูดอากาศ · อุปกรณ์ฮาร์ดแวร์ไฟฟ้า

แบรนด์ที่มีสินค้าอยู่ในระบบจริง (ห้ามเพิ่มแบรนด์นอกรายการนี้เองเด็ดขาด)
CHANG (ตราช้าง) · NANO · KJL · IWACHI · FSL · GONGNIU/GONEO · BLUE CARBON ·
SAFE-T-CUT · IAMPONG (เอี่ยมพงศ์พัฒนา) · Panasonic · Sentoshi · Schneider Electric ·
RACER · ZEBERG · และแบรนด์สายไฟ BCC · YAZAKI · THAI UNION · UNITED · NNN
ถ้าลูกค้าถามถึงแบรนด์ที่ไม่อยู่ในรายการนี้ ห้ามตอบว่า "มี" หรือ "ไม่มี"
ให้บอกว่าต้องให้ทีมงานตรวจสอบให้ แล้วสรุปส่งต่อไลน์

บริการ
รับประกอบตู้โหลด 3 เฟส · รับผลิตตู้ MDB ตามสเปก · บริการติดตั้ง · งานโครงการ · ปรึกษาระบบไฟ

บทบาทของคุณ
คุณคือ "ผู้ช่วยรับเรื่องเบื้องต้น" ไม่ใช่คนปิดการขาย
หน้าที่หลักคือ สอบถามความต้องการของลูกค้าให้ได้ใจความ แล้วส่งต่อให้ทีมงานทางไลน์ดูแลต่อ

ขั้นตอนการคุย
1. ทักทายแล้วถามว่าลูกค้าต้องการอะไร (หาสินค้า / อยากได้ราคา / ปรึกษาเรื่องไฟฟ้า)
2. เก็บข้อมูลให้ครบ ถามครั้งละ 1 คำถาม ห้ามยิงคำถามรัวเป็นชุด สิ่งที่ต้องได้คือ
   - สินค้า/รุ่นที่ต้องการ (ถ้าลูกค้าไม่รู้รุ่น ให้ถามลักษณะงานหรือขนาดที่ใช้แทน)
   - จำนวนที่ต้องการ
   - ใช้กับงานอะไร เช่น บ้าน อาคาร โรงงาน
   - ชื่อผู้ติดต่อ และเบอร์โทรหรือไอดีไลน์ (ถามครั้งเดียว ถ้าลูกค้าไม่สะดวกให้ข้ามไป ห้ามคะยั้นคะยอ)
3. ได้ครบแล้ว หรือลูกค้าไม่อยากให้ข้อมูลเพิ่มแล้ว ให้สรุปทันที ห้ามถามวนไปเรื่อยๆ
   ถ้าลูกค้าบอกข้อมูลครบตั้งแต่ข้อความแรก ให้ข้ามไปสรุปได้เลย

วิธีส่งต่อ (สำคัญมาก ต้องทำตามเป๊ะ)
เมื่อพร้อมส่งต่อ ให้ปิดท้ายข้อความด้วยบล็อกนี้ ขึ้นบรรทัดใหม่ และต้องเป็นส่วนสุดท้ายของข้อความ
สรุปให้ทีมงาน:
- สินค้า/รุ่น: ...
- จำนวน: ...
- ใช้กับงาน: ...
- ชื่อผู้ติดต่อ: ...
- เบอร์/ไลน์: ...
- รายละเอียดเพิ่มเติม: ...
หัวข้อไหนไม่มีข้อมูล ให้ใส่ว่า "ไม่ได้ระบุ" ห้ามแต่งข้อมูลเอง
ก่อนบล็อกสรุป ให้บอกลูกค้าว่ากดปุ่มสีเขียวด้านล่างเพื่อส่งลิสต์นี้ให้ทีมงานทางไลน์
ใช้บล็อก "สรุปให้ทีมงาน:" เฉพาะตอนจะส่งต่อจริงเท่านั้น ห้ามใส่ทุกข้อความ

กฎการอ้างอิงข้อมูลสินค้า (สำคัญที่สุด ห้ามละเมิด)
ทุกครั้งที่ลูกค้าถามถึงสินค้า ระบบจะค้นฐานข้อมูลสินค้าจริงให้ก่อน
แล้วแนบผลค้นมาให้คุณในหัวข้อ "ผลค้นจากฐานข้อมูลสินค้าจริง"
- ผลค้นนั้นคือ "ความจริงชุดเดียว" ที่คุณอ้างอิงได้ ห้ามอ้างรุ่นหรือรหัสสินค้านอกผลค้นเด็ดขาด
- ถ้าระบบแจ้งว่า "ไม่พบรายการที่ตรงกับคำค้นนี้" แปลว่าคุณไม่มีข้อมูลรุ่นนั้น
  ห้ามตอบว่ามีของ ห้ามเดารหัสรุ่น ห้ามแต่งสเปก ให้บอกตรงๆ ว่าขอให้ทีมงานตรวจสอบให้
  แล้วเก็บรายละเอียดเพื่อสรุปส่งต่อไลน์
- ถ้าไม่มีหัวข้อผลค้นแนบมาเลย ให้ถือว่าคุณไม่มีข้อมูลสินค้า ห้ามเดาเช่นกัน
- ห้ามยืนยันว่าสินค้ารุ่นใด "มีของพร้อมส่ง" เพราะผลค้นบอกแค่ว่ามีรุ่นนี้ในแคตตาล็อก
  ไม่ได้บอกสต็อกคงเหลือ

กฎเหล็ก
- ตอบเป็นภาษาไทยเสมอ สุภาพ เป็นกันเอง กระชับ (ปกติ 2-4 ประโยค)
- ห้ามบอกราคา สต็อก หรือระยะเวลาส่งของเด็ดขาด เพราะคุณไม่มีข้อมูลนั้น
  ห้ามพิมพ์ตัวเลขคู่กับคำว่า "บาท" หรือสัญลักษณ์ ฿ ในทุกกรณี แม้ลูกค้าจะเป็นคนเอ่ยราคามาก่อน
  ถ้าลูกค้าถามราคา/ขอใบเสนอราคา/ถามว่ามีของไหม ให้ถามรายละเอียดสินค้าที่ต้องการสั้นๆ
  แล้วสรุปส่งต่อไลน์ทันที
- ช่องทางติดต่อที่พิมพ์ได้มีแค่ของบริษัทเท่านั้น: โทร 02-894-4007 / 02-894-4008
  และ LINE @kirdsaengsawang — ห้ามพิมพ์เบอร์โทร ไอดีไลน์ หรือลิงก์เว็บอื่นเด็ดขาด
- ถ้าลูกค้าถามความรู้เรื่องไฟฟ้า (เลือกขนาดเบรกเกอร์ ขนาดสายไฟ ความต่างของตู้แต่ละแบบ
  ระบบ 1 เฟส/3 เฟส มาตรฐาน มอก./IEC) ให้ตอบสั้นๆ ก่อน แล้วค่อยถามต่อว่าจะให้ทีมงานช่วยจัดของไหม
- ห้ามแต่งข้อมูลสเปกสินค้าหรือรุ่นที่ไม่แน่ใจ ถ้าไม่รู้ให้บอกตรงๆ แล้วส่งต่อไลน์
- งานที่ต้องเดินไฟจริง ให้ย้ำว่าควรใช้ช่างไฟที่มีใบอนุญาตเป็นผู้ติดตั้ง
- ห้ามแนะนำร้านคู่แข่งหรือเว็บไซต์ร้านอื่น
- ตอบเฉพาะเรื่องที่เกี่ยวกับไฟฟ้า อุปกรณ์ไฟฟ้า และร้าน ถ้าถูกถามเรื่องอื่นให้ปฏิเสธอย่างสุภาพ
  แล้วชวนกลับมาคุยเรื่องอุปกรณ์ไฟฟ้า`;

// ══════════════════════════════════════════════════════════════════════════════
//  ด่านตรวจคำตอบก่อนถึงลูกค้า
//  กฎในพรอมป์ต์เป็นแค่ "คำขอ" โมเดลพลาดได้เสมอ ด่านนี้คือตัวบังคับจริงระดับโค้ด
//  ครอบเฉพาะเรื่องที่ผิดแล้วลูกค้าเสียหายจริงและตรวจได้แน่นอน 100%:
//  ราคา · เบอร์โทร · ไอดีไลน์ · ลิงก์ภายนอก
//  (สเปกสินค้าตรวจด้วย regex ไม่ได้ จึงคุมด้วยการยัดข้อมูลจริงเข้าไปแทน — ดู CHAT_CATALOG)
// ══════════════════════════════════════════════════════════════════════════════
const OFFICIAL_PHONES  = ['028944007', '028944008'];
const OFFICIAL_LINE_ID = '@kirdsaengsawang';
const CHAT_SAFE_REPLY  =
  'ขออภัยครับ ข้อมูลส่วนนี้ผมยืนยันแทนทีมงานไม่ได้ (เช่น ราคา สต็อก หรือช่องทางติดต่อ)\n'
  + 'รบกวนทักไลน์ @kirdsaengsawang หรือโทร 02-894-4007 เพื่อคุยกับทีมงานโดยตรงนะครับ';

// คืนชื่อกฎที่ถูกละเมิด ('' = ผ่าน)
function chatReplyViolation(reply) {
  // ราคา — ผู้ช่วยไม่มีข้อมูลราคา ตัวเลขติดกับ บาท/฿ จึงผิดเสมอ
  if (/\d[\d,.]*\s*(บาท|฿)|฿\s*\d/.test(reply)) return 'price';

  // เบอร์โทร — ต้องเป็นเบอร์บริษัทเท่านั้น
  for (const m of reply.match(/0\d[\d\s-]{7,12}\d/g) || []) {
    if (!OFFICIAL_PHONES.includes(m.replace(/\D/g, ''))) return 'phone';
  }

  // ไอดีไลน์ — ต้องเป็นของบริษัทเท่านั้น
  for (const m of reply.match(/@[A-Za-z0-9._-]+/g) || []) {
    if (m.toLowerCase() !== OFFICIAL_LINE_ID) return 'line';
  }

  // ลิงก์ — กันแนะนำเว็บร้านอื่น
  for (const m of reply.match(/https?:\/\/\S+/gi) || []) {
    if (!m.startsWith(LINE_URL)) return 'url';
  }

  return '';
}

// แปลงผลค้นสินค้าจากหน้าเว็บเป็นบล็อกข้อเท็จจริงให้ผู้ช่วยอ้างอิง
// ข้อมูลนี้มาจากเบราว์เซอร์ จึงต้องล้างให้สะอาดก่อน กันการยัดคำสั่งปลอมเข้าพรอมป์ต์
function chatCatalogBlock(catalog, total, brands) {
  if (!Array.isArray(catalog)) return null;   // ไม่ได้ค้นมา
  const clean = (v, max) => String(v == null ? '' : v)
    .replace(/[\u0000-\u001f]+/g, ' ')   // ยุบอักขระควบคุม/ขึ้นบรรทัดใหม่ (ไม่แตะ '-' ที่รหัสรุ่นใช้)
    .trim().slice(0, max);

  const lines = catalog.slice(0, 12).map(f => {
    if (!f || typeof f !== 'object') return '';
    const code = clean(f.code, 80);
    if (!code) return '';
    const bits = [`รหัส/รุ่น: ${code}`];
    const name = clean(f.name, 160);   if (name)   bits.push(`ชื่อ: ${name}`);
    const brand = clean(f.brand, 60);  if (brand)  bits.push(`แบรนด์: ${brand}`);
    const cat = clean(f.cat, 80);      if (cat)    bits.push(`หมวด: ${cat}`);
    const series = clean(f.series, 80); if (series) bits.push(`ซีรีส์: ${series}`);
    return '- ' + bits.join(' · ');
  }).filter(Boolean);

  if (!lines.length) return 'ผลค้นจากฐานข้อมูลสินค้าจริง: ไม่พบรายการที่ตรงกับคำค้นนี้\n'
    + 'คุณจึงไม่มีข้อมูลสินค้าที่ลูกค้าถามถึง ห้ามยืนยันว่ามีของ ห้ามเดารหัสรุ่นหรือสเปก\n'
    + 'ให้บอกตรงๆ ว่าขอให้ทีมงานตรวจสอบให้ แล้วเก็บรายละเอียดเพื่อสรุปส่งต่อไลน์';

  // ยอดจริงกับรายชื่อแบรนด์ — สำคัญมาก เพราะรายการข้างบนถูกตัดเหลือ 12 ตัวอย่าง
  // ถ้าไม่บอก ผู้ช่วยจะนับจากรายการที่เห็นแล้วตอบลูกค้าว่าร้านมีแค่ 12 รุ่น ทั้งที่มีหลายร้อย
  const totalNum = Number.isFinite(+total) ? Math.trunc(+total) : 0;
  const brandList = [...new Set(
    (Array.isArray(brands) ? brands : []).slice(0, 15).map(b => clean(b, 60)).filter(Boolean)
  )];

  let out = 'ผลค้นจากฐานข้อมูลสินค้าจริง (อ้างอิงรุ่น/รหัสได้เฉพาะรายการนี้เท่านั้น):\n'
    + lines.join('\n')
    + '\nรายการข้างบนยืนยันแค่ว่า "มีรุ่นนี้ในแคตตาล็อก" ไม่ได้บอกราคาและไม่ได้บอกสต็อกคงเหลือ';
  if (totalNum > lines.length) {
    out += `\nคำค้นนี้ตรงกับสินค้าในระบบทั้งหมด ${totalNum} รายการ `
      + `ข้างบนเป็นเพียงตัวอย่าง ${lines.length} รายการแรกเท่านั้น\n`
      + `ถ้าจะบอกจำนวนให้ลูกค้า ต้องใช้ตัวเลข ${totalNum} ห้ามนับจากรายการตัวอย่างข้างบน`;
  }
  if (brandList.length) {
    out += '\nแบรนด์ที่ตรงกับคำค้นนี้มีเฉพาะ: ' + brandList.join(' · ') + '\n'
      + 'ถ้าลูกค้าถามหาแบรนด์ที่ไม่อยู่ในรายชื่อนี้ แปลว่าคำค้นไม่ได้ตรงกับแบรนด์นั้น '
      + 'ห้ามตอบว่าร้านมีแบรนด์นั้น และห้ามเสนอสินค้าข้างบนเสมือนเป็นแบรนด์ที่ลูกค้าถาม '
      + 'ให้บอกว่าขอให้ทีมงานตรวจสอบให้';
  }
  return out;
}

// รหัสที่ลูกค้าเอ่ยถึงแต่ค้นแล้วไม่มีในระบบ — ต้องบอกผู้ช่วยตรงๆ
// กันเคสที่ผลค้นมีสินค้าใกล้เคียงติดมา แล้วผู้ช่วยเข้าใจผิดว่ารหัสที่ถามมีอยู่จริง
function chatUnknownCodesBlock(codes) {
  if (!Array.isArray(codes)) return null;
  const list = codes
    .map(c => String(c == null ? '' : c).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 5);
  if (!list.length) return null;
  return 'ตรวจแล้ว: รหัส/รุ่นต่อไปนี้ที่ลูกค้าเอ่ยถึง ไม่มีอยู่ในฐานข้อมูลสินค้าของร้าน\n'
    + list.map(c => `- ${c}`).join('\n')
    + '\nห้ามตอบว่ามีรุ่นนี้ ห้ามแต่งสเปกของรุ่นนี้เด็ดขาด\n'
    + 'ให้บอกลูกค้าตรงๆ ว่าไม่พบรุ่นนี้ในระบบและขอให้ทีมงานตรวจสอบให้อีกครั้ง\n'
    + 'ถ้าในผลค้นมีสินค้าประเภทใกล้เคียง จะเสนอเป็น "ทางเลือกใกล้เคียง" ได้ แต่ต้องบอกชัดว่าไม่ใช่รุ่นที่ลูกค้าถาม';
}

// ══════════════════════════════════════════════════════════════════════════════
//  ออเดอร์จากหน้าเว็บ → ไลน์ทีมงาน
//  ทีมงานต้องอ้างอิงออเดอร์กันได้ จึงต้องมีเลขที่และเวลาที่อ่านง่ายติดไปด้วย
//  ใช้เวลาไทย (UTC+7) เสมอ ไม่ว่าเซิร์ฟเวอร์จะตั้งโซนเวลาอะไรไว้
// ══════════════════════════════════════════════════════════════════════════════
const thaiNow = () => new Date(Date.now() + 7 * 60 * 60 * 1000);

// 22/08/2026 13:45 น.
function thaiTimeText() {
  const d = thaiNow();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} น.`;
}

// เลขที่ออเดอร์ WEB-YYMMDD-NNN — เริ่มนับใหม่ทุกวัน
async function nextOrderNo() {
  const d = thaiNow();
  const p = (n) => String(n).padStart(2, '0');
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`;
  let n = 1;
  try {
    const seq = await readJson('orderseq', {});
    n = (Number(seq[ymd]) || 0) + 1;
    seq[ymd] = n;
    // เก็บย้อนหลังพอประมาณ ไม่ให้ไฟล์โตไปเรื่อยๆ
    const keep = Object.keys(seq).sort().slice(-14);
    await writeJson('orderseq', Object.fromEntries(keep.map(k => [k, seq[k]])));
  } catch (e) {
    console.error('order seq error:', e);   // นับไม่ได้ก็ยังต้องส่งออเดอร์ให้ทีมงานได้
  }
  return `WEB-${ymd}-${String(n).padStart(3, '0')}`;
}

// ข้อความออเดอร์ที่ทีมงานจะเห็นในไลน์
function orderMessage(orderNo, when, prodTxt, summary) {
  return 'ออเดอร์ใหม่จากเว็บไซต์\n'
    + `เลขที่: ${orderNo}\n`
    + `เวลา: ${when}\n`
    + (prodTxt ? `${prodTxt}\n` : '')
    + '--------------------\n'
    + summary
    + '\n--------------------\n'
    + 'ส่งอัตโนมัติจากหน้าเว็บ · กรุณาติดต่อกลับลูกค้า';
}

// ---------- กันเดารหัสผ่านหน้าล็อกอิน ----------
const LOGIN_MAX_FAIL = 5;                 // ผิดได้กี่ครั้ง
const LOGIN_WINDOW   = 15 * 60 * 1000;    // ภายในกี่นาที
const LOGIN_LOCK     = 15 * 60 * 1000;    // แล้วล็อกนานเท่าไร

const clientIp = (req) =>
  req.headers.get('x-nf-client-connection-ip')
  || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
  || 'unknown';
const loginKey = (ip) => 'ratelimit/login/' + String(ip).replace(/[^a-zA-Z0-9.:_-]/g, '_');

// เหลือเวลาโดนล็อกกี่วินาที (0 = ไม่ได้ถูกล็อก)
async function loginLockLeft(ip) {
  const rec = await readJson(loginKey(ip), null);
  if (!rec || !rec.until) return 0;
  const left = rec.until - Date.now();
  return left > 0 ? Math.ceil(left / 1000) : 0;
}
// นับครั้งที่ผิด — คืนจำนวนครั้งที่เหลือก่อนโดนล็อก (0 = ล็อกแล้ว)
async function loginFail(ip) {
  const key = loginKey(ip);
  const now = Date.now();
  let rec = await readJson(key, null);
  if (!rec || typeof rec.start !== 'number' || now - rec.start > LOGIN_WINDOW) rec = { start: now, count: 0 };
  rec.count += 1;
  if (rec.count >= LOGIN_MAX_FAIL) rec.until = now + LOGIN_LOCK;
  await writeJson(key, rec);
  return Math.max(0, LOGIN_MAX_FAIL - rec.count);
}
// ล็อกอินสำเร็จแล้วล้างตัวนับทิ้ง
async function loginReset(ip) {
  try { await store().delete(loginKey(ip)); } catch {}
}

// จำกัดจำนวนครั้งต่อ IP — กันค่าใช้จ่ายบานปลายจาก endpoint สาธารณะ
async function chatRateOk(ip) {
  const key = 'ratelimit/chat/' + (ip || 'unknown').replace(/[^a-zA-Z0-9.:_-]/g, '_');
  const now = Date.now();
  let rec = await readJson(key, null);
  if (!rec || typeof rec.start !== 'number' || now - rec.start > CHAT_RATE_WIN) {
    rec = { start: now, count: 0 };
  }
  if (rec.count >= CHAT_RATE_MAX) return false;
  rec.count += 1;
  await writeJson(key, rec);
  return true;
}

// ส่งลิสต์ความต้องการเข้าไลน์ OA — จำกัดจำนวนแยกจากแชท เพราะ endpoint คนละตัว
const LEAD_RATE_MAX = 10;
const LEAD_RATE_WIN = 60 * 60 * 1000;
async function leadRateOk(ip) {
  const key = 'ratelimit/lead/' + (ip || 'unknown').replace(/[^a-zA-Z0-9.:_-]/g, '_');
  const now = Date.now();
  let rec = await readJson(key, null);
  if (!rec || typeof rec.start !== 'number' || now - rec.start > LEAD_RATE_WIN) rec = { start: now, count: 0 };
  if (rec.count >= LEAD_RATE_MAX) return false;
  rec.count += 1;
  await writeJson(key, rec);
  return true;
}

// ลูกค้าแนบรูปสินค้าที่อยากถามในแชท — จำกัดแยกจาก /lead เพราะรูปกินพื้นที่เก็บมากกว่า
const CHATIMG_RATE_MAX = 15;
const CHATIMG_RATE_WIN = 60 * 60 * 1000;
async function chatImageRateOk(ip) {
  const key = 'ratelimit/chatimg/' + (ip || 'unknown').replace(/[^a-zA-Z0-9.:_-]/g, '_');
  const now = Date.now();
  let rec = await readJson(key, null);
  if (!rec || typeof rec.start !== 'number' || now - rec.start > CHATIMG_RATE_WIN) rec = { start: now, count: 0 };
  if (rec.count >= CHATIMG_RATE_MAX) return false;
  rec.count += 1;
  await writeJson(key, rec);
  return true;
}

// ---------- บทบาทและสิทธิ์ (แหล่งความจริงอยู่ที่เซิร์ฟเวอร์) ----------
const ROLES = {
  super: { products:true,  editProduct:true,  deleteProduct:true,  resetAll:true,  users:true,  sales:true },
  admin: { products:true,  editProduct:true,  deleteProduct:false, resetAll:false, users:false, sales:true },
  sales: { products:false, editProduct:false, deleteProduct:false, resetAll:false, users:false, sales:true },
};
const can = (user, what) => !!(user && ROLES[user.role] && ROLES[user.role][what]);

// ---------- helper ----------
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64uToBytes = (s) => {
  const p = s.replace(/-/g,'+').replace(/_/g,'/');
  const bin = atob(p + '='.repeat((4 - p.length % 4) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
};
const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...headers } });

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw new Error('SESSION_SECRET_MISSING');
  return s;
}

async function hashPassword(password, saltB64) {
  const salt = saltB64 ? b64uToBytes(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:PBKDF2_ITER, hash:'SHA-256' }, key, 256);
  return { salt: b64u(salt), hash: b64u(bits) };
}
// เทียบแบบ constant-time กันการเดารหัสจากเวลาตอบกลับ
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function signToken(payload) {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return body + '.' + b64u(sig);
}
async function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const expect = b64u(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
  if (!safeEqual(sig, expect)) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(b64uToBytes(body)));
    if (!p.exp || p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch { return null; }
}

const store = () => getStore(STORE);
async function readJson(key, fallback) {
  try { const v = await store().get(key, { type:'json' }); return v ?? fallback; }
  catch { return fallback; }
}
const writeJson = (key, value) => store().setJSON(key, value);

// ---------- ผู้ใช้ ----------
async function loadUsers() {
  let users = await readJson('users', null);
  if (Array.isArray(users) && users.length) return users;

  // ครั้งแรกสุด: สร้างแอดมินหลักจาก environment variable
  const u = process.env.BOOTSTRAP_ADMIN_USER;
  const p = process.env.BOOTSTRAP_ADMIN_PASS;
  if (!u || !p) return [];
  const { salt, hash } = await hashPassword(p);
  users = [{ id:'u1', username:u.toLowerCase(), name:'ผู้ดูแลระบบหลัก', role:'super', salt, hash, active:true, createdAt:Date.now() }];
  await writeJson('users', users);
  return users;
}
const publicUser = (u) => ({ id:u.id, username:u.username, name:u.name, role:u.role, active:u.active !== false });

function cookieFrom(req) {
  const raw = req.headers.get('cookie') || '';
  const m = raw.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
const setCookie = (token, maxAge) =>
  `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

async function currentUser(req) {
  const payload = await verifyToken(cookieFrom(req));
  if (!payload) return null;
  const users = await loadUsers();
  const u = users.find(x => x.id === payload.sub);
  if (!u || u.active === false) return null;
  // ถอนสิทธิ์ทันทีถ้าบทบาทถูกเปลี่ยนหลังออก token
  if (u.role !== payload.role) return null;
  return u;
}

// ============================================================================
export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/(?:\.netlify\/functions\/api|api)/, '') || '/';
  const method = req.method.toUpperCase();

  try { secret(); }
  catch { return json({ error:'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า SESSION_SECRET' }, 500); }

  try {
    // ---------- เข้าสู่ระบบ ----------
    if (path === '/auth/login' && method === 'POST') {
      const ip = clientIp(req);

      // กันเดารหัสผ่าน — ล็อกชั่วคราวเมื่อผิดติดกันหลายครั้ง
      const lock = await loginLockLeft(ip);
      if (lock > 0) {
        return json({ error:`ใส่รหัสผิดหลายครั้งเกินไป กรุณารออีก ${Math.ceil(lock / 60)} นาทีแล้วลองใหม่` },
                    429, { 'retry-after': String(lock) });
      }

      const { username, password } = await req.json().catch(() => ({}));
      if (!username || !password) return json({ error:'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, 400);

      const users = await loadUsers();
      if (!users.length) return json({ error:'ยังไม่ได้ตั้งค่าบัญชีผู้ดูแลระบบ (BOOTSTRAP_ADMIN_USER/PASS)' }, 503);

      const u = users.find(x => x.username === String(username).trim().toLowerCase());
      // คำนวณแฮชเสมอแม้ไม่เจอผู้ใช้ เพื่อไม่ให้เดาได้จากเวลาตอบกลับ
      const probe = await hashPassword(String(password), u ? u.salt : b64u(new Uint8Array(16)));
      if (!u || !safeEqual(probe.hash, u.hash) || u.active === false) {
        const left = await loginFail(ip);
        // ไม่บอกว่าผิดที่ชื่อผู้ใช้หรือรหัสผ่าน เพื่อไม่ให้เดาว่ามีบัญชีนี้อยู่จริงไหม
        return json({ error: left > 0
          ? `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลืออีก ${left} ครั้งก่อนถูกล็อกชั่วคราว)`
          : 'ใส่รหัสผิดหลายครั้งเกินไป บัญชีนี้ถูกล็อกชั่วคราว กรุณารอสักครู่' }, 401);
      }
      await loginReset(ip);
      const token = await signToken({ sub:u.id, role:u.role, exp: Math.floor(Date.now()/1000) + TTL_SEC });
      return json({ user: publicUser(u) }, 200, { 'set-cookie': setCookie(token, TTL_SEC) });
    }

    if (path === '/auth/logout' && method === 'POST')
      return json({ ok:true }, 200, { 'set-cookie': setCookie('', 0) });

    // อ่านข้อมูลสินค้าเปิดสาธารณะ (หน้าร้านต้องใช้แสดงผล) — แต่การ "แก้ไข" ต้องล็อกอิน
    if (path === '/products' && method === 'GET')
      return json({ products: await readJson('products', []) });

    // อ่านการตั้งค่าเว็บเปิดสาธารณะ (หน้าแคตตาล็อกต้องใช้แสดงลิงก์แบรนด์)
    if (path === '/settings' && method === 'GET')
      return json({ settings: await readJson('settings', {}) });

    // ---------- ผู้ช่วย AI ตอบลูกค้า (เปิดสาธารณะ ลูกค้าหน้าเว็บใช้ได้เลย) ----------
    if (path === '/chat' && method === 'POST') {
      if (!process.env.ANTHROPIC_API_KEY)
        return json({ error:'ระบบผู้ช่วยยังไม่ได้ตั้งค่า กรุณาทักไลน์ @kirdsaengsawang', lineUrl: LINE_URL }, 503);

      const ip = req.headers.get('x-nf-client-connection-ip')
              || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
      if (!(await chatRateOk(ip)))
        return json({ error:'คุยกันเยอะแล้ววันนี้ 😊 รบกวนทักไลน์ @kirdsaengsawang เพื่อคุยกับทีมงานโดยตรงนะครับ', lineUrl: LINE_URL }, 429);

      const body = await req.json().catch(() => ({}));
      const history = Array.isArray(body.messages) ? body.messages : [];

      // รับเฉพาะรูปแบบที่ต้องการ และตัดความยาวทิ้ง กันการยัดข้อความยาวผิดปกติ
      const messages = history
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
        .slice(-CHAT_MAX_TURNS)
        .map(m => ({ role: m.role, content: m.content.slice(0, CHAT_MAX_CHARS) }));

      if (!messages.length || messages[messages.length - 1].role !== 'user')
        return json({ error:'รูปแบบข้อความไม่ถูกต้อง' }, 400);

      // บริบทสินค้า — ส่งมาจากหน้าสินค้าตามแบรนด์ ผู้ช่วยจะได้รู้ว่าลูกค้ากำลังดูรุ่นไหนอยู่
      const system = [{ type:'text', text: CHAT_SYSTEM, cache_control: { type:'ephemeral' } }];
      const prod = body.product;
      if (prod && typeof prod === 'object') {
        const labels = { code:'รุ่น/รหัส', name:'ชื่อสินค้า', brand:'แบรนด์', cat:'หมวดหมู่', series:'ซีรีส์' };
        const lines = Object.keys(labels)
          .filter(k => typeof prod[k] === 'string' && prod[k].trim())
          .map(k => `${labels[k]}: ${prod[k].slice(0, 120)}`);
        if (lines.length) system.push({ type:'text', text:
          'ตอนนี้ลูกค้าเปิดหน้าสินค้าตัวนี้อยู่ ถ้าลูกค้าไม่ได้ระบุเป็นอย่างอื่น ให้ถือว่าคุยเรื่องสินค้าตัวนี้\n' +
          lines.join('\n') +
          '\nให้ถามความต้องการเพิ่ม เช่น จำนวนที่ต้องการ และงานที่จะเอาไปใช้ แล้วสรุปส่งทีมงาน โดยต้องมีรุ่น/รหัสสินค้าอยู่ในบรรทัดสรุปเสมอ' });
      }

      // ผลค้นจากแคตตาล็อกจริง — หัวใจของความแม่นยำ
      // ต้องแนบเสมอแม้ค้นไม่เจอ เพราะ "ไม่เจอ" ก็เป็นข้อเท็จจริงที่กันการเดาได้
      const catalogBlock = chatCatalogBlock(body.catalog, body.catalogTotal, body.catalogBrands);
      if (catalogBlock) system.push({ type:'text', text: catalogBlock });
      const unknownBlock = chatUnknownCodesBlock(body.unknownCodes);
      if (unknownBlock) system.push({ type:'text', text: unknownBlock });

      try {
        const anthropic = new Anthropic();
        const resp = await anthropic.beta.messages.create({
          model: CHAT_MODEL,
          max_tokens: 2000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          thinking: { type: 'adaptive' },
          output_config: { effort: 'low' },
          system,
          messages,
        });

        if (resp.stop_reason === 'refusal')
          return json({ reply:'ขออภัยครับ คำถามนี้ผมตอบให้ไม่ได้ รบกวนทักไลน์ @kirdsaengsawang เพื่อคุยกับทีมงานโดยตรงนะครับ', lineUrl: LINE_URL });

        const reply = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
        if (!reply)
          return json({ reply:'ขออภัยครับ ผมยังตอบคำถามนี้ไม่ได้ รบกวนทักไลน์ @kirdsaengsawang นะครับ', lineUrl: LINE_URL });

        // ด่านสุดท้าย — คำตอบที่ละเมิดกฎห้ามถึงมือลูกค้า ต่อให้โมเดลตั้งใจตอบดีก็ตาม
        const bad = chatReplyViolation(reply);
        if (bad) {
          console.error('chat reply blocked:', bad);
          return json({ reply: CHAT_SAFE_REPLY, blocked: bad, lineUrl: LINE_URL });
        }
        return json({ reply, lineUrl: LINE_URL });
      } catch (e) {
        console.error('chat error:', e);
        return json({ error:'ระบบผู้ช่วยขัดข้องชั่วคราว รบกวนทักไลน์ @kirdsaengsawang นะครับ', lineUrl: LINE_URL }, 502);
      }
    }

    // ---------- ส่งลิสต์ความต้องการของลูกค้าเข้าไลน์บริษัท (เปิดสาธารณะ) ----------
    // ต้องตั้ง LINE_CHANNEL_ACCESS_TOKEN (Messaging API) + LINE_TO (userId/groupId ผู้รับ)
    // ถ้ายังไม่ได้ตั้ง จะเก็บลิสต์ไว้ก่อนแล้วตอบ sent:false ให้หน้าเว็บสลับไปโหมดคัดลอกแทน
    if (path === '/lead' && method === 'POST') {
      const ip = clientIp(req);
      if (!(await leadRateOk(ip)))
        return json({ error:'ส่งบ่อยเกินไป รบกวนทักไลน์ @kirdsaengsawang โดยตรงนะครับ', lineUrl: LINE_URL }, 429);

      const body = await req.json().catch(() => ({}));
      const summary = typeof body.summary === 'string' ? body.summary.trim().slice(0, 2000) : '';
      if (!summary) return json({ error:'ไม่มีข้อมูลที่จะส่ง' }, 400);

      const p = body.product && typeof body.product === 'object' ? body.product : null;
      const code = p && typeof p.code === 'string' ? p.code.trim().slice(0, 80) : '';
      const pname = p && typeof p.name === 'string' ? p.name.trim().slice(0, 120) : '';
      const prodTxt = code ? `สินค้าที่ลูกค้าเปิดดู: ${code}${pname ? ' · ' + pname : ''}` : '';

      // รูปที่ลูกค้าแนบมาในแชท — รับเฉพาะพาธของ endpoint เราเท่านั้น กัน URL ปลอมหลุดเข้าไปในข้อความ LINE
      const imgUrl = typeof body.imageUrl === 'string' ? body.imageUrl : '';
      const validImg = /^\/api\/chat-image\/[A-Za-z0-9_-]+$/.test(imgUrl);
      const absImgUrl = validImg ? url.origin + imgUrl : '';

      const orderNo = await nextOrderNo();
      const when    = thaiTimeText();

      // เก็บออเดอร์ไว้เสมอ ต่อให้ส่งไลน์ไม่ผ่านก็ยังตามย้อนหลังได้
      try {
        const leads = await readJson('leads', []);
        leads.push({ orderNo, at: new Date().toISOString(), ip, product: prodTxt, summary, image: absImgUrl || undefined });
        await writeJson('leads', leads.slice(-500));
      } catch (e) { console.error('lead save error:', e); }

      const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      const to    = process.env.LINE_TO;
      if (!token || !to) {
        console.warn('lead: ยังไม่ได้ตั้ง LINE_CHANNEL_ACCESS_TOKEN / LINE_TO — เก็บออเดอร์อย่างเดียว');
        return json({ ok:true, sent:false, orderNo, reason:'unconfigured', lineUrl: LINE_URL });
      }
      try {
        const messages = [{ type:'text', text: orderMessage(orderNo, when, prodTxt, summary) }];
        // LINE ต้องดึงรูปจาก URL https สาธารณะเอง — local dev เป็น http จึงข้ามส่วนนี้ (ยังส่งข้อความได้ตามปกติ)
        if (absImgUrl && absImgUrl.startsWith('https://'))
          messages.push({ type:'image', originalContentUrl: absImgUrl, previewImageUrl: absImgUrl });

        const r = await fetch('https://api.line.me/v2/bot/message/push', {
          method:'POST',
          headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ to, messages }),
        });
        // LINE ตอบ 4xx เมื่อโทเคนผิด/หมดอายุ หรือ LINE_TO ไม่ถูกต้อง — ต้องเห็นใน log ให้ชัด
        if (!r.ok) throw new Error(`LINE push ${r.status} ${(await r.text()).slice(0, 300)}`);
        return json({ ok:true, sent:true, orderNo, lineUrl: LINE_URL });
      } catch (e) {
        console.error('lead push error:', e);
        return json({ ok:true, sent:false, orderNo, reason:'push-failed', lineUrl: LINE_URL });
      }
    }

    // ---------- รูปแคตตาล็อกที่แอดมินอัปโหลดเอง (เปิดสาธารณะ เพราะหน้าเว็บต้องแสดง) ----------
    if (path.startsWith('/catalog-image/') && method === 'GET') {
      const key = path.slice('/catalog-image/'.length);
      if (!/^[A-Za-z0-9_-]+$/.test(key)) return json({ error:'ชื่อไฟล์ไม่ถูกต้อง' }, 400);
      const rec = await readJson('catalogimg/' + key, null);
      if (!rec || !rec.data) return json({ error:'ไม่พบรูป' }, 404);
      const bytes = Buffer.from(rec.data, 'base64');
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': rec.type || 'image/jpeg',
          // ?v=... เปลี่ยนทุกครั้งที่อัปใหม่ จึงแคชยาวได้โดยไม่ค้างรูปเก่า
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // ---------- รูปที่ลูกค้าแนบมาในแชท (เปิดสาธารณะ) ----------
    // ต้องเปิดสาธารณะเพราะ LINE ต้องดึงรูปนี้ไปแสดงในข้อความ push ให้ทีมงาน
    if (path.startsWith('/chat-image/') && method === 'GET') {
      const key = path.slice('/chat-image/'.length);
      if (!/^[A-Za-z0-9_-]+$/.test(key)) return json({ error:'ชื่อไฟล์ไม่ถูกต้อง' }, 400);
      const rec = await readJson('chatimg/' + key, null);
      if (!rec || !rec.data) return json({ error:'ไม่พบรูป' }, 404);
      const bytes = Buffer.from(rec.data, 'base64');
      return new Response(bytes, {
        status: 200,
        headers: { 'Content-Type': rec.type || 'image/jpeg', 'Cache-Control': 'public, max-age=604800' },
      });
    }

    // อัปโหลดรูปที่ลูกค้าแนบมาในแชท — เปิดสาธารณะ (ไม่ต้องล็อกอิน) แต่จำกัดจำนวนต่อ IP
    // เก็บไว้เฉยๆ ไม่พยายามวิเคราะห์รูปเอง (ไม่มี AI ดูภาพ) แค่ส่งต่อให้ทีมงานดูเองทาง /lead
    if (path === '/chat-image' && method === 'POST') {
      const ip = clientIp(req);
      if (!(await chatImageRateOk(ip)))
        return json({ error:'แนบรูปบ่อยเกินไป รบกวนทักไลน์ @kirdsaengsawang โดยตรงนะครับ' }, 429);

      const body = await req.json().catch(() => ({}));
      const dataUrl = String(body.dataUrl || '');
      const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!m) return json({ error:'รองรับเฉพาะไฟล์รูป JPG / PNG / WEBP' }, 400);

      const [, type, b64] = m;
      if (b64.length > 4 * 1024 * 1024) return json({ error:'ไฟล์ใหญ่เกินไป (จำกัด 3MB)' }, 400);

      const key = crypto.randomUUID().replace(/-/g, '');
      await writeJson('chatimg/' + key, { type, data: b64, at: Date.now() });
      return json({ ok:true, url: `/api/chat-image/${key}` });
    }

    // ---------- ตั้งแต่บรรทัดนี้ ต้องล็อกอินแล้วเท่านั้น ----------
    const me = await currentUser(req);

    if (path === '/auth/me')
      return me ? json({ user: publicUser(me), can: ROLES[me.role] }) : json({ error:'ยังไม่ได้เข้าสู่ระบบ' }, 401);

    if (!me) return json({ error:'ยังไม่ได้เข้าสู่ระบบ' }, 401);

    // ---------- จัดการผู้ใช้ (แอดมินหลักเท่านั้น) ----------
    if (path === '/users') {
      if (!can(me, 'users')) return json({ error:'ไม่มีสิทธิ์เข้าถึงส่วนนี้' }, 403);
      const users = await loadUsers();

      if (method === 'GET') return json({ users: users.map(publicUser) });

      if (method === 'POST') {
        const body = await req.json().catch(() => ({}));
        const act = body.action;
        const activeSupers = (list) => list.filter(x => x.role === 'super' && x.active !== false).length;

        if (act === 'create') {
          const un = String(body.username || '').trim().toLowerCase();
          const nm = String(body.name || '').trim();
          const pw = String(body.password || '');
          if (!/^[a-z0-9._-]{3,}$/.test(un)) return json({ error:'ชื่อผู้ใช้ต้องเป็น a-z 0-9 . _ - และยาว 3 ตัวขึ้นไป' }, 400);
          if (!nm) return json({ error:'กรุณากรอกชื่อ-นามสกุล' }, 400);
          if (pw.length < 8) return json({ error:'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' }, 400);
          if (!ROLES[body.role]) return json({ error:'บทบาทไม่ถูกต้อง' }, 400);
          if (users.some(x => x.username === un)) return json({ error:'มีชื่อผู้ใช้นี้อยู่แล้ว' }, 409);
          const { salt, hash } = await hashPassword(pw);
          users.push({ id:'u' + Date.now(), username:un, name:nm, role:body.role, salt, hash, active:true, createdAt:Date.now() });
          await writeJson('users', users);
          return json({ users: users.map(publicUser) });
        }

        const target = users.find(x => x.id === body.id);
        if (!target) return json({ error:'ไม่พบผู้ใช้' }, 404);

        if (act === 'setRole') {
          if (target.id === me.id)      return json({ error:'เปลี่ยนบทบาทของตัวเองไม่ได้' }, 400);
          if (!ROLES[body.role])        return json({ error:'บทบาทไม่ถูกต้อง' }, 400);
          target.role = body.role;
          if (!activeSupers(users))     return json({ error:'ต้องมีแอดมินหลักที่ใช้งานอยู่อย่างน้อย 1 คน' }, 400);
        } else if (act === 'toggleActive') {
          if (target.id === me.id)      return json({ error:'ระงับบัญชีตัวเองไม่ได้' }, 400);
          target.active = target.active === false;
          if (!activeSupers(users))     return json({ error:'ต้องมีแอดมินหลักที่ใช้งานอยู่อย่างน้อย 1 คน' }, 400);
        } else if (act === 'edit') {
          const un = String(body.username || '').trim().toLowerCase();
          const nm = String(body.name || '').trim();
          if (!/^[a-z0-9._-]{3,}$/.test(un)) return json({ error:'ชื่อผู้ใช้ไม่ถูกต้อง' }, 400);
          if (!nm) return json({ error:'กรุณากรอกชื่อ-นามสกุล' }, 400);
          if (users.some(x => x.id !== target.id && x.username === un)) return json({ error:'มีชื่อผู้ใช้นี้อยู่แล้ว' }, 409);
          target.username = un; target.name = nm;
        } else if (act === 'resetPassword') {
          const pw = String(body.password || '');
          if (pw.length < 8) return json({ error:'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' }, 400);
          const { salt, hash } = await hashPassword(pw);
          target.salt = salt; target.hash = hash;
        } else if (act === 'delete') {
          if (target.id === me.id) return json({ error:'ลบบัญชีตัวเองไม่ได้' }, 400);
          const left = users.filter(x => x.id !== target.id);
          if (!activeSupers(left)) return json({ error:'ต้องมีแอดมินหลักที่ใช้งานอยู่อย่างน้อย 1 คน' }, 400);
          await writeJson('users', left);
          return json({ users: left.map(publicUser) });
        } else {
          return json({ error:'คำสั่งไม่ถูกต้อง' }, 400);
        }

        await writeJson('users', users);
        return json({ users: users.map(publicUser) });
      }
    }

    // ---------- สินค้า (override) ----------
    if (path === '/products') {
      if (method === 'GET') return json({ products: await readJson('products', []) });
      if (method === 'POST') {
        if (!can(me, 'editProduct')) return json({ error:'บทบาทของคุณไม่มีสิทธิ์แก้ไขสินค้า' }, 403);
        const body = await req.json().catch(() => ({}));
        if (!Array.isArray(body.products)) return json({ error:'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);
        await writeJson('products', body.products);
        return json({ ok:true, count: body.products.length });
      }
    }

    // ---------- ตั้งค่าเว็บไซต์ (แคตตาล็อก + ข้อมูลติดต่อ) ----------
    // ---------- อัปโหลดรูปหน้าแคตตาล็อก (แอดมินที่แก้สินค้าได้เท่านั้น) ----------
    if (path === '/catalog-image' && method === 'POST') {
      if (!can(me, 'editProduct')) return json({ error:'บทบาทของคุณไม่มีสิทธิ์อัปโหลดรูป' }, 403);
      const body = await req.json().catch(() => ({}));
      const key = String(body.key || '');
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(key)) return json({ error:'ชื่อรูปไม่ถูกต้อง' }, 400);

      const dataUrl = String(body.dataUrl || '');
      const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!m) return json({ error:'รองรับเฉพาะไฟล์รูป JPG / PNG / WEBP / GIF' }, 400);

      const [, type, b64] = m;
      // base64 ยาวกว่าไฟล์จริง ~33% — 4MB base64 ≈ ไฟล์ 3MB
      if (b64.length > 4 * 1024 * 1024) return json({ error:'ไฟล์ใหญ่เกินไป (จำกัด 3MB)' }, 400);

      await writeJson('catalogimg/' + key, { type, data: b64, at: Date.now() });
      return json({ ok:true, url: `/api/catalog-image/${key}?v=${Date.now()}` });
    }

    if (path === '/settings' && method === 'POST') {
      if (!can(me, 'editProduct')) return json({ error:'บทบาทของคุณไม่มีสิทธิ์แก้ไขการตั้งค่าเว็บไซต์' }, 403);
      const body = await req.json().catch(() => ({}));
      if (!body.settings || typeof body.settings !== 'object')
        return json({ error:'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);

      const s = body.settings;
      const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
      // ยอมรับเฉพาะ http/https เพื่อกัน javascript: และลิงก์แปลกปลอม
      const okUrl = (v) => !v || /^https?:\/\//i.test(v);
      const okImg = (v) => /^\/api\/catalog-image\/[A-Za-z0-9_-]+(\?v=\d+)?$/.test(v);

      // หลังบ้านมีหลายที่ที่บันทึกการตั้งค่าคนละส่วนกัน (ฟอร์ม "ตั้งค่าเว็บไซต์" กับ "โหมดแก้รูป")
      // ส่วนไหนไม่ได้ส่งมาในคำขอนี้ ต้องคงค่าเดิมไว้ ไม่ใช่ล้างทิ้ง
      const prev = (await readJson('settings')) || {};

      // ---- แคตตาล็อก: ต่อแบรนด์มี ลิงก์ / ชื่อที่แสดง / ข้อความปุ่ม / ซ่อน ----
      let catalog = prev.catalog || {};
      if ('catalog' in s) {
        catalog = {};
        for (const [name, raw] of Object.entries(s.catalog || {})) {
          if (!raw || typeof raw !== 'object') continue;
          const url = str(raw.url, 500);
          if (!okUrl(url)) return json({ error:`ลิงก์ของ ${name} ต้องขึ้นต้นด้วย http:// หรือ https://` }, 400);
          const rec = {};
          if (url)            rec.url    = url;
          if (raw.label)      rec.label  = str(raw.label, 60);
          if (raw.cta)        rec.cta    = str(raw.cta, 40);
          if (raw.hidden === true) rec.hidden = true;
          // รูปที่อัปโหลดเอง — รับเฉพาะพาธของ endpoint เราเท่านั้น
          // กันไม่ให้ยัดลิงก์ภายนอกหรือ javascript: เข้ามาเป็น src ของรูป
          const img = str(raw.img, 300);
          if (img) {
            if (!okImg(img)) return json({ error:`รูปของ ${name} ไม่ถูกต้อง` }, 400);
            rec.img = img;
          }
          if (Object.keys(rec).length) catalog[name] = rec;
        }
      }

      // ---- รูปภาพทั้งเว็บที่แอดมินเปลี่ยนเอง (โหมดแก้รูปบนหน้าเว็บจริง) ----
      // คีย์ = พาธรูปเดิมที่ฝังอยู่ในเว็บ เช่น assets/banner1.png
      // ค่า  = พาธรูปที่แอดมินอัปโหลดทับ ต้องเป็น endpoint ของเราเท่านั้น
      let images = prev.images || {};
      if ('images' in s) {
        images = {};
        for (const [slot, raw] of Object.entries(s.images || {})) {
          // ชื่อไฟล์รูปในเว็บมีทั้งเว้นวรรคและภาษาไทย จึงกันเฉพาะตัวที่อันตราย
          // (คีย์นี้เป็นแค่ชื่อช่องสำหรับเทียบ ไฟล์จริงเก็บด้วยชื่อที่แฮชมาอีกที)
          if (slot.length > 200 || slot.includes('..') || /[\u0000-\u001f\\<>"]/.test(slot))
            return json({ error:`รูปของ ${slot} ไม่ถูกต้อง` }, 400);
          const v = str(raw, 300);
          if (!v) continue;   // ค่าว่าง = คืนไปใช้รูปเดิมที่มากับเว็บ
          if (!okImg(v)) return json({ error:`รูปของ ${slot} ไม่ถูกต้อง` }, 400);
          images[slot] = v;
          if (Object.keys(images).length >= 500) break;
        }
      }

      // ---- ข้อมูลติดต่อ (ใช้ร่วมกันหลายหน้า) ----
      let contact = prev.contact || {};
      if ('contact' in s) {
        const c = s.contact || {};
        const lineUrl = str(c.lineUrl, 300);
        if (!okUrl(lineUrl)) return json({ error:'ลิงก์ไลน์ต้องขึ้นต้นด้วย http:// หรือ https://' }, 400);
        contact = {
          phone:   str(c.phone, 60),
          lineId:  str(c.lineId, 60),
          lineUrl,
          hours:   str(c.hours, 120),
          address: str(c.address, 300),
        };
      }

      const out = {
        catalog,
        catalogFooter: 'catalogFooter' in s ? str(s.catalogFooter, 80) : str(prev.catalogFooter, 80),
        contact,
        images,
        // เก็บรูปแบบเดิมไว้ด้วย เผื่อหน้าเว็บเวอร์ชันเก่ายังอ่านอยู่
        catalogUrls: Object.fromEntries(Object.entries(catalog).filter(([, v]) => v.url).map(([k, v]) => [k, v.url])),
      };
      await writeJson('settings', out);
      return json({ ok:true, settings: out });
    }

    // ---------- ใบเสนอราคา ----------
    if (path === '/quotes') {
      if (!can(me, 'sales')) return json({ error:'ไม่มีสิทธิ์เข้าถึงส่วนนี้' }, 403);
      const quotes = await readJson('quotes', []);
      if (method === 'GET') return json({ quotes });
      if (method === 'POST') {
        const body = await req.json().catch(() => ({}));
        if (body.action === 'create') {
          const q = body.quote || {};
          if (!q.cust?.name || !Array.isArray(q.items) || !q.items.length)
            return json({ error:'ต้องมีชื่อลูกค้าและรายการสินค้าอย่างน้อย 1 รายการ' }, 400);
          const no = 'QT' + new Date().toISOString().slice(2,10).replace(/-/g,'') + '-' + String(quotes.length + 1).padStart(3,'0');
          // ผู้ออกใบมาจากเซสชันเสมอ ไม่รับจากฝั่งเบราว์เซอร์
          const rec = { no, at:Date.now(), by:me.name, byUser:me.username, cust:q.cust, items:q.items, total:Number(q.total) || 0 };
          const next = [rec, ...quotes];
          await writeJson('quotes', next);
          return json({ quotes: next, created: no });
        }
        if (body.action === 'delete') {
          const next = quotes.filter(x => x.no !== body.no);
          await writeJson('quotes', next);
          return json({ quotes: next });
        }
        return json({ error:'คำสั่งไม่ถูกต้อง' }, 400);
      }
    }

    return json({ error:'ไม่พบปลายทางที่เรียก' }, 404);
  } catch (e) {
    // รายละเอียดข้อผิดพลาดลง log ของ Netlify เท่านั้น ไม่ส่งกลับให้ผู้เรียก
    // (ข้อความ error ภายในมักหลุดชื่อไฟล์/โครงสร้างระบบ ซึ่งเป็นข้อมูลให้คนไม่หวังดี)
    console.error('api error:', path, method, e);
    return json({ error:'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง' }, 500);
  }
};

export const config = { path: '/api/*' };
