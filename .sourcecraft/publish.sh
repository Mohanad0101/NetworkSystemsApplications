#!/usr/bin/env bash
# Run only in the SourceCraft publication cube, after a successful build.
set -euo pipefail

: "${SOURCECRAFT_COMMIT_SHA:?SourceCraft commit SHA is required}"
: "${SOURCECRAFT_COMMIT_REF_NAME:?SourceCraft branch name is required}"
ruby qa/validate_course.rb
if [ "$SOURCECRAFT_COMMIT_REF_NAME" != main ]; then
  echo "Publication is restricted to main." >&2
  exit 1
fi
for page in index.html labs/lx0.html labs/lx1.html labs/lx2.html labs/lx3.html labs/lx4.html labs/lx5.html labs/lx6.html labs/lx7.html assessments/foundation.html \
  assets/js/report-builder.js assets/js/learning-deck.js assets/js/report-review.js assets/js/completion-summary.js assets/js/quiz.js assets/js/evidence-pad.js assets/js/progress.js assets/css/style.css \
  assets/templates/NSA_LX0_Report_Template.docx assets/templates/NSA_LX1_Report_Template.docx \
  assets/templates/NSA_LX2_Report_Template.docx assets/templates/NSA_LX3_Report_Template.docx \
  assets/templates/NSA_LX4_Report_Template.docx assets/templates/NSA_LX5_Report_Template.docx assets/templates/NSA_LX6_Report_Template.docx assets/templates/NSA_LX7_Report_Template.docx; do
  test -s "site/$page"
done

# Inline web decks must be rendered before publication.
grep -q 'data-learning-deck="lx0"' site/labs/lx0.html
test "$(grep -c 'data-deck-slide=' site/labs/lx0.html)" -eq 7
grep -q 'data-learning-deck="lx1"' site/labs/lx1.html
test "$(grep -c 'data-deck-slide=' site/labs/lx1.html)" -eq 7
grep -q 'data-learning-deck="lx2"' site/labs/lx2.html
test "$(grep -c 'data-deck-slide=' site/labs/lx2.html)" -eq 7
grep -q 'data-learning-deck="lx3"' site/labs/lx3.html
test "$(grep -c 'data-deck-slide=' site/labs/lx3.html)" -eq 7
grep -q 'data-learning-deck="lx4"' site/labs/lx4.html
test "$(grep -c 'data-deck-slide=' site/labs/lx4.html)" -eq 7
grep -q 'data-learning-deck="lx5"' site/labs/lx5.html
test "$(grep -c 'data-deck-slide=' site/labs/lx5.html)" -eq 7
grep -q 'data-learning-deck="lx6"' site/labs/lx6.html
test "$(grep -c 'data-deck-slide=' site/labs/lx6.html)" -eq 7
grep -q 'data-learning-deck="lx7"' site/labs/lx7.html
test "$(grep -c 'data-deck-slide=' site/labs/lx7.html)" -eq 7

