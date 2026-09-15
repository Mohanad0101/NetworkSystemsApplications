# Instructor-only achievement workflow

The public course is static. Student browsers must never receive a repository token or a write-capable API key.

Recommended workflow:

1. Review submitted DOCX reports as usual.
2. Put only **accepted** auto-generated DOCX reports into a local folder outside the repository, for example `~/NSA-approved`.
3. Run:

   ```bash
   python3 tools/publish_achievements.py --approved ~/NSA-approved
   ```

4. Review the diff of `_data/achievements.json`, then commit/push it.
5. The course page rebuild displays only `group + number + lab + date + approved badge`.

Optional special badges are instructor decisions. Copy `achievement_awards.example.json` to a private local file and pass it with `--awards /path/to/achievement_awards.json`. Do not award special badges from MCQ scores or speed alone.

The tool never copies the DOCX reports into the repository and never publishes the student's full name, terminal output, screenshots, answers, or grade.
