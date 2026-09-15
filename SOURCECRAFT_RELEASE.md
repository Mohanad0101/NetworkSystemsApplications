# SourceCraft student release

This repository is configured for SourceCraft Sites.

## Expected flow
1. Push this release to the repository's `main` branch.
2. `.sourcecraft/ci.yaml` starts `build-site`.
3. The Ruby 3.3 cube runs the full course validator, installs Jekyll 4.4, and builds `site/`.
4. The publication cube reruns validation and checks required pages, quizzes, evidence editors, report templates, progress/report scripts, and the enhanced learning components.
5. `.sourcecraft/publish.sh` publishes the generated `site/` directory to the `release` branch with `--force-with-lease`.
6. `.sourcecraft/sites.yaml` serves `site/` from `release`.

## SourceCraft prerequisites
SourceCraft Sites requires a public repository in a public organization. The repository's main branch must be `main`, and CI must have permission to update the `release` branch.

## After the first successful workflow
Open the deployment URL and perform one student smoke test:
LX0 deck → output-reading interaction → evidence → MCQ → completion card → generated DOCX.
Then reload LX0 to confirm local progress persists.

No student evidence is transmitted by the course JavaScript; it remains local until the student submits the generated document by the instructor's chosen channel.
