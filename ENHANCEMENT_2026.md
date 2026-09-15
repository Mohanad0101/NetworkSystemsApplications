# Learning-first enhancement

This revision preserves LX0–LX7 and the existing evidence/report architecture while adding:

- an inline seven-scene concept deck at the top of every lab;
- lab-specific visual language and examples rather than a repeated generic deck;
- prediction/diagnostic interactions before hands-on work;
- accessible keyboard-operable controls and reduced-motion behavior;
- a direct transition from conceptual preparation into the existing practical route;
- firmer but non-punitive handling of obvious filler evidence;
- no external runtime dependency for the new interaction layer.

The existing task-aware evidence rules, DOCX builder, privacy model, quizzes, progress system,
and lab content remain in place. The deck is a teaching layer, not a gate or grade.

## Second pass

- added an automatic pre-flight summary beside DOCX generation;
- pre-flight combines identity, hands-on route, evidence completeness and understanding check;
- upgraded generated DOCX opening into an instructor-readable completion card;
- added a human-readable report identifier and concise route/material summary;
- retained non-punitive language: automated checks indicate readiness, not grades;
- inline decks now record when the learner reaches the hand-off to practice.

## Continuation pass

- Inline concept decks now remember progress and mark conceptual preparation when the final scene is reached.
- Every lab shows a compact learner-facing route: Разобраться → Попробовать → Выполнить → Проверить → Собрать отчёт.
- The report pre-flight now includes conceptual preparation, so a student cannot obtain the strongest “ready” state by skipping the learning introduction.
- This is still not a grade: the deck is a learning checkpoint, while evidence heuristics only catch missing/obviously weak material.
- The DOCX cover language is cleaner and more instructor-readable, with an explicit learning-path summary.
- Existing lab-specific content and interactions remain intact; no lab was flattened into a generic template.

## Experience pass 3

- Added a different troubleshooting field guide to every LX lab, with progressive help rather than immediate solutions.
- Added one lab-specific diagnostic reflection per lab.
- Added a lightweight local report review that flags obvious filler, very short entries, and repeated evidence without assigning a grade.
- Kept all checks supportive and local to the browser; instructor judgment remains separate.
- Preserved the individual character and content of each lab.

## Visual/content pass 4

- Added clickable, lab-specific concept annotations inside the inline decks.
- Each deck now lets students inspect the important parts of its mental model instead of only reading a static diagram.
- Added one natural contextual bridge per lab to connect conceptual preparation with hands-on work without repeating instructional-design labels.
- Refined DOCX completion language for faster instructor scanning and clearer distinction between completion evidence and grading.

## Learning depth pass 5

- Added a unique terminal/output-reading interaction to every lab.
- Students now identify which line actually proves a requested system fact before entering hands-on work.
- Added cumulative retrieval threads to LX3–LX7 so earlier concepts are reused instead of disappearing after each lab.
- Strengthened filler guidance while keeping it formative: weak evidence is returned for clarification, not automatically graded.
- All new interactions are dependency-free and keyboard-operable.

## Consolidation / QA pass 6

- Removed a redundant transition component introduced earlier; the deck handoff and authentic-output activity already provide that function.
- Added a different final learning statement to every lab immediately before report readiness.
- Refined readiness wording so incomplete work receives a next-action message rather than a generic failure state.
- Audited injected components for accidental duplication across LX0–LX7.
- Added COURSE_QA.md documenting the final learner journey, accessibility assumptions, and remaining deployment checks.

## Academic correctness / MCQ pass 9

- Reviewed LX0–LX7 quiz structures and technically sensitive teaching claims.
- Tightened systemd, sticky-bit, shebang, and fstab/findmnt wording to avoid common oversimplifications.
- Added machine-readable quiz structural QA and an instructor-facing academic QA report.
- Preserved formative retry behavior: MCQs teach and diagnose misconceptions rather than punish first attempts.
