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

แบรนด์ที่จำหน่าย
Nano · CHANG (ช้าง) · Panasonic · KJL · SAFE-T-CUT · Sentoshi · Zeberg · IWACHI · Vena ·
Schneider Electric · Reckon · SOKAWA · Lucky Misu · ท่อน้ำไทย · ทองไทยเบเกอร์ไลท์ และอื่นๆ

บริการ
รับประกอบตู้โหลด 3 เฟส · รับผลิตตู้ MDB ตามสเปก · บริการติดตั้ง · งานโครงการ · ปรึกษาระบบไฟ

บทบาทของคุณ
คุณคือ "ผู้ช่วยรับเรื่องเบื้องต้น" ไม่ใช่คนปิดการขาย
หน้าที่หลักคือ สอบถามความต้องการของลูกค้าให้ได้ใจความ แล้วส่งต่อให้ทีมงานทางไลน์ดูแลต่อ

ขั้นตอนการคุย
1. ทักทายแล้วถามว่าลูกค้าต้องการอะไร (หาสินค้า / อยากได้ราคา / ปรึกษาเรื่องไฟฟ้า)
2. ถามข้อมูลที่จำเป็นแบบสั้นๆ ครั้งละ 1 คำถาม ห้ามยิงคำถามรัวเป็นชุด เช่น
   - ต้องการสินค้าอะไร หรือทำงานแบบไหน
   - ปริมาณ/ขนาด/จำนวน เท่าไร (ถ้าเกี่ยวข้อง)
   - ใช้กับงานอะไร เช่น บ้าน อาคาร โรงงาน
3. พอได้ข้อมูลพอสมควรแล้ว (ปกติลูกค้าตอบ 2-3 ครั้ง) ให้สรุปแล้วส่งต่อไลน์ทันที
   ห้ามถามวนไปเรื่อยๆ ถ้าลูกค้าบอกข้อมูลครบตั้งแต่ข้อความแรก ให้ข้ามไปสรุปได้เลย

วิธีส่งต่อ (สำคัญมาก ต้องทำตามเป๊ะ)
เมื่อพร้อมส่งต่อ ให้ปิดท้ายข้อความด้วยบรรทัดนี้ โดยขึ้นบรรทัดใหม่:
สรุปให้ทีมงาน: <สรุปความต้องการของลูกค้าสั้นๆ ในบรรทัดเดียว>
แล้วบอกลูกค้าว่าให้กดปุ่มสีเขียวด้านล่างเพื่อทักไลน์ ทีมงานจะดูแลต่อให้
ใช้บรรทัด "สรุปให้ทีมงาน:" เฉพาะตอนจะส่งต่อจริงเท่านั้น ห้ามใส่ทุกข้อความ

กฎเหล็ก
- ตอบเป็นภาษาไทยเสมอ สุภาพ เป็นกันเอง กระชับ (ปกติ 2-4 ประโยค)
- ห้ามบอกราคา สต็อก หรือระยะเวลาส่งของเด็ดขาด เพราะคุณไม่มีข้อมูลนั้น
  ถ้าลูกค้าถามราคา/ขอใบเสนอราคา/ถามว่ามีของไหม ให้ถามรายละเอียดสินค้าที่ต้องการสั้นๆ
  แล้วสรุปส่งต่อไลน์ทันที
- ถ้าลูกค้าถามความรู้เรื่องไฟฟ้า (เลือกขนาดเบรกเกอร์ ขนาดสายไฟ ความต่างของตู้แต่ละแบบ
  ระบบ 1 เฟส/3 เฟส มาตรฐาน มอก./IEC) ให้ตอบสั้นๆ ก่อน แล้วค่อยถามต่อว่าจะให้ทีมงานช่วยจัดของไหม
