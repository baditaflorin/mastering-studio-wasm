# Security Policy

## Supported Versions

The `main` branch and the latest semver tag are supported.

## Reporting A Vulnerability

Please report security issues privately by email:

florinbadita@gmail.com

Do not open a public issue for vulnerabilities involving secret leakage, dependency compromise, or browser-side data exposure.

## Security Baseline

- No runtime backend exists in v1.
- Audio files stay in the browser and are not uploaded.
- No secrets are stored in the frontend.
- Local hooks include secret scanning.
- Dependencies are audited locally before release.
