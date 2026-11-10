# คู่มือติดตั้ง WSL, Docker, Tor และ Bitcoin Node

คู่มือนี้ติดตั้งทุกอย่างที่ Space ต้องใช้บนเครื่อง Windows ให้ทำตามลำดับหัวข้อ
เพราะแต่ละส่วนต้องใช้ส่วนก่อนหน้า ผลลัพธ์สุดท้ายคือ Bitcoin Core บน Windows
ที่เชื่อมต่อผ่าน Tor ใน WSL เท่านั้น

| ส่วน         | อยู่ที่ | หน้าที่                               | เริ่มทำงานเมื่อ                                             |
| ------------ | ------- | ------------------------------------- | ----------------------------------------------------------- |
| WSL          | Windows | ระบบ Linux ที่ Docker และ Tor รันอยู่ | เข้า `wsl -d Ubuntu` ครั้งแรก                               |
| Docker       | WSL     | รัน Postgres และ Redis                | พร้อม WSL แต่ container ต้องสั่ง `docker compose up -d` เอง |
| Tor          | WSL     | ทางออกเครือข่ายของ node               | พร้อม WSL                                                   |
| Bitcoin Node | Windows | Bitcoin Core ที่ Space เรียกผ่าน RPC  | เปิด Bitcoin Core จาก Start menu หลังเปิด WSL แล้ว          |

แต่ละชุดคำสั่งบอกไว้ว่าต้องรันใน **PowerShell** (ฝั่ง Windows) หรือ **Ubuntu** (ใน WSL)
ตัวเลขและค่าตัวอย่างอ้างอิงเครื่องจริง ณ วันที่ 10 พฤศจิกายน 2026

---

## 1. WSL

WSL (Windows Subsystem for Linux) ทำให้รัน Linux บน Windows ได้ คู่มือนี้ใช้ **WSL 2** กับ
Ubuntu

### 1.1 สิ่งที่ต้องมี

- **ระบบปฏิบัติการ:** Windows 10 เวอร์ชัน 2004 ขึ้นไป (Build 19041 ขึ้นไป) หรือ Windows 11
- **ฮาร์ดแวร์:** เปิด Virtualization ใน BIOS/UEFI

### 1.2 ติดตั้ง

**กรณีที่ 1: ยังไม่เคยติดตั้ง WSL**

1. เปิด PowerShell แบบ **Run as administrator** โดยกด `Win + X` แล้วเลือก Windows
   PowerShell (Admin) หรือค้นหา PowerShell ใน Start menu แล้วคลิกขวาเลือก Run as
   administrator
2. รันคำสั่งนี้ มันจะเปิด feature ที่จำเป็น ติดตั้ง WSL kernel ตั้งค่าเป็น WSL 2
   และติดตั้ง Ubuntu เป็น distro หลัก

   ```powershell
   wsl --install
   ```

3. รีสตาร์ตเครื่อง ขั้นนี้ข้ามไม่ได้

**กรณีที่ 2: มี WSL อยู่แล้ว**

1. เช็กเวอร์ชันใน PowerShell ถ้าช่อง `VERSION` เป็น `2` ให้ข้ามไปหัวข้อ 1.3 ได้เลย

   ```powershell
   wsl -l -v
   ```

2. ถ้าเป็น `1` ให้ตั้งค่าเริ่มต้นเป็น WSL 2 แล้วแปลง distro เดิม โดยเปลี่ยน `Ubuntu`
   เป็นชื่อ distro ของคุณถ้าไม่ตรง

   ```powershell
   wsl --set-default-version 2
   wsl --set-version Ubuntu 2
   ```

### 1.3 สร้างผู้ใช้

หลังรีสตาร์ต หน้าต่าง Ubuntu จะเปิดขึ้นเอง ถ้าไม่เปิดให้เปิดจาก Start menu จากนั้นตั้ง
UNIX username ซึ่งไม่จำเป็นต้องตรงกับชื่อผู้ใช้ Windows แล้วตั้งรหัสผ่าน

ตอนพิมพ์รหัสผ่าน หน้าจอจะไม่แสดงอะไรเลย ไม่มีแม้แต่จุดหรือดอกจัน ซึ่งเป็นเรื่องปกติของ
Linux ให้พิมพ์จบแล้วกด Enter

### 1.4 เปิด systemd

Docker และ Tor ต้องใช้ systemd เพื่อเริ่มเองพร้อม WSL

1. เปิดไฟล์ตั้งค่าใน Ubuntu

   ```bash
   sudo nano /etc/wsl.conf
   ```

2. เพิ่มบรรทัดนี้ แล้วกด `Ctrl + O`, `Enter` เพื่อบันทึก และ `Ctrl + X` เพื่อออก

   ```ini
   [boot]
   systemd=true
   ```

3. สั่งปิด WSL ใน PowerShell แล้วเปิด Ubuntu ใหม่

   ```powershell
   wsl --shutdown
   ```

