# SourceCraft 404 repair

This release follows the documented SourceCraft Sites layout exactly:

- `.sourcecraft/sites.yaml` on `main` selects `ref: release` and `root: site`.
- CI builds Jekyll to `site/`.
- Publication commits the **entire `site/` directory** to the `release` branch.
- Therefore the published branch contains `site/index.html`, which is exactly the file selected by `root: site`.

After pushing to `main`, verify:
1. CI/CD → `build-site` is successful.
2. Code → branch `release` exists.
3. In `release`, `site/index.html` exists.
4. Repository → Deployments → open the SourceCraft Sites URL.

If the CI succeeds but the deployment still returns SourceCraft's generic 404, check that the repository and organization are public and that the Sites configuration shown in Repository Settings points to `release` / `site`.
