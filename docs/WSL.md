# Windows Subsystem for Linux (WSL) Setup Guide

This guide provides step-by-step instructions to enable, install, and manage the Windows Subsystem for Linux
(WSL) on your Windows machine. It focuses on setting up **WSL 2**, the latest version offering improved
performance and full system call compatibility.

---

## 1. Prerequisites

Before starting, ensure your system meets the requirements:

- **OS**: Windows 10 (version 2004 or higher, Build 19041 or higher) or Windows 11.
- **Hardware**: Virtualization must be enabled in your computer's BIOS/UEFI settings.

---

## 2. Installation Setup

### Option A: Fresh Installation (No WSL installed)

If you have never installed WSL before, Windows provides a simple single command to set up everything.

1.  **Open PowerShell as Administrator**:
    - Press `Win + X` and select **Windows PowerShell (Admin)**, or search for "PowerShell" in the Start menu,
      right-click, and select "Run as administrator".

2.  **Run the Install Command**: Type the following command and press Enter:

    ```powershell
    wsl --install
    ```

    > **Note**: This command automatically enables the necessary Windows features, installs the WSL kernel,
    > updates it to WSL 2, and installs **Ubuntu** as the default distribution.

3.  **Restart Your Computer**: You **must** restart your machine to complete the installation.

### Option B: Checking & Upgrading an Existing Installation

If you already have WSL but aren't sure if it's set up correctly or needs upgrading to WSL 2:

1.  **Check Current Version**: Open PowerShell and run:

    ```powershell
    wsl -l -v
    ```

    - If you see `VERSION 2` under your distribution, you are good to go.
    - If you see `VERSION 1`, follow the steps below to upgrade.

2.  **Set WSL 2 as Default**: Ensure all future installations use WSL 2:

    ```powershell
    wsl --set-default-version 2
    ```

3.  **Convert an Existing Distribution to WSL 2**: If you have a distribution (e.g., Ubuntu) running on
    Version 1, run:
    ```powershell
    wsl --set-version Ubuntu 2
    ```
    _(Replace `Ubuntu` with your specific distribution name if different)._

---

## 3. Initial Configuration

After installing and restarting, the terminal window for your Linux distribution (e.g., Ubuntu) should open
automatically. If not, launch it from the Start menu.

1.  **Create a User Account**:
    - You will be prompted to create a **UNIX username**. This does not need to match your Windows username.
    - Next, create a **password**.

    > **Important**: When typing your password, **nothing will appear on the screen** (no asterisks or dots).
    > This is a standard Linux security feature. Just type the password and press Enter.

---

## 4. Keeping Linux Updated

It is best practice to update your Linux distribution's package list and installed software regularly.

1.  **Open your Linux Terminal** (e.g., Ubuntu).
2.  **Run the Update Commands**: Copy and paste the following commands:

    ```bash
    # Update the list of available packages
    sudo apt update

    # Upgrade the installed packages to their latest versions
    sudo apt upgrade -y
    ```

    - You will need to enter your Linux password to run commands with `sudo` (admin privileges).

---

## 5. Common Commands

Here are some essential commands to manage your WSL environment from **PowerShell**:

| Command               | Description                                             |
| :-------------------- | :------------------------------------------------------ |
| `wsl`                 | Enter the default Linux distribution shell.             |
| `wsl -l -v`           | List installed distributions and their WSL versions.    |
| `wsl --shutdown`      | Immediately terminate all running WSL distributions.    |
| `wsl --update`        | Update the WSL kernel manually.                         |
| `wsl -d <DistroName>` | Launch a specific distribution (e.g., `wsl -d Debian`). |

---

## Troubleshooting

- **Virtualization Error**: If you see error `0x80370102`, ensure Virtualization is enabled in your BIOS/UEFI.
- **Kernel Update Required**: If prompted, you may need to download the Linux kernel update package manually
  from Microsoft's documentation.
