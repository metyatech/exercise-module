# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial set of repository metadata files (LICENSE, SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, CHANGELOG.md).
- GitHub Actions CI workflow.
- Repository quality tooling (ESLint, Prettier) and CI formatting/lint/test checks.
- Dependency vulnerability scan in CI (`npm audit --audit-level=moderate`).
- Regression checks for plugin signature and CI workflow structure.

### Changed

- Docusaurus plugin entrypoint signature restored to `(context, options) => Plugin`.
- Security reporting guidance moved to private reporting (GitHub Security Advisories).

### Fixed

- CI workflow YAML structure and branch triggers.
- Code of Conduct placeholder text.
