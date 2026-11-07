# คู่มือติดตั้ง WSL, Docker, Tor และ Bitcoin Node

คู่มือนี้ติดตั้งทุกอย่างที่ Space ต้องใช้บนเครื่อง Windows ให้ทำตามลำดับหัวข้อ
เพราะแต่ละส่วนต้องใช้ส่วนก่อนหน้า ผลลัพธ์สุดท้ายคือ Bitcoin Core ที่รันใน WSL
และเชื่อมต่อผ่าน Tor เท่านั้น

| ส่วน         | หน้าที่                              | เริ่มทำงานเมื่อ                                             |
| ------------ | ------------------------------------ | ----------------------------------------------------------- |
| WSL          | ระบบ Linux ที่ทุกส่วนรันอยู่         | เข้า `wsl -d Ubuntu` ครั้งแรก                               |
| Docker       | รัน Postgres และ Redis               | พร้อม WSL แต่ container ต้องสั่ง `docker compose up -d` เอง |
| Tor          | ทางออกเครือข่ายของ node              | พร้อม WSL                                                   |
| Bitcoin Node | Bitcoin Core ที่ Space เรียกผ่าน RPC | พร้อม WSL                                                   |

แต่ละชุดคำสั่งบอกไว้ว่าต้องรันใน **PowerShell** (ฝั่ง Windows) หรือ **Ubuntu** (ใน WSL)
ตัวเลขและค่าตัวอย่างอ้างอิงเครื่องจริง ณ วันที่ 31 ตุลาคม 2026

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

Docker, Tor และ `bitcoind` ต้องใช้ systemd เพื่อเริ่มเองพร้อม WSL

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
จากนั้นสั่ง `wsl --shutdown` เพื่อให้มีผล ถ้าจำกัด RAM ต้องเหลือพอสำหรับ `dbcache` ของ
node ด้วย

```ini
[wsl2]
telemetry=false
memory=8GB
processors=4
```

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
  รวมถึง Docker, Tor และ `bitcoind`

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

---

## 4. Bitcoin Node

ส่วนนี้ติดตั้ง **Bitcoin Core 31.2** ใน WSL โดยเก็บข้อมูลไว้ในไฟล์ VHDX บน `<Local Disk>`
และให้ P2P วิ่งผ่าน Tor เท่านั้น

`<Local Disk>` คือไดรฟ์ Windows ที่ใช้เก็บ VHDX เช่น `D:`
ให้แทนด้วยไดรฟ์ของคุณทุกจุดก่อนรันคำสั่ง

| รายการ           | ค่า                                                              |
| ---------------- | ---------------------------------------------------------------- |
| ไฟล์ดิสก์        | `<Local Disk>\bitcoin-node.vhdx`                                 |
| จุด mount ใน WSL | `/mnt/wsl/btcnode`                                               |
| โฟลเดอร์ข้อมูล   | `/mnt/wsl/btcnode/bitcoin` โดยมี `~/.bitcoin` เป็น symlink ชี้ไป |
| Config           | `~/.bitcoin/bitcoin.conf`                                        |
| Log              | `~/.bitcoin/debug.log`                                           |
| RPC              | `127.0.0.1:8332` เรียกได้ทั้งจาก WSL และ Windows                 |

