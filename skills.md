---
name: student-first-secure-academic-course-design
description: Design, audit, and improve high-quality university courses and practical labs that are academically correct, student-friendly, interactive, responsive, evidence-based, and secure by default. Use for course home pages, lab pages, formative MCQ, learning progress, report/evidence workflows, privacy-aware achievement boards, static GitHub/GitLab/SourceCraft Pages delivery, and pre-deployment QA.
---

# Student-First Secure Academic Course Design

## Purpose

Create practical university courses in which students can **understand what they are learning, perform the work themselves, recover from mistakes, know what evidence to keep, and submit a clean report without unnecessary formatting work**.

The course must feel like a carefully designed academic learning environment, not an automatically generated website. Scientific correctness, useful practice, clarity, accessibility, and student confidence take priority over visual novelty.

This skill is based on the mature interaction pattern used in the current **Network Systems & Applications** course: a clear course map, short lab stages, `Готово, когда` checkpoints, minimal evidence, local text-result fields, formative retryable MCQ, learning-progress tracking, report completeness, automatic DOCX generation, an optional instructor-approved achievement board, and strict separation between automated guidance and instructor assessment.

---

## 1. Non-negotiable principles

Always satisfy all of these unless the instructor explicitly changes one:

1. **Academic correctness first.** Verify changing technical facts against official or primary documentation before teaching them.
2. **One idea at a time.** A lab page may be long in total, but the student should work through short stages rather than one continuous wall of instructions.
3. **Learning before grading.** Practice, hints, MCQ, progress, and completeness are formative. Do not silently turn them into grades.
4. **Evidence, not screenshot collection.** Ask only for evidence that demonstrates an important result.
5. **Terminal output is text.** Do not request a screenshot of text that can be copied and verified as text.
6. **Screenshots only when the visual state matters**, for example a VM manager showing two running VMs or a GUI configuration state.
7. **The instructor keeps academic judgment.** Automated checks may detect missing, implausible, or obviously random material, but must not claim to prove authorship, correctness, or understanding.
8. **Friendly feedback.** Incorrect attempts should lead to a useful hint and another attempt, not shame or punishment.
9. **No hidden tracking.** Tell students what is saved, where it is saved, and what is sent. Prefer local-only state for static courses.
10. **Secure by default.** Never require passwords, private keys, tokens, `/etc/shadow`, API secrets, or other sensitive data as evidence.
11. **Responsive and accessible.** The course must remain usable on a laptop, tablet, and phone, with keyboard navigation and readable contrast.
12. **No duplicated content.** The course home is a map; the lab contains execution detail; the report contains evidence. Do not repeat the same explanation everywhere.

---

## 2. Start from the academic backbone

When a reference course, syllabus, textbook, standard, or professor's material is provided:

1. Read the complete topic sequence before redesigning it.
2. Preserve the intended academic progression unless there is a strong pedagogical reason to change it.
3. Build a mapping:
   - original topic;
   - new topic/page;
   - core learning outcome;
   - practical skill;
   - local lab;
   - formative assessment;
   - current/archival status of the source.
4. Separate **academic structure** from **implementation age**. An old reference can provide an excellent topic sequence while containing obsolete code or security practices.
5. For technologies that change, verify against current official documentation.
6. Mark historical material as historical. Never present Python 2, obsolete APIs, weak cryptography, insecure protocol examples, or deprecated deployment practices as current production guidance.

### Source hierarchy

Prefer sources in this order:

1. official standards / RFCs;
2. official product or project documentation;
3. official university/course source provided by the instructor;
4. high-quality textbooks or reputable educational material;
5. secondary tutorials only when necessary.

Never let a convenient tutorial override a current official specification.

---

## 3. Course-home architecture

The main course page is a **navigation and orientation page**, not a second textbook.

Recommended order:

1. **Compact hero**
   - course name;
   - one-sentence purpose;
   - what the student will be able to do;
   - one primary `Начать / Продолжить` action.
2. **Available practice**
   - the labs students can work on now;
   - personal learning-route progress;
   - report-material completeness;
   - a clear continue button.
3. **How the practical course works**
   - Execute;
   - Check;
   - Keep the main evidence;
   - Practice with MCQ;
   - Download the report.
