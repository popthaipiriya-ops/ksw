# ============================================================================
#  เซิร์ฟเวอร์สำหรับพัฒนา/ใช้งานในเครื่อง — บริษัท เกิดแสงสว่าง จำกัด
#  มีระบบตรวจสอบสิทธิ์ฝั่งเซิร์ฟเวอร์เหมือนกับ netlify/functions/api.mjs
#  ข้อมูลเก็บในโฟลเดอร์ .data (ไม่ถูกอัปขึ้นเว็บจริง)
# ============================================================================
$ErrorActionPreference = 'Stop'
$port = if ($env:PORT) { $env:PORT } else { "4321" }
$url  = "http://localhost:$port/"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$data = Join-Path $root ".data"
if (-not (Test-Path $data)) { New-Item -ItemType Directory -Force $data | Out-Null }

$UTF8   = New-Object System.Text.UTF8Encoding($false)
$ITER   = 150000
$TTLSEC = 60 * 60 * 8

# ---------- กันเดารหัสผ่านหน้าล็อกอิน ----------
$LOGIN_MAX_FAIL = 5                 # ผิดได้กี่ครั้ง
$LOGIN_WINDOW   = 15 * 60 * 1000    # ภายในกี่นาที
$LOGIN_LOCK     = 15 * 60 * 1000    # แล้วล็อกนานเท่าไร
$LoginFail      = @{}               # นับในหน่วยความจำ (รีเซ็ตเมื่อรีสตาร์ทเซิร์ฟเวอร์)

# ---------- ผู้ช่วย AI ตอบลูกค้า ----------
# endpoint นี้เปิดสาธารณะและมีค่าใช้จ่ายต่อข้อความ จึงต้องจำกัดปริมาณให้รัดกุม
$CHAT_MODEL     = 'claude-opus-5'
$CHAT_MAX_CHARS = 1000            # ความยาวข้อความลูกค้าต่อครั้ง
$CHAT_MAX_TURNS = 20              # จำนวนข้อความย้อนหลังที่ส่งเข้าโมเดล
$CHAT_RATE_MAX  = 30              # จำนวนข้อความต่อ IP
$CHAT_RATE_WIN  = 60 * 60 * 1000  # ต่อ 1 ชั่วโมง
$ChatRate       = @{}             # นับจำนวนครั้งในหน่วยความจำ (รีเซ็ตเมื่อรีสตาร์ทเซิร์ฟเวอร์)
$LINE_URL       = 'https://lin.ee/rAFJt2QD'

# คีย์ Anthropic สำหรับทดสอบในเครื่อง
# ใช้ตัวแปรสภาพแวดล้อมก่อน ถ้าไม่มีค่อยอ่านจากไฟล์ .data\anthropic.key
# (.data ถูก .gitignore ไว้แล้ว คีย์จึงไม่หลุดขึ้น GitHub)
# อ่านทุกครั้งที่มีคนแชท เพื่อให้วางไฟล์คีย์แล้วใช้ได้เลยโดยไม่ต้องรีสตาร์ท
# ส่งลิสต์ความต้องการเข้าไลน์ OA ของบริษัท (LINE Messaging API)
# ต้องมี access token ของ Messaging API + ไอดีผู้รับ (userId หรือ groupId)
# ตั้งผ่าน env: LINE_CHANNEL_ACCESS_TOKEN / LINE_TO
# หรือไฟล์ .data\line.json = { "token": "...", "to": "..." }  (.data ไม่ขึ้น git)
$LEAD_RATE_MAX = 10                # ส่งลิสต์ได้กี่ครั้งต่อ IP
$LEAD_RATE_WIN = 60 * 60 * 1000    # ต่อ 1 ชั่วโมง
$LeadRate      = @{}
function Get-LinePush {
  $token = $env:LINE_CHANNEL_ACCESS_TOKEN
  $to    = $env:LINE_TO
  if (-not $token -or -not $to) {
    $lf = Join-Path $data 'line.json'
    if (Test-Path -LiteralPath $lf) {
      try {
        $o = ([System.IO.File]::ReadAllText($lf, [System.Text.Encoding]::UTF8)) | ConvertFrom-Json
        if (-not $token) { $token = [string]$o.token }
        if (-not $to)    { $to    = [string]$o.to }
      } catch {}
    }
  }
  if (-not $token -or -not $to) { return $null }
  return @{ token=$token; to=$to }
}

function Get-AnthropicKey {
  if ($env:ANTHROPIC_API_KEY) { return $env:ANTHROPIC_API_KEY }
  $kf = Join-Path $data 'anthropic.key'
  if (Test-Path -LiteralPath $kf) {
    $k = ([System.IO.File]::ReadAllText($kf, [System.Text.Encoding]::UTF8)).Trim()
    if ($k) { return $k }
  }
  return $null
}

$CHAT_SYSTEM = @'
คุณคือผู้ช่วยตอบคำถามลูกค้าของ "บริษัท เกิดแสงสว่าง จำกัด" (KiRD SAENG SAWANG CO.,LTD.)
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
  แล้วชวนกลับมาคุยเรื่องอุปกรณ์ไฟฟ้า
'@