4. ตรวจผลใน Ubuntu คำสั่งนี้ต้องตอบ `systemd`

   ```bash
   ps -p 1 -o comm=
   ```

### 1.5 จำกัด RAM และ CPU (ถ้าต้องการ)

สร้างไฟล์ `%USERPROFILE%\.wslconfig` ฝั่ง Windows ค่าด้านล่างคือค่าที่เครื่องนี้ใช้
จากนั้นสั่ง `wsl --shutdown` เพื่อให้มีผล WSL รันแค่ Docker และ Tor จึงไม่ต้องให้ RAM มาก

```ini
[wsl2]
telemetry=false
memory=2GB
processors=2
```

อย่าย้าย node เข้ามารันใน WSL เหตุผลอยู่ต้นหัวข้อ 4

### 1.6 อัปเดต Linux

ควรรันใน Ubuntu เป็นประจำ คำสั่ง `sudo` จะถามรหัสผ่าน Linux

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.7 คำสั่งที่ใช้บ่อย

รันใน PowerShell

| คำสั่ง                 | ความหมาย                                        |
| ---------------------- | ----------------------------------------------- |
| `wsl`                  | เข้า shell ของ distro หลัก                      |
| `wsl -d Ubuntu`        | เข้า distro ที่ระบุ                             |
| `wsl -l -v`            | ดู distro ทั้งหมด สถานะ และเวอร์ชันของ WSL      |
| `wsl --list --running` | ดู distro ที่รันอยู่ โดยไม่ทำให้ WSL เริ่มทำงาน |
| `wsl --shutdown`       | ปิด WSL ทั้งหมดทันที                            |
| `wsl --update`         | อัปเดต WSL                                      |

### 1.8 WSL ทำงานเมื่อไหร่

- WSL ไม่เริ่มเองตอนเปิดเครื่อง จะเริ่มเมื่อเข้า `wsl -d Ubuntu` ครั้งแรก
- เมื่อปิด terminal สุดท้าย WSL จะดับเองภายในราว 16 วินาที และ service ทุกตัวจะหยุดตาม
  ทั้ง Docker และ Tor ซึ่งทำให้ Space ต่อ Postgres ไม่ได้ และ node บน Windows หา peer
  ไม่ได้ ระหว่างใช้งานจึงต้องเปิด terminal ของ WSL ค้างไว้

### 1.9 แก้ปัญหา

- **ขึ้น error `0x80370102`:** เปิด Virtualization ใน BIOS/UEFI
- **ระบบบอกให้อัปเดต kernel:** รัน `wsl --update` ถ้ายังไม่ได้ให้ดาวน์โหลด Linux kernel
  update package จากเอกสารของ Microsoft

---

## 2. Docker

ส่วนนี้ติดตั้ง **Docker Engine** ใน Ubuntu โดยตรง ไม่ใช้ Docker Desktop เพราะเบากว่า
และเป็น open source ที่ใช้ได้ฟรี

ต้องเปิด systemd ตามหัวข้อ 1.4 ก่อน และทุกคำสั่งในส่วนนี้รันใน Ubuntu ยกเว้นที่บอกไว้

### 2.1 ลบแพ็กเกจเก่าที่อาจชนกัน

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt remove $pkg; done
```

### 2.2 เพิ่ม repository ของ Docker

1. ติดตั้งเครื่องมือที่จำเป็น

   ```bash
   sudo apt update
   sudo apt install ca-certificates curl gnupg -y
   ```

2. เพิ่ม GPG key ทางการของ Docker

   ```bash
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg
   ```

3. เพิ่ม repository คำสั่งนี้ตรวจเวอร์ชัน Ubuntu และสถาปัตยกรรมของเครื่องให้เอง

   ```bash
   echo \
     "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
     sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   ```

### 2.3 ติดตั้ง Docker

```bash
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

### 2.4 ตั้งค่าหลังติดตั้ง

1. เพิ่มผู้ใช้เข้ากลุ่ม `docker` เพื่อใช้คำสั่งโดยไม่ต้องมี `sudo` จากนั้น logout
   แล้วเข้าใหม่ หรือรัน `newgrp docker` เพื่อให้มีผลทันที

   ```bash
   sudo usermod -aG docker $USER
   ```

