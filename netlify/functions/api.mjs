// ============================================================================
//  ระบบหลังบ้าน — ตรวจสอบสิทธิ์ฝั่งเซิร์ฟเวอร์ทั้งหมด
//  เบราว์เซอร์แก้ค่าอะไรก็ไม่มีผล เพราะทุกคำสั่งถูกตรวจซ้ำที่นี่
// ============================================================================
import { getStore } from '@netlify/blobs';

const STORE   = 'kss-admin';
const COOKIE  = 'kss_sess';
const TTL_SEC = 60 * 60 * 8;           // เซสชันอายุ 8 ชั่วโมง
const PBKDF2_ITER = 150000;

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
      const { username, password } = await req.json().catch(() => ({}));
      if (!username || !password) return json({ error:'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, 400);

      const users = await loadUsers();
      if (!users.length) return json({ error:'ยังไม่ได้ตั้งค่าบัญชีผู้ดูแลระบบ (BOOTSTRAP_ADMIN_USER/PASS)' }, 503);

      const u = users.find(x => x.username === String(username).trim().toLowerCase());
      // คำนวณแฮชเสมอแม้ไม่เจอผู้ใช้ เพื่อไม่ให้เดาได้จากเวลาตอบกลับ
      const probe = await hashPassword(String(password), u ? u.salt : b64u(new Uint8Array(16)));
      if (!u || !safeEqual(probe.hash, u.hash) || u.active === false) {
        return json({ error:'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, 401);
      }
      const token = await signToken({ sub:u.id, role:u.role, exp: Math.floor(Date.now()/1000) + TTL_SEC });
      return json({ user: publicUser(u) }, 200, { 'set-cookie': setCookie(token, TTL_SEC) });
    }

    if (path === '/auth/logout' && method === 'POST')
      return json({ ok:true }, 200, { 'set-cookie': setCookie('', 0) });

    // อ่านข้อมูลสินค้าเปิดสาธารณะ (หน้าร้านต้องใช้แสดงผล) — แต่การ "แก้ไข" ต้องล็อกอิน
    if (path === '/products' && method === 'GET')
      return json({ products: await readJson('products', []) });

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
