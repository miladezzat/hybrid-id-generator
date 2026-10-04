# Releasing and deployment

## Validate a change

```bash
npm ci
npx playwright install chromium
npm run verify
```

The checks cover source regressions, built and packed installations, CommonJS/ESM/TypeScript, browser bundles, release gates, and generated documentation.

## GitHub Pages

Pages serves the committed `docs/` directory from **main**. VitePress Markdown and theme files live in `documentation/`.

```bash
npm run docs
npm run smoke:docs
npm run smoke:docs:browser
```

Commit both the source changes and generated `docs/` output. After the change is merged into `main`, GitHub Pages rebuilds automatically. The site's base path is `/hybrid-id-generator/`; its address is `https://miladezzat.github.io/hybrid-id-generator/`.

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
2. Build and commit documentation for the final version.
3. Merge or push the approved release to `main`.

The workflow compares `package.json` with npm `latest` before installing dependencies. Equal versions skip publish and verify the existing release. A newer stable version runs the full checks, publishes once, then polls the exact npm version for registry propagation. Older or malformed versions fail the gate.

A workflow re-run for an already published version verifies it instead of publishing again. If verification times out after an accepted publish, inspect npm before retrying: registry processing is distinct from upload success.

PR validation never publishes a package. Adding a release tag alone does not trigger publishing; a push to `main` or an explicit workflow dispatch on `main` does.
