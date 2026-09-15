# Academic and MCQ quality audit

## Scope
LX0–LX7 teaching pages, inline concept decks, authentic-output activities, and formative MCQs were reviewed for clarity, internal consistency, single-best-answer structure, and technically sensitive Linux/SSH/systemd/Bash/storage claims.

## Quality rules applied
- MCQs are formative: retry is allowed and feedback is part of learning.
- Each item should have one best answer under the assumptions stated in the lab.
- Distractors should represent realistic misconceptions, not jokes or obviously impossible choices.
- Questions should sample interpretation, diagnosis, application, and comparison—not only command recall.
- Version-/implementation-sensitive claims should be phrased narrowly enough to remain correct in the stated Linux Mint/systemd/OpenSSH environment.
- Browser completion is evidence of following the learning route, not proof that an external VM action was performed correctly.

## Targeted corrections in this pass
- systemd `default.target`: wording now describes the configured default boot target without implying it is a universal fixed target.
- `NoNewPrivileges=yes`: wording now distinguishes running as an unprivileged user from preventing acquisition of new privileges through exec-related mechanisms.
- `findmnt --verify`: wording now describes validation/error reporting and avoids claiming it proves all runtime behavior.
- LX6 material explicitly recommends `findmnt --verify` rather than treating `mount -a` as a general fstab checker.
- sticky-bit wording now acknowledges owner/privileged exceptions and rename as well as deletion.
- shebang wording now describes the interpreter directive used for direct execution without oversimplifying it as a Bash-only feature.

## MCQ structural audit
See `QUIZ_QA.json`. Every LX quiz was checked for question count and valid correct-answer indices.

## Remaining instructor-level review
Before a semester release, rerun the course on the exact Linux Mint/VirtualBox versions used by students and recheck any command output examples whose formatting can vary by package version.
