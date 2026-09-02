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

# ══════════════════════════════════════════════════════════════════════════
#  เปิดให้เข้าถึงโฟลเดอร์ .data ผ่าน URL ได้
#  ────────────────────────────────────────────────────────────────────────
#  ค่าเริ่มต้นคือ "ปิด" — ต้องตั้งตัวแปรสภาพแวดล้อมก่อนสตาร์ตถึงจะเปิด
#
#      $env:EXPOSE_DATA = 1 ; .\serve.ps1
#
#  ที่ไม่ฝัง $true ไว้ในไฟล์ เพราะค่านั้นจะติดไปกับ repo ด้วย
#  ใครที่ pull ไปแล้วรัน serve.ps1 จะได้ .data ที่เปิดอยู่ตามไปโดยไม่รู้ตัว
#  ทำเป็น env แทน = เปิดเฉพาะเครื่องที่ตั้งใจเปิด และหายไปเองเมื่อปิดหน้าต่าง
#
#  ⚠ .data ไม่ได้มีแค่ข้อมูลธรรมดา แต่มีของที่หลุดแล้วเสียหายจริงอยู่ด้วย
#    secret.key   = คีย์เซ็น token เซสชัน · ใครอ่านได้ ปลอมคุกกี้เป็น super admin ได้เลย
#    users.json   = salt + hash รหัสผ่าน เอาไปไล่เดารหัสแบบออฟไลน์ได้
#    anthropic.key / line.json = คีย์ของบริการภายนอก
#    leads.json / quotes.json  = ชื่อและเบอร์ลูกค้า
#  เซิร์ฟเวอร์นี้ผูกกับ localhost เท่านั้น คนนอกยิงตรงเข้ามาไม่ได้
#  แต่เว็บใดก็ตามที่เปิดในเบราว์เซอร์เครื่องเดียวกันยิงมาที่ localhost ได้
#
#  หมายเหตุ: เว็บจริงบน Netlify ไม่ได้รับผลจากตัวแปรนี้
#  เพราะ .data ถูก .gitignore ไว้ (ไม่เคยถูกอัปขึ้นไป) และ netlify.toml
#  ยัง redirect /.data/* เป็น 404 ไว้อีกชั้น
# ══════════════════════════════════════════════════════════════════════════
$EXPOSE_DATA = ($env:EXPOSE_DATA -in @('1', 'true', 'yes', 'on'))

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

# ลูกค้าแนบรูปสินค้าที่อยากถามในแชท — จำกัดแยกจาก /lead เพราะรูปกินพื้นที่เก็บมากกว่า
$CHATIMG_RATE_MAX = 15
$CHATIMG_RATE_WIN = 60 * 60 * 1000
$ChatImgRate      = @{}
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
  แล้วชวนกลับมาคุยเรื่องอุปกรณ์ไฟฟ้า
'@

# ══════════════════════════════════════════════════════════════════════════
#  ด่านตรวจคำตอบก่อนถึงลูกค้า (ต้องตรงกับ netlify/functions/api.mjs เสมอ)
#  กฎในพรอมป์ต์เป็นแค่ "คำขอ" โมเดลพลาดได้ ด่านนี้คือตัวบังคับจริงระดับโค้ด
# ══════════════════════════════════════════════════════════════════════════
$OFFICIAL_PHONES  = @('028944007', '028944008')
$OFFICIAL_LINE_ID = '@kirdsaengsawang'
$CHAT_SAFE_REPLY  = "ขออภัยครับ ข้อมูลส่วนนี้ผมยืนยันแทนทีมงานไม่ได้ (เช่น ราคา สต็อก หรือช่องทางติดต่อ)`r`nรบกวนทักไลน์ @kirdsaengsawang หรือโทร 02-894-4007 เพื่อคุยกับทีมงานโดยตรงนะครับ"

# คืนชื่อกฎที่ถูกละเมิด ('' = ผ่าน)
function Get-ChatViolation([string]$reply) {
  # ราคา — ผู้ช่วยไม่มีข้อมูลราคา ตัวเลขติดกับ บาท/฿ จึงผิดเสมอ
  if ($reply -match '\d[\d,.]*\s*(บาท|฿)' -or $reply -match '฿\s*\d') { return 'price' }
  # เบอร์โทร — ต้องเป็นเบอร์บริษัทเท่านั้น
  foreach ($m in [regex]::Matches($reply, '0\d[\d\s-]{7,12}\d')) {
    $digits = ($m.Value -replace '\D', '')
    if ($OFFICIAL_PHONES -notcontains $digits) { return 'phone' }
  }
  # ไอดีไลน์ — ต้องเป็นของบริษัทเท่านั้น
  foreach ($m in [regex]::Matches($reply, '@[A-Za-z0-9._-]+')) {
    if ($m.Value.ToLower() -ne $OFFICIAL_LINE_ID) { return 'line' }
  }
  # ลิงก์ — กันแนะนำเว็บร้านอื่น
  foreach ($m in [regex]::Matches($reply, 'https?://\S+')) {
    if (-not $m.Value.StartsWith($LINE_URL)) { return 'url' }
  }
  return ''
}

