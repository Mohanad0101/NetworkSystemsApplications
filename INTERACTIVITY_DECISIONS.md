# Interactivity decisions

## Peer interaction — implemented
LX0–LX7 now include a short, authentic pair-review/troubleshooting activity. The activity is channel-neutral: an instructor can use an LMS forum, SourceCraft-linked discussion space, Teams/Discord, or in-class pairs without hard-coding a third-party dependency into the course.

## H5P — not required for this release
The course already provides custom dependency-free web slides, formative MCQs, progressive hints and practical evidence. Adding H5P solely to satisfy a technology checklist would increase deployment and maintenance complexity. H5P should be added only if the institution provides a supported H5P host/LMS and a specific activity benefits from it.

## Pyodide — not appropriate for the current LX0–LX7 scope
The current course teaches Linux systems, SSH, permissions, processes, systemd, storage and Bash. There is no Python/socket-programming lab in LX0–LX7. Pyodide also runs Python in a browser/WASM environment and cannot reproduce privileged Linux/systemd/VirtualBox networking behavior. It should be considered later for a genuine Python network-programming module, not used as a substitute for the Mint VM.

## Accessibility
The course uses native buttons/details controls, visible focus, a skip-to-content link, reduced-motion handling, responsive layouts, text labels in addition to color, and keyboard-operable custom interactions. A final rendered WCAG audit remains part of release QA.
