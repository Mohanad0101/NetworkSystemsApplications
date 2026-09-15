# Student environment baseline

The student-facing course is now designed around:

- Windows PC as the host.
- Oracle VirtualBox already installed/managed by the institution.
- Linux Mint 22.3 “Zena” Desktop as the guest VM.
- No Windows administrator account required for ordinary course work.
- Linux `sudo` is used inside the VM where the lab requires administrative Linux actions.
- Windows PowerShell is used as the SSH client.

## SSH networking
Primary course path: VirtualBox NAT with a GUI port-forward rule `127.0.0.1:2222 → guest:22`.

Alternative: Bridged Adapter when the local network permits the VM to obtain a usable LAN address.

The course does not instruct students to bypass Windows administrative restrictions. If `ssh.exe` or VirtualBox functionality is unavailable because of institutional policy, students are told to contact the instructor/IT support.