# แปลงผลค้นสินค้าจากหน้าเว็บเป็นบล็อกข้อเท็จจริงให้ผู้ช่วยอ้างอิง
# เรียกเฉพาะตอนหน้าเว็บส่ง catalog มาจริงเท่านั้น (ผู้เรียกเป็นคนเช็ค)
# ว่างหรือ $null ที่ส่งเข้ามา = ค้นแล้วไม่เจอ ซึ่งต้องบอกผู้ช่วยให้รู้ ไม่ใช่เงียบ
function Get-ChatCatalogBlock($catalog, $total, $brands) {
  $clean = {
    param($v, $max)
    $s = ([string]$v) -replace '[\u0000-\u001f]+', ' '
    $s = $s.Trim()
    if ($s.Length -gt $max) { $s = $s.Substring(0, $max) }
    return $s
  }
  $lines = @()
  foreach ($f in @($catalog) | Select-Object -First 12) {
    if ($null -eq $f) { continue }
    $code = & $clean $f.code 80
    if (-not $code) { continue }
    $bits = @("รหัส/รุ่น: $code")
    $v = & $clean $f.name 160;   if ($v) { $bits += "ชื่อ: $v" }
    $v = & $clean $f.brand 60;   if ($v) { $bits += "แบรนด์: $v" }
    $v = & $clean $f.cat 80;     if ($v) { $bits += "หมวด: $v" }
    $v = & $clean $f.series 80;  if ($v) { $bits += "ซีรีส์: $v" }
    $lines += ('- ' + ($bits -join ' · '))
  }
  if ($lines.Count -eq 0) {
    return "ผลค้นจากฐานข้อมูลสินค้าจริง: ไม่พบรายการที่ตรงกับคำค้นนี้`r`n" +
           "คุณจึงไม่มีข้อมูลสินค้าที่ลูกค้าถามถึง ห้ามยืนยันว่ามีของ ห้ามเดารหัสรุ่นหรือสเปก`r`n" +
           "ให้บอกตรงๆ ว่าขอให้ทีมงานตรวจสอบให้ แล้วเก็บรายละเอียดเพื่อสรุปส่งต่อไลน์"
  }
  # ยอดจริงกับรายชื่อแบรนด์ — สำคัญมาก เพราะรายการข้างบนถูกตัดเหลือ 12 ตัวอย่าง
  # ถ้าไม่บอก ผู้ช่วยจะนับจากรายการที่เห็นแล้วตอบลูกค้าว่าร้านมีแค่ 12 รุ่น ทั้งที่มีหลายร้อย
  $totalNum = 0
  if ($null -ne $total) { [void][int]::TryParse([string]$total, [ref]$totalNum) }
  $brandList = @()
  foreach ($bn in @($brands) | Select-Object -First 15) {
    $s = & $clean $bn 60
    if ($s -and $brandList -notcontains $s) { $brandList += $s }
  }

  $out = "ผลค้นจากฐานข้อมูลสินค้าจริง (อ้างอิงรุ่น/รหัสได้เฉพาะรายการนี้เท่านั้น):`r`n" +
         ($lines -join "`r`n") +
         "`r`nรายการข้างบนยืนยันแค่ว่า ""มีรุ่นนี้ในแคตตาล็อก"" ไม่ได้บอกราคาและไม่ได้บอกสต็อกคงเหลือ"
  if ($totalNum -gt $lines.Count) {
    $out += "`r`nคำค้นนี้ตรงกับสินค้าในระบบทั้งหมด $totalNum รายการ " +
            "ข้างบนเป็นเพียงตัวอย่าง $($lines.Count) รายการแรกเท่านั้น`r`n" +
            "ถ้าจะบอกจำนวนให้ลูกค้า ต้องใช้ตัวเลข $totalNum ห้ามนับจากรายการตัวอย่างข้างบน"
  }
  if ($brandList.Count -gt 0) {
    $out += "`r`nแบรนด์ที่ตรงกับคำค้นนี้มีเฉพาะ: " + ($brandList -join ' · ') + "`r`n" +
            "ถ้าลูกค้าถามหาแบรนด์ที่ไม่อยู่ในรายชื่อนี้ แปลว่าคำค้นไม่ได้ตรงกับแบรนด์นั้น " +
            "ห้ามตอบว่าร้านมีแบรนด์นั้น และห้ามเสนอสินค้าข้างบนเสมือนเป็นแบรนด์ที่ลูกค้าถาม " +
            "ให้บอกว่าขอให้ทีมงานตรวจสอบให้"
  }
  return $out
}

# รหัสที่ลูกค้าเอ่ยถึงแต่ค้นแล้วไม่มีในระบบ — ต้องบอกผู้ช่วยตรงๆ
# กันเคสที่ผลค้นมีสินค้าใกล้เคียงติดมา แล้วผู้ช่วยเข้าใจผิดว่ารหัสที่ถามมีอยู่จริง
function Get-ChatUnknownCodesBlock($codes) {
  $list = @()
  foreach ($c in @($codes) | Select-Object -First 5) {
    $s = (([string]$c) -replace '[\u0000-\u001f]+', ' ').Trim()
    if ($s.Length -gt 60) { $s = $s.Substring(0, 60) }
    if ($s) { $list += $s }
  }
  if ($list.Count -eq 0) { return $null }
  return "ตรวจแล้ว: รหัส/รุ่นต่อไปนี้ที่ลูกค้าเอ่ยถึง ไม่มีอยู่ในฐานข้อมูลสินค้าของร้าน`r`n" +
         (($list | ForEach-Object { "- $_" }) -join "`r`n") +
         "`r`nห้ามตอบว่ามีรุ่นนี้ ห้ามแต่งสเปกของรุ่นนี้เด็ดขาด`r`n" +
         "ให้บอกลูกค้าตรงๆ ว่าไม่พบรุ่นนี้ในระบบและขอให้ทีมงานตรวจสอบให้อีกครั้ง`r`n" +
         "ถ้าในผลค้นมีสินค้าประเภทใกล้เคียง จะเสนอเป็น ""ทางเลือกใกล้เคียง"" ได้ แต่ต้องบอกชัดว่าไม่ใช่รุ่นที่ลูกค้าถาม"
}

# ══════════════════════════════════════════════════════════════════════════
#  ดึงข้อมูลสินค้าจากเว็บอื่น (ต้องตรงกับ netlify/functions/api.mjs)
#
#  เซิร์ฟเวอร์เป็นคนยิง HTTP ออกไปเอง เพราะเบราว์เซอร์ยิงข้ามโดเมนไม่ได้ (CORS)
#  แต่พอเซิร์ฟเวอร์ยิงตาม URL ที่ผู้ใช้พิมพ์ ก็เปิดช่อง SSRF ทันที
#  (พิมพ์ http://127.0.0.1/... หรือ IP วงในของออฟฟิศ แล้วอ่านข้อมูลหลังไฟร์วอลล์ได้)
#  จึงต้องกันปลายทางที่เป็นเครื่องตัวเองและวง LAN ทุกกรณี
# ══════════════════════════════════════════════════════════════════════════
$IMPORT_MAX_BYTES = 3MB      # หน้าใหญ่กว่านี้ไม่อ่านต่อ กัน memory บาน
$IMPORT_TIMEOUT   = 15       # วินาที