4. **Course orientation**
   - why the subject matters;
   - learning outcomes;
   - prerequisites.
5. **Full syllabus/program**
   - compact and searchable;
   - future topics clearly marked as planned;
   - archival references clearly labelled.
6. **Assessment model**
   - formative MCQ;
   - evidence/report submission;
   - instructor assessment.
7. **Materials and official references**.

### Main lab-card standard

Each ready lab card should show only information useful for action:

- lab code and title;
- one practical outcome sentence;
- small metadata chips such as `5 этапов`, `12 MCQ`, `авто-DOCX`;
- **Учебный маршрут**: self-marked stage progress;
- **Материалы к отчёту**: completeness of required submission material;
- status: `Можно начать`, `В работе`, or `Готово к проверке`;
- one primary action: `Начать LX…` or `Продолжить LX…`;
- an unobtrusive MCQ link.

Do not combine these two indicators into one percentage:

- **Learning route** = where the student is in the activity.
- **Material completeness** = whether required evidence/report elements are present.

Neither is a grade.

---

## 4. Lab-page architecture

A practical lab should begin with a calm, compact orientation panel.

### Required opening elements

- Why this lab matters.
- What the student will learn.
- What practical skill they will gain.
- Approximate time.
- Prerequisites.
- Naming rule for placeholders/sample names.
- 4–6 stage route.
- Number/type of evidence items.
- Exact final deliverables.
- `← Страница курса` navigation.

### Stage pattern

Use this pattern repeatedly:

**ДЕЙСТВИЕ**  
What to do now.

**Готово, когда**  
What observable state means the step succeeded.

**В ОТЧЁТ**  
Only the minimum evidence needed from this stage.

**ПОДСКАЗКА**  
A short recovery hint if a common difficulty occurs.

**ОСТОРОЖНО**  
Only for genuinely risky or destructive actions.

A student should be able to answer four questions at every point:

1. What am I doing?
2. Why am I doing it?
3. How do I know it worked?
4. Do I need to save anything for the report?

### Stage size

Prefer a stage that can be completed in roughly **5–20 minutes**. Break long procedures into checkpoints. Optional exploration belongs in collapsed `details` sections after the core task.

### Command-learning rhythm

For beginner terminal labs, **do not teach by dumping a multi-command block and asking the student to paste the whole transcript**. The core learning path should normally use one logical command per code block. Before or immediately after that command, explain in plain language:

1. what question the command answers or what state it changes;
2. the important argument, path, option, or operator in the command;
3. what the student should notice in the output;
4. what a common unexpected result means.

Use a deliberate rhythm:

> question → one command → inspect output → interpret → next command

Pipelines are acceptable when the pipeline itself is the concept being taught. A compound command using `;`, `&&`, command substitution, or several checks may be used in a clearly labelled **summary/verification collector** after the individual ideas have already been learned. Its purpose is to create short, deterministic evidence or measure completion—not to hide several new operations inside one copy-paste step.

Evidence instructions should prefer a few labelled result lines such as `SERVICE=active`, `HOST=...`, or `CHECK=OK` over raw command history, installer logs, progress bars, or an entire terminal session.

---


### Course workspace convention

All student-owned lab artifacts must use one stable home-directory hierarchy:

```text
~/NSA/LX0
~/NSA/LX1
~/NSA/LX2
...
```

Rules:

- `~/NSA` is the course workspace root.
- Each lab owns exactly one top-level folder named with the canonical uppercase lab code (`LX0`, `LX1`, ...).
- Create the current lab folder with `mkdir -p ~/NSA/LXn`; do not create all future folders in advance.
- Student-created files, scripts, logs, archives, temporary lab data, and evidence artifacts belong under the current `~/NSA/LXn` folder unless the learning objective explicitly requires a standard/system location.
- Standard Linux locations must remain standard: for example SSH keys/config stay in `~/.ssh`; systemd units, `/etc`, `/var`, `/tmp`, device nodes, and intentionally system-level permission exercises may use their real locations when that location is itself part of the concept.
- When a lab must touch a system path, say explicitly that it is an exception and keep the student's source/evidence copy under `~/NSA/LXn` where practical.
- Paths are case-sensitive. Use `NSA` and `LXn` exactly, not `nsa`, `labs`, `lx1`, or ad-hoc sibling folders.
- QA must reject legacy student workspace paths such as `~/labs/lxN` and `~/lxN-*` in mandatory lab instructions.

