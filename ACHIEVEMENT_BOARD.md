# Secure achievement board — deployment model

## Goal

Show a small, encouraging course-home sidebar with recently **accepted** lab completions while keeping the static course secure and minimizing student data.

Public row fields are deliberately limited to:

- laboratory code;
- completion/acceptance date;
- student group;
- list number;
- instructor-approved badge.

The board does not publish full names, report content, screenshots, MCQ results, retries, grades, or instructor comments.

## Why the browser does not publish directly

This course is a static site. A secret that allows a browser to write to a repository/database would also be available to every visitor. Therefore student-side JavaScript remains read/local-only and the CSP keeps `connect-src 'none'`.

The trust boundary is the instructor review:

1. Student completes a lab and downloads the normal auto-generated DOCX.
2. The DOCX contains only a small machine-readable completion receipt in standard custom document properties: course ID, lab, group, list number, date, and the student's public-board opt-in.
3. Instructor reviews the work normally.
4. Only accepted reports are placed in a local approved folder.
5. `tools/publish_achievements.py` reads that folder and rewrites `_data/achievements.json` with the public allowlist only.
6. Commit/push the JSON; the normal static-site build updates the board.

The receipt is not proof of authorship and is not used to grade the work. A student could modify a local DOCX; this is why reports are imported only after instructor review.

## Instructor command

```bash
python3 tools/publish_achievements.py --approved ~/NSA-approved
```

Preview without writing:

```bash
python3 tools/publish_achievements.py --approved ~/NSA-approved --dry-run
```

Special quality badges can be supplied from an instructor-only JSON file:

```bash
python3 tools/publish_achievements.py \
  --approved ~/NSA-approved \
  --awards ~/NSA-achievement-awards.json
```

Use `teacher/achievement_awards.example.json` as the format example. Do not keep student reports inside the repository.

## Badge policy

Automatically derived milestone badges are intentionally non-competitive:

- `Работа принята` — one accepted lab;
- `Стабильный прогресс` — at least two accepted labs;
- `Системный практик` — all currently available labs accepted.

`Отличная работа` and `Самостоятельное решение` are instructor-awarded. They are not based automatically on speed, MCQ score, retry count, or completeness percentage.

## Reuse in other courses

Change only:

- `_config.yml` → `course_id`;
- `_data/achievements.json` → `allowed_labs` and badge vocabulary;
- lab report builder metadata if the course uses another report generator.

The sidebar renderer and importer can remain unchanged.
