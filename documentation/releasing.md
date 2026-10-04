# Releasing and deployment

## Validate a change

```bash
npm ci
npx playwright install chromium
npm run verify
```

The checks cover source regressions, built and packed installations, CommonJS/ESM/TypeScript, browser bundles, release gates, and generated documentation.

## GitHub Pages

The `Deploy Documentation` workflow builds VitePress Markdown and theme files from **main**, tests the resulting site, and uploads `documentation/.vitepress/dist/` as a Pages artifact. The deploy job depends on that successful build, so the live site uses the source from the same commit.

When migrating from the old branch-based deployment, set repository **Settings → Pages → Build and deployment → Source** to **GitHub Actions** after merging this workflow. Run `Deploy Documentation` manually if the first deployment started before that setting was changed. The existing committed `docs/` site is retained during the transition; new builds do not overwrite or depend on it.

```bash
npm run docs
npm run smoke:docs
npm run smoke:docs:browser
```

Commit source changes only. After the change is merged into `main`, GitHub Actions builds and deploys the site automatically. The site's base path is `/hybrid-id-generator/`; its address is `https://miladezzat.github.io/hybrid-id-generator/`.

For editing, use `npm run docs:serve`; for built-site review, use `npm run docs:preview`. Open the printed URL with the repository base path.

## npm trusted publisher

The publish workflow uses the same OIDC approach as encrypt-rsa. In the package's npm access settings, configure a GitHub Actions trusted publisher with:

| Field | Value |
| --- | --- |
| Organization or user | `miladezzat` |
| Repository | `hybrid-id-generator` |
| Workflow filename | `publish.yml` |
| Environment | Empty; the workflow does not use one |
| Direct publishing | Enabled |
| Dist-tag management | Leave disabled unless separately required |

The matching workflow must be committed. No `NPM_TOKEN` is passed. GitHub-hosted Ubuntu runners use Node 24, npm 11.13.0, and `id-token: write`. See [npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) for the account setup.

## Prepare and publish a version

**main** is the only permanent branch. Open pull requests against `main`; merging a reviewed change updates the documentation and runs the npm release gate. Temporary feature branches can be removed after merging.

1. Update the version and changelog in the reviewed change. `npm run prepare-release -- patch` validates and uses npm's built-in version command; it creates a commit and tag, so run it only when ready for that operation.
2. Build and check documentation for the final version; commit its source.
3. Merge or push the approved release to `main`.

The workflow compares `package.json` with npm `latest` before installing dependencies. Equal versions skip publish and verify the existing release. For a newer stable version, it checks the exact version endpoint first: an existing version is verified rather than republished, even if `latest` lags or was retagged. A missing exact version runs the full checks, publishes once, then polls for registry propagation. Older or malformed versions and registry lookup errors fail the gate.

A workflow re-run for an already published version verifies it instead of publishing again. If verification times out after an accepted publish, inspect npm before retrying: registry processing is distinct from upload success.

PR validation never publishes a package. Adding a release tag alone does not trigger publishing; a push to `main` or an explicit workflow dispatch on `main` does.
