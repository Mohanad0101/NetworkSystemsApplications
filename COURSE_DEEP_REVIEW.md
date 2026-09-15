# Deep Course Review — Network Systems & Applications

Review date: 2026-09-03

## Scope

This review covers the current static course package, with full local labs LX0–LX7, course-home navigation, formative MCQ, evidence collection, learning progress, material completeness, automatic DOCX generation, report templates, and SourceCraft/GitLab deployment checks.

The current local labs were reviewed against the academic backbone at https://koroteev.site/os/ and current primary/official documentation where behavior can change.

## Academic status

### LX0 — Linux in a VM

The lab correctly distinguishes installation media from an installed guest system, uses VirtualBox as the learning virtualization environment, verifies the installed system, exports/imports OVA, and requires a real recovery check rather than treating file creation alone as proof.

Current VirtualBox/Mint guidance in the course is aligned with:

- Linux Mint release notes: https://linuxmint.com/rel_zena.php
- Oracle VirtualBox 7.2 documentation: https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/Introduction.html
- Oracle Guest Additions: https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/guestadditions.html

### LX1 — Command line

The lab correctly teaches paths, terminal/session identity, redirects/pipes, hard vs symbolic links, and archive creation/recovery. Evidence is text-first, allowing commands and results to remain searchable and readable.

Relevant primary references include:

- GNU Coreutils `ln`: https://www.gnu.org/software/coreutils/manual/html_node/ln-invocation.html
- GNU tar: https://www.gnu.org/software/tar/manual/
- Linux inode semantics: https://man7.org/linux/man-pages/man7/inode.7.html

### LX2 — SSH and tmux

The lab correctly distinguishes SSH client/server roles, verifies host identity during first trust, separates public and private keys, uses Ed25519 as the preferred educational key type, verifies public-key-only authentication, and uses tmux as a session-persistence tool rather than claiming that it survives server reboot automatically.

Relevant current sources:

- Ubuntu OpenSSH server guide: https://ubuntu.com/server/docs/how-to/security/openssh-server/
- Oracle VirtualBox NAT/port forwarding: https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html
- OpenSSH manual: https://man.openbsd.org/ssh

### LX3 — Users and permissions

The lab correctly separates UID/GID, primary/supplementary groups, ownership, file vs directory permission meaning, sticky bit, and umask. The umask experiment runs in a subshell to avoid silently modifying the student's parent shell. Expected permission failures are treated as successful policy tests when appropriate.

Relevant references:

- `chmod(1)`: https://man7.org/linux/man-pages/man1/chmod.1.html
- `umask(2)`: https://man7.org/linux/man-pages/man2/umask.2.html
- path resolution: https://man7.org/linux/man-pages/man7/path_resolution.7.html

### LX4 — Processes and packages

The lab separates package state from process state, uses APT simulation before the single required package install, avoids broad upgrade/autoremove operations, and performs signal experiments only on a student-created `sleep` process whose PID/owner/command are rechecked before use. STOP/CONT/TERM and nice/renice are taught as observable process-management mechanisms rather than command memorization.

Relevant primary references:

- Ubuntu APT: https://manpages.ubuntu.com/manpages/noble/en/man8/apt.8.html
- `ps(1)`: https://man7.org/linux/man-pages/man1/ps.1.html
- `kill(1)`: https://man7.org/linux/man-pages/man1/kill.1.html

### LX5 — Boot and systemd services

The lab modernizes the original systemd topic into a safe service lifecycle exercise. It observes PID 1/default target without changing boot targets, manually tests the Python program before registration as a service, verifies the unit with `systemd-analyze verify`, explicitly separates `enable` from `start`, reads service-specific journal output, verifies MainPID change after restart, and cleans up only the lab-created service. The service runs as the student's ordinary account and includes modest systemd hardening.

Relevant primary references:

- systemd bootup: https://man7.org/linux/man-pages/man7/bootup.7.html
- `systemd.service(5)`: https://man7.org/linux/man-pages/man5/systemd.service.5.html
- `systemctl(1)`: https://man7.org/linux/man-pages/man1/systemctl.1.html
- `systemd.unit(5)`: https://man7.org/linux/man-pages/man5/systemd.unit.5.html
- `systemd-analyze(1)`: https://man7.org/linux/man-pages/man1/systemd-analyze.1.html
- `journalctl(1)`: https://man7.org/linux/man-pages/man1/journalctl.1.html

## Student-experience status

The strongest current design features are:

- course home acts as a course map rather than a duplicate textbook;
- labs begin with a 5-stage route;
- each meaningful stage states `Готово, когда`;
- terminal evidence is collected as text;
- screenshots are minimized;
- evidence IDs are stable across page/schema/report/template;
- formative MCQ supports retry without penalty;
- learning-route progress is kept separate from submission completeness;
- report completeness is kept separate from academic grading;
- automatic DOCX removes duplicate manual report formatting;
- blank templates remain available as a fallback;
- navigation back to the main course page is available from labs;
- placeholder/sample naming is explicitly explained.

## Progress synchronization fix

The earlier course home read only `nsa-learning-progress:v1:*`, while the lab's percentage such as 55% represented **material completeness**, calculated by `report-builder.js`. Therefore the two pages were reporting different state.

The fixed architecture keeps them separate and displays both on every ready-lab card; the top course summary also shows an aggregate of report materials for labs that already have a saved summary:

- `Учебный маршрут` — self-marked learning stages;
- `Материалы к отчёту` — submission completeness.