## 5. Naming and personalization

Do not let students accidentally submit example identities.

If examples contain names such as `ivan`, `ivanov`, `petrov`, `YOUR NAME`, or `myname`:

- state clearly whether the value is a placeholder;
- tell the student exactly what to substitute;
- prefer neutral placeholders such as `myname`, `your_user`, `vm_ip`, `GROUP`, `SURNAME`;
- explain which names are **part of the experiment and must not be changed**.

Example:

- `myname` → student's own surname in Latin characters;
- `user_1`, `workers`, `teachers` → fixed experimental names; do not replace.

Run a pre-deployment scan for legacy sample surnames so they do not leak into report templates or filenames.

---

## 6. Evidence design

### Evidence-minimization rule

For every requested artifact ask:

> Does this evidence prove a learning outcome that is not already demonstrated elsewhere?

If no, remove it.

### Preferred evidence types

**Text result** for:

- command output;
- IDs, paths, permissions, ports, process state;
- SSH context;
- file contents;
- diagnostic results.

**Screenshot** only for:

- GUI configuration;
- a visual state that cannot be represented well as text;
- simultaneous VM/window states;
- diagrams or visual outputs when the visual form itself is the evidence.

**File artifact** only when the file itself is a required outcome, such as an archive, source code file, configuration, notebook, or project package.

### Stable evidence IDs

Every required evidence item gets a stable ID such as:

- `LX2-01`
- `LX2-02`
- `LX2-Q`

The same ID must appear in:

- lab instructions;
- local evidence editor;
- submission schema;
- auto-generated report;
- blank template;
- CI validation.

This prevents student confusion and authoring drift.

---

## 7. Text-result editor

For terminal evidence, render the `<textarea>` **statically in HTML**. JavaScript may enhance it, but must not be required for the field to exist.

### Required behavior

- plain text only;
- clear evidence ID;
- helpful placeholder;
- character counter;
- copy button;
- clear button;
- local-storage explanation;
- secret warning;
- no automatic network submission.

### Storage model

Use:

- `sessionStorage` for student-generated text, MCQ state, short answers, and report identity when local persistence is needed only during the working tab/session;
- `localStorage` only for **non-sensitive summary state** that should survive closing/reopening, such as self-marked route stages and numerical completeness summaries.

Do not place student name, group, terminal output, answers, screenshots, keys, or report content in persistent `localStorage` merely to make a dashboard easier.

If the course home needs report readiness, persist only data such as:

```text
labId
percent
complete
total
verified
review
updatedAt
```

Never persist the evidence itself in that summary. Treat this as a strict whitelist, not a blacklist: if a new summary field is not clearly non-sensitive and necessary for navigation, do not persist it.

---

## 8. Learning progress

Learning progress is a **personal navigation aid**, not proof that the work was performed.

Use approximately 4–6 self-marked stages per lab. A stage may be automatically marked only when there is an unambiguous learning event, such as completing all MCQ questions.

Display:

- `3 / 5 этапов · 60%`;
- next recommended stage;
- `Продолжить с места остановки`.

State explicitly:

> Учебный прогресс — личный ориентир, а не оценка и не доказательство выполнения.

On the course home, aggregate route stages across ready labs, but do not mix route progress with report completeness.

---

## 9. Material completeness

Completeness answers:

> Is the submission package sufficiently filled to be reviewed?

It does **not** answer:

> Is the work correct? Did the student author it? What grade should it receive?

### Gentle validation states

Use four states:

- **Не заполнено** — nothing provided.
- **Можно уточнить / Результат сохранён** — material exists; a friendly hint can improve it.
- **Похоже, всё на месте** — basic expected markers are present.
- **Готово к проверке** — material is available for instructor review.

Do not make pattern checks excessively strict. Students may have legitimate system differences.

Reject only clearly unusable cases such as:

- empty field;
- obvious filler (`asdf`, `qwerty`, `test`);
- sensitive secret material;
- unreadable/invalid required file.

A plausible but different output should generally count as material and receive a non-punitive hint.

### Main-page synchronization

When the lab calculates completeness, publish a **summary-only localStorage record** and show it on the lab card on the course home.