2. ตั้งให้ Docker เริ่มเองพร้อม WSL

   ```bash
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

### 2.5 ตรวจผล

ถ้าเห็นข้อความ `Hello from Docker!` แปลว่าติดตั้งสำเร็จ

```bash
docker run hello-world
```

### 2.6 คำสั่งที่ใช้บ่อย

| คำสั่ง                 | ความหมาย                                            |
| ---------------------- | --------------------------------------------------- |
| `docker ps`            | ดู container ที่รันอยู่                             |
| `docker ps -a`         | ดู container ทั้งหมด รวมตัวที่หยุดแล้ว              |
| `docker images`        | ดู image ในเครื่อง                                  |
| `docker volume ls`     | ดู volume ที่เก็บข้อมูล                             |
| `docker compose up -d` | เปิด service ตาม `docker-compose.yml` แบบเบื้องหลัง |
| `docker compose down`  | หยุดและลบ container ที่ `up` สร้างไว้               |
| `docker logs -f <id>`  | ดู log ของ container แบบต่อเนื่อง                   |

---

## 3. Tor

ส่วนนี้ติดตั้ง Tor daemon ใน Ubuntu จาก repository ของ Tor Project
เพื่อให้ได้เวอร์ชันล่าสุด ทุกคำสั่งรันใน Ubuntu

### 3.1 ติดตั้ง

1. ติดตั้งเครื่องมือที่จำเป็น

   ```bash
   sudo apt update
   sudo apt install apt-transport-https curl gnupg lsb-release -y
   ```

2. เพิ่ม GPG key ของ Tor Project

   ```bash
   curl -s https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --dearmor | sudo tee /usr/share/keyrings/tor-archive-keyring.gpg >/dev/null
   ```

3. เพิ่ม repository

   ```bash
   echo "deb [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] https://deb.torproject.org/torproject.org $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/tor.list >/dev/null
   echo "deb-src [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] https://deb.torproject.org/torproject.org $(lsb_release -cs) main" | sudo tee -a /etc/apt/sources.list.d/tor.list >/dev/null
   ```

4. ติดตั้ง Tor

   ```bash
   sudo apt update
   sudo apt install tor deb.torproject.org-keyring -y
   ```

### 3.2 เปิด ControlPort

Bitcoin Core ใช้ ControlPort เพื่อสั่งให้ Tor สร้าง onion service ทำให้ peer
อื่นต่อเข้ามาได้โดยไม่ต้อง forward port

1. หยุด Tor แล้วเปิดไฟล์ตั้งค่า

   ```bash
   sudo systemctl stop tor
   sudo nano /etc/tor/torrc
   ```

2. เพิ่มบรรทัดท้ายไฟล์ โดยเลือกวิธียืนยันตัวตนแบบเดียว

   **วิธีที่ 1: ใช้รหัสผ่านแบบ hash (เครื่องนี้ใช้วิธีนี้ และแนะนำ)**

   สร้าง hash ก่อน การใส่ช่องว่างหน้าคำสั่งช่วยไม่ให้รหัสเข้า shell history
   ตามค่าเริ่มต้นของ Ubuntu

   ```bash
    tor --hash-password "your_strong_password"
   ```

   นำ hash ที่ได้มาใส่ใน `torrc` และเก็บรหัสผ่านตัวจริงไว้ใส่ใน `bitcoin.conf` ที่หัวข้อ
   4.4

   ```ini
   ControlPort 9051
   HashedControlPassword 16:REPLACE_WITH_YOUR_HASH
   CookieAuthentication 0
   ```

   **วิธีที่ 2: ไม่ยืนยันตัวตน**

   ง่ายที่สุด แต่ทุกโปรแกรมในเครื่องจะสั่ง Tor ได้ ใช้เฉพาะเครื่องส่วนตัวที่ใช้คนเดียว
   และต้องตัดบรรทัด `torpassword` ออกจาก `bitcoin.conf`

   ```ini
   ControlPort 9051
   CookieAuthentication 0
   ```

3. บันทึกไฟล์แล้วเริ่ม Tor

   ```bash
   sudo systemctl start tor
   ```

### 3.3 ตรวจผล

1. คำสั่งนี้ต้องตอบ `active` ทั้งสองบรรทัด

   ```bash
   systemctl is-active tor tor@default
   ```

2. คำสั่งนี้ต้องแสดง `"IsTor":true`

   ```bash
   curl --socks5-hostname 127.0.0.1:9050 https://check.torproject.org/api/ip
   ```

Tor ฟังบน `127.0.0.1` สองพอร์ต คือ `9050` สำหรับ SOCKS proxy และ `9051` สำหรับ ControlPort
Bitcoin Core บน Windows ต่อพอร์ตเหล่านี้ผ่าน `127.0.0.1` ได้เลย เพราะ WSL ส่งต่อ localhost
จาก Windows ให้เอง

---

## 4. Bitcoin Node

ส่วนนี้ติดตั้ง **Bitcoin Core 31.2** บน Windows โดยเก็บข้อมูลไว้บน `<Local Disk>` และให้
P2P วิ่งผ่าน Tor ใน WSL เท่านั้น

`<Local Disk>` คือไดรฟ์ Windows ที่ใช้เก็บข้อมูล node เช่น `D:`
ให้แทนด้วยไดรฟ์ของคุณทุกจุดก่อนรันคำสั่ง

| รายการ         | ค่า                                                  |
| -------------- | ---------------------------------------------------- |
| โปรแกรม        | `C:\Program Files\Bitcoin\bitcoin-qt.exe`            |
| `bitcoin-cli`  | `C:\Program Files\Bitcoin\daemon\bitcoin-cli.exe`    |
| โฟลเดอร์ข้อมูล | `<Local Disk>\Bitcoin Node`                          |
| Config         | `<Local Disk>\Bitcoin Node\bitcoin.conf`             |
| Log            | `<Local Disk>\Bitcoin Node\debug.log`                |
| RPC            | `127.0.0.1:8332`                                     |
| Tor            | `127.0.0.1:9050` และ `127.0.0.1:9051` ซึ่งอยู่ใน WSL |

> **อย่าใช้ Bitcoin Knots 29.4.1 ขึ้นไป:**
> [release notes](https://github.com/bitcoinknots/bitcoin/releases/tag/v29.4.1.knots20260508)
> ระบุว่าเปลี่ยน proof-of-work เป็น BLAKE2b แบบ backward-incompatible ทำให้ node
> แยกไปอยู่คนละ chain กับ Bitcoin Core

> **ทำไมไม่รัน node ใน WSL:** เคยลองแล้วเมื่อพฤศจิกายน 2026 node ทำให้หน่วยความจำของ WSL
> ตึงจน kernel จองหน่วยความจำให้ vsock ไม่ได้ WSL Relay ซึ่งพา `127.0.0.1` จาก Windows
> เข้า WSL จึงรับ connection ไม่ได้เป็นช่วง ๆ และ Space ขึ้น
> `CONNECT_TIMEOUT 127.0.0.1:5432` บ่อยมาก ให้ WSL มีแค่ Docker และ Tor

### 4.1 ดาวน์โหลดและตรวจ

ดาวน์โหลดผ่าน Tor และตรวจลายเซ็นใน Ubuntu แล้วตรวจ Authenticode ใน PowerShell

1. ดาวน์โหลดลงโฟลเดอร์ Downloads ของ Windows โดยแทน `<Windows user>` ด้วยชื่อโฟลเดอร์ใน
   `C:\Users` ถ้าช้ามากให้รันซ้ำ ชื่อผู้ใช้สุ่มทำให้ Tor เปลี่ยน circuit และ `-C -`
   จะโหลดต่อจากเดิม

   ```bash
   V=31.2
   D=/mnt/c/Users/<Windows user>/Downloads/bitcoin-core-$V
   mkdir -p "$D" && cd "$D"
   for f in bitcoin-$V-win64-setup.exe SHA256SUMS SHA256SUMS.asc; do
     curl --socks5-hostname "c$RANDOM:x@127.0.0.1:9050" -fLO -C - "https://bitcoincore.org/bin/bitcoin-core-$V/$f"
   done
   ```

2. ตรวจ hash ต้องขึ้น `OK`

   ```bash
   sha256sum --ignore-missing --check SHA256SUMS
   ```

3. ตรวจลายเซ็นด้วย key ของผู้ build จาก `bitcoin-core/guix.sigs` ต้องมี `Good signature`
   หลายรายการ (รุ่น 31.2 ได้ 8 รายการ) และห้ามมี `BAD signature` คำเตือนว่า key ยังไม่ถูก
   trust เป็นเรื่องปกติ

   ```bash
   export GNUPGHOME="$HOME/.cache/gnupg-core-$V"; mkdir -m 700 -p "$GNUPGHOME"
   curl -fsSL 'https://api.github.com/repositories/355107265/contents/builder-keys' \
     | grep download_url | grep -oE 'https://[a-zA-Z0-9./_-]+' \
     | while read -r u; do curl -fsSL "$u" | gpg --batch --quiet --import; done
   gpg --batch --verify SHA256SUMS.asc SHA256SUMS 2>&1 | grep -E 'Good signature|BAD signature'
   rm -rf "$GNUPGHOME"; unset GNUPGHOME
   ```

4. ตรวจลายเซ็นของ Windows ใน PowerShell ต้องได้ `Valid` และผู้เซ็นคือ
   `Bitcoin Core Code Signing LLC`

   ```powershell
   Get-AuthenticodeSignature "$env:USERPROFILE\Downloads\bitcoin-core-31.2\bitcoin-31.2-win64-setup.exe" | Format-List Status, SignerCertificate
   ```

### 4.2 ติดตั้ง

ติดตั้งเมื่อผ่านการตรวจทั้งหมดในหัวข้อ 4.1 แล้ว โดยดับเบิลคลิกตัวติดตั้งตามปกติ
หรือติดตั้งแบบไม่ถามอะไรจาก PowerShell ซึ่งจะขึ้นหน้าต่าง UAC ให้กดยืนยัน

```powershell
Start-Process "$env:USERPROFILE\Downloads\bitcoin-core-31.2\bitcoin-31.2-win64-setup.exe" -ArgumentList '/S' -Verb RunAs -Wait
```

### 4.3 เตรียมโฟลเดอร์ข้อมูล

สร้างโฟลเดอร์ก่อนเปิด Bitcoin Core ครั้งแรก แล้วจำกัดสิทธิ์ให้บัญชีของคุณ, SYSTEM และ
Administrators เท่านั้น เพราะ `bitcoin.conf` มีรหัสผ่านอยู่ข้างใน รันใน PowerShell แบบปกติ

```powershell
$dir = '<Local Disk>\Bitcoin Node'
New-Item -ItemType Directory -Force -Path $dir
icacls $dir /inheritance:r /grant:r "$($env:USERDOMAIN)\$($env:USERNAME):(OI)(CI)F" "SYSTEM:(OI)(CI)F" "Administrators:(OI)(CI)F"
```

### 4.4 ตั้งค่า bitcoin.conf

Space ใช้ RPC user 2 ตัวที่มีสิทธิ์ต่างกัน และไม่เก็บรหัสจริงไว้ใน `bitcoin.conf`

| User                 | ใครใช้                                           | รหัส                                                              |
| -------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `rpc_space`          | เว็บ และสคริปต์ที่แค่อ่าน                        | สุ่มด้วย `openssl rand -hex 32` แล้วเก็บใน `.env`                 |
| `rpc_space_terminal` | `tests/transfer.spec.ts`, `tests/wallet.spec.ts` | Terminal password ตั้งเอง เก็บใน password manager ไม่อยู่ในไฟล์ใด |

สร้างบรรทัด `rpcauth` ทีละ user ใน Ubuntu โดยรันครั้งที่สองด้วย `rpc_space_terminal`
รหัสที่พิมพ์จะไม่เข้า history ของ shell

```bash
python3 - rpc_space <<'PY'
import getpass, hmac, secrets, sys
password = getpass.getpass(f"Password for {sys.argv[1]}: ")
salt = secrets.token_hex(16)
digest = hmac.new(salt.encode(), password.encode(), "SHA256").hexdigest()
print(f"rpcauth={sys.argv[1]}:{salt}${digest}")
PY
```

สร้าง `<Local Disk>\Bitcoin Node\bitcoin.conf` ด้วย Notepad แล้วบันทึกเป็น UTF-8
โดยใส่ค่าที่ได้ และ `torpassword` คือรหัสผ่านตัวจริงที่สร้าง hash ในหัวข้อ 3.2

```ini
txindex=1
blockfilterindex=1
coinstatsindex=1
dbcache=4096
spendzeroconfchange=0

