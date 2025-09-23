# Self-Hosted GitHub Actions Runner Setup

This guide will help you set up a self-hosted GitHub Actions runner for your `naimjeem/todo-api-enterprise-cicd` repository on Windows.

## Prerequisites

- Windows 10/11 or Windows Server 2019+
- PowerShell 5.1+ (included with Windows)
- Administrator privileges (recommended)
- GitHub Personal Access Token with `repo` and `admin:org` permissions

## Quick Setup (Recommended)

### Option 1: PowerShell Script (Easiest)
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\quick-setup-runner.ps1
```

### Option 2: Batch File
```cmd
# Run Command Prompt as Administrator
.\scripts\setup-runner.bat
```

### Option 3: Advanced PowerShell Script
```powershell
# Run PowerShell as Administrator
.\scripts\setup-self-hosted-runner.ps1 -GitHubToken "YOUR_TOKEN" -RunnerName "my-runner"
```

## Manual Setup (Step by Step)

If you prefer to follow the exact instructions from the GitHub documentation:

### Step 1: Create Runner Directory
```powershell
mkdir C:\actions-runner
cd C:\actions-runner
```

### Step 2: Download Runner Package
```powershell
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.328.0/actions-runner-win-x64-2.328.0.zip -OutFile actions-runner-win-x64-2.328.0.zip
```

### Step 3: Validate Hash (Optional but Recommended)
```powershell
if((Get-FileHash -Path actions-runner-win-x64-2.328.0.zip -Algorithm SHA256).Hash.ToUpper() -ne 'a73ae192b8b2b782e1d90c08923030930b0b96ed394fe56413a073cc6f694877'.ToUpper()) { throw 'Computed checksum did not match' }
```

### Step 4: Extract Package
```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.328.0.zip", "$PWD")
```

### Step 5: Configure Runner
```powershell
.\config.cmd --url https://github.com/naimjeem/todo-api-enterprise-cicd --token YOUR_GITHUB_TOKEN
```

### Step 6: Run Runner
```powershell
.\run.cmd
```

## Service Installation (Optional)

To run the runner as a Windows Service (recommended for production):

```powershell
# Install as service
.\svc.cmd install

# Start the service
.\svc.cmd start

# Check service status
Get-Service "GitHub Actions Runner"
```

## Service Management Commands

```powershell
# Stop service
.\svc.cmd stop

# Start service
.\svc.cmd start

# Uninstall service
.\svc.cmd uninstall

# Manual run (without service)
.\run.cmd
```

## Verification

1. **Check GitHub Repository Settings:**
   - Go to: https://github.com/naimjeem/todo-api-enterprise-cicd/settings/actions/runners
   - You should see your runner listed as "Online"

2. **Check Runner Logs:**
   - Logs are located in: `C:\actions-runner\_diag`
   - Monitor `Runner_*.log` files for any issues

3. **Test with a Workflow:**
   - Push a commit to trigger your CI/CD pipeline
   - The workflow should now run on your self-hosted runner

## Troubleshooting

### Common Issues

1. **Permission Errors:**
   - Run PowerShell/Command Prompt as Administrator
   - Ensure you have proper permissions on the installation directory

2. **Network Issues:**
   - Check firewall settings
   - Ensure outbound HTTPS connections are allowed
   - Verify GitHub token has correct permissions

3. **Service Won't Start:**
   - Check Windows Event Logs
   - Verify the runner configuration is correct
   - Try running manually first: `.\run.cmd`

4. **Runner Shows Offline:**
   - Check if the service is running: `Get-Service "GitHub Actions Runner"`
   - Restart the service: `.\svc.cmd restart`
   - Check logs in `C:\actions-runner\_diag`

### Log Locations

- **Service Logs:** `C:\actions-runner\_diag\Runner_*.log`
- **Windows Event Logs:** Event Viewer → Windows Logs → Application
- **Service Status:** `Get-Service "GitHub Actions Runner"`

## Security Considerations

1. **Token Security:**
   - Use Personal Access Tokens with minimal required permissions
   - Store tokens securely (consider using Windows Credential Manager)
   - Rotate tokens regularly

2. **Runner Security:**
   - Keep the runner machine updated
   - Use Windows Defender or equivalent antivirus
   - Consider network isolation for production runners

3. **Repository Access:**
   - Only grant necessary repository access
   - Use organization-level runners for multiple repositories

## Uninstalling the Runner

```powershell
# Stop and uninstall service
.\svc.cmd stop
.\svc.cmd uninstall

# Remove runner from GitHub (run this first)
.\config.cmd remove --token YOUR_GITHUB_TOKEN

# Remove installation directory
Remove-Item -Path C:\actions-runner -Recurse -Force
```

## Support

- **GitHub Documentation:** https://docs.github.com/en/actions/hosting-your-own-runners
- **Runner Issues:** https://github.com/actions/runner/issues
- **Repository Issues:** Create an issue in your repository

---

**Note:** This setup is specifically configured for the `naimjeem/todo-api-enterprise-cicd` repository. If you need to set up runners for other repositories, update the repository URL in the configuration commands.

