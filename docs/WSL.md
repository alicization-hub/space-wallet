## Enable WSL and install a Linux Distribution: You need WSL2 and a Linux Distribution (e.g. Ubuntu)

1. **If you don't have WSL yet**

   - Open PowerShell or Command Prompt as administrator (Run as administrator)
   - Run the command: `wsl --install` (This command will automatically install WSL and Ubuntu)
   - Restart your computer when prompted
   - Launch Ubuntu for the first time to set up your username and password

2. **If there is already a WSL, but it might be WSL1**

   - Open PowerShell as Administrator
   - Check the version of the Distribution you are using: `wsl -l -v`
   - If it is Version 1, change it to Version 2: `wsl --set-version <distribution name> 2` (e.g.
     `wsl --set-version Ubuntu 2`)
   - Set WSL2 as Default: `wsl --set-default-version 2`
   - Enter the WSL `wsl -d Ubuntu`

## Update Linux Distribution in WSL

- Open the Linux Distribution Terminal (e.g. Ubuntu).
- Run command

```bash
sudo apt update
sudo apt upgrade -y
```
