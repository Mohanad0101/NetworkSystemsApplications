# Security Review — Static Interactive Course

Review date: 2026-09-03

## Security model

The current course is intentionally static. Student evidence and reports are processed locally in the browser; the evidence/report modules contain no fetch/XHR/WebSocket/sendBeacon path for uploading student work.

This design follows the principle of minimizing data collection. Web Storage behavior is documented by MDN:

- https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
- https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage

## Data handling

### sessionStorage

Used for data needed while the student works in the current browsing session, including text evidence and report-building state. This prevents the course home from becoming a persistent store of student work.

### localStorage

Used only for non-sensitive navigation/readiness state:

- self-marked learning-route stages;
- numerical material-completeness summary and timestamp.

The completeness summary deliberately excludes student name, group, outputs, short answers, files, and screenshots.

## Browser hardening

The layout uses a restrictive Content Security Policy with self-hosted executable assets, `connect-src 'none'`, `object-src 'none'`, `frame-src 'none'`, `form-action 'none'`, and `script-src-attr 'none'`.

OWASP recommends restrictive CSP as a defense-in-depth control and documents `script-src`, `script-src-attr`, `object-src`, and other directives here:

https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html

The course additionally:

- has no external JavaScript CDN;
- has no HTML form submission path;
- uses `rel="noopener noreferrer"` for new-tab external links;
- avoids `eval`, `new Function`, `document.write`, `innerHTML`, `outerHTML`, and `insertAdjacentHTML` in course JavaScript;
- escapes student text before embedding it into generated OOXML;
- rejects obvious private-key/token/shadow-like material from evidence workflows;
- validates screenshot MIME/size, PNG/JPEG magic bytes, browser decodability, and dimensions locally before accepting it as report evidence;
- revokes generated object URLs;
- avoids runtime inline-style mutation so the JavaScript remains compatible with the strict `style-src 'self'` policy;
- does not teach disabled SSH host-key checking or blanket `chmod 777` as a shortcut.

## Automated security/source QA

`qa/validate_course.rb` is dependency-free and is called by SourceCraft/GitLab CI. It validates course data, evidence/route consistency, MCQ structure, CSP/security invariants, unsafe JavaScript patterns, persistent-summary field restrictions, image-validation safeguards, OOXML escaping, external-link safety, Bash syntax, sample-name leakage, and DOCX integrity. `qa/progress_sync_test.js` is a local regression test for the cross-page 55% completeness synchronization bug.

The build pipelines also inspect the generated site for critical student-facing elements so a successful source edit cannot silently publish a page without MCQ, evidence editors, report controls, progress state, or course navigation.

## Remaining platform limitation

Some security headers, notably framing policies best delivered as HTTP response headers, depend on the static hosting platform. A CSP meta element provides useful client-side restrictions but is not a substitute for every HTTP security header. If SourceCraft/GitLab hosting later supports custom response headers, add appropriate server-side headers there as an additional layer rather than weakening the current CSP.

## Instructor-approved achievement board

The new course-home achievement board deliberately does **not** add a write API to the student browser. The CSP still uses `connect-src 'none'`, and student-facing JavaScript contains no repository/API credential.

The public board is generated from `_data/achievements.json` and uses a strict public allowlist:

- lab code;
- ISO date;
- group;
- list number;
- approved badge;
- `approved: true` gate.

Full names, evidence, screenshots, answers, MCQ result/retry history, completeness, grades, and instructor comments are excluded from public board rows.

The automatic DOCX generator embeds only a minimal machine-readable receipt in standard DOCX custom properties: course ID, lab code, group, list number, report date, and the student's explicit public-board consent flag. It does not embed the student's full name in the machine-readable receipt.

`tools/publish_achievements.py` is an instructor-side importer. It processes only a local folder that the instructor has already designated as **approved reports**, validates the metadata, requires public-board opt-in by default, deduplicates group+number+lab, writes the JSON atomically, and never copies reports into the repository. The metadata is convenience data, not proof of authorship; instructor review remains the trust boundary.

Special quality badges such as `Отличная работа` and `Самостоятельное решение` require an instructor override. They are not calculated from completion percentage, MCQ score, retry count, or speed.

## Final verification

The final source audit reports **534 PASS / 0 FAIL**. Additional runtime checks confirm that the browser-side course code contains no fetch/XHR/WebSocket/sendBeacon path, the production achievement feed ships empty, explicit opt-in is required, and the instructor importer publishes only the allowlisted public record. A real auto-generated DOCX was also passed through the importer: the public result contained only lab/date/group/list-number/badge/approved, while full name and completeness were absent from the machine-readable receipt.


## LX4 safety additions