server=1
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
rpcallowip=::1
rpcport=8332
rpcthreads=16
rpcauth=rpc_space:REPLACE_ME
rpcauth=rpc_space_terminal:REPLACE_ME
rpcwhitelistdefault=1
rpcwhitelist=rpc_space:getblockchaininfo,getnetworkinfo,getmempoolinfo,getpeerinfo,getnettotals,getnetworkhashps,getmempoolfeeratediagram,getblockhash,getblockheader,uptime,getrawtransaction,listwallets,getwalletinfo,getbalances,listunspent,listtransactions,getaddressinfo
rpcwhitelist=rpc_space_terminal:getblockchaininfo,listwallets,loadwallet,createwallet,listdescriptors,getdescriptorinfo,importdescriptors,getaddressinfo,listunspent,listtransactions,estimatesmartfee,testmempoolaccept,sendrawtransaction
rpcwhitelist=__cookie__:getblockchaininfo,getnetworkinfo,getpeerinfo,getmempoolinfo

onlynet=onion
proxy=127.0.0.1:9050
proxyrandomize=1
torcontrol=127.0.0.1:9051
torpassword=REPLACE_ME
listen=1
listenonion=1
bind=127.0.0.1:8334=onion
discover=0
dns=0
dnsseed=0
natpmp=0
```

| ค่า                         | เหตุผล                                                                     |
| --------------------------- | -------------------------------------------------------------------------- |
| `onlynet=onion`, `proxy`    | ให้ P2P ทั้งหมดวิ่งผ่าน Tor                                                |
| `proxyrandomize=1`          | แยก circuit ต่อ connection เพื่อไม่ให้เชื่อมโยงกันได้                      |
| `dns=0`, `dnsseed=0`        | ไม่ค้น DNS นอก Tor โดยจะหา peer จาก seed ที่ฝังมาใน Core                   |
| `natpmp=0`                  | ปิดการเปิดพอร์ตอัตโนมัติ ซึ่งเปิดเป็นค่าเริ่มต้นตั้งแต่ Core 30            |
| `bind=127.0.0.1:8334=onion` | รับ connection ขาเข้าผ่าน onion service เท่านั้น                           |
| `rpcbind=127.0.0.1`         | เปิด RPC เฉพาะในเครื่อง                                                    |
| `rpcauth`                   | เก็บแค่ hash ของรหัส ไม่เก็บรหัสจริงในไฟล์                                 |
| `rpcwhitelist`              | จำกัดคำสั่งของแต่ละ user โดยเว็บอ่านได้อย่างเดียว                          |
| `txindex=1`                 | Space ต้องใช้เพื่ออ่านประวัติธุรกรรม                                       |
| `dbcache=4096`              | เร่ง sync ครั้งแรก เมื่อ sync ครบลดเหลือ `1024` ได้ แล้วค่อยเปิด node ใหม่ |

บน Windows ไม่มีด่านกันรั่วระดับระบบแบบ systemd การที่ node ใช้แค่ Tor มาจากค่าใน
`bitcoin.conf` อย่างเดียว ทุกครั้งที่แก้ไฟล์นี้ให้ตรวจตามหัวข้อ 4.6 ซ้ำ

**ห้ามมี `rpcwhitelist` สองบรรทัดสำหรับ user เดียวกัน** เพราะ Core
จะเก็บเฉพาะคำสั่งที่อยู่ในทั้งสองบรรทัด ถ้า Space เรียกคำสั่งใหม่ในอนาคต
ต้องเพิ่มลงในบรรทัดเดิม ไม่อย่างนั้น log ของแอปจะขึ้น `HTTP 403 Forbidden` และ `debug.log`
จะบอกชื่อคำสั่งนั้น

บรรทัด `__cookie__` คือสิทธิ์ของ `bitcoin-cli` ในเครื่องนี้ ซึ่งอ่านสถานะได้ตามหัวข้อ 4.6
แต่ส่งเงินหรืออ่าน wallet ไม่ได้ และ `bitcoin-cli stop` ก็ใช้ไม่ได้ ให้ปิด node จากเมนูของ
Bitcoin Core ตามหัวข้อ 4.8

### 4.5 เปิดครั้งแรก

1. เปิด Ubuntu ค้างไว้ให้ Tor ทำงาน แล้วตรวจใน PowerShell ว่า Windows มองเห็น Tor
   ทั้งสองคำสั่งต้องตอบ `True`

   ```powershell
   Test-NetConnection 127.0.0.1 -Port 9050 -InformationLevel Quiet
   Test-NetConnection 127.0.0.1 -Port 9051 -InformationLevel Quiet
   ```

2. เปิด Bitcoin Core จาก Start menu ครั้งแรกจะถามโฟลเดอร์ข้อมูล ให้เลือก **Use a custom
   data directory** แล้วเลือก `<Local Disk>\Bitcoin Node` และ **อย่าเปิดตัวเลือกจำกัดขนาด
   blockchain (prune)** เพราะ `txindex=1` ใช้กับ prune ไม่ได้

### 4.6 ตรวจผล

ทุกคำสั่งรันใน PowerShell ครั้งแรกอาจต้องรอราว 1–3 นาทีกว่าจะมี peer
เริ่มจากสร้างคำสั่งย่อ `btc` ไว้ใน session นั้น

```powershell
function btc { & 'C:\Program Files\Bitcoin\daemon\bitcoin-cli.exe' '-datadir=<Local Disk>\Bitcoin Node' @args }
```

Network ที่ใช้ได้ต้องมีแค่ `onion`

```powershell
((btc getnetworkinfo) -join "`n" | ConvertFrom-Json).networks | Where-Object reachable | Select-Object -ExpandProperty name
```

Peer ทุกตัวต้องเป็น `onion`

```powershell
((btc getpeerinfo) -join "`n" | ConvertFrom-Json) | Group-Object network | Select-Object Count, Name
```

Connection ทั้งหมดของ Bitcoin Core ต้องไปที่ `127.0.0.1` เท่านั้น

```powershell
Get-NetTCPConnection -OwningProcess (Get-Process bitcoin-qt).Id -State Established | Select-Object -ExpandProperty RemoteAddress -Unique
```

ความคืบหน้าดูได้จาก `blocks` ที่เพิ่มขึ้นเรื่อย ๆ

```powershell
((btc getblockchaininfo) -join "`n" | ConvertFrom-Json) | Select-Object blocks, headers, verificationprogress
```

### 4.7 ต่อกับ Space

`.env` ของ Space เก็บเฉพาะ credential ของเว็บ ส่วนสิทธิ์สูงอยู่ใน terminal password
ซึ่งไม่อยู่ในไฟล์ใดเลย เพราะโปรแกรมที่รันในชื่อคุณอ่านไฟล์ของคุณได้ทุกไฟล์

| ใน `.env`      | ค่า                                         |
| -------------- | ------------------------------------------- |
| `RPC_PROTOCOL` | `http`                                      |
| `RPC_HOST`     | `127.0.0.1`                                 |
| `RPC_PORT`     | `8332`                                      |
| `RPC_USERNAME` | `rpc_space`                                 |
| `RPC_PASSWORD` | รหัสของ `rpc_space` จากหัวข้อ 4.4           |
| `DB_USER`      | `web_space`                                 |
| `DB_PASSWORD`  | รหัสของ role `web_space` จากขั้นตอนด้านล่าง |
| `DB_OWNER`     | role ที่เป็นเจ้าของตาราง (`POSTGRES_USER`)  |

ตั้งค่า Postgres ตามลำดับนี้:

1. ถ้า `docker-compose.yml` ของ Postgres publish port เป็น `5432:5432` ให้เปลี่ยนเป็น
   `127.0.0.1:5432:5432` และถ้าไฟล์นั้นอ่าน `DB_USER` หรือ `DB_PASSWORD` จาก `.env`
   ตัวเดียวกับ Space ให้แยกออกก่อน
2. สร้างตารางและ role `web_space` ด้วย owner role รันใน PowerShell ที่โฟลเดอร์ของ Space

   ```powershell
   $env:DB_USER = "<owner role>"
   $env:DB_PASSWORD = [Net.NetworkCredential]::new("", (Read-Host -AsSecureString "Owner password")).Password
   bun run drizzle:migrate
   Remove-Item Env:DB_USER, Env:DB_PASSWORD
   ```

3. ตั้งรหัสใน Ubuntu `\password` จะ hash ฝั่ง client รหัสจริงจึงไม่เข้า log ของ server
   รหัสของ owner role ต้องเป็น terminal password ตัวเดียวกับ `rpc_space_terminal`

   ```bash
   docker exec -it postgresql psql -U <owner role> -d <db name>
   ```

   ```text
   \password web_space
   \password <owner role>
   \q
   ```

ตรวจผลใน PowerShell โดยใช้คำสั่ง `btc` จากหัวข้อ 4.6:

| ตรวจอะไร                 | คำสั่ง                                                                                                                                        | ผลที่ถูกต้อง                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| เว็บอ่าน node ได้        | `bun tests/node.spec.ts`                                                                                                                      | แสดงสถานะ node                          |
| Terminal password ใช้ได้ | `bun tests/wallet.spec.ts load`                                                                                                               | จบโดยไม่มี error                        |
| `bitcoin-cli` อ่านได้    | `btc getblockchaininfo`                                                                                                                       | ตอบปกติ                                 |
| `bitcoin-cli` ถูกจำกัด   | `btc listwallets`                                                                                                                             | `error: server returned HTTP error 403` |
| เว็บถูกจำกัด             | `curl.exe -s -o NUL -w "%{http_code}" -u rpc_space --data-binary '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"help\"}' http://127.0.0.1:8332/` | ถาม password แล้วพิมพ์ `403`            |