# Evidence fields are rendered statically, so a student can paste results even
# if JavaScript fails or is cached. Fail the publication if they disappear.
grep -q 'data-evidence-editor="LX0-02"' site/labs/lx0.html
grep -q 'data-evidence-editor="LX1-01"' site/labs/lx1.html
grep -q 'data-evidence-editor="LX2-01"' site/labs/lx2.html
grep -q 'data-evidence-editor="LX3-01"' site/labs/lx3.html
grep -q 'data-evidence-editor="LX4-01"' site/labs/lx4.html
grep -q 'data-evidence-editor="LX5-01"' site/labs/lx5.html
grep -q 'data-evidence-editor="LX6-01"' site/labs/lx6.html
grep -q 'data-evidence-editor="LX7-01"' site/labs/lx7.html
grep -q 'data-report-builder' site/labs/lx6.html
grep -q 'data-learning-progress' site/labs/lx6.html
grep -q 'data-build-report' site/labs/lx6.html
grep -q 'data-report-builder' site/labs/lx7.html
grep -q 'data-learning-progress' site/labs/lx7.html
grep -q 'data-build-report' site/labs/lx7.html
grep -q '<textarea[^>]*data-evidence-id="LX0-02"' site/labs/lx0.html
test "$(grep -c 'data-quiz-card' site/labs/lx0.html)" -eq 10
test "$(grep -c 'data-quiz-card' site/labs/lx1.html)" -eq 12
test "$(grep -c 'data-quiz-card' site/labs/lx2.html)" -eq 12
test "$(grep -c 'data-quiz-card' site/labs/lx3.html)" -eq 12
test "$(grep -c 'data-quiz-card' site/labs/lx4.html)" -eq 12
test "$(grep -c 'data-quiz-card' site/labs/lx5.html)" -eq 12
test "$(grep -c 'data-quiz-card' site/labs/lx6.html)" -eq 12
test "$(grep -c 'data-quiz-card' site/labs/lx7.html)" -eq 12
test "$(grep -c 'data-quiz-card' site/assessments/foundation.html)" -eq 12
grep -q 'data-report-quiz-preview' site/labs/lx0.html
grep -q 'data-report-builder' site/labs/lx0.html
grep -q 'data-learning-progress' site/labs/lx0.html
grep -q 'data-progress-toggle="1"' site/labs/lx0.html
grep -q 'data-home-progress-lab="lx0"' site/index.html
grep -q 'data-home-progress-lab="lx4"' site/index.html
grep -q 'data-home-progress-lab="lx5"' site/index.html
grep -q 'data-home-progress-lab="lx6"' site/index.html
grep -q 'data-home-progress-lab="lx7"' site/index.html
grep -q 'data-home-completeness-text' site/index.html
grep -q 'data-home-completeness-bar' site/index.html
grep -q 'data-overall-completeness-text' site/index.html
grep -q 'nsa-submission-completeness:v1:' site/assets/js/report-builder.js
grep -q 'nsa-submission-completeness:v1:' site/assets/js/progress.js
grep -q 'course-naming-note' site/index.html
grep -q '← К курсу' site/labs/lx0.html
grep -q 'lab-name-guide' site/labs/lx0.html
grep -q 'lab-name-guide' site/labs/lx3.html
grep -q 'Пройти ещё раз для закрепления' site/assets/js/quiz.js
grep -q 'try-again' site/assets/js/quiz.js
grep -q 'Content-Security-Policy' site/labs/lx0.html

# Read both refs before changing the local checkout. The explicit lease rejects
# a competing publication instead of silently replacing its result.
remote_refs="$(git ls-remote origin refs/heads/main refs/heads/release)"
main_sha="$(printf '%s\n' "$remote_refs" | awk '$2 == "refs/heads/main" {print $1}')"
release_sha="$(printf '%s\n' "$remote_refs" | awk '$2 == "refs/heads/release" {print $1}')"
if [ "$main_sha" != "$SOURCECRAFT_COMMIT_SHA" ]; then
  echo "Skipped: main has changed since this build started. Use the latest main workflow."
  exit 0
fi
if [ "$(git rev-parse HEAD)" != "$SOURCECRAFT_COMMIT_SHA" ]; then
  echo "Checkout does not match the commit being published." >&2
  exit 1
fi

# The release branch is generated output; main remains the editable source.
git checkout -B release "$SOURCECRAFT_COMMIT_SHA"
git config user.name "SourceCraft Pages CI"
git config user.email "sourcecraft-pages-ci@users.noreply.local"
# site/ is ignored on source branches, but must be tracked on release.
git add --force --all -- site
if ! git diff --cached --quiet; then
  git commit -m "Deploy course from $SOURCECRAFT_COMMIT_SHA"
fi
git push --force-with-lease="refs/heads/release:$release_sha" origin HEAD:refs/heads/release