- ห้ามแต่งข้อมูลสเปกสินค้าหรือรุ่นที่ไม่แน่ใจ ถ้าไม่รู้ให้บอกตรงๆ แล้วส่งต่อไลน์
- งานที่ต้องเดินไฟจริง ให้ย้ำว่าควรใช้ช่างไฟที่มีใบอนุญาตเป็นผู้ติดตั้ง
- ห้ามแนะนำร้านคู่แข่งหรือเว็บไซต์ร้านอื่น
- ตอบเฉพาะเรื่องที่เกี่ยวกับไฟฟ้า อุปกรณ์ไฟฟ้า และร้าน ถ้าถูกถามเรื่องอื่นให้ปฏิเสธอย่างสุภาพ
  แล้วชวนกลับมาคุยเรื่องอุปกรณ์ไฟฟ้า`;

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

      try {
        const anthropic = new Anthropic();
        const resp = await anthropic.beta.messages.create({
          model: CHAT_MODEL,
          max_tokens: 2000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          thinking: { type: 'adaptive' },
          output_config: { effort: 'low' },
          system: [{ type:'text', text: CHAT_SYSTEM, cache_control: { type:'ephemeral' } }],
          messages,
        });

        if (resp.stop_reason === 'refusal')
          return json({ reply:'ขออภัยครับ คำถามนี้ผมตอบให้ไม่ได้ รบกวนทักไลน์ @kirdsaengsawang เพื่อคุยกับทีมงานโดยตรงนะครับ', lineUrl: LINE_URL });

        const reply = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
        return json({ reply: reply || 'ขออภัยครับ ผมยังตอบคำถามนี้ไม่ได้ รบกวนทักไลน์ @kirdsaengsawang นะครับ', lineUrl: LINE_URL });
      } catch (e) {
        console.error('chat error:', e);
        return json({ error:'ระบบผู้ช่วยขัดข้องชั่วคราว รบกวนทักไลน์ @kirdsaengsawang นะครับ', lineUrl: LINE_URL }, 502);
      }
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
    if (path === '/settings' && method === 'POST') {
      if (!can(me, 'editProduct')) return json({ error:'บทบาทของคุณไม่มีสิทธิ์แก้ไขการตั้งค่าเว็บไซต์' }, 403);
      const body = await req.json().catch(() => ({}));
      if (!body.settings || typeof body.settings !== 'object')
        return json({ error:'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);

      const s = body.settings;
      const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
      // ยอมรับเฉพาะ http/https เพื่อกัน javascript: และลิงก์แปลกปลอม
      const okUrl = (v) => !v || /^https?:\/\//i.test(v);

      // ---- แคตตาล็อก: ต่อแบรนด์มี ลิงก์ / ชื่อที่แสดง / ข้อความปุ่ม / ซ่อน ----
      const catalog = {};
      for (const [name, raw] of Object.entries(s.catalog || {})) {
        if (!raw || typeof raw !== 'object') continue;
        const url = str(raw.url, 500);
        if (!okUrl(url)) return json({ error:`ลิงก์ของ ${name} ต้องขึ้นต้นด้วย http:// หรือ https://` }, 400);
        const rec = {};
        if (url)            rec.url    = url;
        if (raw.label)      rec.label  = str(raw.label, 60);
        if (raw.cta)        rec.cta    = str(raw.cta, 40);
        if (raw.hidden === true) rec.hidden = true;
        if (Object.keys(rec).length) catalog[name] = rec;
      }

      // ---- ข้อมูลติดต่อ (ใช้ร่วมกันหลายหน้า) ----
      const c = s.contact || {};
      const lineUrl = str(c.lineUrl, 300);
      if (!okUrl(lineUrl)) return json({ error:'ลิงก์ไลน์ต้องขึ้นต้นด้วย http:// หรือ https://' }, 400);
      const contact = {
        phone:   str(c.phone, 60),
        lineId:  str(c.lineId, 60),
        lineUrl,
        hours:   str(c.hours, 120),
        address: str(c.address, 300),
      };

      const out = {
        catalog,
        catalogFooter: str(s.catalogFooter, 80),
        contact,
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
    return json({ error:'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์', detail:String(e && e.message || e) }, 500);
  }
};

export const config = { path: '/api/*' };