- Package changes use `apt-get -s` simulation before the required `apt install htop`; no system-wide upgrade, blind `autoremove`, or mass package removal is part of the lab.
- The lab records whether `htop` existed before the exercise and removes it only when the student installed it for LX4.
- Process-signal exercises use only student-created `sleep` processes. The lab explicitly asks the student to confirm PID ownership and command identity before sending STOP/CONT/TERM.
- No required Bash block uses `SIGKILL`, `kill -9`, `pkill`, or `killall`.
- Student command output remains local in the evidence editor and is subject to the same secret-detection and XML-escaping rules as LX0–LX3.
- CI/source validation now treats LX4 page, evidence editor, 12 MCQ cards, report template, and allowed achievement lab as required deployment artifacts.


## LX5 safety additions

- Mandatory boot observation is read-only: the lab does not use `systemctl isolate`, `set-default`, `mask`, GRUB edits, or mandatory reboot.
- State-changing `systemctl` commands target only the lab-owned `lx5-heartbeat.service`. Existing system services are not stopped, disabled, or modified.
- The service program is manually syntax-checked and run as the ordinary student before system installation, reducing diagnostic ambiguity.
- The unit is checked with `systemd-analyze verify` before lifecycle testing and uses an explicit non-root `User=` plus `NoNewPrivileges=yes`, `PrivateTmp=yes`, `ProtectSystem=strict`, and `ProtectHome=yes`.
- `enable` and `start` are deliberately separated; the lab never teaches `enable` as proof that a process is currently running.
- Journal evidence is limited to a few service-specific lines (`journalctl -u`) rather than broad system logs.
- Cleanup removes only `/etc/systemd/system/lx5-heartbeat.service` and `/usr/local/lib/lx5-heartbeat`, then reloads systemd manager configuration.
- The optional reboot check is explicitly non-mandatory and occurs only before cleanup.
- CI/source validation treats the LX5 page, four evidence editors, twelve MCQ cards, report template, and achievement allowlist entry as required release artifacts.

## LX5 release verification

The final source validation for the LX5 release reports **747 PASS / 0 FAIL**. JavaScript syntax, JSON/YAML parsing, SourceCraft publish-script syntax, progress synchronization, and the instructor-side achievement importer also pass. No Python bytecode/cache artifacts are shipped. Jekyll/Bundler are unavailable locally, so the existing SourceCraft/GitLab post-build checks remain responsible for validating the rendered production site before publication.


## LX6 storage-safety additions

- Required filesystem mutation is confined to `~/NSA/LX6/lx6-ext4.img` through a `/dev/loopN` device.
- The student must verify both the `/dev/loopN` pattern and the loop backing file before `mkfs.ext4`.
- Required Bash contains no `fdisk`, `parted`, `sfdisk`, `gdisk`, `wipefs`, or `dd of=/dev/...` operation.
- `dd` is demonstrated only with a normal file under the student's LX6 directory.
- The system `/etc/fstab` is read-only in the lab; configuration practice uses `fstab.lab`, `findmnt --verify --tab-file`, and `mount --all --fstab`.
- Cleanup detaches only a loop-device pattern loaded from the LX6 state file and removes only lab-owned files.
- NFS is explained without installing/enabling an NFS server in the required path.
- CI/source validation includes dedicated guards for all of the rules above.


## LX6 release verification

LX6 extends the course security model to destructive storage operations: the safe target is created by the lab, target identity is verified before mutation, system fstab remains untouched, and cleanup is scoped to the lab-owned loop/image resources. The runtime loop experiment could not be executed inside the build container because its `/dev/loop` node is unavailable; option compatibility and all authored Bash syntax were validated, and production CI provides post-build page guards.

## LX7 scripting/cron safety additions

- No root-level cron files are edited; the lab uses the current user's `crontab` only.
- Existing crontab content is preserved. Course automation owns only the `NSA-LX7-BEGIN`/`NSA-LX7-END` block, and cleanup removes only that block.
- The cron script writes only under `~/NSA/LX7` and sets a minimal explicit `PATH`.
- The lab does not create users, accept passwords as script arguments, edit `/etc/passwd`/`/etc/shadow`, install PostgreSQL, or grant broad permissions from the historical optional exercises.
- PATH is modified only in the current interactive session; LX7 does not append untrusted directories to shell startup files.
- SHA-256 is used for change detection; the lab states that integrity against a saved digest is not proof of origin unless the baseline is trusted/authenticated.


## LX7 scheduler privacy

LX7 uses only the student's user crontab and owns a delimited `NSA-LX7-BEGIN/END` block. The mandatory path does not use `crontab -r`, `/etc/crontab`, `/etc/cron.d`, or root scheduling. Existing user cron entries are filtered through temporary files and are not copied into the lab report or retained as course evidence. Scheduled output is written only to `~/NSA/LX7/cron.log`.
