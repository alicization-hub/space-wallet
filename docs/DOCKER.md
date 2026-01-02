# Docker Engine on WSL 2 (Ubuntu) Setup Guide

This guide details how to install the standard **Docker Engine** directly inside your WSL 2 Ubuntu
distribution. This approach is often preferred over Docker Desktop for performance and licensing reasons
(Docker Engine is free and open source).

---

## 1. Uninstall Old Versions

First, ensure a clean environment by removing any conflicting legacy packages.

1.  Open your **Ubuntu Terminal** (WSL).
2.  Run the removal command:
    ```bash
    for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt remove $pkg; done
    ```

---

## 2. Install Docker Engine

We will install Docker using the official repository to ensure ease of upgrades.

### Step 2.1: Set up the Repository

1.  **Update apt and install certificates**:

    ```bash
    sudo apt update
    sudo apt install ca-certificates curl gnupg -y
    ```

2.  **Add Docker's Official GPG Key**:

    ```bash
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    ```

3.  **Add the Repository to sources**:
    ```bash
    echo \
      "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    ```
    _(This command automatically detects your Ubuntu version and architecture)._

### Step 2.2: Install Docker Packages

1.  Update the package index again with the new repo:

    ```bash
    sudo apt update
    ```

2.  Install Docker Engine, CLI, containerd, and plugins:
    ```bash
    sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
    ```

---

## 3. Post-Installation Configuration

### Step 3.1: Manage Docker as Non-Root User

By default, Docker commands generally require `sudo`. To run Docker without `sudo`:

1.  **Add your user to the docker group**:

    ```bash
    sudo usermod -aG docker $USER
    ```

2.  **Apply changes**:
    - You generally need to log out and log back in.
    - Alternatively, activate the group change immediately:
      ```bash
      newgrp docker
      ```

### Step 3.2: Enable Systemd (Recommended)

Modern WSL 2 supports `systemd`. Enabling this allows Docker to start automatically like a real Linux server,
avoiding hacky scripts.

1.  **Check/Edit wsl.conf**: Run the following to verify or create the configuration file:

    ```bash
    sudo nano /etc/wsl.conf
    ```

2.  **Add these lines**:

    ```ini
    [boot]
    systemd=true
    ```

3.  **Save and Exit**:
    - Press `Ctrl + O`, `Enter` to save.
    - Press `Ctrl + X` to exit.

4.  **Restart WSL**: You must restart WSL completely for this to take effect.
    - **In Windows PowerShell**:
      ```powershell
      wsl --shutdown
      ```
    - Open Ubuntu again.

5.  **Enable Docker Service**: Now inside Ubuntu, enable and start Docker:
    ```bash
    sudo systemctl enable docker
    sudo systemctl start docker
    ```

---

## 4. Verification

To verify that Docker is installed and configured correctly:

1.  Run the "Hello World" container:

    ```bash
    docker run hello-world
    ```

    **Success Output**: If you see a message saying **"Hello from Docker!"**, your installation is successful.

---

## 5. Cheat Sheet

| Command                | Description                                                      |
| :--------------------- | :--------------------------------------------------------------- |
| `docker ps`            | List running containers.                                         |
| `docker ps -a`         | List all containers (including stopped ones).                    |
| `docker images`        | List locally downloaded images.                                  |
| `docker compose up -d` | Start services defined in `docker-compose.yml` in detached mode. |
| `docker compose down`  | Stop and remove resources created by `up`.                       |
| `docker logs -f <id>`  | Follow logs of a specific container.                             |