# ---------- ไฟล์เก็บข้อมูล ----------
$fUsers   = Join-Path $data "users.json"
$fQuotes  = Join-Path $data "quotes.json"
$fProds   = Join-Path $data "products.json"
$fSetting = Join-Path $data "settings.json"
$fLeads   = Join-Path $data "leads.json"
$fSecret  = Join-Path $data "secret.key"

function Read-Json([string]$path, $fallback) {
  if (-not (Test-Path $path)) { return $fallback }
  try {
    $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    if (-not $raw.Trim()) { return $fallback }
    $o = $raw | ConvertFrom-Json
    if ($null -eq $o) { return $fallback }
    return $o
  } catch { return $fallback }
}
# บังคับให้เขียนเป็น JSON array เสมอ (ถ้ามีสมาชิกเดียว PowerShell จะเขียนเป็น object)
function Write-Json([string]$path, $obj) {
  $json = ConvertTo-Json -InputObject @($obj) -Depth 12 -Compress
  [System.IO.File]::WriteAllText($path, $json, $UTF8)
}
# เขียน JSON แบบ object เดี่ยว (ไม่ห่อเป็น array) — ใช้กับ settings.json
function Write-JsonObj([string]$path, $obj) {
  $json = ConvertTo-Json -InputObject $obj -Depth 12 -Compress
  [System.IO.File]::WriteAllText($path, $json, $UTF8)
}
# ตัดช่องว่างหัวท้ายและจำกัดความยาว (รับ $null ได้)
function Trim-Max($v, [int]$max) {
  $s = ([string]$v).Trim()
  if ($s.Length -gt $max) { $s = $s.Substring(0, $max) }
  return $s
}
# แปลง PSCustomObject ที่อ่านจาก JSON ให้เป็น hashtable ธรรมดา
function To-Hashtable($o) {
  $h = @{}
  if ($null -eq $o) { return $h }
  foreach ($p in $o.PSObject.Properties) { $h[$p.Name] = $p.Value }
  return $h
}

# ---------- crypto ----------
function To-B64Url([byte[]]$bytes) {
  [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}
function From-B64Url([string]$s) {
  $t = $s.Replace('-','+').Replace('_','/')
  switch ($t.Length % 4) { 2 { $t += '==' } 3 { $t += '=' } }
  [Convert]::FromBase64String($t)
}
function Get-Secret {
  if ($env:SESSION_SECRET -and $env:SESSION_SECRET.Length -ge 24) { return $env:SESSION_SECRET }
  if (Test-Path $fSecret) { return [System.IO.File]::ReadAllText($fSecret, [System.Text.Encoding]::UTF8).Trim() }
  $rnd = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($rnd)
  $s = To-B64Url $rnd
  [System.IO.File]::WriteAllText($fSecret, $s, $UTF8)
  return $s
}
function Hash-Password([string]$password, [string]$saltB64) {
  if ($saltB64) { $salt = From-B64Url $saltB64 }
  else {
    $salt = New-Object byte[] 16
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($salt)
  }
  $kdf = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($password, $salt, $ITER, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
  $bits = $kdf.GetBytes(32)
  $kdf.Dispose()
  return @{ salt = (To-B64Url $salt); hash = (To-B64Url $bits) }
}
function Safe-Equal([string]$a, [string]$b) {
  if (-not $a -or -not $b -or $a.Length -ne $b.Length) { return $false }
  $diff = 0
  for ($i = 0; $i -lt $a.Length; $i++) { $diff = $diff -bor ([int][char]$a[$i] -bxor [int][char]$b[$i]) }
  return ($diff -eq 0)
}
function Sign-Token($payload) {
  $body = To-B64Url ([System.Text.Encoding]::UTF8.GetBytes(($payload | ConvertTo-Json -Compress)))
  # ต้องใส่ , หน้าอาร์เรย์ ไม่งั้น PowerShell จะกระจาย byte เป็นอาร์กิวเมนต์ทีละตัว
  $keyBytes = [System.Text.Encoding]::UTF8.GetBytes((Get-Secret))
  $h = New-Object System.Security.Cryptography.HMACSHA256(,$keyBytes)
  $sig = To-B64Url ($h.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($body)))
  $h.Dispose()
  return "$body.$sig"
}
function Verify-Token([string]$token) {
  if (-not $token -or -not $token.Contains('.')) { return $null }
  $parts = $token.Split('.')
  if ($parts.Count -ne 2) { return $null }
  $keyBytes = [System.Text.Encoding]::UTF8.GetBytes((Get-Secret))
  $h = New-Object System.Security.Cryptography.HMACSHA256(,$keyBytes)
  $expect = To-B64Url ($h.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($parts[0])))
  $h.Dispose()
  if (-not (Safe-Equal $parts[1] $expect)) { return $null }
  try {
    $p = [System.Text.Encoding]::UTF8.GetString((From-B64Url $parts[0])) | ConvertFrom-Json
    $now = [int][double]::Parse((Get-Date -UFormat %s))
    if (-not $p.exp -or $p.exp -lt $now) { return $null }
    return $p
  } catch { return $null }
}