ในคำสั่งสุดท้ายต้องใช้ `curl.exe` ไม่ใช่ `curl` เพราะใน PowerShell 5.1 คำว่า `curl` คือ
`Invoke-WebRequest`

Space จะแสดงคำเตือนแทนหน้า wallet จนกว่า node จะ sync เกิน 97% ส่วนการสร้างและกู้ wallet
ทำจาก terminal ตามหัวข้อ Wallets ใน `README.md` และการส่งเงินทำจาก terminal ตามหัวข้อ
Sending

ถ้าหน้า wallet บอกว่า node ยืนยัน address ไม่ได้ และ log ขึ้น `HTTP 403 Forbidden` ให้รัน
`bun tests/wallet.spec.ts load` เพราะเว็บโหลด wallet ของ node เองไม่ได้

### 4.8 การใช้งานประจำวัน

**เปิด:** ทำตามลำดับนี้

1. เข้า `wsl -d Ubuntu` แล้วเปิดหน้าต่างค้างไว้ ถ้าปิดหน้าต่างสุดท้าย WSL จะดับพร้อม Tor
   และ node จะหา peer ไม่ได้ แต่ข้อมูลไม่เสีย
2. เปิด container ถ้าต้องใช้ โดยต้องรันจากจุดที่ไฟล์ compose นั้นอยู่

   ```bash
   docker compose up -d
   ```

