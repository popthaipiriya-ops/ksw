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

# ---------- ไฟล์เก็บข้อมูล ----------
$fUsers   = Join-Path $data "users.json"
$fQuotes  = Join-Path $data "quotes.json"
$fProds   = Join-Path $data "products.json"
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
        $b = Read-Body $req
        if (-not $b -or -not $b.username -or -not $b.password) { Send-Json $res @{ error='กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' } 400; continue }
        $users = @(Load-Users)
        $un = ([string]$b.username).Trim().ToLower()
        $u = $users | Where-Object { $_.username -eq $un } | Select-Object -First 1
        $saltUse = if ($u) { $u.salt } else { To-B64Url (New-Object byte[] 16) }
        $probe = Hash-Password ([string]$b.password) $saltUse
        if (-not $u -or -not (Safe-Equal $probe.hash $u.hash) -or $u.active -eq $false) {
          Send-Json $res @{ error='ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' } 401; continue
        }
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

      # ---------- build (เฉพาะเครื่องพัฒนา) ----------
      if ($ep -eq '/build' -and $method -eq 'POST') {
        $sr = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
        $body = $sr.ReadToEnd(); $sr.Close()
        [System.IO.File]::WriteAllText((Join-Path $root "app.js"), $body, $UTF8)
        Send-Json $res @{ ok=$true; chars=$body.Length } 200; continue
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