> **อย่าใช้ Bitcoin Knots 29.4.1 ขึ้นไป:**
> [release notes](https://github.com/bitcoinknots/bitcoin/releases/tag/v29.4.1.knots20260508)
> ระบุว่าเปลี่ยน proof-of-work เป็น BLAKE2b แบบ backward-incompatible ทำให้ node
> แยกไปอยู่คนละ chain กับ Bitcoin Core

### 4.1 สร้าง VHDX

1. เปิด PowerShell แบบ **Run as administrator** แล้วคำนวณขนาดที่ 95% ของ `<Local Disk>`

   ```powershell
   [math]::Floor((Get-Volume -FilePath <Local Disk>\).Size * 0.95 / 1MB)
   ```

2. สร้างไฟล์ด้วยตัวเลขที่ได้ ตัวอย่างนี้ใช้ค่าของไดรฟ์ 2 TB ไฟล์จะเริ่มที่ราว 4 MB
   และโตตามการใช้งานจริง

   ```powershell
   'create vdisk file="<Local Disk>\bitcoin-node.vhdx" maximum=1812326 type=expandable' | diskpart
   ```

3. เปิด PowerShell **แบบปกติ ไม่ใช่ Admin**
   แล้วคัดลอกไฟล์เพื่อเปลี่ยนเจ้าของเป็นบัญชีของคุณ ถ้าข้ามขั้นนี้ เจ้าของจะเป็น
   `Administrators` และ WSL จะ mount ไม่ได้

   ```powershell
   Copy-Item <Local Disk>\bitcoin-node.vhdx <Local Disk>\bitcoin-node.new.vhdx
   Remove-Item <Local Disk>\bitcoin-node.vhdx
   Rename-Item <Local Disk>\bitcoin-node.new.vhdx bitcoin-node.vhdx
   (Get-Acl <Local Disk>\bitcoin-node.vhdx).Owner
   ```

บรรทัดสุดท้ายต้องแสดงชื่อบัญชีของคุณ อย่าดับเบิลคลิกไฟล์นี้ใน Windows เพราะ Windows จะ
mount มันเอง แล้ว WSL จะใช้ไฟล์ไม่ได้จนกว่าจะ eject

### 4.2 Format และเตรียมโฟลเดอร์

1. ต่อ VHDX เข้ากับ WSL ใน PowerShell

   ```powershell
   wsl --mount --vhd <Local Disk>\bitcoin-node.vhdx --bare
   ```

2. หา disk ใหม่ใน Ubuntu โดยดูจากขนาดที่ตั้งไว้ แล้ว format โดยแทน `sdX` ด้วยชื่อที่เจอ
   **ตรวจให้แน่ใจก่อนรัน เพราะคำสั่งนี้ล้างข้อมูลทั้ง disk**

   ```bash
   lsblk
   sudo mkfs.ext4 -m 0 -T largefile -L btcnode /dev/sdX
   ```

3. ถอดออกแล้วต่อใหม่แบบมีชื่อใน PowerShell

   ```powershell
   wsl --unmount <Local Disk>\bitcoin-node.vhdx
   wsl --mount --vhd <Local Disk>\bitcoin-node.vhdx --name btcnode
   ```

4. สร้างโฟลเดอร์ข้อมูลและ symlink ใน Ubuntu

   ```bash
   sudo install -d -m 700 -o "$USER" -g "$USER" /mnt/wsl/btcnode/bitcoin
   ln -s /mnt/wsl/btcnode/bitcoin ~/.bitcoin
   ```

### 4.3 ติดตั้ง Bitcoin Core

ทุกคำสั่งรันใน Ubuntu

1. ดาวน์โหลดผ่าน Tor ถ้าช้ามากให้รันซ้ำ ชื่อผู้ใช้สุ่มทำให้ Tor เปลี่ยน circuit และ `-C -`
   จะโหลดต่อจากเดิม ตอนติดตั้งจริงความเร็วต่างกันตั้งแต่ราว 22 KB/s ถึง 716 KB/s

   ```bash
   V=31.2
   mkdir -p ~/.cache/core-$V && cd ~/.cache/core-$V
   for f in bitcoin-$V-x86_64-linux-gnu.tar.gz SHA256SUMS SHA256SUMS.asc; do
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
   export GNUPGHOME="$PWD/gnupg"; mkdir -m 700 "$GNUPGHOME"
   curl -fsSL 'https://api.github.com/repositories/355107265/contents/builder-keys' \
     | grep download_url | grep -oE 'https://[a-zA-Z0-9./_-]+' \
     | while read -r u; do curl -fsSL "$u" | gpg --batch --quiet --import; done
   gpg --batch --verify SHA256SUMS.asc SHA256SUMS 2>&1 | grep -E 'Good signature|BAD signature'
   ```

4. ติดตั้งเมื่อผ่านทั้งสองข้อ แล้วลบไฟล์ดาวน์โหลดทิ้งได้

   ```bash
   tar -xzf bitcoin-$V-x86_64-linux-gnu.tar.gz
   sudo install -m 0755 bitcoin-$V/bin/* /usr/local/bin/
   sudo install -d /usr/local/libexec
   sudo install -m 0755 bitcoin-$V/libexec/* /usr/local/libexec/
   bitcoind --version | head -1
   cd ~ && rm -rf ~/.cache/core-$V
   unset GNUPGHOME
   ```

### 4.4 ตั้งค่า bitcoin.conf

Space ใช้ RPC user 2 ตัวที่มีสิทธิ์ต่างกัน และไม่เก็บรหัสจริงไว้ใน `bitcoin.conf`

| User                 | ใครใช้                                           | รหัส                                                              |
| -------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `rpc_space`          | เว็บ และสคริปต์ที่แค่อ่าน                        | สุ่มด้วย `openssl rand -hex 32` แล้วเก็บใน `.env`                 |
| `rpc_space_terminal` | `tests/transfer.spec.ts`, `tests/wallet.spec.ts` | Terminal password ตั้งเอง เก็บใน password manager ไม่อยู่ในไฟล์ใด |

สร้างบรรทัด `rpcauth` ทีละ user โดยรันครั้งที่สองด้วย `rpc_space_terminal`
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

สร้างไฟล์ด้วย `nano ~/.bitcoin/bitcoin.conf` แล้วใส่ค่าที่ได้ โดย `torpassword`
คือรหัสผ่านตัวจริงที่สร้าง hash ในหัวข้อ 3.2

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

จำกัดสิทธิ์ไฟล์เพราะมีรหัสผ่านอยู่ข้างใน

```bash
chmod 600 ~/.bitcoin/bitcoin.conf
```

| ค่า                         | เหตุผล                                                                    |
| --------------------------- | ------------------------------------------------------------------------- |
| `onlynet=onion`, `proxy`    | ให้ P2P ทั้งหมดวิ่งผ่าน Tor                                               |
| `proxyrandomize=1`          | แยก circuit ต่อ connection เพื่อไม่ให้เชื่อมโยงกันได้                     |
| `dns=0`, `dnsseed=0`        | ไม่ค้น DNS นอก Tor โดยจะหา peer จาก seed ที่ฝังมาใน Core                  |
| `natpmp=0`                  | ปิดการเปิดพอร์ตอัตโนมัติ ซึ่งเปิดเป็นค่าเริ่มต้นตั้งแต่ Core 30           |
| `bind=127.0.0.1:8334=onion` | รับ connection ขาเข้าผ่าน onion service เท่านั้น                          |
| `rpcbind=127.0.0.1`         | เปิด RPC เฉพาะในเครื่อง                                                   |
| `rpcauth`                   | เก็บแค่ hash ของรหัส ไม่เก็บรหัสจริงในไฟล์                                |
| `rpcwhitelist`              | จำกัดคำสั่งของแต่ละ user โดยเว็บอ่านได้อย่างเดียว                         |
| `txindex=1`                 | Space ต้องใช้เพื่ออ่านประวัติธุรกรรม                                      |
| `dbcache=4096`              | เร่ง sync ครั้งแรก เมื่อ sync ครบลดเหลือ `1024` ได้ แล้วค่อย restart node |

**ห้ามมี `rpcwhitelist` สองบรรทัดสำหรับ user เดียวกัน** เพราะ Core
จะเก็บเฉพาะคำสั่งที่อยู่ในทั้งสองบรรทัด ถ้า Space เรียกคำสั่งใหม่ในอนาคต
ต้องเพิ่มลงในบรรทัดเดิม ไม่อย่างนั้น log ของแอปจะขึ้น `HTTP 403 Forbidden` และ `debug.log`
จะบอกชื่อคำสั่งนั้น

บรรทัด `__cookie__` คือสิทธิ์ของ `bitcoin-cli` ในเครื่องนี้ ซึ่งอ่านสถานะได้ตามหัวข้อ 4.6
แต่ส่งเงินหรืออ่าน wallet ไม่ได้ และ `bitcoin-cli stop` ก็ใช้ไม่ได้ ให้หยุด node ด้วย
`systemctl` ตามหัวข้อ 4.8

### 4.5 ตั้งให้เริ่มพร้อม WSL

VHDX ต้องสั่ง mount จากฝั่ง Windows จึงต้องมีสคริปต์ให้ systemd เรียก `wsl.exe` ก่อนเริ่ม
node

1. สร้างสคริปต์ด้วย `sudo nano /usr/local/sbin/btcnode-mount` โดยแทน `<Local Disk>`
   ด้วยไดรฟ์ของคุณ

   ```sh
   #!/bin/sh
   # Attach <Local Disk>\bitcoin-node.vhdx to WSL. Only Windows can attach it, so call wsl.exe through interop.
   M=/mnt/wsl/btcnode
   if ! mountpoint -q "$M"; then
     WSL_UTF8=1 /mnt/c/Windows/System32/wsl.exe --mount --vhd '<Local Disk>\bitcoin-node.vhdx' --name btcnode </dev/null
     i=0
     while ! mountpoint -q "$M"; do
       i=$((i + 1))
       if [ "$i" -gt 30 ]; then
         echo "VHDX did not appear at $M" >&2
         exit 1
       fi
       sleep 1
     done
   fi
   # WSL gives its disks an 8 MiB readahead. LevelDB reads small records through mmap, so each
   # miss pulled megabytes it never used: 128 KiB cut the node's reads from ~1.4 GB/s to ~20 MB/s.
   dev=$(basename "$(findmnt -no SOURCE "$M")")
   echo 128 > "/sys/block/$dev/queue/read_ahead_kb"
   ```

   บรรทัดท้ายลด readahead ของดิสก์จาก 8 MB ที่ WSL ตั้งไว้เหลือ 128 KB ถ้าไม่ลด node
   จะอ่านดิสก์เกินจริงหลายสิบเท่าระหว่าง sync (วัดได้ราว 1.4 GB/s เทียบกับไม่ถึง 150 MB/s)

   ```bash
   sudo chmod 755 /usr/local/sbin/btcnode-mount
   ```

2. สร้าง `/etc/systemd/system/btcnode-mount.service`

   ```ini
   [Unit]
   Description=Mount Bitcoin node VHDX

   [Service]
   Type=oneshot
   RemainAfterExit=yes
   ExecStart=/usr/local/sbin/btcnode-mount
   TimeoutStartSec=120
   ```

3. สร้าง `/etc/systemd/system/bitcoind.service` โดยเปลี่ยน `User=` เป็นชื่อผู้ใช้ Linux
   ของคุณ

   ```ini
   [Unit]
   Description=Bitcoin Core (Tor only)
   Requires=btcnode-mount.service
   After=btcnode-mount.service tor.service
   Wants=tor.service

   [Service]
   User=space-tech
   ExecStartPre=/usr/bin/test -f /mnt/wsl/btcnode/bitcoin/bitcoin.conf
   ExecStart=/usr/local/bin/bitcoind -datadir=/mnt/wsl/btcnode/bitcoin
   Restart=on-failure
   TimeoutStopSec=600
   IPAddressDeny=any
   IPAddressAllow=localhost

   [Install]
   WantedBy=multi-user.target
   ```

   สองบรรทัด `IPAddress...` คือด่านกันรั่ว: ต่อให้ตั้งค่า `bitcoin.conf` ผิด `bitcoind`
   ก็ออกเน็ตตรงไม่ได้ ไปได้แค่ localhost ซึ่งมี Tor รออยู่

4. ทดสอบว่า kernel บังคับใช้ด่านนี้จริง เพราะถ้าไม่รองรับ systemd จะข้ามไปเงียบ ๆ
   คำสั่งแรกต้องได้ `rc` ที่ไม่ใช่ `0` และคำสั่งที่สองต้องได้ `rc=0`

   ```bash
   sudo systemd-run --quiet --wait --pipe -p IPAddressDeny=any -p IPAddressAllow=localhost curl -m 8 -sS -o /dev/null https://1.1.1.1; echo "rc=$?"
   sudo systemd-run --quiet --wait --pipe -p IPAddressDeny=any -p IPAddressAllow=localhost curl -m 60 -sS -o /dev/null --socks5-hostname 127.0.0.1:9050 https://check.torproject.org; echo "rc=$?"
   ```

5. เปิดใช้งาน

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable bitcoind
   sudo systemctl start bitcoind
   ```

### 4.6 ตรวจผล

ทุกคำสั่งรันใน Ubuntu ครั้งแรกอาจต้องรอราว 1–3 นาทีกว่าจะมี peer

| ตรวจอะไร    | คำสั่ง                          | ผลที่ถูกต้อง                    |
| ----------- | ------------------------------- | ------------------------------- |
| Service     | `systemctl is-active bitcoind`  | `active`                        |
| VHDX        | `findmnt /mnt/wsl/btcnode`      | เห็น `ext4`                     |
| ความคืบหน้า | `bitcoin-cli getblockchaininfo` | `blocks` เพิ่มขึ้นเรื่อย ๆ      |
| Socket      | `ss -tnp \| grep bitcoind`      | ปลายทางเป็น `127.0.0.1` ทั้งหมด |

Network ที่ใช้ได้ต้องมีแค่ `['onion']`

```bash
bitcoin-cli getnetworkinfo | python3 -c 'import json,sys; print([n["name"] for n in json.load(sys.stdin)["networks"] if n["reachable"]])'
```

Peer ทุกตัวต้องเป็น `onion`

```bash
bitcoin-cli getpeerinfo | python3 -c 'import json,sys,collections; print(collections.Counter(p["network"] for p in json.load(sys.stdin)))'
```

ดู log แบบต่อเนื่องได้ด้วย `tail -f ~/.bitcoin/debug.log`

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

ตรวจผล:

| ตรวจอะไร                 | คำสั่ง                                                                                                                                  | ผลที่ถูกต้อง                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| เว็บอ่าน node ได้        | `bun tests/node.spec.ts` บน Windows                                                                                                     | แสดงสถานะ node                          |
| Terminal password ใช้ได้ | `bun tests/wallet.spec.ts load` บน Windows                                                                                              | จบโดยไม่มี error                        |
| `bitcoin-cli` อ่านได้    | `bitcoin-cli getblockchaininfo`                                                                                                         | ตอบปกติ                                 |
| `bitcoin-cli` ถูกจำกัด   | `bitcoin-cli listwallets`                                                                                                               | `error: server returned HTTP error 403` |
| เว็บถูกจำกัด             | `curl -s -o /dev/null -w '%{http_code}\n' -u rpc_space --data-binary '{"jsonrpc":"2.0","id":1,"method":"help"}' http://127.0.0.1:8332/` | ถาม password แล้วพิมพ์ `403`            |

Space จะแสดงคำเตือนแทนหน้า wallet จนกว่า node จะ sync เกิน 97% ส่วนการสร้างและกู้ wallet
ทำจาก terminal ตามหัวข้อ Wallets ใน `README.md` และการส่งเงินทำจาก terminal ตามหัวข้อ
Sending

ถ้าหน้า wallet บอกว่า node ยืนยัน address ไม่ได้ และ log ขึ้น `HTTP 403 Forbidden` ให้รัน
`bun tests/wallet.spec.ts load` เพราะเว็บโหลด wallet ของ node เองไม่ได้

### 4.8 การใช้งานประจำวัน

**เปิด:** พิมพ์ `wsl -d Ubuntu` อย่างเดียว VHDX และ node จะเริ่มเอง

**ให้ sync ต่อ:** เปิด terminal ของ WSL ค้างไว้อย่างน้อยหนึ่งหน้าต่าง
เพราะเมื่อปิดหน้าต่างสุดท้าย WSL จะดับและ node จะหยุด แต่เปิดกลับมาแล้วจะ sync ต่อจากเดิม

**ปิด:** ทำตามลำดับนี้

1. หยุด container ที่เปิดโดยต้องรันจากจุดที่ไฟล์ compose นั้นอยู่

   ```bash
   docker compose down
   ```

2. ใน Ubuntu หยุด node แล้ว **รอให้ prompt กลับมาก่อน** เพราะ node ต้องเขียนข้อมูลใน
   `dbcache` ลงดิสก์ อาจใช้เวลาหลายนาที

   ```bash
   sudo systemctl stop bitcoind
   ```

3. ออกจาก Ubuntu ด้วย `logout`
4. ใน PowerShell ปิด WSL แล้วปิดหน้าต่าง

   ```powershell
   wsl --shutdown
   exit
   ```

ถ้าจะปิดหรือรีสตาร์ต Windows ก็ควรหยุด node ตามข้อ 2 ก่อนเช่นกัน ถ้าสั่ง stop
แล้วเปลี่ยนใจโดยยังไม่ได้ออกจาก WSL ให้รัน `sudo systemctl start bitcoind`

### 4.9 อัปเกรด Bitcoin Core

1. อ่าน release notes ของรุ่นใหม่ก่อน
2. หยุด node ด้วย `sudo systemctl stop bitcoind`
3. ทำตามหัวข้อ 4.3 โดยเปลี่ยน `V=` เป็นรุ่นใหม่
4. เริ่ม node ด้วย `sudo systemctl start bitcoind` แล้วตรวจตามหัวข้อ 4.6

### 4.10 แก้ปัญหา

| อาการ                                                                | สาเหตุ                                                                    | วิธีแก้                                                               |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Mount แล้วขึ้น `Wsl/Service/AttachDisk/MountDisk/HCS/E_ACCESSDENIED` | VHDX มีเจ้าของเป็น `Administrators`                                       | ทำขั้นที่ 3 ของหัวข้อ 4.1 ตอนไฟล์ยังว่าง                              |
| `bitcoind` เป็น `failed` หลังเข้า WSL                                | Mount ไม่สำเร็จ เช่น `<Local Disk>` ไม่อยู่ หรือปิด interop ใน `wsl.conf` | ดู `systemctl status btcnode-mount` และ `journalctl -u btcnode-mount` |
| `connections` เป็น `0` ช่วงแรก                                       | Tor กำลังหา peer ซึ่งปกติใช้เวลาราว 1–3 นาที                              | ถ้านานกว่านั้นให้ตรวจ Tor ตามหัวข้อ 3.3                               |
| `headers` เป็น `0` แต่ log ขึ้น `Pre-synchronizing blockheaders`     | เป็นขั้น pre-sync ซึ่งปกติ และจะเริ่มนับใหม่ถ้า restart ระหว่างทาง        | รอจนขึ้น `Synchronizing blockheaders`                                 |
| Node หยุดเองหลังปิด terminal                                         | WSL ดับเมื่อไม่มี session เหลือ                                           | เปิด terminal ค้างไว้ตามหัวข้อ 4.8                                    |
| `wsl --unmount` หรือ mount ไม่ได้เพราะไฟล์ถูกใช้อยู่                 | Windows mount VHDX อยู่จากการดับเบิลคลิก                                  | Eject ไดรฟ์นั้นใน File Explorer ก่อน                                  |