# คืนข้อความบอกเหตุผลถ้า URL ใช้ไม่ได้ ('' = ผ่าน)
function Get-ImportUrlBlock([string]$url) {
  $u = $null
  if (-not [System.Uri]::TryCreate($url, [System.UriKind]::Absolute, [ref]$u)) { return 'ลิงก์ไม่ถูกต้อง' }
  if ($u.Scheme -ne 'http' -and $u.Scheme -ne 'https') { return 'รองรับเฉพาะลิงก์ http และ https' }

  # แปลงชื่อโดเมนเป็น IP จริงก่อนตัดสิน — กันเคสโดเมนที่ตั้งใจชี้กลับมาวงใน
  $ips = @()
  try { $ips = [System.Net.Dns]::GetHostAddresses($u.DnsSafeHost) } catch { return 'หาที่อยู่ของเว็บนี้ไม่เจอ' }
  if (-not $ips -or $ips.Count -eq 0) { return 'หาที่อยู่ของเว็บนี้ไม่เจอ' }

  foreach ($ip in $ips) {
    if ([System.Net.IPAddress]::IsLoopback($ip)) { return 'ลิงก์นี้ชี้กลับมาที่เครื่องเซิร์ฟเวอร์เอง ไม่อนุญาต' }
    $b = $ip.GetAddressBytes()
    if ($ip.AddressFamily -eq 'InterNetwork') {
      if ($b[0] -eq 10)                                { return 'ลิงก์นี้ชี้ไปเครือข่ายภายใน ไม่อนุญาต' }
      if ($b[0] -eq 127)                               { return 'ลิงก์นี้ชี้กลับมาที่เครื่องเซิร์ฟเวอร์เอง ไม่อนุญาต' }
      if ($b[0] -eq 169 -and $b[1] -eq 254)            { return 'ลิงก์นี้ชี้ไปเครือข่ายภายใน ไม่อนุญาต' }
      if ($b[0] -eq 172 -and $b[1] -ge 16 -and $b[1] -le 31) { return 'ลิงก์นี้ชี้ไปเครือข่ายภายใน ไม่อนุญาต' }
      if ($b[0] -eq 192 -and $b[1] -eq 168)            { return 'ลิงก์นี้ชี้ไปเครือข่ายภายใน ไม่อนุญาต' }
      if ($b[0] -eq 0)                                 { return 'ลิงก์นี้ชี้ไปเครือข่ายภายใน ไม่อนุญาต' }
    } else {
      if ($ip.IsIPv6LinkLocal -or $ip.IsIPv6SiteLocal) { return 'ลิงก์นี้ชี้ไปเครือข่ายภายใน ไม่อนุญาต' }
      if (($b[0] -band 0xFE) -eq 0xFC)                 { return 'ลิงก์นี้ชี้ไปเครือข่ายภายใน ไม่อนุญาต' }   # fc00::/7
    }
  }
  return ''
}

function Get-ImportMeta([string]$html, [string]$prop) {
  # รับทั้ง property= และ name= และสลับลำดับ attribute ได้
  $pat = '<meta[^>]+(?:property|name)\s*=\s*["'']' + [regex]::Escape($prop) + '["''][^>]*>'
  $m = [regex]::Match($html, $pat, 'IgnoreCase')
  if (-not $m.Success) { return '' }
  $c = [regex]::Match($m.Value, 'content\s*=\s*["'']([^"'']*)["'']', 'IgnoreCase')
  if ($c.Success) { return [System.Net.WebUtility]::HtmlDecode($c.Groups[1].Value).Trim() }
  return ''
}

# ดึงค่าจาก JSON-LD ที่เป็น schema.org/Product — แม่นกว่าเดา DOM มาก
# ร้านค้าออนไลน์ส่วนใหญ่ฝัง JSON-LD ไว้อยู่แล้วเพื่อ SEO
function Get-ImportJsonLd([string]$html) {
  foreach ($m in [regex]::Matches($html, '<script[^>]+application/ld\+json[^>]*>([\s\S]*?)</script>', 'IgnoreCase')) {
    $raw = $m.Groups[1].Value.Trim()
    if (-not $raw) { continue }
    $obj = $null
    try { $obj = $raw | ConvertFrom-Json } catch { continue }
    # อาจเป็น object เดี่ยว, อาเรย์ หรือห่อใน @graph
    $stack = New-Object System.Collections.Stack
    $stack.Push($obj)
    while ($stack.Count -gt 0) {
      $cur = $stack.Pop()
      if ($null -eq $cur) { continue }
      if ($cur -is [object[]]) { foreach ($x in $cur) { $stack.Push($x) }; continue }
      if ($cur.PSObject.Properties.Name -contains '@graph') { $stack.Push($cur.'@graph'); continue }
      $type = [string]$cur.'@type'
      if ($type -match 'Product') { return $cur }
    }
  }
  return $null
}
# ══════════════════════════════════════════════════════════════════════════
#  ออเดอร์จากหน้าเว็บ → ไลน์ทีมงาน (ต้องตรงกับ netlify/functions/api.mjs)
#  ทีมงานต้องอ้างอิงออเดอร์กันได้ จึงต้องมีเลขที่และเวลาไทยติดไปด้วย
# ══════════════════════════════════════════════════════════════════════════
$fOrderSeq = Join-Path $data "orderseq.json"

function Get-ThaiNow { [DateTime]::UtcNow.AddHours(7) }
function Get-ThaiTimeText { (Get-ThaiNow).ToString('dd/MM/yyyy HH:mm') + ' น.' }

