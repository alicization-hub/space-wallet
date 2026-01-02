# Running Bitcoin Core with Tor (WSL 2)

This guide provides a comprehensive approach to running a **Bitcoin Core** node behind **Tor** for enhanced
privacy. We will install the Tor daemon inside a WSL 2 (Ubuntu) environment and configure Bitcoin Core
(whether running on Windows or WSL 2) to route all traffic seamlessly through it.

---

## 1. Install Tor Daemon in WSL 2

We use the official Tor Project repository to ensure we have the latest and most secure version.

### Step 1: Install Dependencies

Open your Ubuntu Terminal (WSL) and install the tools needed for secure package management.

```bash
sudo apt update
sudo apt install apt-transport-https curl gnupg lsb-release -y
```

### Step 2: Add Tor Project Repository

1.  **Add the GPG Key**: Verify the software integrity by adding the Tor Project's official key to your
    keyring.

    ```bash
    curl -s https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --dearmor | sudo tee /usr/share/keyrings/tor-archive-keyring.gpg >/dev/null
    ```

2.  **Add the Repository Source**: Configure `apt` to fetch packages from the Tor Project.

    ```bash
    echo "deb [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] https://deb.torproject.org/torproject.org $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/tor.list >/dev/null
    echo "deb-src [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] https://deb.torproject.org/torproject.org $(lsb_release -cs) main" | sudo tee -a /etc/apt/sources.list.d/tor.list >/dev/null
    ```

### Step 3: Install Tor

Update your package lists and install the Tor service.

```bash
sudo apt update
sudo apt install tor deb.torproject.org-keyring -y
```

---

## 2. Configure Tor

To allow Bitcoin Core to create a **Hidden Service** (allowing incoming connections without port forwarding)
and control Tor, we must configure the `ControlPort`.

### Step 1: Edit Configuration

1.  Stop the service before editing:

    ```bash
    sudo systemctl stop tor
    ```

2.  Open the configuration file:
    ```bash
    sudo nano /etc/tor/torrc
    ```

### Step 2: Setup Control Port

Scroll to the relevant section or add these lines to the bottom. Choose **one** authentication method:

#### Option A: No Authentication (Easiest)

_Best for single-user secured machines._

```ini
ControlPort 9051
CookieAuthentication 0
```

#### Option B: Hashed Password (Secure)

_Recommended for shared environments._

1.  Generate a hash:
    ```bash
    tor --hash-password "your_strong_password"
    ```
2.  Add to `torrc`:
    ```ini
    ControlPort 9051
    HashedControlPassword 16:98AA...REPLACE_WITH_YOUR_HASH...
    CookieAuthentication 0
    ```

### Step 3: Restart Tor

Save the file (`Ctrl+O` -> `Enter`) and exit (`Ctrl+X`), then restart the service.

```bash
sudo systemctl start tor
sudo systemctl status tor
```

_(Ensure the status is **active (running)**)_.

---

## 3. Configure Bitcoin Core

Now, configure your Bitcoin node to proxy traffic through Tor.

**File Location:**

- **Windows**: `%APPDATA%\Bitcoin\bitcoin.conf`
- **WSL 2**: `~/.bitcoin/bitcoin.conf`

Add the following lines to your `bitcoin.conf`:

```ini
# --- Tor Proxy Settings ---

# Connect to Tor SOCKS5 proxy (WSL 2 runs on localhost for Windows apps too)
proxy=127.0.0.1:9050

# Randomize credentials to prevent transaction linking
proxyrandomize=1

# Block all non-Tor traffic (Prevents IP leaks)
onlynet=onion

# --- Hidden Service (Incoming) ---

# Automatically create a Hidden Service
onion=1

# Listen for incoming connections
listen=1
bind=127.0.0.1

# --- Security ---

# Disable UPnP (Not needed for Tor)
upnp=0
discover=0

# Enable Tor debug logging
debug=tor

# If using Option B (Hashed Password), add your password here:
# torpassword=your_strong_password
```

---

## 4. Verification

Restart Bitcoin Core and check the following to ensure you are private.

1.  **Check `debug.log`**: Look for lines containing "tor". You should see:

    > `tor: Got service ID <your_onion_address>, advertising service ...` `AddOnion successful`

2.  **Check Peer Connections**: Run `bitcoin-cli getpeerinfo` (or use the Console).
    - Ensure peers have **.onion** addresses.
    - This confirms all traffic is routed through the Tor network.

---

### Troubleshooting

- **Connection Issues?** If Bitcoin Core on Windows cannot reach Tor in WSL 2, ensure WSL is running. In rare
  cases where `localhost` binding fails, find your WSL IP:
  ```bash
  ip addr show eth0
  ```
  Use that IP (e.g., `172.x.x.x`) instead of `127.0.0.1` in `bitcoin.conf`.
