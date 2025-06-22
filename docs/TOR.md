# Setting Up Bitcoin Core with Tor in WSL2 (Ubuntu)

This guide summarizes the steps to install the Tor daemon in WSL2 (Ubuntu) and configure your Bitcoin Core
node (running on Windows or WSL2) to connect through Tor, including setting up a Tor Hidden Service.

---

## 1. Install Tor Daemon in WSL2 (Ubuntu)

This ensures you're using the latest and most secure version of Tor.

1.  **Open your Ubuntu terminal in WSL2.**

2.  **Install necessary dependencies:**

    ```bash
    sudo apt update
    sudo apt install apt-transport-https curl gnupg -y
    ```

3.  **Add Tor Project's GPG Key:**

    ```bash
    curl -s [https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc](https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc) | gpg --dearmor | sudo tee /usr/share/keyrings/tor-archive-keyring.gpg >/dev/null
    ```

4.  **Add Tor Project Repository to APT sources:**

    ```bash
    echo "deb [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] [https://deb.torproject.org/torproject.org](https://deb.torproject.org/torproject.org) $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/tor.list >/dev/null
    echo "deb-src [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] [https://deb.torproject.org/torproject.org](https://deb.torproject.org/torproject.org) $(lsb_release -cs) main" | sudo tee -a /etc/apt/sources.list.d/tor.list >/dev/null
    ```

5.  **Update APT cache and install Tor:**

    ```bash
    sudo apt update
    sudo apt install tor deb.torproject.org-keyring -y
    ```

6.  **Configure Tor's ControlPort:** Bitcoin Core needs to communicate with Tor's ControlPort to manage the
    Hidden Service.

    - **Stop Tor service:**

      ```bash
      sudo systemctl stop tor
      ```

    - **Edit `torrc`:**

      ```bash
      sudo nano /etc/tor/torrc
      ```

    - **Choose one of these authentication methods:**

      - **Option A: No Authentication (easiest for testing)** Add or uncomment these lines:

        ```bash
        ControlPort 9051
        CookieAuthentication 0
        ```

      - **Option B: Hashed Password Authentication (more secure and recommended)**

        1.  **Generate a hashed password** in your WSL2 terminal:

            ```bash
            tor --hash-password "your_strong_control_password"
            ```

            _Replace `"your_strong_control_password"` with a secure password you'll remember._ This command
            will output a hashed string starting with `16:`. Copy this entire string.

        2.  **Add these lines to `torrc`:**

            ```bash
            ControlPort 9051
            HashedControlPassword <PASTE_YOUR_HASHED_PASSWORD_HERE>
            ```

            _Make sure `CookieAuthentication 0` is NOT present or commented out if you choose this option._

    - **Save and exit** (`Ctrl+O`, `Enter`, `Ctrl+X`).

    - **Start Tor service:**

      ```bash
      sudo systemctl start tor
      ```

    - **Verify Tor status:**

      ```bash
      sudo systemctl status tor
      ```

      It should show `active (running)`.

---

## 2. Configure Bitcoin Core's `bitcoin.conf`

This section covers setting up Bitcoin Core (whether running on Windows or WSL2) to use the Tor daemon in
WSL2.

### For Bitcoin Core on Windows:

1.  **Locate your `bitcoin.conf` file:** Typically at `%APPDATA%\Roaming\Bitcoin\bitcoin.conf`. If it doesn't
    exist, create it.

2.  **Add/Modify settings in `bitcoin.conf`:** Paste the following configuration. The `127.0.0.1:9050` address
    for the proxy works because WSL2 automatically forwards localhost connections from Windows to services
    running on localhost within WSL2.

    ```ini
    # --- Tor Proxy Settings: Force all outgoing connections through Tor ---
    # Specifies the IP address and port of your Tor SOCKS5 proxy.
    proxy=127.0.0.1:9050

    # Randomizes the source of the proxy connections and prevents DNS leaks.
    proxyrandomize=1

    # Forces Bitcoin Core to only connect to other nodes via the Tor network (.onion addresses).
    # This is crucial for privacy and prevents IP address leakage.
    onlynet=onion

    # --- Tor Hidden Service Settings: Enable incoming connections via Tor ---
    # Enables a Tor Hidden Service for your node. Bitcoin Core will automatically
    # generate and manage the .onion address and its private key.
    onion=1

    # Enables listening for incoming connections. Essential for a full node.
    listen=1

    # Binds Bitcoin Core to the local interface only, routing incoming Tor connections.
    bind=127.0.0.1

    # Do not specify an external IP when using a Tor Hidden Service.
    # Comment this line out, or ensure it's not present.
    # externalip=

    # Disable UPNP as it's not needed with a Tor Hidden Service.
    upnp=0

    # Disable automatic external IP discovery when using Tor.
    discover=0

    # Enable detailed Tor-related logging in debug.log.
    debug=tor

    # --- If you chose Hashed Password Authentication for Tor's ControlPort ---
    # This password must match the "your_strong_control_password" you used to generate the hash.
    # torpassword=your_strong_control_password
    ```

## 3. Start Bitcoin Core and Verify

1.  **Start your Bitcoin Core node.**

    - If on Windows, launch the Bitcoin Core GUI or `bitcoind.exe`.
    - If on WSL2, run `bitcoind -daemon` in your Ubuntu terminal.

2.  **Check the `debug.log` file.**

    - On Windows: `%APPDATA%\Roaming\Bitcoin\debug.log`
    - On WSL2: `~/.bitcoin/debug.log`
    - Look for messages indicating successful Tor connection and Hidden Service creation:
      - `[tor] Successfully connected!`
      - `[tor] Authentication successful`
      - `Got tor service ID {serviceId}`
      - `[tor] Our Tor onion service is available at [your_onion_address].onion:8333/`

3.  **Verify Peer Connections (Optional):** In the Bitcoin Core console (GUI) or using `bitcoin-cli` (Windows
    CMD or WSL2 terminal):
    ```bash
    bitcoin-cli getpeerinfo
    ```
    You should see connections with `network: onion` and `.onion` addresses for your peers.

---

By following these steps, your Bitcoin Core node will operate with enhanced privacy by routing all its traffic
through the Tor network, and it will be discoverable by other Tor-enabled nodes via its unique `.onion`
address.