3. เปิด Bitcoin Core จาก Start menu

**ปิด:** ทำตามลำดับนี้

1. ปิด Bitcoin Core จากเมนู **File → Exit** หรือคลิกขวาที่ไอคอนใน system tray แล้วเลือก
   Exit ปุ่ม X มุมหน้าต่างแค่ย่อลง tray เพราะตั้ง Minimize on close ไว้ จากนั้น
   **รอจนหน้าต่าง "Bitcoin Core is shutting down" หายไป** เพราะ node ต้องเขียนข้อมูลใน
   `dbcache` ลงดิสก์ อาจใช้เวลาหลายนาที คำสั่งนี้ต้องไม่แสดงอะไร

   ```powershell
   Get-Process bitcoin-qt -ErrorAction SilentlyContinue
   ```

2. หยุด container ที่เปิดโดยต้องรันจากจุดที่ไฟล์ compose นั้นอยู่

   ```bash
   docker compose down
   ```

3. ออกจาก Ubuntu ด้วย `logout`
4. ใน PowerShell ปิด WSL แล้วปิดหน้าต่าง

   ```powershell
   wsl --shutdown
   exit
   ```

ถ้าจะปิดหรือรีสตาร์ต Windows ให้ปิด Bitcoin Core ตามข้อ 1 ก่อนเสมอ

