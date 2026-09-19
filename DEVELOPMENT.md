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

Publishing runs automatically when a `vX.Y.Z` tag is pushed, after audit, lint,
tests, and packaging pass. The tag must match the version in `package.json`.

One-time setup: add a repository Actions secret named `VSCE_PAT` in GitHub under
Settings > Secrets and variables > Actions. Use a valid Marketplace token with
the Manage scope and access to the `dotenv` publisher.

From a clean, up-to-date `master` branch, create and push the next release:

```bash
npm version patch
git push origin master --follow-tags
```

`npm version patch` updates the package files and creates the version commit and
annotated tag. Use a new version for each release; already published versions
cannot be published again. No Marketplace token is needed on your machine for
this workflow.

To publish manually instead:

```
npm run login -- dotenv
npm run publish
```

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