This solves a common UX failure: a student sees `55%` in a lab but `0%` on the course page because the two pages used different state sources. Add a regression test that seeds a non-round value such as `55%` and verifies the exact value appears on the course-home card after the progress script runs.

Label the two indicators clearly:

- `Учебный маршрут`;
- `Материалы к отчёту`.

---

## 9A. Instructor-approved achievement board

A public or shared achievement board can motivate students, but it must **not** become a live leaderboard, a grade display, or a browser-write endpoint.

### Safe default for static courses

For GitHub/GitLab/SourceCraft Pages, never place a repository token, webhook secret, database credential, or write-capable API key in student JavaScript. A static browser cannot securely prove that a student really completed a lab.

Use a two-stage model instead:

1. the student completes the lab and downloads the normal report;
2. the instructor reviews the report;
3. only an **accepted** report may be imported into a public-safe achievement feed;
4. the course rebuild renders that feed as a compact sidebar.

The report may embed a small machine-readable receipt in DOCX custom properties so instructor-side import is easy. That receipt is convenience metadata, **not a trust proof**. The instructor review is the trust boundary.

### Public data contract

Publish only a strict allowlist such as:

```json
{
  "lab": "LX2",
  "date": "2026-09-03",
  "group": "GROUP-101",
  "number": 7,
  "badge": "accepted",
  "approved": true
}
```

Do **not** publish:

- full name;
- email;
- terminal output;
- screenshots;
- short answers;
- MCQ score or retry count;
- grade;
- comments meant only for the student;
- local-storage identifiers or browser fingerprints.

Prefer explicit student opt-in before a pseudonymous group+number record is displayed publicly. A student who does not opt in must still receive exactly the same teaching, feedback, assessment, and ability to submit work.

### Badge policy

Badges should recognize learning without creating an unfair ranking. Good examples:

- `Работа принята` — instructor accepted the lab;
- `Стабильный прогресс` — several labs have been accepted;
- `Системный практик` — all currently available labs are accepted;
- `Отличная работа` — instructor-awarded for unusually clear, correct evidence and explanation;
- `Самостоятельное решение` — instructor-awarded for thoughtful independent troubleshooting.

Do not award a public badge automatically from speed, first-attempt MCQ correctness, retry count, or raw completeness percentage. Special quality badges require instructor judgment.

### Reusable implementation contract

Keep the board driven by a small course data file, for example `_data/achievements.json`, and keep the renderer generic. The importer should:

- scan only an instructor-controlled **approved reports** folder;
- validate the embedded course ID, lab ID, group, list number, date, and consent marker;
- ignore completeness as an acceptance/grade rule;
- deduplicate `group + number + lab`;
- write atomically;
- never copy reports into the repository;
- reject unknown fields/badges rather than silently publishing them.

For courses that later add a real backend, preserve the same public data contract. Writes must happen through an authenticated server-side endpoint; student JavaScript must never contain the write credential.

### Course-home presentation

Use a small sidebar or secondary panel titled like `Достижения практикума`. Show at most a few recent accepted entries and explain that it is not a ranking. On narrow screens, move the panel below the lab cards rather than shrinking the cards.

---

## 10. MCQ for learning

MCQ is formative practice unless the instructor explicitly defines a graded test.

### Question quality

Each question should teach or reinforce something important. Prefer:

- interpretation of command output;
- choice between realistic actions;
- common misconception;
- troubleshooting scenario;
- cause/effect reasoning;
- comparison of concepts;
- security reasoning.

Avoid:

- trivia;
- wording puzzles;
- duplicate questions;
- questions whose only purpose is memorizing a command option without context.

### Interaction

For a wrong option:

- do not label the student as failed;
- explain why that option does not fit;
- allow another option immediately;
- do not reveal the correct answer before another meaningful attempt unless pedagogically necessary.

Friendly pattern:

> Хорошая попытка. Этот вариант не подходит — посмотрите объяснение и попробуйте другой.

For success:

> Верно. Хорошо — вы связали команду с её результатом.

After all questions:

- show completion;
- allow `Пройти ещё раз для закрепления`;
- allow unlimited retries for formative learning;
- do not penalize retries;
- do not put retry count into the instructor report by default.