### 4.9 Sync ผ่าน clearnet ชั่วคราว

การ sync ตั้งแต่ศูนย์ผ่าน Tor ใช้เวลาหลายวัน ถ้าต้องการเร็วกว่า ให้ sync ผ่าน clearnet
แล้วค่อยกลับเป็น Tor-only ระหว่างนั้น ISP และ peer จะเห็นว่า IP นี้รัน node

1. ปิด Bitcoin Core ตามหัวข้อ 4.8 แล้วสำรอง config ใน PowerShell

   ```powershell
   Copy-Item '<Local Disk>\Bitcoin Node\bitcoin.conf' '<Local Disk>\Bitcoin Node\bitcoin.conf.tor'
   ```

2. ใน `bitcoin.conf` ลบบรรทัดตั้งแต่ `onlynet=onion` ถึง `natpmp=0` แล้วใส่ชุดนี้แทน

   ```ini
   blocksonly=1
   listen=0
   discover=0
   natpmp=0
   dns=1
   dnsseed=1
   ```

3. เปิด Bitcoin Core ระหว่างนี้ **อย่าส่ง bitcoin** เพราะธุรกรรมจะผูกกับ IP ของคุณได้ และ
   `blocksonly=1` ทำให้ `estimatesmartfee` ประมาณค่าธรรมเนียมได้ไม่แม่น
