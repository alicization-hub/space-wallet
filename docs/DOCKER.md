## Docker Engine Installation in WSL (Ubuntu)

### 1. Uninstall Older Versions of Docker (if any)

_It is important to make sure that there are no older versions of Docker that could be causing the problem. If
you have never installed it before, you can skip this step._

- Open Ubuntu Terminal in WSL and run the command

```bash
# This command will attempt to remove all known Docker packages.
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt remove $pkg; done
```

### 2. Install required dependencies

_Docker Engine requires some packages to work._

```bash
sudo apt update
sudo apt install ca-certificates curl gnupg lsb-release -y
```

- `ca-certificates`: Allows browsers and other tools to verify SSL/TLS certificates
- `curl`: A tool for transferring data by URL
- `gnupg`: A tool for cryptography and digital signing
- `lsb-release`: A tool for identifying information about the system's Linux Standard Base (LSB)

### 3. Add Docker GPG Key

_For security and to verify the source of the package, we will need to add the official Docker GPG key._

```bash
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

- `sudo mkdir -m 0755 -p /etc/apt/keyrings`: Create a directory to store GPG Keys if they don't already exist
- `curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg`:
  Download Docker's GPG Key, dearmor (converted to binary), and save it to a `docker.gpg` file

### 4. Add Docker APT Repository

_Now we will add the Docker Repository to our package sources so that apt knows about it and can download the
Docker Engine._

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

_This command will add a line specifying the Docker Repository source to the
`/etc/apt/sources.list.d/docker.list` file based on your system architecture and your Ubuntu distribution
codename._

### 5. Install Docker Engine and Docker Compose

_Once everything is ready, it’s time to install Docker Engine and Docker Compose._

```bash
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

- `docker-ce`: Docker Community Edition (the core Docker Engine)
- `docker-ce-cli`: Docker Command Line Interface (the `docker` tools we use) containerd.io: Container runtime
  (a key component of Docker)
- `docker-buildx-plugin`: a plugin for building multi-platform images
- `docker-compose-plugin`: a plugin for Docker Compose (a tool for managing multi-container Docker
  applications)

### 6. Manage Docker permissions (Optional but highly recommended)

_By default, you will need to use sudo every time you run a docker command. To avoid this, you can add your
current user to the docker group._

```bash
sudo usermod -aG docker $USER
```

- `sudo usermod -aG docker $USER`: Add the current user (`$USER`) to the `docker` group
- Important: After running this command, you must log out of the WSL Terminal and log back in, or close and
  reopen the Terminal, for the new privileges to take effect.

### 7. Configure Docker to run automatically when WSL starts (Optional)

_By default, the Docker Daemon (service) does not start automatically when you start WSL. If you want Docker
to run all the time you use WSL, you can add a command to start the Docker Daemon in your `.bashrc` (or other
shell startup file)._

```bash
echo -e '\n# Start Docker daemon if not running' >> ~/.bashrc
echo 'if ! pgrep dockerd > /dev/null; then' >> ~/.bashrc
echo 'sudo service docker start > /dev/null 2>&1 &' >> ~/.bashrc
echo 'fi' >> ~/.bashrc
```

- This command will add the above code to your `~/.bashrc` file.
- `if ! pgrep dockerd > /dev/null; then`: Check if `dockerd` (Docker daemon) is running.
- `sudo service docker start > /dev/null 2>&1 &`: If not, start the Docker service in the background (`&`) and
  hide the output `(> /dev/null 2>&1)`.

---

**Caution**: Using `sudo service docker start` in your `.bashrc` will prompt you for your password every time
you open a new Terminal. If you don't want to be asked for your password often, you'll need to set up
`sudoers` to allow the current user to run `service docker start` without a password (which is a bit more
complicated and requires security precautions).