# ---------- บทบาทและสิทธิ์ (แหล่งความจริงอยู่ที่นี่) ----------
$ROLES = @{
  super = @{ products=$true;  editProduct=$true;  deleteProduct=$true;  resetAll=$true;  users=$true;  sales=$true }
  admin = @{ products=$true;  editProduct=$true;  deleteProduct=$false; resetAll=$false; users=$false; sales=$true }
  sales = @{ products=$false; editProduct=$false; deleteProduct=$false; resetAll=$false; users=$false; sales=$true }
}
function Can($user, [string]$what) {
  if (-not $user) { return $false }
  $r = $ROLES[$user.role]
  if (-not $r) { return $false }
  return [bool]$r[$what]
}

# ---------- ผู้ใช้ ----------
function Load-Users {
  $u = @(Read-Json $fUsers @())
  if ($u.Count -gt 0) { return $u }
  $un = if ($env:BOOTSTRAP_ADMIN_USER) { $env:BOOTSTRAP_ADMIN_USER.ToLower() } else { 'admin' }
  if ($env:BOOTSTRAP_ADMIN_PASS) { $pw = $env:BOOTSTRAP_ADMIN_PASS }
  else {
    $rb = New-Object byte[] 9
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($rb)
    $pw = (To-B64Url $rb)
  }
  $hp = Hash-Password $pw $null
  $list = @(@{ id='u1'; username=$un; name='ผู้ดูแลระบบหลัก'; role='super'; salt=$hp.salt; hash=$hp.hash; active=$true })
  Write-Json $fUsers $list
  Write-Host ""
  Write-Host "==========================================================" -ForegroundColor Yellow
  Write-Host " สร้างบัญชีแอดมินหลักครั้งแรกแล้ว" -ForegroundColor Yellow
  Write-Host ("   ชื่อผู้ใช้ : {0}" -f $un) -ForegroundColor Yellow
  Write-Host ("   รหัสผ่าน  : {0}" -f $pw) -ForegroundColor Yellow
  Write-Host " (กรุณาเปลี่ยนรหัสผ่านทันทีหลังเข้าสู่ระบบ)" -ForegroundColor Yellow
  Write-Host "==========================================================" -ForegroundColor Yellow
  Write-Host ""
  return $list
}
function Public-User($u) { @{ id=$u.id; username=$u.username; name=$u.name; role=$u.role; active=($u.active -ne $false) } }
function Count-ActiveSupers($list) { @($list | Where-Object { $_.role -eq 'super' -and $_.active -ne $false }).Count }

# ---------- HTTP helpers ----------
function Send-Json($res, $obj, [int]$status = 200, [string]$cookie = $null) {
  $res.StatusCode = $status
  $res.ContentType = "application/json; charset=utf-8"
  $res.Headers.Add("Cache-Control", "no-store")
  if ($cookie) { $res.Headers.Add("Set-Cookie", $cookie) }
  $bytes = [System.Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Depth 12 -Compress))
  $res.ContentLength64 = $bytes.Length
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
  $res.OutputStream.Close()
}
function Read-Body($req) {
  $sr = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
  $t = $sr.ReadToEnd(); $sr.Close()
  if (-not $t.Trim()) { return $null }
  try { return ($t | ConvertFrom-Json) } catch { return $null }
}
function Get-SessionCookie($req) {
  $raw = $req.Headers["Cookie"]
  if (-not $raw) { return $null }
  foreach ($part in $raw.Split(';')) {
    $kv = $part.Trim().Split('=', 2)
    if ($kv.Count -eq 2 -and $kv[0] -eq 'kss_sess') { return [System.Uri]::UnescapeDataString($kv[1]) }
  }
  return $null
}
# หมายเหตุ: ไม่ใส่ Secure เพราะเครื่อง local ใช้ http (ถ้าใส่ เบราว์เซอร์จะทิ้ง cookie)
function Make-Cookie([string]$token, [int]$maxAge) {
  "kss_sess=$([System.Uri]::EscapeDataString($token)); Path=/; HttpOnly; SameSite=Strict; Max-Age=$maxAge"
}
function Current-User($req) {
  $p = Verify-Token (Get-SessionCookie $req)
  if (-not $p) { return $null }
  $users = @(Load-Users)
  $u = $users | Where-Object { $_.id -eq $p.sub } | Select-Object -First 1
  if (-not $u -or $u.active -eq $false) { return $null }
  if ($u.role -ne $p.role) { return $null }
  return $u
}

# ---------- MIME ----------
$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css"; ".js"="application/javascript"; ".jsx"="application/javascript"
  ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".gif"="image/gif"; ".svg"="image/svg+xml"
  ".webp"="image/webp"; ".jfif"="image/jpeg"; ".ttf"="font/ttf"; ".woff"="font/woff"; ".woff2"="font/woff2"
  ".json"="application/json"; ".ico"="image/x-icon"; ".mp4"="video/mp4"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()