For report completeness, count **all questions completed**, not first-attempt correctness.

---

## 11. Automatic report workflow

The default student workflow should be:

> Perform → paste/select evidence → answer MCQ → answer short reflections → download ready DOCX.

Do not require the student to copy the same output into Word manually after already entering it in the lab.

### Auto-generated DOCX should include

- course/lab title;
- student identity;
- date;
- learning-route summary;
- material-completeness summary;
- evidence in stable ID order;
- readable terminal output as monospaced text;
- only the required screenshots;
- MCQ completion statement;
- short answers;
- a clear instructor-review section.

### Instructor section

Keep automated metrics separate from academic judgment:

```text
Комплектность материалов (авто): ____
Корректность выполнения: __________
Понимание и объяснение: ___________
Комментарий / итог: _______________
```

### Download rules

- blank template is always available;
- auto-report download is never blocked by incomplete work;
- if completeness is below 100%, the DOCX should clearly identify missing material and remain usable as a working report;
- 100% must always be described as **100% completeness, not 100 points**.

---

## 12. Feedback tone

Use simple, natural, academically correct Russian for Russian-language student courses.

Prefer:

- `Хорошее начало — можно сверить ещё один момент.`
- `Результат сохранён. Проверьте, что…`
- `Попробуйте ещё раз — это нормальная часть обучения.`
- `Если вывод отличается, сравните…`

Avoid:

- `FAIL`;
- `Вы ошиблись` when unnecessary;
- `Работа не засчитана` for formative checks;
- threatening red warnings for ordinary mistakes;
- praise that is unrelated to actual progress.

Use red only for real safety or destructive-action warnings.

---

## 13. Visual design system

Color must communicate function, not decorate the page.

Recommended semantic system:

- **Blue** — action / what to do;
- **Green** — expected successful state;
- **Teal** — evidence/result for report;
- **Yellow/amber** — hint or gentle review;
- **Red** — safety/destructive warning only;
- **Purple** — optional visual evidence if a separate visual category is useful.

Keep surfaces light, borders subtle, typography readable, and motion minimal.

### Responsive rules

- no horizontal page scrolling;
- tables get their own horizontal-scroll wrapper;
- cards collapse from 4 → 2 → 1 columns;
- controls remain at least comfortably tappable;
- fixed lab navigation must not cover content;
- long command/code blocks scroll independently;
- progress labels stack on narrow phones.

### Accessibility

- semantic headings in order;
- keyboard-accessible controls;
- visible `:focus-visible`;
- proper labels for textareas and inputs;
- `aria-live` only for useful dynamic status;
- native `<progress>` when appropriate;
- do not communicate state by color alone;
- respect `prefers-reduced-motion` when using animation.

---

## 14. Secure static-course architecture

Prefer a static architecture when student submissions are not meant to be centrally tracked.

### Browser security rules

- self-host scripts and styles;
- no third-party analytics by default;
- no external executable JavaScript/CDN dependency unless explicitly justified;
- use a restrictive Content Security Policy;
- avoid runtime inline-style mutation when `style-src 'self'` is used; prefer classes, the `hidden` attribute, and authored stylesheets;
- block network APIs in student evidence/report modules unless a real backend is intentionally introduced;
- use `textContent` and DOM node creation for user-visible data;
- never interpolate unescaped student text into HTML;
- escape student text before inserting it into XML/OOXML;
- never use `eval`, `new Function`, `document.write`, `innerHTML`, `outerHTML`, or `insertAdjacentHTML` for user content;
- external `target="_blank"` links require `rel="noopener noreferrer"`;
- do not include forms when the static course does not submit data;
- do not teach `curl ... | sh`, disabled SSH host-key checks, blanket `chmod 777`, shared weak passwords, or production root execution as convenient shortcuts.

### Suggested CSP for the current static architecture

Use a policy comparable to:

```text
default-src 'self';
script-src 'self';
script-src-attr 'none';
style-src 'self';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'none';
object-src 'none';
frame-src 'none';
worker-src 'none';
media-src 'none';
base-uri 'self';
form-action 'none'
```

Do not add directives that break required functionality without testing them.

### File handling

For local screenshot/file selection:

- restrict acceptable MIME types/extensions;
- do not trust MIME type or filename alone: for required PNG/JPEG evidence, check file signatures and confirm the browser can decode the image before including it in the report;
- impose reasonable size bounds;
- verify readable image dimensions when practical;
- never upload implicitly;
- revoke object URLs after download/use;
- explain that file selection remains local;
- do not persist sensitive screenshots in localStorage merely to preserve a percentage.

---

## 15. Technical content safety

For administration/network/security labs:

- explain what `sudo` changes;
- avoid commands whose scope is larger than the learning task;
- use temporary or isolated lab directories for destructive operations;
- make destructive cleanup targets explicit;
- verify SSH host keys on first trust;
- distinguish public and private keys;
- never request private-key evidence;
- distinguish encryption, integrity, and authentication;
- distinguish TCP and UDP behavior correctly;
- distinguish FTP, FTPS, and SFTP;
- mark classical ciphers as educational, not production security;
- use current Python 3 APIs;
- state when behavior depends on implementation/version, e.g. CPython GIL behavior;
- distinguish container writable layers from persistent storage.

---

## 16. Course data architecture

Keep content, interaction, and submission requirements separated.

Recommended structure:

```text
_data/
  course.yml          # modules, topics, outcomes, references
  submission.yml      # evidence, routes, questions, deliverables
  quizzes.json        # MCQ source of truth
_includes/
  course-home.html
  lab-start.html
  quiz.html
  submission.html
_layouts/
  default.html
labs/
  lx0.md
  lx1.md
assets/
  css/
  js/
  templates/
qa/
  validate_course.rb
SKILL.md
```

Avoid manually duplicating quiz content or submission IDs in many files. If static rendered quiz HTML is required for resilience, generate it from the source data and validate that it matches the source of truth.

---

## 17. Pre-deployment QA gate

Do not call a course release-ready until it passes a reproducible QA gate.

### Academic checks

- all learning outcomes correspond to actual lab activity;
- commands and explanations are scientifically/technically correct;
- current technology statements are verified against official sources;
- historical references are labelled;
- no duplicated or filler content;
- MCQ answers and explanations are correct;
- terminology is consistent.

### Student-experience checks

- every lab can return to the course home;
- route stages and anchors work;
- `Готово, когда` exists at meaningful checkpoints;
- every report evidence ID is visible at the correct step;
- static text editors are visible without JavaScript;
- MCQ appears in built HTML;
- retry works;
- blank template is always downloadable;
- auto-report is always downloadable;
- course-home card displays both learning-route progress and report-material completeness;
- achievement board renders only the public allowlist (`group`, `number`, `lab`, `date`, approved badge);
- public board requires instructor approval and, when configured, explicit student opt-in;
- no student-browser code contains a write credential or network path for publishing achievements;
- placeholder names are clearly explained;
- no old sample surnames remain.

### Code/security checks

- YAML/JSON parse successfully;
- JavaScript syntax passes local validation;
- Bash code fences pass `bash -n` where applicable;
- no `eval`, `new Function`, `document.write`, unsafe HTML insertion;
- evidence/report modules contain no unexpected network API;
- CSP exists and is restrictive;
- no external executable scripts;
- external new-tab links have `noopener noreferrer`;
- templates are valid DOCX packages;
- no secrets or private keys are committed;
- no dangerous teaching shortcuts such as `chmod 777` or disabled host-key checking;
- ZIP/package integrity is verified after packaging.

### CI gate

The deployed/built HTML—not only the Markdown source—must be checked for critical interactive elements. Fail the deployment when required MCQ cards, evidence editors, report builder, progress indicators, navigation, or templates disappear.

---

## 18. Development workflow for a new course

Do not generate an entire semester in one uncontrolled pass.

### Phase A — Course blueprint

Produce:

- audience and prerequisite profile;
- course promise;
- module sequence;
- topic-to-skill mapping;
- assessment model;
- technical stack;
- source/reference map.

### Phase B — Build one exemplar lab

Make one lab excellent first. Validate:

- route length;
- wording;
- evidence burden;
- MCQ quality;
- report generation;
- responsive design;
- security.

Use it as the pattern for later labs without mechanically repeating wording.

### Phase C — Build lab by lab

For every lab:

1. define 2–5 measurable outcomes;
2. identify the real-world skill;
3. divide into 4–6 stages;
4. define success checkpoints;
5. choose minimal evidence;
6. write friendly troubleshooting hints;
7. add 8–15 high-quality formative MCQ as appropriate;
8. add 2–4 short reflection questions only when they reveal understanding;
9. update submission schema and template;
10. run QA before moving to the next lab.

### Phase D — Course-home integration

Only after labs are stable:

- expose cards;
- connect progress/completeness;
- optionally add the reusable instructor-approved achievement board;
- add continue logic;
- update program status;
- validate mobile view.

### Phase E — Release gate

Run full academic + UX + security QA and package a complete version plus a changed-files-only version when useful.

---

## 19. Output style for course content

For student-facing Russian:

- natural, simple sentences;
- correct technical terminology;
- explain a new term the first time it appears;
- use short paragraphs rather than excessive bullets;
- avoid internal design notes or AI/meta commentary;
- avoid exaggerated motivational language;
- use examples to make difficult concepts concrete;
- prefer `why → action → observation → meaning`.

For academic explanations:

- distinguish fact from simplification;
- name important limitations;
- avoid absolute statements when behavior is implementation-dependent;
- use exact commands only when they have been checked for the stated environment.

---

### Destructive or state-changing systems labs

When a topic requires commands that could destroy data or destabilize the host (`mkfs`, `dd`, partition editors, service-manager changes, firewall changes, database resets, etc.), do not teach the destructive operation directly against the student's real resource. Prefer a disposable sandbox that reproduces the concept:

- filesystem work → image file + verified loop device;
- container/runtime work → dedicated lab container;
- service work → one lab-owned unit;
- database destructive work → disposable lab schema/database;
- network policy → isolated VM/network namespace when practical.

Before a destructive command, add an explicit identity check for the target and a visible stop condition. The lab should make the safe target easy to recognize and the dangerous target impossible to reach through copy-paste from the required path. Cleanup must be scoped to lab-owned resources only.

Use this sequence whenever possible: **observe → create sandbox → verify identity → mutate → verify result → clean up**.

## 20. Verification anchors

When implementing the secure browser architecture in this skill, verify details against current primary guidance rather than relying on copied code:

- Web Storage API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
- `sessionStorage` behavior (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
- Content Security Policy (OWASP): https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- Jekyll includes/data/build documentation: https://jekyllrb.com/docs/

For technical labs, add domain-specific official sources. Examples from Network Systems & Applications include:

- Ubuntu OpenSSH: https://ubuntu.com/server/docs/how-to/security/openssh-server/
- Oracle VirtualBox networking: https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html
- Linux Mint: https://linuxmint.com/

Re-check version-sensitive claims whenever a course is created or materially updated.

---

## 21. Definition of done

A course/lab is done only when a student can realistically:

1. understand why the task matters;
2. start without reading a huge page first;
3. know the next action;
4. see what success looks like;
5. recover from a common mistake with a kind hint;
6. keep only meaningful evidence;
7. practice with retryable formative questions;
8. return later and continue from the correct point;
9. download a useful report without manually rebuilding it;
10. know exactly what to send to the instructor;
11. understand that progress/completeness are not grades;
12. complete the activity without exposing secrets or relying on unsafe code.

If any of these fail, improve the course before adding more visual features.

## Reusable pattern: scripting and scheduler labs

- Teach automation as a contract: explicit interpreter, quoted inputs, syntax check, meaningful exit status, deterministic output, then scheduling.
- Never overwrite a student's entire scheduler configuration. Own a clearly delimited marker block and remove only that block during cleanup.
- Prefer user-level scheduling for beginner labs. Root/system schedulers require a separate administrative objective and stronger safeguards.
- Scheduled jobs must use explicit paths/environment and write only to a lab-owned directory. Do not assume an interactive shell's aliases, current directory, or PATH.
- A checksum demonstrates byte-level consistency with a baseline; it is not authenticity unless the baseline itself is trusted or authenticated.
- Modernize historical weak-hash examples (for example MD5) to an appropriate contemporary hash while explaining why the original is limited.

- Do not persist a student's pre-existing scheduler configuration merely for audit convenience. If a lab must preserve existing entries, process them in a short-lived temporary file and keep only the lab-owned block as evidence. Existing scheduler entries may contain private paths, commands, or credentials.