# เลขที่ออเดอร์ WEB-YYMMDD-NNN — เริ่มนับใหม่ทุกวัน
function Get-NextOrderNo {
  $ymd = (Get-ThaiNow).ToString('yyMMdd')
  $n = 1
  try {
    $seq = To-Hashtable (Read-Json $fOrderSeq @{})
    $n = [int]$seq[$ymd] + 1
    $seq[$ymd] = $n
    # เก็บย้อนหลังพอประมาณ ไม่ให้ไฟล์โตไปเรื่อยๆ
    $keep = @($seq.Keys | Sort-Object | Select-Object -Last 14)
    $trim = @{}
    foreach ($k in $keep) { $trim[$k] = $seq[$k] }
    Write-JsonObj $fOrderSeq $trim
  } catch {
    Write-Host ("order seq error: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
  }
  return ("WEB-{0}-{1:D3}" -f $ymd, $n)
}

# ข้อความออเดอร์ที่ทีมงานจะเห็นในไลน์
function Get-OrderMessage([string]$orderNo, [string]$when, [string]$prodTxt, [string]$summary) {
  $head = "ออเดอร์ใหม่จากเว็บไซต์`r`nเลขที่: $orderNo`r`nเวลา: $when`r`n"
  if ($prodTxt) { $head += "$prodTxt`r`n" }
  return $head + "--------------------`r`n" + $summary +
         "`r`n--------------------`r`nส่งอัตโนมัติจากหน้าเว็บ · กรุณาติดต่อกลับลูกค้า"
}

# ---------- ไฟล์เก็บข้อมูล ----------
$fUsers   = Join-Path $data "users.json"
$fQuotes  = Join-Path $data "quotes.json"
$fProds   = Join-Path $data "products.json"
$fSetting = Join-Path $data "settings.json"
$fLeads   = Join-Path $data "leads.json"
$dImg     = Join-Path $data "catalogimg"
if (-not (Test-Path $dImg)) { New-Item -ItemType Directory -Force $dImg | Out-Null }
$dChatImg = Join-Path $data "chatimg"
if (-not (Test-Path $dChatImg)) { New-Item -ItemType Directory -Force $dChatImg | Out-Null }
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
# หนีอักขระพิเศษก่อนเอาชื่อไฟล์ไปวางใน HTML
# (System.Web ไม่ได้ถูกโหลดมาให้เองใน PowerShell 5.1 จึงเขียนเองสั้นๆ)
function Html-Escape($v) {
  ([string]$v).Replace('&','&amp;').Replace('<','&lt;').Replace('>','&gt;').Replace('"','&quot;')
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
  # ถ้าเป็น hashtable/dictionary อยู่แล้ว ต้องก๊อปจากคีย์จริงเท่านั้น
  # ห้ามไปอ่าน PSObject.Properties เพราะจะได้ Count/Keys/Values ของตัว hashtable
  # กลายมาเป็น "คีย์" ปลอม แล้ว $h.Keys จะคืนค่าว่างทั้งที่มีข้อมูลอยู่
  if ($o -is [System.Collections.IDictionary]) {
    foreach ($k in $o.Keys) { $h[$k] = $o[$k] }
    return $h
  }
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
# importWeb = ดึงข้อมูลสินค้าจากเว็บอื่น — ให้เฉพาะแอดมินหลัก
# เพราะเป็นการสั่งให้เซิร์ฟเวอร์ยิง HTTP ออกไปข้างนอกตาม URL ที่ผู้ใช้พิมพ์
$ROLES = @{
  super = @{ products=$true;  editProduct=$true;  deleteProduct=$true;  resetAll=$true;  users=$true;  sales=$true;  importWeb=$true }
  admin = @{ products=$true;  editProduct=$true;  deleteProduct=$false; resetAll=$false; users=$false; sales=$true;  importWeb=$false }
  sales = @{ products=$false; editProduct=$false; deleteProduct=$false; resetAll=$false; users=$false; sales=$true;  importWeb=$false }
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
# เตือนให้เห็นชัดตอนสตาร์ต จะได้ไม่มีทางเปิดค้างไว้โดยไม่รู้ตัว
if ($EXPOSE_DATA) {
  Write-Host ""
  Write-Host " *** เปิดให้เข้าถึงโฟลเดอร์ .data ผ่าน URL อยู่ ***" -ForegroundColor Red
  Write-Host ("     {0}.data/  — มี secret.key และ users.json อยู่ในนั้น" -f $url) -ForegroundColor Yellow
  Write-Host "     ปิดโดยเอา `$env:EXPOSE_DATA ออกแล้วสตาร์ตใหม่" -ForegroundColor Yellow
  Write-Host ""
}
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
      # ต้องครอบ @() เสมอ — Read-Json คืน @() ออกมาเป็น $null ทำให้ JSON กลายเป็น {} ไม่ใช่ []
      # ฝั่งเว็บเช็ค Array.isArray ถ้าไม่ใช่ array จะข้ามการซิงค์ ทำให้ล้างสินค้าแล้วเครื่องอื่นไม่อัปเดตตาม
      if ($ep -eq '/products' -and $method -eq 'GET') {
        Send-Json $res @{ products=@(Read-Json $fProds @()) } 200; continue
      }

      # อ่านการตั้งค่าเว็บเปิดสาธารณะ (หน้าแคตตาล็อกต้องใช้แสดงลิงก์แบรนด์)
      if ($ep -eq '/settings' -and $method -eq 'GET') {
        Send-Json $res @{ settings=(Read-Json $fSetting @{}) } 200; continue
      }

      # รูปแคตตาล็อกที่แอดมินอัปโหลดเอง (เปิดสาธารณะ เพราะหน้าเว็บต้องแสดง)
      if ($ep -like '/catalog-image/*' -and $method -eq 'GET') {
        $key = $ep.Substring('/catalog-image/'.Length)
        if ($key -notmatch '^[A-Za-z0-9_-]+$') { Send-Json $res @{ error='ชื่อไฟล์ไม่ถูกต้อง' } 400; continue }
        $imgFile = Join-Path $dImg ("$key.json")
        if (-not (Test-Path -LiteralPath $imgFile)) { Send-Json $res @{ error='ไม่พบรูป' } 404; continue }
        $recImg = Read-Json $imgFile $null
        if (-not $recImg -or -not $recImg.data) { Send-Json $res @{ error='ไม่พบรูป' } 404; continue }
        $bytes = [Convert]::FromBase64String([string]$recImg.data)
        $res.ContentType = if ($recImg.type) { [string]$recImg.type } else { 'image/jpeg' }
        $res.Headers.Add('Cache-Control', 'public, max-age=31536000, immutable')
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.OutputStream.Close()
        continue
      }

      # รูปที่ลูกค้าแนบมาในแชท (เปิดสาธารณะ — LINE ต้องดึงรูปนี้ไปแสดงในข้อความ push ให้ทีมงาน)
      if ($ep -like '/chat-image/*' -and $method -eq 'GET') {
        $key = $ep.Substring('/chat-image/'.Length)
        if ($key -notmatch '^[A-Za-z0-9_-]+$') { Send-Json $res @{ error='ชื่อไฟล์ไม่ถูกต้อง' } 400; continue }
        $imgFile = Join-Path $dChatImg ("$key.json")
        if (-not (Test-Path -LiteralPath $imgFile)) { Send-Json $res @{ error='ไม่พบรูป' } 404; continue }
        $recImg = Read-Json $imgFile $null
        if (-not $recImg -or -not $recImg.data) { Send-Json $res @{ error='ไม่พบรูป' } 404; continue }
        $bytes = [Convert]::FromBase64String([string]$recImg.data)
        $res.ContentType = if ($recImg.type) { [string]$recImg.type } else { 'image/jpeg' }
        $res.Headers.Add('Cache-Control', 'public, max-age=604800')
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.OutputStream.Close()
        continue
      }

      # อัปโหลดรูปที่ลูกค้าแนบมาในแชท — เปิดสาธารณะ (ไม่ต้องล็อกอิน) แต่จำกัดจำนวนต่อ IP
      # เก็บไว้เฉยๆ ไม่พยายามวิเคราะห์รูปเอง (ไม่มี AI ดูภาพ) แค่ส่งต่อให้ทีมงานดูเองทาง /lead
      if ($ep -eq '/chat-image' -and $method -eq 'POST') {
        $ip = [string]$req.RemoteEndPoint.Address
        $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $rec = $ChatImgRate[$ip]
        if ($null -eq $rec -or ($now - [int64]$rec.start) -gt $CHATIMG_RATE_WIN) { $rec = @{ start=$now; count=0 } }
        if ([int]$rec.count -ge $CHATIMG_RATE_MAX) {
          Send-Json $res @{ error='แนบรูปบ่อยเกินไป รบกวนทักไลน์ @kirdsaengsawang โดยตรงนะครับ' } 429; continue
        }
        $rec.count = [int]$rec.count + 1
        $ChatImgRate[$ip] = $rec

        $b = Read-Body $req
        $dataUrl = [string]$b.dataUrl
        $m = [regex]::Match($dataUrl, '^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$')
        if (-not $m.Success) { Send-Json $res @{ error='รองรับเฉพาะไฟล์รูป JPG / PNG / WEBP' } 400; continue }
        $b64 = $m.Groups[2].Value
        if ($b64.Length -gt 4MB) { Send-Json $res @{ error='ไฟล์ใหญ่เกินไป (จำกัด 3MB)' } 400; continue }
        $key = [guid]::NewGuid().ToString('N')
        Write-JsonObj (Join-Path $dChatImg "$key.json") @{ type=$m.Groups[1].Value; data=$b64; at=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }
        Send-Json $res @{ ok=$true; url=("/api/chat-image/{0}" -f $key) } 200; continue
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

        # ผลค้นจากแคตตาล็อกจริง — หัวใจของความแม่นยำ
        # ต้องแนบเสมอแม้ค้นไม่เจอ เพราะ "ไม่เจอ" ก็เป็นข้อเท็จจริงที่กันการเดาได้
        # (PowerShell แปลง JSON array ว่างเป็น @() ไม่ใช่ $null จึงแยกสองกรณีนี้ได้)
        if ($b.PSObject.Properties.Name -contains 'catalog') {
          $catItems = @($b.catalog)   # อาจว่าง = ค้นแล้วไม่เจอ ซึ่งก็เป็นข้อเท็จจริงที่ต้องบอก
          $catBlock = Get-ChatCatalogBlock $catItems $b.catalogTotal $b.catalogBrands
          if ($catBlock) { $sysBlocks += @{ type='text'; text=$catBlock } }
        }
        if ($b.unknownCodes) {
          $unkBlock = Get-ChatUnknownCodesBlock @($b.unknownCodes)
          if ($unkBlock) { $sysBlocks += @{ type='text'; text=$unkBlock } }
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
          if (-not $reply) {
            Send-Json $res @{ reply='ขออภัยครับ ผมยังตอบคำถามนี้ไม่ได้ รบกวนทักไลน์ @kirdsaengsawang นะครับ'; lineUrl=$LINE_URL } 200; continue
          }
          # ด่านสุดท้าย — คำตอบที่ละเมิดกฎห้ามถึงมือลูกค้า ต่อให้โมเดลตั้งใจตอบดีก็ตาม
          $bad = Get-ChatViolation $reply
          if ($bad) {
            Write-Host ("chat reply blocked: {0}" -f $bad) -ForegroundColor Yellow
            Send-Json $res @{ reply=$CHAT_SAFE_REPLY; blocked=$bad; lineUrl=$LINE_URL } 200; continue
          }
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
        }

        $orderNo = Get-NextOrderNo
        $when    = Get-ThaiTimeText

        # รูปที่ลูกค้าแนบมาในแชท — รับเฉพาะพาธของ endpoint เราเท่านั้น กัน URL ปลอมหลุดเข้าไปในข้อความ LINE
        $imgUrl = [string]$b.imageUrl
        $validImg = $imgUrl -match '^/api/chat-image/[A-Za-z0-9_-]+$'
        $absImgUrl = if ($validImg) { $req.Url.GetLeftPart([System.UriPartial]::Authority) + $imgUrl } else { '' }

        # เก็บออเดอร์ไว้ในเครื่องเสมอ ต่อให้ส่งไลน์ไม่ผ่านก็ยังไม่หาย
        try {
          $leads = @(Read-Json $fLeads @())
          $leadRec = @{ orderNo=$orderNo; at=(Get-Date).ToString('yyyy-MM-dd HH:mm:ss'); ip=$ip; product=$prodTxt; summary=$summary }
          if ($absImgUrl) { $leadRec['image'] = $absImgUrl }
          $leads += $leadRec
          if ($leads.Count -gt 500) { $leads = $leads[($leads.Count - 500)..($leads.Count - 1)] }
          Write-Json $fLeads $leads
        } catch { Write-Host ("lead save error: {0}" -f $_.Exception.Message) -ForegroundColor Yellow }

        $push = Get-LinePush
        if (-not $push) {
          Write-Host "lead: ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN / LINE_TO — เก็บลงไฟล์อย่างเดียว" -ForegroundColor Yellow
          Send-Json $res @{ ok=$true; sent=$false; orderNo=$orderNo; reason='unconfigured'; lineUrl=$LINE_URL } 200; continue
        }
        try {
          [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
          $text = Get-OrderMessage $orderNo $when $prodTxt $summary
          $msgs = @(@{ type='text'; text=$text })
          # LINE ต้องดึงรูปจาก URL https สาธารณะเอง — local dev เป็น http จึงข้ามส่วนนี้ (ยังส่งข้อความได้ตามปกติ)
          if ($absImgUrl -and $absImgUrl.StartsWith('https://')) {
            $msgs += @{ type='image'; originalContentUrl=$absImgUrl; previewImageUrl=$absImgUrl }
          }
          $payload = @{ to=$push.to; messages=$msgs }
          $bytes = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $payload -Depth 8 -Compress))
          Invoke-WebRequest -Uri 'https://api.line.me/v2/bot/message/push' -Method Post `
            -Headers @{ 'Authorization' = "Bearer $($push.token)" } -Body $bytes `
            -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 30 | Out-Null
          Write-Host ("lead sent: {0}" -f $orderNo) -ForegroundColor Green
          Send-Json $res @{ ok=$true; sent=$true; orderNo=$orderNo; lineUrl=$LINE_URL } 200; continue
        } catch {
          Write-Host ("lead push error: {0}" -f $_.Exception.Message) -ForegroundColor Red
          Send-Json $res @{ ok=$true; sent=$false; orderNo=$orderNo; reason='push-failed'; lineUrl=$LINE_URL } 200; continue
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

      # ---------- สถานะระบบ (สำหรับหน้าเครื่องมือในหลังบ้าน) ----------
      # บอกแค่ว่า "ตั้งค่าไว้แล้วหรือยัง" ไม่ส่งค่าคีย์ออกไปเด็ดขาด
      if ($ep -eq '/status' -and $method -eq 'GET') {
        if (-not (Can $me 'editProduct')) { Send-Json $res @{ error='ไม่มีสิทธิ์เข้าถึงส่วนนี้' } 403; continue }
        $stSet = To-Hashtable (Read-Json $fSetting @{})
        # ห้ามครอบ @() รอบ hashtable — จะได้อาร์เรย์ที่มีสมาชิกเดียว (ตัว hashtable เอง) นับได้ 1 เสมอ
        $imgN = 0; if ($null -ne $stSet['images'])   { $imgN = (To-Hashtable $stSet['images']).Count }
        $txtN = 0; if ($null -ne $stSet['texts'])    { $txtN = (To-Hashtable $stSet['texts']).Count }
        $catN = 0; if ($null -ne $stSet['catalog'])  { $catN = (To-Hashtable $stSet['catalog']).Count }
        $artN = 0; if ($null -ne $stSet['articles']) { $artN = @($stSet['articles']).Count }
        Send-Json $res @{
          env     = 'local'
          ai      = @{ configured = [bool](Get-AnthropicKey); model = $CHAT_MODEL }
          line    = @{ configured = [bool](Get-LinePush) }
          session = @{ secretConfigured = [bool]($env:SESSION_SECRET -and $env:SESSION_SECRET.Length -ge 24) }
          counts  = @{
            users    = @(Load-Users).Count
            products = @(Read-Json $fProds @()).Count
            quotes   = @(Read-Json $fQuotes @()).Count
            leads    = @(Read-Json $fLeads @()).Count
            articles = $artN
            images   = $imgN
            texts    = $txtN
            catalog  = $catN
          }
          limits  = @{ chatPerHour = $CHAT_RATE_MAX; leadPerHour = $LEAD_RATE_MAX; chatImagePerHour = $CHATIMG_RATE_MAX }
          exposeData = [bool]$EXPOSE_DATA
        } 200
        continue
      }

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

      # ---------- ดึงข้อมูลสินค้าจากเว็บอื่น (แอดมินหลักเท่านั้น) ----------
      if ($ep -eq '/import-fetch' -and $method -eq 'POST') {
        if (-not (Can $me 'importWeb')) { Send-Json $res @{ error='เฉพาะแอดมินหลักเท่านั้นที่ใช้เมนูนี้ได้' } 403; continue }
        $b = Read-Body $req
        $url = Trim-Max $b.url 500
        if (-not $url) { Send-Json $res @{ error='กรุณาใส่ลิงก์สินค้า' } 400; continue }

        $blocked = Get-ImportUrlBlock $url
        if ($blocked) { Send-Json $res @{ error=$blocked } 400; continue }

        try {
          [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
          $r = Invoke-WebRequest -Uri $url -Method Get -MaximumRedirection 3 `
                 -Headers @{ 'User-Agent'='Mozilla/5.0 (compatible; KiRDSaengSawangBot/1.0)'; 'Accept-Language'='th,en' } `
                 -UseBasicParsing -TimeoutSec $IMPORT_TIMEOUT
        } catch {
          Send-Json $res @{ error=("เปิดลิงก์ไม่สำเร็จ: {0}" -f $_.Exception.Message) } 502; continue
        }

        $bytes = $r.RawContentStream.ToArray()
        if ($bytes.Length -gt $IMPORT_MAX_BYTES) { $bytes = $bytes[0..($IMPORT_MAX_BYTES-1)] }
        $html = [System.Text.Encoding]::UTF8.GetString($bytes)

        # 1) JSON-LD ก่อน เพราะเป็นข้อมูลที่เว็บประกาศเองว่าเป็นสินค้าอะไร
        $ld = Get-ImportJsonLd $html
        $name = ''; $brand = ''; $desc = ''; $gtin = ''; $price = ''; $imgs = @()
        if ($ld) {
          $name = Trim-Max $ld.name 200
          $desc = Trim-Max $ld.description 3000
          if ($ld.brand) { $brand = Trim-Max $(if ($ld.brand.name) { $ld.brand.name } else { $ld.brand }) 80 }
          foreach ($k in @('gtin13','gtin','gtin12','gtin8','sku','mpn')) {
            if (-not $gtin -and $ld.$k) { $gtin = Trim-Max $ld.$k 60 }
          }
          $offer = $ld.offers
          if ($offer -is [object[]]) { $offer = $offer[0] }
          if ($offer -and $offer.price) { $price = Trim-Max $offer.price 30 }
          foreach ($im in @($ld.image)) {
            $s = ''
            if ($im -is [string]) { $s = $im } elseif ($im -and $im.url) { $s = [string]$im.url }
            $s = Trim-Max $s 500
            if ($s -and $imgs -notcontains $s) { $imgs += $s }
          }
        }

        # 2) เติมช่องที่ยังว่างด้วย Open Graph / title — เว็บที่ไม่มี JSON-LD ยังพอได้ข้อมูล
        if (-not $name)  { $name = Get-ImportMeta $html 'og:title' }
        if (-not $name)  {
          $t = [regex]::Match($html, '<title[^>]*>([\s\S]*?)</title>', 'IgnoreCase')
          if ($t.Success) { $name = Trim-Max ([System.Net.WebUtility]::HtmlDecode($t.Groups[1].Value).Trim()) 200 }
        }
        if (-not $desc)  { $desc = Get-ImportMeta $html 'og:description' }
        if (-not $desc)  { $desc = Get-ImportMeta $html 'description' }
        if (-not $brand) { $brand = Get-ImportMeta $html 'og:site_name' }
        if (-not $price) { $price = Get-ImportMeta $html 'product:price:amount' }
        $ogImg = Get-ImportMeta $html 'og:image'
        if ($ogImg -and $imgs -notcontains $ogImg) { $imgs += $ogImg }

        # รูปต้องเป็น URL เต็มเสมอ ไม่งั้นหน้าเว็บเราโหลดไม่ขึ้น
        $baseUri = [System.Uri]$url
        $absImgs = @()
        foreach ($s in $imgs | Select-Object -First 8) {
          $iu = $null
          if ([System.Uri]::TryCreate($baseUri, $s, [ref]$iu) -and ($iu.Scheme -eq 'http' -or $iu.Scheme -eq 'https')) {
            if ($absImgs -notcontains $iu.AbsoluteUri) { $absImgs += $iu.AbsoluteUri }
          }
        }

        # ราคาเก็บเป็นตัวเลขล้วน ให้ฟอร์มสินค้าเอาไปใช้ต่อได้เลย
        $priceNum = ''
        if ($price) {
          $pClean = ($price -replace '[^\d.]', '')
          if ($pClean -match '^\d+(\.\d+)?$') { $priceNum = $pClean }
        }

        if (-not $name) { Send-Json $res @{ error='อ่านข้อมูลสินค้าจากหน้านี้ไม่ได้ ลองใช้ลิงก์หน้ารายละเอียดสินค้าโดยตรง' } 422; continue }

        Send-Json $res @{
          ok=$true
          data=@{
            name=$name; brand=$brand; description=$desc; gtin=$gtin
            price=$priceNum; images=$absImgs; source=$url
            hasJsonLd=[bool]$ld
          }
        } 200; continue
      }

      # ---------- สินค้า ----------
      if ($ep -eq '/products' -and $method -eq 'POST') {
        if (-not (Can $me 'editProduct')) { Send-Json $res @{ error='บทบาทของคุณไม่มีสิทธิ์แก้ไขสินค้า' } 403; continue }
        $b = Read-Body $req
        if ($null -eq $b -or $null -eq $b.products) { Send-Json $res @{ error='รูปแบบข้อมูลไม่ถูกต้อง' } 400; continue }
        Write-Json $fProds @($b.products)
        Send-Json $res @{ ok=$true; count=@($b.products).Count } 200; continue
      }

      # ---------- อัปโหลดรูปหน้าแคตตาล็อก (แอดมินที่แก้สินค้าได้เท่านั้น) ----------
      if ($ep -eq '/catalog-image' -and $method -eq 'POST') {
        if (-not (Can $me 'editProduct')) { Send-Json $res @{ error='บทบาทของคุณไม่มีสิทธิ์อัปโหลดรูป' } 403; continue }
        $b = Read-Body $req
        $key = [string]$b.key
        if ($key -notmatch '^[A-Za-z0-9_-]{1,40}$') { Send-Json $res @{ error='ชื่อรูปไม่ถูกต้อง' } 400; continue }
        $dataUrl = [string]$b.dataUrl
        $m = [regex]::Match($dataUrl, '^data:(image/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$')
        if (-not $m.Success) { Send-Json $res @{ error='รองรับเฉพาะไฟล์รูป JPG / PNG / WEBP / GIF' } 400; continue }
        $b64 = $m.Groups[2].Value
        if ($b64.Length -gt 4MB) { Send-Json $res @{ error='ไฟล์ใหญ่เกินไป (จำกัด 3MB)' } 400; continue }
        Write-JsonObj (Join-Path $dImg "$key.json") @{ type=$m.Groups[1].Value; data=$b64; at=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }
        $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        Send-Json $res @{ ok=$true; url=("/api/catalog-image/{0}?v={1}" -f $key, $stamp) } 200; continue
      }

      # ---------- ตั้งค่าเว็บไซต์ (ลิงก์แบรนด์ในหน้าแคตตาล็อก ฯลฯ) ----------
      if ($ep -eq '/settings' -and $method -eq 'POST') {
        if (-not (Can $me 'editProduct')) { Send-Json $res @{ error='บทบาทของคุณไม่มีสิทธิ์แก้ไขการตั้งค่าเว็บไซต์' } 403; continue }
        $b = Read-Body $req
        if ($null -eq $b -or $null -eq $b.settings) { Send-Json $res @{ error='รูปแบบข้อมูลไม่ถูกต้อง' } 400; continue }

        # หลังบ้านมีหลายที่ที่บันทึกการตั้งค่าคนละส่วนกัน (ฟอร์ม "ตั้งค่าเว็บไซต์" กับ "โหมดแก้รูป")
        # ส่วนไหนไม่ได้ส่งมาในคำขอนี้ ต้องคงค่าเดิมไว้ ไม่ใช่ล้างทิ้ง
        # ไม่งั้นบันทึกฟอร์มหนึ่งแล้วอีกส่วนหายเกลี้ยง
        $prev = To-Hashtable (Read-Json $fSetting @{})
        $sk   = @($b.settings.PSObject.Properties.Name)

        # ---- แคตตาล็อก: ต่อแบรนด์มี ลิงก์ / ชื่อที่แสดง / ข้อความปุ่ม / ซ่อน ----
        # ยอมรับเฉพาะ http/https เพื่อกัน javascript: และลิงก์แปลกปลอม
        $catalog = @{}
        $urlMap  = @{}
        if ($sk -contains 'catalog') {
          $inCat   = To-Hashtable $b.settings.catalog
          $badKey  = $null
          $badImg  = $null
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
            # รูปที่อัปโหลดเอง — รับเฉพาะพาธของ endpoint เราเท่านั้น
            $img = Trim-Max $raw.img 300
            if ($img) {
              if ($img -notmatch '^/api/catalog-image/[A-Za-z0-9_-]+(\?v=\d+)?$') { $badImg = $k; break }
              $rec['img'] = $img
            }
            if ($rec.Count -gt 0)      { $catalog[[string]$k] = $rec }
          }
          if ($badKey) { Send-Json $res @{ error=("ลิงก์ของ {0} ต้องขึ้นต้นด้วย http:// หรือ https://" -f $badKey) } 400; continue }
          if ($badImg) { Send-Json $res @{ error=("รูปของ {0} ไม่ถูกต้อง" -f $badImg) } 400; continue }
        } else {
          if ($null -ne $prev['catalog'])     { $catalog = $prev['catalog'] }
          if ($null -ne $prev['catalogUrls']) { $urlMap  = $prev['catalogUrls'] }
        }

        # ---- รูปภาพทั้งเว็บที่แอดมินเปลี่ยนเอง (โหมดแก้รูปบนหน้าเว็บจริง) ----
        # คีย์ = พาธรูปเดิมที่ฝังอยู่ในเว็บ เช่น assets/banner1.png
        # ค่า  = พาธรูปที่แอดมินอัปโหลดทับ ต้องเป็น endpoint ของเราเท่านั้น
        #        (กันไม่ให้ยัดลิงก์ภายนอกหรือ javascript: มาเป็น src ของรูป)
        $images = @{}
        if ($sk -contains 'images') {
          $inImg   = To-Hashtable $b.settings.images
          $badSlot = $null
          foreach ($k in @($inImg.Keys)) {
            $slot = [string]$k
            # ชื่อไฟล์รูปในเว็บมีทั้งเว้นวรรคและภาษาไทย จึงกันเฉพาะตัวที่อันตราย
            # (คีย์นี้ใช้เป็นแค่ชื่อช่องสำหรับเทียบ ไม่ได้เอาไปต่อเป็นพาธไฟล์จริง
            #  ไฟล์บนดิสก์ใช้ชื่อที่แฮชมาจากคีย์อีกที)
            if ($slot.Length -gt 200 -or $slot.Contains('..') -or $slot -match '[\u0000-\u001f\\<>"]') { $badSlot = $slot; break }
            $v = Trim-Max $inImg[$k] 300
            if (-not $v) { continue }   # ค่าว่าง = คืนไปใช้รูปเดิมที่มากับเว็บ
            if ($v -notmatch '^/api/catalog-image/[A-Za-z0-9_-]+(\?v=\d+)?$') { $badSlot = $slot; break }
            $images[$slot] = $v
            if ($images.Count -ge 500) { break }
          }
          if ($badSlot) { Send-Json $res @{ error=("รูปของ {0} ไม่ถูกต้อง" -f $badSlot) } 400; continue }
        } else {
          if ($null -ne $prev['images']) { $images = $prev['images'] }
        }

        # ---- ข้อความบนเว็บที่แอดมินแก้เอง ----
        # คีย์ = ข้อความเดิมที่ฝังอยู่ในโค้ด · ค่า = ข้อความใหม่
        # เป็นข้อความล้วน หน้าเว็บแสดงเป็น text node จึงยัดสคริปต์เข้ามาไม่ได้
        $texts = @{}
        if ($sk -contains 'texts') {
          $inTxt = To-Hashtable $b.settings.texts
          foreach ($k in @($inTxt.Keys)) {
            $key = ([string]$k).Trim()
            if (-not $key -or $key.Length -gt 400) { continue }
            $v = Trim-Max $inTxt[$k] 400
            if (-not $v -or $v -eq $key) { continue }   # เท่าเดิม = ไม่ต้องเก็บ
            $texts[$key] = $v
            if ($texts.Count -ge 800) { break }
          }
        } elseif ($null -ne $prev['texts']) { $texts = $prev['texts'] }

        # ---- บทความเกร็ดความรู้ที่แอดมินเขียนเอง ----
        # เก็บเป็นข้อความล้วนทุกฟิลด์ หน้าเว็บแสดงเป็น text node ไม่ใช่ HTML
        # จึงยัดสคริปต์เข้ามาไม่ได้แม้แอดมินจะพิมพ์แท็กลงไป
        $articles = @()
        if ($sk -contains 'articles') {
          $badArt = $null
          foreach ($raw in @($b.settings.articles)) {
            if ($null -eq $raw) { continue }
            $title = Trim-Max $raw.title 120
            if (-not $title) { continue }             # ไม่มีหัวข้อ = ไม่เก็บ
            $img = Trim-Max $raw.img 300
            if ($img -and $img -notmatch '^/api/catalog-image/[A-Za-z0-9_-]+(\?v=\d+)?$' -and $img -notmatch '^assets/[A-Za-z0-9._/ -]{1,200}$') {
              $badArt = $title; break
            }
            $id = Trim-Max $raw.id 40
            if (-not $id) { $id = 'a' + [Guid]::NewGuid().ToString('N').Substring(0, 10) }
            $body = @()
            foreach ($p in @($raw.body) | Select-Object -First 30) {
              $t = Trim-Max $p 2000
              if ($t) { $body += $t }
            }
            $at = 0; [void][int64]::TryParse([string]$raw.at, [ref]$at)
            if ($at -le 0) { $at = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }
            $articles += @{ id=$id; title=$title; excerpt=(Trim-Max $raw.excerpt 300); img=$img; body=$body; at=$at }
            if ($articles.Count -ge 50) { break }
          }
          if ($badArt) { Send-Json $res @{ error=("รูปของบทความ ""{0}"" ไม่ถูกต้อง" -f $badArt) } 400; continue }
        } elseif ($null -ne $prev['articles']) { $articles = @($prev['articles']) }

        # ---- ข้อมูลติดต่อ (ใช้ร่วมกันหลายหน้า) ----
        $contact = @{}
        if ($sk -contains 'contact') {
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
        } elseif ($null -ne $prev['contact']) { $contact = $prev['contact'] }

        $cfoot = if ($sk -contains 'catalogFooter') { Trim-Max $b.settings.catalogFooter 80 } else { [string]$prev['catalogFooter'] }

        $out = @{
          catalog       = $catalog
          catalogFooter = $cfoot
          contact       = $contact
          images        = $images
          texts         = $texts
          articles      = @($articles)
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
    # ตัด \ ปิดท้ายทิ้ง ไม่งั้น "/.data/" กับ "/.data" จะถูกมองเป็นคนละพาธ
    $rel = [System.Uri]::UnescapeDataString($path).TrimStart("/").Replace("/", "\").TrimEnd("\")
    $file = Join-Path $root $rel

    # กันการไต่ออกนอกโฟลเดอร์โปรเจกต์ด้วย ..\ — สำคัญขึ้นมากเมื่อเปิด .data ให้เข้าถึงได้
    # เทียบจากพาธที่คลี่เต็มแล้ว ไม่ใช่จากข้อความใน URL ซึ่งปลอมได้หลายแบบ
    $rootFull = [System.IO.Path]::GetFullPath($root).TrimEnd('\') + '\'
    $fileFull = ''
    try { $fileFull = [System.IO.Path]::GetFullPath($file) } catch { $fileFull = '' }
    $inRoot = $fileFull -and ($fileFull + '\').StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)

    $isData    = ($rel -eq ".data" -or $rel -like ".data\*")
    $dataBlock = $isData -and (-not $EXPOSE_DATA)   # ปิดอยู่ = ทำเหมือนไม่มีไฟล์

    # ---------- หน้ารายชื่อไฟล์ในโฟลเดอร์ ----------
    # โฟลเดอร์ .data ไม่มี index.html ถ้าไม่มีหน้ารายการก็ต้องเดาชื่อไฟล์เอาเอง
    if ($inRoot -and $isData -and $EXPOSE_DATA -and (Test-Path -LiteralPath $fileFull -PathType Container)) {
      $urlBase = '/' + ($rel.Replace('\', '/')).TrimEnd('/')
      $rows = ''
      foreach ($item in (Get-ChildItem -LiteralPath $fileFull | Sort-Object { -not $_.PSIsContainer }, Name)) {
        $nm   = Html-Escape $item.Name
        $href = $urlBase + '/' + [System.Uri]::EscapeDataString($item.Name)
        $size = if ($item.PSIsContainer) { '&lt;โฟลเดอร์&gt;' } else { '{0:N0} ไบต์' -f $item.Length }
        $when = $item.LastWriteTime.ToString('dd/MM/yyyy HH:mm')
        $rows += "<tr><td><a href=""$href"">$nm</a></td><td class=n>$size</td><td class=n>$when</td></tr>"
      }
      $up = if ($rel -eq '.data') { '' } else { "<p><a href=""$($urlBase.Substring(0, $urlBase.LastIndexOf('/')))"">.. ขึ้นบน</a></p>" }
      $html = @"
<!DOCTYPE html><html lang="th"><head><meta charset="utf-8">
<title>$(Html-Escape $rel)</title>
<style>body{font-family:Consolas,'Noto Sans Thai',monospace;background:#0f1613;color:#dfeae5;padding:28px;line-height:1.7}
h1{font-size:16px;color:#52cfb6;margin:0 0 4px}p.w{color:#ff9059;font-size:12.5px;margin:0 0 18px}
table{border-collapse:collapse;font-size:13px}td{padding:5px 22px 5px 0;border-bottom:1px solid #21312b}
td.n{color:#8aa098;text-align:right;white-space:nowrap}a{color:#dfeae5}a:hover{color:#52cfb6}</style>
</head><body><h1>$(Html-Escape $rel)</h1>
<p class=w>โฟลเดอร์นี้มีคีย์เซสชันและ hash รหัสผ่านอยู่ ปิดกลับได้ที่ \$EXPOSE_DATA ใน serve.ps1</p>
$up<table>$rows</table></body></html>
"@
      $res.ContentType = 'text/html; charset=utf-8'
      $res.Headers.Add('Cache-Control', 'no-store')
      $bytes = [System.Text.Encoding]::UTF8.GetBytes($html)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      $res.OutputStream.Close()
      continue
    }

    if ($inRoot -and (-not $dataBlock) -and (Test-Path -LiteralPath $fileFull -PathType Leaf)) {
      $ext = [System.IO.Path]::GetExtension($fileFull).ToLower()
      # ไฟล์ใน .data เป็น json/ตัวหนังสือล้วน อยากให้เปิดอ่านในเบราว์เซอร์ได้เลย
      # ไม่ใช่เด้งดาวน์โหลด (.key ไม่มีในตาราง mime จึงต้องบอกชนิดให้เอง)
      $res.ContentType = if ($isData) {
        if ($ext -eq '.json') { 'application/json; charset=utf-8' } else { 'text/plain; charset=utf-8' }
      } elseif ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
      if ($isData) { $res.Headers.Add('Cache-Control', 'no-store') }
      $bytes = [System.IO.File]::ReadAllBytes($fileFull)
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