Write-Host ("Serving {0} on {1}" -f $root, $url) -ForegroundColor Green
Load-Users | Out-Null

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  $path = $req.Url.LocalPath
  $method = $req.HttpMethod.ToUpper()

  try {
    # ================= API =================
    if ($path -like '/api/*') {
      $ep = $path.Substring(4)

      if ($ep -eq '/auth/login' -and $method -eq 'POST') {
        $lip = [string]$req.RemoteEndPoint.Address
        $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

        # กันเดารหัสผ่าน — ล็อกชั่วคราวเมื่อผิดติดกันหลายครั้ง
        $lrec = $LoginFail[$lip]
        if ($null -ne $lrec -and $lrec.until -and [int64]$lrec.until -gt $nowMs) {
          $leftSec = [Math]::Ceiling(([int64]$lrec.until - $nowMs) / 1000)
          $leftMin = [Math]::Ceiling($leftSec / 60)
          Send-Json $res @{ error=("ใส่รหัสผิดหลายครั้งเกินไป กรุณารออีก {0} นาทีแล้วลองใหม่" -f $leftMin) } 429; continue
        }

        $b = Read-Body $req
        if (-not $b -or -not $b.username -or -not $b.password) { Send-Json $res @{ error='กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' } 400; continue }
        $users = @(Load-Users)
        $un = ([string]$b.username).Trim().ToLower()
        $u = $users | Where-Object { $_.username -eq $un } | Select-Object -First 1
        $saltUse = if ($u) { $u.salt } else { To-B64Url (New-Object byte[] 16) }
        $probe = Hash-Password ([string]$b.password) $saltUse
        if (-not $u -or -not (Safe-Equal $probe.hash $u.hash) -or $u.active -eq $false) {
          if ($null -eq $lrec -or ($nowMs - [int64]$lrec.start) -gt $LOGIN_WINDOW) { $lrec = @{ start=$nowMs; count=0; until=$null } }
          $lrec.count = [int]$lrec.count + 1
          if ([int]$lrec.count -ge $LOGIN_MAX_FAIL) { $lrec.until = $nowMs + $LOGIN_LOCK }
          $LoginFail[$lip] = $lrec
          $left = [Math]::Max(0, $LOGIN_MAX_FAIL - [int]$lrec.count)
          # ไม่บอกว่าผิดที่ชื่อผู้ใช้หรือรหัสผ่าน เพื่อไม่ให้เดาว่ามีบัญชีนี้อยู่จริงไหม
          $emsg = if ($left -gt 0) { "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลืออีก $left ครั้งก่อนถูกล็อกชั่วคราว)" }
                  else { 'ใส่รหัสผิดหลายครั้งเกินไป บัญชีนี้ถูกล็อกชั่วคราว กรุณารอสักครู่' }
          Send-Json $res @{ error=$emsg } 401; continue
        }
        $LoginFail.Remove($lip) | Out-Null   # ล็อกอินสำเร็จแล้วล้างตัวนับทิ้ง
        $now = [int][double]::Parse((Get-Date -UFormat %s))
        $tok = Sign-Token @{ sub=$u.id; role=$u.role; exp=($now + $TTLSEC) }
        Send-Json $res @{ user=(Public-User $u) } 200 (Make-Cookie $tok $TTLSEC); continue
      }

      if ($ep -eq '/auth/logout' -and $method -eq 'POST') {
        Send-Json $res @{ ok=$true } 200 (Make-Cookie '' 0); continue
      }

      # อ่านสินค้าเปิดสาธารณะ (หน้าร้านต้องใช้)
      if ($ep -eq '/products' -and $method -eq 'GET') {
        Send-Json $res @{ products=(Read-Json $fProds @()) } 200; continue
      }

      # อ่านการตั้งค่าเว็บเปิดสาธารณะ (หน้าแคตตาล็อกต้องใช้แสดงลิงก์แบรนด์)
      if ($ep -eq '/settings' -and $method -eq 'GET') {
        Send-Json $res @{ settings=(Read-Json $fSetting @{}) } 200; continue
      }

      # ---------- ผู้ช่วย AI ตอบลูกค้า (เปิดสาธารณะ ลูกค้าหน้าเว็บใช้ได้เลย) ----------
      if ($ep -eq '/chat' -and $method -eq 'POST') {
        $apiKey = Get-AnthropicKey
        if (-not $apiKey) {
          Write-Host "chat: ยังไม่มีคีย์ — ใส่คีย์ที่ .data\anthropic.key หรือตั้ง `$env:ANTHROPIC_API_KEY แล้วลองใหม่" -ForegroundColor Yellow
          Send-Json $res @{ error='ตอนนี้ผู้ช่วยยังใช้งานไม่ได้ รบกวนทักไลน์ @kirdsaengsawang นะครับ'; lineUrl=$LINE_URL } 503; continue
        }

        # จำกัดจำนวนครั้งต่อ IP กันค่าใช้จ่ายบานปลาย
        $ip = [string]$req.RemoteEndPoint.Address
        $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $rec = $ChatRate[$ip]
        if ($null -eq $rec -or ($now - [int64]$rec.start) -gt $CHAT_RATE_WIN) { $rec = @{ start=$now; count=0 } }
        if ([int]$rec.count -ge $CHAT_RATE_MAX) {
          Send-Json $res @{ error='คุยกันเยอะแล้ววันนี้ รบกวนทักไลน์ @kirdsaengsawang นะครับ'; lineUrl=$LINE_URL } 429; continue
        }
        $rec.count = [int]$rec.count + 1
        $ChatRate[$ip] = $rec

        $b = Read-Body $req
        if ($null -eq $b -or $null -eq $b.messages) { Send-Json $res @{ error='รูปแบบข้อความไม่ถูกต้อง' } 400; continue }

        # รับเฉพาะรูปแบบที่ต้องการ และตัดความยาวทิ้ง
        $msgs = @()
        foreach ($m in @($b.messages)) {
          if ($null -eq $m) { continue }
          $role = [string]$m.role
          $text = [string]$m.content
          if (($role -ne 'user' -and $role -ne 'assistant') -or -not $text.Trim()) { continue }
          if ($text.Length -gt $CHAT_MAX_CHARS) { $text = $text.Substring(0, $CHAT_MAX_CHARS) }
          $msgs += ,@{ role=$role; content=$text }
        }
        if ($msgs.Count -gt $CHAT_MAX_TURNS) { $msgs = $msgs[($msgs.Count - $CHAT_MAX_TURNS)..($msgs.Count - 1)] }
        if ($msgs.Count -eq 0 -or $msgs[$msgs.Count - 1].role -ne 'user') {
          Send-Json $res @{ error='รูปแบบข้อความไม่ถูกต้อง' } 400; continue
        }

        # บริบทสินค้า — ส่งมาจากหน้าสินค้าตามแบรนด์ ผู้ช่วยจะได้รู้ว่าลูกค้ากำลังดูรุ่นไหนอยู่
        $sysBlocks = @(@{ type='text'; text=$CHAT_SYSTEM; cache_control=@{ type='ephemeral' } })
        if ($b.product) {
          $labels = [ordered]@{ code='รุ่น/รหัส'; name='ชื่อสินค้า'; brand='แบรนด์'; cat='หมวดหมู่'; series='ซีรีส์' }
          $lines = @()
          foreach ($k in $labels.Keys) {
            $v = [string]$b.product.$k
            if (-not $v.Trim()) { continue }
            if ($v.Length -gt 120) { $v = $v.Substring(0, 120) }
            $lines += ("{0}: {1}" -f $labels[$k], $v)
          }
          if ($lines.Count -gt 0) {
            $ctx = "ตอนนี้ลูกค้าเปิดหน้าสินค้าตัวนี้อยู่ ถ้าลูกค้าไม่ได้ระบุเป็นอย่างอื่น ให้ถือว่าคุยเรื่องสินค้าตัวนี้`r`n" +
                   ($lines -join "`r`n") +
                   "`r`nให้ถามความต้องการเพิ่ม เช่น จำนวนที่ต้องการ และงานที่จะเอาไปใช้ แล้วสรุปส่งทีมงาน โดยต้องมีรุ่น/รหัสสินค้าอยู่ในบรรทัดสรุปเสมอ"
            $sysBlocks += @{ type='text'; text=$ctx }
          }
        }

        try {
          [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
          $payload = @{
            model      = $CHAT_MODEL
            max_tokens = 2000
            fallbacks  = 'default'
            thinking   = @{ type='adaptive' }
            output_config = @{ effort='low' }
            system     = $sysBlocks
            messages   = $msgs
          }
          $jsonBody  = ConvertTo-Json -InputObject $payload -Depth 12 -Compress
          $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
          $headers = @{
            'x-api-key'         = $apiKey
            'anthropic-version' = '2023-06-01'
            'anthropic-beta'    = 'server-side-fallback-2026-07-01'
          }
          $r = Invoke-WebRequest -Uri 'https://api.anthropic.com/v1/messages' -Method Post `
                 -Headers $headers -Body $bodyBytes -ContentType 'application/json; charset=utf-8' `
                 -UseBasicParsing -TimeoutSec 120
          $respText = [System.Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
          $obj = $respText | ConvertFrom-Json

          if ([string]$obj.stop_reason -eq 'refusal') {
            Send-Json $res @{ reply='ขออภัยครับ คำถามนี้ผมตอบให้ไม่ได้ รบกวนทักไลน์ @kirdsaengsawang นะครับ'; lineUrl=$LINE_URL } 200; continue
          }
          $reply = (@($obj.content | Where-Object { $_.type -eq 'text' } | ForEach-Object { $_.text }) -join '').Trim()
          if (-not $reply) { $reply = 'ขออภัยครับ ผมยังตอบคำถามนี้ไม่ได้ รบกวนทักไลน์ @kirdsaengsawang นะครับ' }
          Send-Json $res @{ reply=$reply; lineUrl=$LINE_URL } 200; continue
        } catch {
          Write-Host ("chat error: {0}" -f $_.Exception.Message) -ForegroundColor Red
          Send-Json $res @{ error='ระบบผู้ช่วยขัดข้องชั่วคราว รบกวนทักไลน์ @kirdsaengsawang นะครับ'; lineUrl=$LINE_URL } 502; continue
        }
      }

      # ---------- ส่งลิสต์ความต้องการของลูกค้าเข้าไลน์บริษัท (เปิดสาธารณะ) ----------
      if ($ep -eq '/lead' -and $method -eq 'POST') {
        $ip = [string]$req.RemoteEndPoint.Address
        $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $rec = $LeadRate[$ip]
        if ($null -eq $rec -or ($now - [int64]$rec.start) -gt $LEAD_RATE_WIN) { $rec = @{ start=$now; count=0 } }
        if ([int]$rec.count -ge $LEAD_RATE_MAX) {
          Send-Json $res @{ error='ส่งบ่อยเกินไป รบกวนทักไลน์ @kirdsaengsawang โดยตรงนะครับ'; lineUrl=$LINE_URL } 429; continue
        }
        $rec.count = [int]$rec.count + 1
        $LeadRate[$ip] = $rec

        $b = Read-Body $req
        $summary = Trim-Max $b.summary 2000
        if (-not $summary) { Send-Json $res @{ error='ไม่มีข้อมูลที่จะส่ง' } 400; continue }
        $prodTxt = ''
        if ($b.product -and (Trim-Max $b.product.code 80)) {
          $prodTxt = "สินค้าที่ลูกค้าเปิดดู: " + (Trim-Max $b.product.code 80)
          $pn = Trim-Max $b.product.name 120
          if ($pn) { $prodTxt += " · $pn" }
          $prodTxt += "`r`n"
        }

        # เก็บลิสต์ไว้ในเครื่องเสมอ ต่อให้ส่งไลน์ไม่ผ่านก็ยังไม่หาย
        try {
          $leads = @(Read-Json $fLeads @())
          $leads += @{ at=(Get-Date).ToString('yyyy-MM-dd HH:mm:ss'); ip=$ip; product=$prodTxt.Trim(); summary=$summary }
          if ($leads.Count -gt 500) { $leads = $leads[($leads.Count - 500)..($leads.Count - 1)] }
          Write-Json $fLeads $leads
        } catch { Write-Host ("lead save error: {0}" -f $_.Exception.Message) -ForegroundColor Yellow }

        $push = Get-LinePush
        if (-not $push) {
          Write-Host "lead: ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN / LINE_TO — เก็บลงไฟล์อย่างเดียว" -ForegroundColor Yellow
          Send-Json $res @{ ok=$true; sent=$false; lineUrl=$LINE_URL } 200; continue
        }
        try {
          [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
          $text = "ลูกค้าใหม่จากหน้าเว็บ`r`n$prodTxt$summary"
          $payload = @{ to=$push.to; messages=@(@{ type='text'; text=$text }) }
          $bytes = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $payload -Depth 8 -Compress))
          Invoke-WebRequest -Uri 'https://api.line.me/v2/bot/message/push' -Method Post `
            -Headers @{ 'Authorization' = "Bearer $($push.token)" } -Body $bytes `
            -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 30 | Out-Null
          Send-Json $res @{ ok=$true; sent=$true; lineUrl=$LINE_URL } 200; continue
        } catch {
          Write-Host ("lead push error: {0}" -f $_.Exception.Message) -ForegroundColor Red
          Send-Json $res @{ ok=$true; sent=$false; lineUrl=$LINE_URL } 200; continue
        }
      }

      # เครื่องมือ build (build.html) — ใช้เฉพาะตอนพัฒนาในเครื่อง ไม่เกี่ยวกับระบบหลังบ้าน จึงไม่ต้องล็อกอิน
      if ($ep -eq '/build' -and $method -eq 'POST') {
        $sr = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
        $body = $sr.ReadToEnd(); $sr.Close()
        [System.IO.File]::WriteAllText((Join-Path $root "app.js"), $body, $UTF8)
        Send-Json $res @{ ok=$true; chars=$body.Length } 200; continue
      }

      $me = Current-User $req

      if ($ep -eq '/auth/me') {
        if ($me) { Send-Json $res @{ user=(Public-User $me); can=$ROLES[$me.role] } 200 }
        else     { Send-Json $res @{ error='ยังไม่ได้เข้าสู่ระบบ' } 401 }
        continue
      }
      if (-not $me) { Send-Json $res @{ error='ยังไม่ได้เข้าสู่ระบบ' } 401; continue }

      # ---------- ผู้ใช้ ----------
      if ($ep -eq '/users') {
        if (-not (Can $me 'users')) { Send-Json $res @{ error='ไม่มีสิทธิ์เข้าถึงส่วนนี้' } 403; continue }
        $users = @(Load-Users)
        if ($method -eq 'GET') { Send-Json $res @{ users=@($users | ForEach-Object { Public-User $_ }) } 200; continue }

        $b = Read-Body $req
        if (-not $b) { Send-Json $res @{ error='ข้อมูลไม่ถูกต้อง' } 400; continue }
        $act = [string]$b.action

        if ($act -eq 'create') {
          $un = ([string]$b.username).Trim().ToLower()
          $nm = ([string]$b.name).Trim()
          $pw = [string]$b.password
          if ($un -notmatch '^[a-z0-9._-]{3,}$') { Send-Json $res @{ error='ชื่อผู้ใช้ต้องเป็น a-z 0-9 . _ - และยาว 3 ตัวขึ้นไป' } 400; continue }
          if (-not $nm) { Send-Json $res @{ error='กรุณากรอกชื่อ-นามสกุล' } 400; continue }
          if ($pw.Length -lt 8) { Send-Json $res @{ error='รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' } 400; continue }
          if (-not $ROLES.ContainsKey([string]$b.role)) { Send-Json $res @{ error='บทบาทไม่ถูกต้อง' } 400; continue }
          if ($users | Where-Object { $_.username -eq $un }) { Send-Json $res @{ error='มีชื่อผู้ใช้นี้อยู่แล้ว' } 409; continue }
          $hp = Hash-Password $pw $null
          $users = @($users) + @(@{ id=('u' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()); username=$un; name=$nm; role=[string]$b.role; salt=$hp.salt; hash=$hp.hash; active=$true })
          Write-Json $fUsers $users
          Send-Json $res @{ users=@($users | ForEach-Object { Public-User $_ }) } 200; continue
        }

        $target = $users | Where-Object { $_.id -eq [string]$b.id } | Select-Object -First 1
        if (-not $target) { Send-Json $res @{ error='ไม่พบผู้ใช้' } 404; continue }

        if ($act -eq 'delete') {
          if ($target.id -eq $me.id) { Send-Json $res @{ error='ลบบัญชีตัวเองไม่ได้' } 400; continue }
          $left = @($users | Where-Object { $_.id -ne $target.id })
          if ((Count-ActiveSupers $left) -eq 0) { Send-Json $res @{ error='ต้องมีแอดมินหลักที่ใช้งานอยู่อย่างน้อย 1 คน' } 400; continue }
          Write-Json $fUsers $left
          Send-Json $res @{ users=@($left | ForEach-Object { Public-User $_ }) } 200; continue
        }
        elseif ($act -eq 'setRole') {
          if ($target.id -eq $me.id) { Send-Json $res @{ error='เปลี่ยนบทบาทของตัวเองไม่ได้' } 400; continue }
          if (-not $ROLES.ContainsKey([string]$b.role)) { Send-Json $res @{ error='บทบาทไม่ถูกต้อง' } 400; continue }
          $target.role = [string]$b.role
          if ((Count-ActiveSupers $users) -eq 0) { Send-Json $res @{ error='ต้องมีแอดมินหลักที่ใช้งานอยู่อย่างน้อย 1 คน' } 400; continue }
        }
        elseif ($act -eq 'toggleActive') {
          if ($target.id -eq $me.id) { Send-Json $res @{ error='ระงับบัญชีตัวเองไม่ได้' } 400; continue }
          $target.active = ($target.active -eq $false)
          if ((Count-ActiveSupers $users) -eq 0) { Send-Json $res @{ error='ต้องมีแอดมินหลักที่ใช้งานอยู่อย่างน้อย 1 คน' } 400; continue }
        }
        elseif ($act -eq 'edit') {
          $un = ([string]$b.username).Trim().ToLower()
          $nm = ([string]$b.name).Trim()
          if ($un -notmatch '^[a-z0-9._-]{3,}$') { Send-Json $res @{ error='ชื่อผู้ใช้ไม่ถูกต้อง' } 400; continue }
          if (-not $nm) { Send-Json $res @{ error='กรุณากรอกชื่อ-นามสกุล' } 400; continue }
          if ($users | Where-Object { $_.id -ne $target.id -and $_.username -eq $un }) { Send-Json $res @{ error='มีชื่อผู้ใช้นี้อยู่แล้ว' } 409; continue }
          $target.username = $un; $target.name = $nm
        }
        elseif ($act -eq 'resetPassword') {
          $pw = [string]$b.password
          if ($pw.Length -lt 8) { Send-Json $res @{ error='รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' } 400; continue }
          $hp = Hash-Password $pw $null
          $target.salt = $hp.salt; $target.hash = $hp.hash
        }
        else { Send-Json $res @{ error='คำสั่งไม่ถูกต้อง' } 400; continue }

        Write-Json $fUsers $users
        Send-Json $res @{ users=@($users | ForEach-Object { Public-User $_ }) } 200; continue
      }

      # ---------- สินค้า ----------
      if ($ep -eq '/products' -and $method -eq 'POST') {
        if (-not (Can $me 'editProduct')) { Send-Json $res @{ error='บทบาทของคุณไม่มีสิทธิ์แก้ไขสินค้า' } 403; continue }
        $b = Read-Body $req
        if ($null -eq $b -or $null -eq $b.products) { Send-Json $res @{ error='รูปแบบข้อมูลไม่ถูกต้อง' } 400; continue }
        Write-Json $fProds @($b.products)
        Send-Json $res @{ ok=$true; count=@($b.products).Count } 200; continue
      }

      # ---------- ตั้งค่าเว็บไซต์ (ลิงก์แบรนด์ในหน้าแคตตาล็อก ฯลฯ) ----------
      if ($ep -eq '/settings' -and $method -eq 'POST') {
        if (-not (Can $me 'editProduct')) { Send-Json $res @{ error='บทบาทของคุณไม่มีสิทธิ์แก้ไขการตั้งค่าเว็บไซต์' } 403; continue }
        $b = Read-Body $req
        if ($null -eq $b -or $null -eq $b.settings) { Send-Json $res @{ error='รูปแบบข้อมูลไม่ถูกต้อง' } 400; continue }

        # ---- แคตตาล็อก: ต่อแบรนด์มี ลิงก์ / ชื่อที่แสดง / ข้อความปุ่ม / ซ่อน ----
        # ยอมรับเฉพาะ http/https เพื่อกัน javascript: และลิงก์แปลกปลอม
        $inCat   = To-Hashtable $b.settings.catalog
        $catalog = @{}
        $urlMap  = @{}
        $badKey  = $null
        foreach ($k in @($inCat.Keys)) {
          $raw = $inCat[$k]
          if ($null -eq $raw) { continue }
          $url = Trim-Max $raw.url 500
          if ($url -and $url -notmatch '^https?://') { $badKey = $k; break }
          $rec = @{}
          if ($url)                  { $rec['url']    = $url; $urlMap[[string]$k] = $url }
          if ($raw.label)            { $rec['label']  = Trim-Max $raw.label 60 }
          if ($raw.cta)              { $rec['cta']    = Trim-Max $raw.cta 40 }
          if ($raw.hidden -eq $true) { $rec['hidden'] = $true }
          if ($rec.Count -gt 0)      { $catalog[[string]$k] = $rec }
        }
        if ($badKey) { Send-Json $res @{ error=("ลิงก์ของ {0} ต้องขึ้นต้นด้วย http:// หรือ https://" -f $badKey) } 400; continue }

        # ---- ข้อมูลติดต่อ (ใช้ร่วมกันหลายหน้า) ----
        $c = $b.settings.contact
        $lineUrl = Trim-Max $c.lineUrl 300
        if ($lineUrl -and $lineUrl -notmatch '^https?://') {
          Send-Json $res @{ error='ลิงก์ไลน์ต้องขึ้นต้นด้วย http:// หรือ https://' } 400; continue
        }
        $contact = @{
          phone   = Trim-Max $c.phone 60
          lineId  = Trim-Max $c.lineId 60
          lineUrl = $lineUrl
          hours   = Trim-Max $c.hours 120
          address = Trim-Max $c.address 300
        }

        $out = @{
          catalog       = $catalog
          catalogFooter = Trim-Max $b.settings.catalogFooter 80
          contact       = $contact
          catalogUrls   = $urlMap   # เก็บรูปแบบเดิมไว้ เผื่อหน้าเว็บเวอร์ชันเก่ายังอ่านอยู่
        }
        Write-JsonObj $fSetting $out
        Send-Json $res @{ ok=$true; settings=$out } 200; continue
      }

      # ---------- ใบเสนอราคา ----------
      if ($ep -eq '/quotes') {
        if (-not (Can $me 'sales')) { Send-Json $res @{ error='ไม่มีสิทธิ์เข้าถึงส่วนนี้' } 403; continue }
        $quotes = @(Read-Json $fQuotes @())
        if ($method -eq 'GET') { Send-Json $res @{ quotes=$quotes } 200; continue }
        $b = Read-Body $req
        if (-not $b) { Send-Json $res @{ error='ข้อมูลไม่ถูกต้อง' } 400; continue }
        if ([string]$b.action -eq 'create') {
          $q = $b.quote
          if (-not $q -or -not $q.cust -or -not $q.cust.name -or -not $q.items -or @($q.items).Count -eq 0) {
            Send-Json $res @{ error='ต้องมีชื่อลูกค้าและรายการสินค้าอย่างน้อย 1 รายการ' } 400; continue
          }
          $no = 'QT' + (Get-Date -Format 'yyMMdd') + '-' + ('{0:D3}' -f ($quotes.Count + 1))
          $rec = @{ no=$no; at=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); by=$me.name; byUser=$me.username;
                    cust=$q.cust; items=@($q.items); total=[double]$q.total }
          $next = @(@($rec) + $quotes)
          Write-Json $fQuotes $next
          Send-Json $res @{ quotes=$next; created=$no } 200; continue
        }
        if ([string]$b.action -eq 'delete') {
          $next = @($quotes | Where-Object { $_.no -ne [string]$b.no })
          Write-Json $fQuotes $next
          Send-Json $res @{ quotes=$next } 200; continue
        }
        Send-Json $res @{ error='คำสั่งไม่ถูกต้อง' } 400; continue
      }

      Send-Json $res @{ error='ไม่พบปลายทางที่เรียก' } 404; continue
    }

    # ================= ไฟล์สแตติก =================
    if ($path -eq "/") { $path = "/index.html" }
    $rel = [System.Uri]::UnescapeDataString($path).TrimStart("/").Replace("/", "\")
    $file = Join-Path $root $rel

    if ((Test-Path $file -PathType Leaf) -and ($rel -notlike ".data\*")) {
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = if ($mime[$ext]) { $mime[$ext] } else { "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $nf = Join-Path $root "404.html"
      if (Test-Path $nf) {
        $res.ContentType = "text/html; charset=utf-8"
        $bytes = [System.IO.File]::ReadAllBytes($nf)
      } else {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not found: $path")
      }
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $res.OutputStream.Close()
  }
  catch {
    try {
      $res.StatusCode = 500
      $msg = [System.Text.Encoding]::UTF8.GetBytes(("server error: " + $_.Exception.Message))
      $res.ContentLength64 = $msg.Length
      $res.OutputStream.Write($msg, 0, $msg.Length)
      $res.OutputStream.Close()
    } catch {}
  }
}
