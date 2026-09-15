# Lab stylesheet repair

Root cause: `assets/css/style.css`, loaded by every page, had been overwritten by a small enhancement-only stylesheet. The actual shared design system survived as `assets/css/style2.css`, but the layout never loaded `style2.css`. The homepage still looked correct because it additionally loads the large `course-home.css`; labs do not.

Repair: merged the original shared design system and later enhancement rules into the single canonical `style.css`, removed `style2.css`, restored later lab-component styles, bumped the CSS cache key, and added SourceCraft CI regression checks so an incomplete lab stylesheet cannot publish again.
