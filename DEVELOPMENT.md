# DEVELOPMENT

## Setup

Use Node.js 22.12 or newer and install the locked dependencies:

```
npm ci
```

The VS Code API types stay pinned to the minimum supported version in `engines.vscode`.
Standard uses its own compatible ESLint dependency.

## Running in Debug Mode

Open this project in VSCode.

Then in VSCode click `Run` > `Start Debugging`.

That will open up a second VSCode that you can refresh when making changes. [see more](https://www.youtube.com/watch?v=a5DX5pQ9p5M)

CMD + R to refresh the extension, after making changes.

## Tests

```
npm test
```

Tests download the current stable VS Code and use a temporary workspace containing
`HELLO=World` in its `.env` file. No credentials or local `.env` file are needed.

## Packaging

Package it locally.

```
npm run package
```

## Installing

Install it locally.

```
npm run install-package dotenv-vscode-x.x.x.vsix
```

or install it by hand through Visual Studio Code.

Click `Extensions` > `...` > `Install from VSIX` > `Select dotenv-vscode-*-*-*.vsix`

[1] https://community.particle.io/t/how-to-install-a-vscode-extension-from-a-vsix-file/51014
[2] https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix

## Publishing

Publishing to the Visual Studio Marketplace and Open VSX runs automatically when
a `vX.Y.Z` tag is pushed, after audit, lint, tests, and packaging pass. The tag
must match the version in `package.json`. Each registry has an independent job,
so a failure at one does not cancel publishing to the other.

One-time setup: add a repository Actions secret named `VSCE_PAT` in GitHub under
Settings > Secrets and variables > Actions. Use a valid Marketplace token with
the Manage scope and access to the `dotenv` publisher.

For Open VSX, complete the [publisher setup](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions):

1. Sign in to [Open VSX](https://open-vsx.org) with GitHub, link your Eclipse
   account, and review and accept the Publisher Agreement.
2. Generate an [Open VSX access token](https://open-vsx.org/user-settings/tokens)
   and save it as the repository Actions secret `OVSX_PAT`.
3. Ensure the token's account can publish to the `dotenv` namespace (the
   `publisher` in `package.json`). If it does not exist, set `OVSX_PAT` in your
   local environment and run `npx --no-install ovsx create-namespace dotenv`.
   If it already exists, obtain membership instead. Marketplace publisher access
   does not grant Open VSX access.
4. [Claim namespace ownership](https://github.com/eclipse-openvsx/openvsx/wiki/Namespace-Access#how-to-claim-a-namespace)
   to have the extension marked as verified.

From a clean, up-to-date `master` branch, create and push the next release:

```bash
npm version patch
git push origin master --follow-tags
```

`npm version patch` updates the package files and creates the version commit and
annotated tag. Use a new version for each release; already published versions
cannot be published again. No publishing tokens are needed on your machine for
the tag workflow. If only one registry fails, fix its credentials or access and
use GitHub Actions **Re-run failed jobs** to retry only that registry.

To publish manually instead:

```
npm run login -- dotenv
npm run publish
```

To publish a packaged version to Open VSX manually, set `OVSX_PAT` in your local
environment, then run:

```bash
npm run package
npx --no-install ovsx publish dotenv-vscode-X.Y.Z.vsix --registryUrl https://open-vsx.org
```

Replace `X.Y.Z` with the version in `package.json`. This also lets you publish an
existing Marketplace release to Open VSX without trying to republish it to the
Marketplace. The Open VSX token is separate from `VSCE_PAT`; keep both out of the
repository.

[1] https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions
[2] https://marketplace.visualstudio.com/manage/publishers/dotenv

## Icons

List of all icons [https://code.visualstudio.com/api/references/icons-in-labels](https://code.visualstudio.com/api/references/icons-in-labels)
List of all icons [https://microsoft.github.io/vscode-codicons/dist/codicon.html](https://microsoft.github.io/vscode-codicons/dist/codicon.html)

## List of keywords

Find list of keywords here: https://stackoverflow.com/questions/10834765/where-to-find-a-list-of-scopes-for-sublime2-or-textmate

## Reference Theme Colors

https://stackoverflow.com/questions/47117621/how-to-get-the-vscode-theme-color-in-vscode-extensions

## Inspiration

[GitHub Pull Request Extension](https://github.com/microsoft/vscode-pull-request-github/blob/main/package.json)
