#!/usr/bin/env python3
from __future__ import annotations
import json
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / 'tools' / 'publish_achievements.py'
CONFIG = ROOT / '_data' / 'achievements.json'


def custom_xml(lab: str, group: str, number: int, consent: bool) -> str:
    props = [
        ('NSA.CourseId', 'network-systems-applications'),
        ('NSA.Lab', lab),
        ('NSA.Group', group),
        ('NSA.ListNumber', str(number)),
        ('NSA.ReportDate', '2026-09-03'),
        ('NSA.PublicBoardConsent', 'yes' if consent else 'no'),
    ]
    rows = ''.join(
        f'<property fmtid="{{D5CDD505-2E9C-101B-9397-08002B2CF9AE}}" pid="{i+2}" name="{name}"><vt:lpwstr>{value}</vt:lpwstr></property>'
        for i, (name, value) in enumerate(props)
    )
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' \
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" ' \
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' + rows + '</Properties>'


def make_docx(path: Path, lab: str, group: str, number: int, consent: bool) -> None:
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_STORED) as zf:
        zf.writestr('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>')
        zf.writestr('docProps/custom.xml', custom_xml(lab, group, number, consent))


def main() -> None:
    with tempfile.TemporaryDirectory(prefix='nsa-achievement-test-') as tmp:
        tmp = Path(tmp)
        approved = tmp / 'approved'; approved.mkdir()
        data = tmp / 'achievements.json'; shutil.copy2(CONFIG, data)
        make_docx(approved / 'lx0.docx', 'LX0', 'GR-42', 7, True)
        make_docx(approved / 'lx1.docx', 'LX1', 'GR-42', 7, True)
        make_docx(approved / 'private.docx', 'LX1', 'GR-99', 3, False)
        awards = tmp / 'awards.json'
        awards.write_text(json.dumps({'awards':[{'group':'GR-42','number':7,'lab':'LX1','badge':'excellent'}]}), encoding='utf-8')
        subprocess.run(['python3', str(TOOL), '--approved', str(approved), '--data', str(data), '--awards', str(awards)], check=True)
        out = json.loads(data.read_text(encoding='utf-8'))
        entries = out['entries']
        assert len(entries) == 2, entries
        assert all(x['group'] == 'GR-42' for x in entries), entries
        assert any(x['lab'] == 'LX1' and x['badge'] == 'excellent' for x in entries), entries
        allowed = {'lab','date','group','number','badge','approved'}
        assert all(set(x) <= allowed for x in entries), entries
        assert all('name' not in x and 'score' not in x and 'completeness' not in x for x in entries), entries
    print('Achievement import QA: PASS')


if __name__ == '__main__':
    main()
