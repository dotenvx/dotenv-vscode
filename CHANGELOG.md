# CHANGELOG

All notable changes to the Official Dotenv VS Code extension will be documented in this file.

## [Unreleased](https://github.com/dotenvx/dotenv-vscode/compare/v1.5.7...master)

## [1.5.7](https://github.com/dotenvx/dotenv-vscode/compare/v1.5.6...v1.5.7) (2026-09-23)

### Changed

* Respect secret-peeking global setting when off.

## [1.5.6](https://github.com/dotenvx/dotenv-vscode/compare/v1.5.5...v1.5.6) (2026-09-23)

### Changed

* Use the shared auto-cloaking setting for YAML, removing the separate YAML section setting.

## [1.5.5](https://github.com/dotenvx/dotenv-vscode/compare/v1.5.2...v1.5.5) (2026-09-23)

### Changed

* Honor the auto-cloaking setting in the Dotenv Editor, including on load, settings changes, and tab switches (#139).

## [1.5.2](https://github.com/dotenvx/dotenv-vscode/compare/v1.5.1...v1.5.2) (2026-09-20)

### Changed

* Fix README display on marketplace

## [1.5.1](https://github.com/dotenvx/dotenv-vscode/compare/v1.5.0...v1.5.1) (2026-09-20)

### Changed

* Clarify README docs

## [1.5.0](https://github.com/dotenvx/dotenv-vscode/compare/v1.4.0...v1.5.0) (2026-09-20)

### Added

* Add support for decrypting encrypted values ([#137](https://github.com/dotenvx/dotenv-vscode/pull/137))

## [1.4.0](https://github.com/dotenvx/dotenv-vscode/compare/v1.3.0...v1.4.0) (2026-09-20)

### Added

* Add convenient 'reveal' link on pop-out when hovering env key ([#136](https://github.com/dotenvx/dotenv-vscode/pull/136))

## [1.3.0](https://github.com/dotenvx/dotenv-vscode/compare/v1.2.1...v1.3.0) (2026-09-20)

### Added

* Add support for `import { env } from 'node:process'` with autocomplete and secret peeking. ([#135](https://github.com/dotenvx/dotenv-vscode/pull/135))

## [1.2.1](https://github.com/dotenvx/dotenv-vscode/compare/v1.2.0...v1.2.1) (2026-09-19)

### Changed

* Mask full value rather than partial on hover ([#133](https://github.com/dotenvx/dotenv-vscode/pull/133))

## [1.2.0](https://github.com/dotenvx/dotenv-vscode/compare/v1.1.0...v1.2.0) (2026-09-19)

### Changed

* README updates

## [1.1.0](https://github.com/dotenvx/dotenv-vscode/compare/v1.0.0...v1.1.0) (2026-09-19)

### Added

* Add support for cloaking docker-compose.yml files ([#132](https://github.com/dotenvx/dotenv-vscode/pull/132))

## [1.0.0](https://github.com/dotenvx/dotenv-vscode/compare/v0.31.0...v1.0.0) (2026-09-19)

### Changed

* Custom editor so that we can completely avoid any flashing. Fixes [#106](https://github.com/dotenvx/dotenv-vscode/issues/106) 

## [0.31.0](https://github.com/dotenvx/dotenv-vscode/compare/v0.30.2...v0.31.0) (2026-09-19)

### Changed

* Discover nested `.env*` files ([#129](https://github.com/dotenvx/dotenv-vscode/pull/129))

## [0.30.2](https://github.com/dotenvx/dotenv-vscode/compare/v0.30.1...v0.30.2) (2026-09-19)

### Changed

* Stop writing user settings for auto-cloaking. Use editor decorations and extension
  storage for the toggle, and remove only exact hiding rules left by older versions
  ([#99](https://github.com/dotenvx/dotenv-vscode/issues/99)).

## [0.30.1](https://github.com/dotenvx/dotenv-vscode/compare/v0.30.0...v0.30.1) (2026-09-19)

### Added

* Publish to open vsx registry

## [0.30.0](https://github.com/dotenvx/dotenv-vscode/compare/v0.29.0...v0.30.0) (2026-09-19)

### Added

* Add additional language support for erlang, julia, swift, and clojure ([#127](https://github.com/dotenvx/dotenv-vscode/pull/127))

## [0.29.0](https://github.com/dotenvx/dotenv-vscode/compare/v0.28.1...v0.29.0) (2026-09-18)

### Added

* Add support for `.dev.vars` ([#125](https://github.com/dotenvx/dotenv-vscode/pull/125))

### Changed

* Better cloaking ([#124](https://github.com/dotenvx/dotenv-vscode/pull/124))
* Better extension handling ([#123](https://github.com/dotenvx/dotenv-vscode/pull/123))
* Bump dependencies ([#122](https://github.com/dotenvx/dotenv-vscode/pull/122))

### Removed

* Removed the dotenv-vault integration, commands, and sidebar. The extension is now
  named Dotenv Official and focuses on editing `.env` files.

## [0.28.1](https://github.com/dotenvx/dotenv-vscode/compare/v0.28.0...v0.28.1) (2023-11-04)

### Added

* Add additional files to `.vscodeignore`

## [0.28.0](https://github.com/dotenvx/dotenv-vscode/compare/v0.27.3...v0.28.0) (2023-07-02)

### Changed

* Bumped `dotenv-vault` cli to `1.24.0`

## [0.27.3](https://github.com/dotenvx/dotenv-vscode/compare/v0.27.2...v0.27.3) (2023-06-15)

### Changed

* Improved environment variable capture [#96](https://github.com/dotenvx/dotenv-vscode/pull/96)

## [0.27.2](https://github.com/dotenvx/dotenv-vscode/compare/v0.27.1...v0.27.2) (2023-06-15)

### Added

* For autocompletion, respect secret peeking setting off or on [#97](https://github.com/dotenvx/dotenv-vscode/pull/97)

## [0.27.1](https://github.com/dotenvx/dotenv-vscode/compare/v0.27.0...v0.27.1) (2023-06-15)

### Changed

* `await` for async function to set `files.associations` in extension.js

## [0.27.0](https://github.com/dotenvx/dotenv-vscode/compare/v0.26.0...v0.27.0) (2023-06-15)

### Added

* Write to `settings.json` with `files.associations` to make sure `.env` files do not get the properties association. [#77](https://github.com/dotenvx/dotenv-vscode/issues/77)

## 0.26.0

### Added

* Add setting to turn off in-code secret peeking. [#95](https://github.com/dotenvx/dotenv-vscode/pull/95)

## 0.25.0

### Added

* Add setting to change the cloak icon.

## 0.24.3

### Changed

* 🐞 Fix `textMateRules` setting when not present in user machine `settings.json` file. [#94](https://github.com/dotenvx/dotenv-vscode/pull/94)

## 0.24.2

### Changed

* Changed theme to `highContrast` on Marketplace.

## 0.24.1

### Fixed

* Disable dotenv hovers and expanded autocomplete value details when secret peeking is turned off, while keeping autocomplete suggestions available.

* Reverted code causing autocloaking to fail [#93](https://github.com/dotenvx/dotenv-vscode/pull/93)

## 0.24.0

### Added

* Added `import.meta.env` format for javascript highlighting/autocomplete [#88](https://github.com/dotenvx/dotenv-vscode/pull/88)

### Fixed

* Issue where values wouldn't unhide after being autocloaked [#85](https://github.com/dotenvx/dotenv-vscode/issues/85) [#86](https://github.com/dotenvx/dotenv-vscode/issues/86) [#87](https://github.com/dotenvx/dotenv-vscode/pull/87)

## 0.23.0

### Added

* Added autocomplete and hover support for elixir. [#48](https://github.com/dotenvx/dotenv-vscode/issues/48)

### Fixed

* Issue where autocloaking would overwrite other tokenColorCustomization settings resolved [#79](https://github.com/dotenvx/dotenv-vscode/issues/79)

## 0.22.0

### Added

* [#78](https://github.com/dotenvx/dotenv-vscode/pull/78)
* Added autocomplete and hover support for dart.
* Added autocomplete and hover support for kotlin.
* Added .env.fat to list of files that will automatically be configured for dotEnv syntax highlighting.

### Fixed
* Issue where creating a new file and selecting javascript/ruby/python/php language but highlithing would be in .env style resolved. [#66](https://github.com/dotenvx/dotenv-vscode/issues/66), [#63](https://github.com/dotenvx/dotenv-vscode/issues/63)

## 0.21.0

### Changed

* [#74](https://github.com/dotenvx/dotenv-vscode/pull/74)
* Improved syntax highlighting for .env files
* Added more .env extensions that should auto-change the vscode langauge identifier to dotenv

## 0.20.0

### Added

* Added suport for `var_os` in Rust [#71](https://github.com/dotenvx/dotenv-vscode/pull/71)

## 0.19.0

### Removed

* Remove support for .NET dotenv lib [#61](https://github.com/dotenvx/dotenv-vscode/pull/61)

## 0.18.0

* Added support for rust [#64](https://github.com/dotenvx/dotenv-vscode/pull/64)

## 0.17.0

### Added

* Added support for .NET dotenv lib [#61](https://github.com/dotenvx/dotenv-vscode/pull/61)

## 0.16.0

### Added

* Added support for C# autocomplete and secret peeking[#59](https://github.com/dotenvx/dotenv-vscode/pull/59)

## 0.15.0

### Added

* Added support for Java autocomplete and secret peeking[#58](https://github.com/dotenvx/dotenv-vscode/pull/58)

## 0.14.1

### Changed

* Updated dotenv-vault to 1.13.4

## 0.14.0

### Added

* Added support for Go autocomplete and secret peeking[#57](https://github.com/dotenvx/dotenv-vscode/pull/57)

## 0.13.0

### Added

* Added support for PHP autocomplete and secret peeking[#40](https://github.com/dotenvx/dotenv-vscode/pull/40)

## 0.12.0

### Added

* Added support for Python autocomplete and secret peeking[#38](https://github.com/dotenvx/dotenv-vscode/pull/38)

## 0.11.1

### Changed

* Use workspacePath to load `.env` file [#37](https://github.com/dotenvx/dotenv-vscode/pull/37)

## 0.11.0

### Added

* Added support for Ruby autocomplete [#35](https://github.com/dotenvx/dotenv-vscode/pull/35)

## 0.10.2

### Changed

* Various bug patches around autocloaking 🐞

## 0.10.1

### Changed

* Place ENV completion items to top of list [#32](https://github.com/dotenvx/dotenv-vscode/pull/32)

## 0.10.0

* Added support for Ruby ENV secret peeking

## 0.9.0

### Added

* Added support for `.flaskenv` files

## 0.8.2

### Changed

* Updated Marketplace description

## 0.8.1

### Changed

* Preserve current `textMateRules`. Auto-clocking is either added or removed from the list.

## 0.8.0

### Added

* Added auto-cloaking toggle at top of .env file 🎉 ([24](https://github.com/dotenvx/dotenv-vscode/pull/24))

## 0.7.1

### Changed

* Fixed activation event in event of opening `.env` file first ([23](https://github.com/dotenvx/dotenv-vscode/pull/23))

## 0.7.0

### Added

* Auto-cloaking 🎉

## 0.6.1

### Changed

* Updated dotenv-vault to 1.11.2

## 0.6.0

### Added

* Icon in sidebar 🎉
* Working sidebar with buttons for added convenience 🎉
* Modal prompt before running npx dotenv-vault commands


## 0.5.5

### Added

* Added file support

## 0.5.4

### Added

* Clarified some content

## 0.5.3

### Added

* Added support for more extension types - .vault, .me

## 0.5.2

### Changed

* Refactored into helpers

### Added

* Added tests

## 0.5.1

### Changed

* Fix typescript support for hover

## 0.5.0

### Added

* Added support for vue files to have autocompletion
* Added hover support. Hover over a process.env.VARIABLE and view its vaulue set in your .env file 🎉

## 0.4.0

### Added

* Added autocompletion of process.env for .ts files and react code

## 0.3.0

### Added

* Added autocompletion of process.env by reading from local .env file

### Changed

* Support older versions of VSCode

## 0.2.1

### Changed

* README updates

## 0.2.0

### Added

* Syntax highlighting for .env* files

## 0.1.4

### Changed

* README updates

## 0.1.3

### Changed

* Updated README

## 0.1.2

### Changed

* Update banner and turn Q&A off. We will use GitHub Issues.

## 0.1.1

### Changed

* Update displayName

## 0.1.0

### Added

* Added commands:

```
login
logout
new
open
pull
push
status
versions
whoami
```

## 0.0.5

### Changed

* Updated displayName

## 0.0.4

### Changed

* Updated displayName

## 0.0.3

### Added

* Added sponsor link

## 0.0.2

### Added

* Added icon to marketplace

## 0.0.1

Initial release
