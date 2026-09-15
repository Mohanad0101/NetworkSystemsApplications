# SourceCraft lab-style path repair

The live site is hosted at `/network-systems-course/`. The previous CI derived Jekyll's `baseurl`
from the Git repository name. Those values are not guaranteed to be identical, so nested pages
such as `/labs/lx2.html` could receive asset URLs for the wrong project path.

This release fixes the public base URL explicitly to `/network-systems-course` in both `_config.yml`
and CI. CI now refuses publication unless generated lab HTML references:

`/network-systems-course/assets/css/style.css`

It also checks the learning-deck JavaScript URL on LX2.

A stray `<` after the closing `</html>` in the shared layout was also removed.
