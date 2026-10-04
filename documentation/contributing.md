# Contributing

Report reproducible problems through [GitHub issues](https://github.com/miladezzat/hybrid-id-generator/issues). Include the package version, runtime, generator options, expected behavior, and a small reproduction.

## Development

```bash
npm ci
npm run build
npm test
npm run smoke
npm run smoke:install
```

Add a regression test for a behavior fix. Run `npm run verify` before a release; browser checks require Chromium installed with Playwright.

## Documentation

Edit `documentation/`, then run `npm run docs` and commit the generated `docs/` site. Keep API signatures, examples, package behavior, and migration notes aligned. Local search indexes the Markdown guides automatically.

## Pull requests

Target `main` for all changes. It is the only permanent branch and serves documentation and stable npm releases. Explain the problem, resulting behavior, and validation. Remove temporary feature branches after merging. Review the [release guide](./releasing.md) for publishing and Pages deployment.

Follow the repository's [Code of Conduct](https://github.com/miladezzat/hybrid-id-generator/blob/main/CODE_OF_CONDUCT.md).