4. เมื่อ sync ถึงปลาย chain ให้ปิด Bitcoin Core คืน config เดิม
   แล้วเปิดใหม่และตรวจตามหัวข้อ 4.6 ว่ากลับเป็น `onion` อย่างเดียว

   ```powershell
   Copy-Item '<Local Disk>\Bitcoin Node\bitcoin.conf.tor' '<Local Disk>\Bitcoin Node\bitcoin.conf' -Force
   ```

### 4.10 อัปเกรด Bitcoin Core

1. อ่าน release notes ของรุ่นใหม่ก่อน
2. ดาวน์โหลดและตรวจตามหัวข้อ 4.1 โดยเปลี่ยน `V=` และชื่อไฟล์เป็นรุ่นใหม่
3. ปิด Bitcoin Core ตามหัวข้อ 4.8
4. ติดตั้งตามหัวข้อ 4.2 ตัวติดตั้งจะเขียนทับรุ่นเดิม และข้อมูลใน
   `<Local Disk>\Bitcoin Node` ยังอยู่
5. เปิด Bitcoin Core แล้วตรวจตามหัวข้อ 4.6

### 4.11 แก้ปัญหา

| อาการ                                                              | สาเหตุ                                                                  | วิธีแก้                                                                                 |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Peer เป็น `0` นานเกิน 3 นาที                                       | WSL ไม่ได้เปิดอยู่ หรือ Tor ไม่ทำงาน                                    | เปิด Ubuntu ค้างไว้ แล้วตรวจตามข้อ 1 ของหัวข้อ 4.5 และหัวข้อ 3.3                        |
| `bitcoin-cli` ขึ้น `Could not locate RPC credentials` หลังเปิดใหม่ | Node ยังสร้างไฟล์ `.cookie` ไม่เสร็จ                                    | รอสักครู่แล้วรันใหม่ หรือใส่ `-rpcwait` ไว้หน้าคำสั่ง                                   |
| `error: server returned HTTP error 403`                            | คำสั่งนั้นไม่อยู่ใน `rpcwhitelist` ของ user ที่ใช้                      | เพิ่มคำสั่งลงในบรรทัดเดิมของ user นั้นตามหัวข้อ 4.4                                     |
| `headers` เป็น `0` แต่ log ขึ้น `Pre-synchronizing blockheaders`   | เป็นขั้น pre-sync ซึ่งปกติ และจะเริ่มนับใหม่ถ้าเปิด node ใหม่ระหว่างทาง | รอจนขึ้น `Synchronizing blockheaders`                                                   |
| กด X แล้ว node ยังทำงาน                                            | ตั้ง Minimize on close ไว้ หน้าต่างจึงแค่ย่อลง tray                     | ปิดจากเมนู File → Exit ตามหัวข้อ 4.8                                                    |
| Space ขึ้น `CONNECT_TIMEOUT 127.0.0.1:5432`                        | WSL Relay รับ connection ไม่ได้ ตามที่อธิบายไว้ต้นหัวข้อ 4              | ดูว่า node ไม่ได้รันใน WSL และใน Ubuntu ดู `sudo dmesg \| grep -c 'allocation failure'` |
