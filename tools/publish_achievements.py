#!/usr/bin/env python3
"""Publish a privacy-minimized achievement board from instructor-approved DOCX reports.

Security model:
- The public course remains static and has no write credential in browser JavaScript.
- This tool reads only reports the instructor has already placed in an approved local folder.
- It extracts a small custom-property receipt embedded by the course report builder.
- It writes only lab/date/group/list-number/badge to _data/achievements.json.
- It never copies reports, names, evidence, answers, screenshots, or grades into the repository.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import tempfile
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "_data" / "achievements.json"
CUSTOM_PROPS = "docProps/custom.xml"
CP_NS = "http://schemas.openxmlformats.org/officeDocument/2006/custom-properties"
VT_NS = "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"

GROUP_RE = re.compile(r"^[\w\-.А-Яа-яЁё]{1,40}$", re.UNICODE)
LAB_RE = re.compile(r"^[A-Z]{1,5}\d{1,3}$")


def fail(message: str) -> None:
    raise ValueError(message)


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, dict):
        fail(f"{path}: expected a JSON object")
    return data


def safe_text(value: object, limit: int = 80) -> str:
    text = str(value or "").strip()
    if not text or len(text) > limit or any(ord(ch) < 32 for ch in text):
        fail("invalid or empty text field")
    return text


def read_custom_properties(docx: Path) -> dict[str, str]:
    if not docx.is_file() or docx.suffix.lower() != ".docx":
        fail(f"{docx}: not a DOCX file")
    if docx.stat().st_size > 30 * 1024 * 1024:
        fail(f"{docx}: file is unexpectedly large")
    with zipfile.ZipFile(docx, "r") as zf:
        raw_names = zf.namelist()
        if len(raw_names) > 500:
            fail(f"{docx.name}: archive has too many parts")
        if raw_names.count(CUSTOM_PROPS) != 1 or raw_names.count("word/document.xml") != 1:
            fail(f"{docx.name}: missing or duplicate required DOCX parts")
        names = set(raw_names)
        if CUSTOM_PROPS not in names or "word/document.xml" not in names:
            fail(f"{docx.name}: missing course completion metadata")
        info = zf.getinfo(CUSTOM_PROPS)
        if info.file_size > 64 * 1024:
            fail(f"{docx.name}: custom properties part is unexpectedly large")
        root = ET.fromstring(zf.read(CUSTOM_PROPS))
    props: dict[str, str] = {}
    for prop in root.findall(f"{{{CP_NS}}}property"):
        name = prop.attrib.get("name", "")
        value = ""
        for child in list(prop):
            if child.tag.startswith("{" + VT_NS + "}"):
                value = child.text or ""
                break
        if name.startswith("NSA."):
            props[name] = value.strip()
    return props


def validate_receipt(props: dict[str, str], config: dict) -> dict:
    expected_course = safe_text(config.get("course_id"), 80)
    course_id = safe_text(props.get("NSA.CourseId"), 80)
    if course_id != expected_course:
        fail(f"course id mismatch: {course_id!r}")

    lab = safe_text(props.get("NSA.Lab"), 12).upper()
    allowed = {str(x).upper() for x in config.get("allowed_labs", [])}
    if not LAB_RE.fullmatch(lab) or (allowed and lab not in allowed):
        fail(f"lab not allowed: {lab!r}")

    group = safe_text(props.get("NSA.Group"), 40)
    if not GROUP_RE.fullmatch(group):
        fail("group contains unsupported characters")

    number_text = safe_text(props.get("NSA.ListNumber"), 4)
    if not number_text.isdigit() or not (1 <= int(number_text) <= 999):
        fail("list number must be 1..999")
    number = int(number_text)

    date_text = safe_text(props.get("NSA.ReportDate"), 10)
    try:
        report_date = dt.date.fromisoformat(date_text)
    except ValueError as exc:
        fail("report date must be ISO YYYY-MM-DD")
    today = dt.date.today()
    if report_date > today + dt.timedelta(days=1) or report_date < today - dt.timedelta(days=730):
        fail("report date is outside the accepted window")

    consent = str(props.get("NSA.PublicBoardConsent", "")).strip().lower() in {"yes", "true", "1"}

    return {
        "course_id": course_id,
        "lab": lab,
        "group": group,
        "number": number,
        "date": report_date.isoformat(),
        "public_board_consent": consent,
    }


def load_awards(path: Path | None, config: dict) -> dict[tuple[str, int, str], str]:
    if not path:
        return {}
    data = load_json(path)
    allowed_badges = set((config.get("badges") or {}).keys())
    awards: dict[tuple[str, int, str], str] = {}
    for raw in data.get("awards", []):
        if not isinstance(raw, dict):
            fail("award rows must be objects")
        group = safe_text(raw.get("group"), 40)
        if not GROUP_RE.fullmatch(group):
            fail("award group contains unsupported characters")
        try:
            number = int(raw.get("number"))
        except (TypeError, ValueError):
            fail("award list number must be an integer")
        if not 1 <= number <= 999:
            fail("award list number must be 1..999")
        lab = safe_text(raw.get("lab"), 12).upper()
        if lab not in {str(x).upper() for x in config.get("allowed_labs", [])}:
            fail(f"award lab not allowed: {lab}")
        badge = safe_text(raw.get("badge"), 40)
        if badge not in allowed_badges:
            fail(f"unknown badge: {badge}")
        awards[(group, number, lab)] = badge
    return awards


def milestone_badge(accepted_count: int, all_ready_count: int) -> str:
    if all_ready_count > 0 and accepted_count >= all_ready_count:
        return "system_practitioner"
    if accepted_count >= 2:
        return "steady"
    return "accepted"


def build_entries(receipts: list[dict], config: dict, awards: dict[tuple[str, int, str], str]) -> list[dict]:
    # One public row per student+lab; a later accepted report replaces an older one.
    latest: dict[tuple[str, int, str], dict] = {}
    for row in receipts:
        key = (row["group"], row["number"], row["lab"])
        old = latest.get(key)
        if old is None or row["date"] >= old["date"]:
            latest[key] = row

    student_counts: dict[tuple[str, int], int] = {}
    latest_student_key: dict[tuple[str, int], tuple[str, int, str]] = {}
    for key, row in latest.items():
        group, number, _lab = key
        student = (group, number)
        student_counts[student] = student_counts.get(student, 0) + 1
        current = latest_student_key.get(student)
        if current is None or (row["date"], key[2]) >= (latest[current]["date"], current[2]):
            latest_student_key[student] = key
    all_ready_count = len(config.get("allowed_labs", []))

    entries = []
    for (group, number, lab), row in latest.items():
        key = (group, number, lab)
        teacher_badge = awards.get(key)
        badge = teacher_badge or (milestone_badge(student_counts[(group, number)], all_ready_count) if latest_student_key[(group, number)] == key else "accepted")
        entries.append({
            "lab": lab,
            "date": row["date"],
            "group": group,
            "number": number,
            "badge": badge,
            "approved": True,
        })
    entries.sort(key=lambda x: (x["date"], x["lab"], x["group"], -x["number"]), reverse=True)
    return entries


def atomic_write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp_name, path)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the public achievement board from instructor-approved auto-generated DOCX reports.")
    parser.add_argument("--approved", required=True, type=Path, help="Local directory containing only instructor-approved DOCX reports.")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA, help="Achievement-board JSON file to update.")
    parser.add_argument("--awards", type=Path, default=None, help="Optional instructor-only JSON with special badge overrides.")
    parser.add_argument("--dry-run", action="store_true", help="Validate and print the public rows without writing the data file.")
    args = parser.parse_args()

    config = load_json(args.data)
    badges = config.get("badges") or {}
    if "accepted" not in badges:
        fail("achievement config must define an 'accepted' badge")
    reports = sorted(args.approved.glob("*.docx"))
    if not reports:
        fail(f"no DOCX reports found in {args.approved}")

    receipts = []
    rejected = []
    skipped_no_consent = 0
    require_consent = bool((config.get("privacy") or {}).get("require_consent", True))
    for report in reports:
        try:
            receipt = validate_receipt(read_custom_properties(report), config)
            # This tool runs only on the instructor-approved folder. Completeness is
            # intentionally not used as an acceptance rule or a grade.
            if require_consent and not receipt.get("public_board_consent"):
                skipped_no_consent += 1
                continue
            receipts.append(receipt)
        except Exception as exc:  # keep processing other approved files, but fail at end
            rejected.append((report.name, str(exc)))

    if rejected:
        for name, reason in rejected:
            print(f"REJECT {name}: {reason}", file=sys.stderr)
        fail(f"{len(rejected)} approved report(s) failed metadata validation; board was not changed")

    awards = load_awards(args.awards, config)
    entries = build_entries(receipts, config, awards)
    output = dict(config)
    output["entries"] = entries
    output["generated_at"] = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    if args.dry_run:
        print(json.dumps(entries, ensure_ascii=False, indent=2))
    else:
        atomic_write_json(args.data, output)
        print(f"Published {len(entries)} approved achievement row(s) to {args.data}")
        if skipped_no_consent:
            print(f"Skipped {skipped_no_consent} approved report(s) because public-board consent was not selected")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, zipfile.BadZipFile, ET.ParseError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