The report builder now publishes a summary-only record under `nsa-submission-completeness:v1:<lab>`. The record contains counts, percent, and update time only. Student name, group, terminal output, answers, screenshots, and report content are not written into this persistent completeness summary. A Node regression test seeds LX0 at 55% and confirms that 55% is rendered on its main-course card.

## Limits intentionally preserved

- Learning-progress marks do not prove that the student performed the work.
- Pattern checks do not prove authorship or full correctness.
- Completeness is not a grade.
- Screenshot content still requires instructor review.
- Future syllabus topics beyond the fully local LX0–LX7 should not be treated as fully validated practical labs until local modern labs are authored and tested.

## Release recommendation

The architecture is suitable as the template for new practical courses if the same academic, UX, evidence-minimization, security, and CI gates are applied lab by lab rather than copying pages mechanically.

## Achievement-board extension

The course now supports a small privacy-minimized `Достижения практикума` sidebar next to the ready-lab cards. This is intentionally a recognition feed rather than a leaderboard.

The secure static workflow is:

1. student completes the normal lab and generates the normal DOCX;
2. student may explicitly opt in to showing only group + list number + lab + date + an approved badge;
3. instructor reviews the report normally;
4. instructor places accepted reports in a local approved folder;
5. the instructor-side importer extracts only the machine-readable public receipt and updates `_data/achievements.json`;
6. the static site rebuild renders the board.

No browser write endpoint was added. The public course therefore preserves the existing `connect-src 'none'` policy and keeps report/evidence content local. Badge policy also preserves the course's formative philosophy: automatic milestone badges recognize sustained participation, while quality badges are instructor-awarded and are not derived from MCQ score or speed.

This architecture is reusable across future courses because the renderer consumes a generic public record contract and the importer uses `course_id + allowed_labs` configuration rather than hard-coded Network Systems page markup.

## Final verification for achievement-board release

The release candidate was rechecked after the progress-card and achievement-board integration. Source QA reports **534 PASS / 0 FAIL**. The dedicated regression test confirms that an LX0 material-completeness value of **55%** appears unchanged on both the lab and main course card, while learning-route progress remains a separate indicator. The instructor-side achievement importer passed its privacy/consent tests, and an integration test generated a real auto-DOCX, imported its consent receipt, and produced only the public allowlist fields.

## LX5 release verification

LX5 was added as the first fully local laboratory in the Linux administration module. The release candidate passed the dependency-free source validator with **747 PASS / 0 FAIL**, including the dedicated LX5 safety gates, 12 static MCQ cards, four evidence IDs, report-template integrity, progress/completeness integration, achievement-board allowlist, and Bash syntax checks. The LX5 Word fallback template was rendered to two pages and visually inspected; the accessibility audit reports 0 high-severity findings. A local production Jekyll build was not run because Jekyll/Bundler are not installed in the execution environment; post-build CI guards remain the deployment acceptance gate.


### LX6 — Filesystems

LX6 replaces destructive real-disk examples with a verified loop-image workflow. Students still practice the core Linux filesystem model (`lsblk`, `findmnt`, `df`, `du`, `losetup`, `mkfs.ext4`, `mount`, `umount`, UUID/LABEL and fstab), but formatting is constrained to `/dev/loopN` whose backing file is checked against `~/NSA/LX6/lx6-ext4.img` before `mkfs`. The lab also demonstrates mount-point shadowing, persistence across unmount/remount, read-only remount behavior, and validation of an alternative fstab without editing `/etc/fstab`. NFS is introduced conceptually without requiring a server deployment in the mandatory path.

Primary references: https://man7.org/linux/man-pages/man8/lsblk.8.html · https://man7.org/linux/man-pages/man8/findmnt.8.html · https://man7.org/linux/man-pages/man8/losetup.8.html · https://man7.org/linux/man-pages/man8/mount.8.html · https://man7.org/linux/man-pages/man5/fstab.5.html · https://man7.org/linux/man-pages/man5/nfs.5.html


## LX6 release verification

LX6 is the seventh fully local lab (LX0–LX6). Its mandatory path uses four text-evidence items, 12 retryable formative MCQ, learning-progress/completeness integration, automatic DOCX, and no required screenshots. Storage-destructive operations are sandboxed in a verified loop-backed image. Source QA and CI now require the LX6 page, evidence editor, 12 static MCQ cards, report builder, learning progress, template, and achievement allowlist before publication.

### LX7 — Bash scripting and cron

LX7 modernizes the reference sequence without losing its intent. Students create an executable Bash script, learn PATH/quoting and `bash -n`, build a small `case`-driven system report with a meaningful non-zero exit status, detect controlled file changes with SHA-256, and schedule a user-owned cron task with explicit paths/environment. The original MD5 exercise is retained only as historical context; the local lab uses SHA-256 and explicitly explains that a checksum compared with an untrusted baseline does not prove authenticity. Cron changes are scoped to an `NSA-LX7-BEGIN/END` block so existing user jobs are preserved.


## LX7 release verification

LX7 is the eighth fully local lab (LX0–LX7). It uses four text-evidence items, 12 retryable formative MCQ, learning-progress/completeness integration, automatic DOCX, and no required screenshots. The practical path was smoke-tested for script execution, meaningful exit status, SHA-256 mismatch/restore behavior, and cron marker-block filtering. User crontab content is not copied into the report or persisted in the lab directory; only the course-owned marker block and LX7 log are used as evidence.
