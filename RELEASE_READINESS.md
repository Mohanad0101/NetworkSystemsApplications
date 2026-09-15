# Student deployment readiness

Release candidate: student-ready QA pass.

## Automated checks passed
- Repository course validator passes.
- Static MCQ source and canonical quiz data are synchronized.
- All LX0–LX7 report templates are valid DOCX/OpenXML packages and contain the canonical `~/NSA/LXn` workspace.
- Enhancement JavaScript complies with the repository's strict CSP rule (no `innerHTML`, `eval`, inline-style mutation, or network submission).
- Existing Node regression tests were executed where present.
- CI now explicitly checks that the concept deck, output inspector, report review, completion summary, report builder, quiz, evidence and progress scripts are present in the built site.
- LX0–LX7 quiz counts and answer mappings remain covered by CI/repository validation.

## Completion semantics
The course distinguishes three things:
1. learning-route completion;
2. presence/quality of student evidence;
3. instructor confirmation of technical correctness.

The browser never claims to have verified an action performed inside an external VM. Obvious filler is flagged for clarification, while legitimate short command output is still subject to instructor review.

## Report/template behavior
Each LX0–LX7 lab has a DOCX template. Generated reports retain the canonical workspace, student identity fields, practical evidence, MCQ result, and completion summary. The student is instructed to review the generated document before sending it.

## Deployment
Use the existing GitLab Pages or SourceCraft instructions in `DEPLOYMENT.md`. CI performs the authoritative production Jekyll build in Ruby 3.3/Jekyll 4.4.

## Final smoke test after publishing
Open the deployed URL in a normal and private browser window. Complete one lab end-to-end: deck → output interaction → practical evidence → MCQ → completion card → DOCX download. Reopen the page to confirm local progress persistence. Also check one narrow mobile viewport and keyboard-only navigation.

This last smoke test is intentionally deployment-environment dependent and cannot be certified by source-only QA.
