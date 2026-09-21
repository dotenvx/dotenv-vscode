![dotenvx](https://dotenvx.com/banner.png)

*official dotenv extension for vscode*–from the creator of [`dotenv`](https://github.com/motdotla/dotenv).

* auto-cloaking
* auto-completion
* secret peeking
* syntax highlighting 
* NEW: decryption peeking (for encrypted .env files)

<a href="https://marketplace.visualstudio.com/items?itemName=dotenv.dotenv-vscode"><img src="https://img.shields.io/badge/VS%20Marketplace-Install-blue" alt="Install from VS Marketplace"></a>

&nbsp;

> auto-cloaking
<img src="https://github.com/user-attachments/assets/53d25529-ab04-4c5d-8a74-ae6cb39b93cf">

&nbsp;

> auto-completion
<img src="https://github.com/user-attachments/assets/ad2b730e-d32f-4573-acd8-f7491bf48e25"/>

&nbsp;

> secret peeking
<img src="https://github.com/user-attachments/assets/f4441d8d-8765-4849-b947-6ce36412ca03"/>

&nbsp;

> syntax highlighting
<img src="https://github.com/user-attachments/assets/f276e078-c60e-4cb2-9664-f6750d8387c9"/>

&nbsp;

> decryption peeking
<img src="https://github.com/user-attachments/assets/ba5ec15b-1be8-40b1-902d-116fdbf81591"/>

&nbsp;

## FAQ

<details><summary>Does it automatically cloak my secrets? <strong>Yes.</strong></summary><br>

Open a `.env` file and its values start masked.

Click **Toggle auto-cloaking** at the top of the file or run **Dotenv: Toggle auto-cloaking**
from the Command Palette to reveal or hide them.

Switching tabs hides them again in the Dotenv Editor.

&nbsp;

</details>

<details><summary>Does it support .env variants? <strong>Yes.</strong></summary><br>

`.env`, `.env.example`, `.env.development`, `.env.staging`, `.env.production`,
other `.env.*` files, `*.env`, and `.flaskenv` are supported.

&nbsp;

</details>

<details><summary>Can I autocomplete environment variables? <strong>Yes.</strong></summary><br>

Start typing `process.env.` or your language's environment-variable expression.

Suggestions come from your dotenv files, with values masked and source filenames shown.

&nbsp;

</details>

<details><summary>Can I reveal a value inside an autocomplete popup? <strong>Yes.</strong></summary><br>

Open a suggestion's details and click **Reveal value**. Click **Hide value**
to mask it again.

Only that source's value is revealed. The suggestion row stays masked, and your
secret-peeking setting stays unchanged.

&nbsp;

</details>

<details><summary>Can I peek at secrets without opening my .env file? <strong>Yes.</strong></summary><br>

Hover over a reference such as `process.env.SECRET_KEY` or `ENV["SECRET_KEY"]`.

The popup shows the source file and lets you **Reveal value** or **Hide value**.
New hovers follow your `dotenv.enableSecretpeeking` setting.

&nbsp;

</details>

<details><summary>Can I peek at encrypted values with dotenvx? <strong>Yes.</strong></summary><br>

In the Dotenv Editor, hover over an `encrypted:` value and click **Decrypt value**.
The file stays encrypted.

Click **Hide value**, leave the popup, or switch tabs to clear the displayed plaintext.

You'll need a saved file, a trusted workspace, and the dotenvx CLI installed
locally.

dotenvx finds the matching private key through its usual lookup, such as
`.env.keys` or its key store. A key stored only in GitHub Actions isn't available locally.

If dotenvx isn't on your PATH, set `dotenv.dotenvxPath` to its executable.

&nbsp;

</details>

<details><summary>Does it highlight .env syntax? <strong>Yes.</strong></summary><br>

Variable names, values, comments, and quoted strings have syntax highlighting.
The Dotenv Editor also highlights numeric values.

&nbsp;

</details>

<details><summary>Does it support languages other than JavaScript? <strong>Yes.</strong></summary><br>

Auto-completion and secret peeking support JavaScript, TypeScript, Ruby,
Python, PHP, Go, Java, .NET (C#, F#, Visual Basic), C/C++, Julia, Erlang, Perl,
Swift, Clojure, Rust, Dart, Kotlin, and Elixir.

Values come from your dotenv files, rather than the running application's environment.

&nbsp;

</details>

<details><summary>Does it support importing env from node:process? <strong>Yes.</strong></summary><br>

Both `node:process` and `process` imports work, including named aliases and
multiline imports.

```js
import { env } from 'node:process'
console.log(env.SECRET_KEY)

import { env as environment } from 'node:process'
console.log(environment.SECRET_KEY)
```

&nbsp;

</details>

<details><summary>Does it support .NET? <strong>Yes.</strong></summary><br>

C#, F#, and Visual Basic support `Environment.GetEnvironmentVariable`,
including `System.Environment` and the overload with an `EnvironmentVariableTarget`.

Type `(` or `"` in the first argument, or request completion while typing a name.
Hover over the name to peek at its value.

```csharp
var secret = System.Environment.GetEnvironmentVariable("SECRET_KEY");
```

Values come from dotenv files. The extension doesn't read Windows registry values,
`appsettings.json`, or `IConfiguration`.

&nbsp;

</details>

<details><summary>Does it support C and C++? <strong>Yes.</strong></summary><br>

Complete and hover over names in `getenv` calls. C++ also supports
`std::getenv` and `::getenv`.

```c
const char *secret = getenv("SECRET_KEY");
```

&nbsp;

</details>

<details><summary>Does it support Julia and Erlang? <strong>Yes.</strong></summary><br>

Complete and hover over names in these expressions:

```julia
secret = ENV["SECRET_KEY"]
secret = get(ENV, "SECRET_KEY", "fallback")
```

```erlang
Secret = os:getenv("SECRET_KEY").
Secret = os:getenv("SECRET_KEY", "fallback").
```

Erlang files need the `erlang` language mode provided by an Erlang extension.
Fallback arguments aren't evaluated when a key is missing from your dotenv files.

&nbsp;

</details>

<details><summary>Does it support Perl? <strong>Yes.</strong></summary><br>

Suggestions preserve bare keys, single quotes, or double quotes. Hover over
a name to peek at its value.

```perl
my $secret = $ENV{SECRET_KEY};
my $secret = $ENV{'SECRET_KEY'};
my $secret = $ENV{"SECRET_KEY"};
```

&nbsp;

</details>

<details><summary>Does it support Swift and Clojure? <strong>Yes.</strong></summary><br>

Complete names inside quotes and hover over them to peek at their values.

```swift
let secret = ProcessInfo.processInfo.environment["SECRET_KEY"]
let secret = getenv("SECRET_KEY")
```

Swift also supports `Foundation.ProcessInfo.processInfo.environment`,
`Darwin.getenv`, and `Glibc.getenv`.

```clojure
(System/getenv "SECRET_KEY")
(java.lang.System/getenv "SECRET_KEY")
```

&nbsp;

</details>

<details><summary>Does it work with monorepos? <strong>Yes.</strong></summary><br>

Completion and secret peeking look in the source file's directory and each
parent directory up to its workspace root.

Sibling projects and other workspace folders stay separate. Your project doesn't
need to install the `dotenv` package.

&nbsp;

</details>

<details><summary>Can I see values from multiple .env files? <strong>Yes.</strong></summary><br>

Each key appears once in completion, with its source filenames.

Hover and completion details show the values with their filenames, nearest
directories first. The extension doesn't guess which environment your application runs.

Unsaved dotenv edits appear immediately in completion and secret peeking.

&nbsp;

</details>

<details><summary>Can I use custom dotenv filenames? <strong>Yes.</strong></summary><br>

Associate them with the `dotenv` language in your project's `.vscode/settings.json`:

```json
{
  "files.associations": {
    ".dev.vars": "dotenv",
    "**/.env.d/*": "dotenv"
  }
}
```

This enables syntax highlighting, cloaking, and the toggle in the native editor,
and includes those files in completion and secret-peeking discovery.

Open files with Dotenv selected as their language are included too.

&nbsp;

</details>

<details><summary>Can I edit and copy values while they're cloaked? <strong>Yes.</strong></summary><br>

Cloaking is visual: copied text contains the actual value.

The Dotenv Editor supports line numbers, multiple cursors, find/replace, folding,
comments, and normal editing. Save, undo, and redo use the usual shortcuts and
update the underlying document.

If another edit conflicts with yours, your draft stays available to copy instead
of overwriting the other edit.

&nbsp;

</details>

<details><summary>Does the Dotenv Editor prevent secrets from flashing when I switch tabs? <strong>Yes.</strong></summary><br>

Values are masked before the editor becomes visible, and masking updates
locally as you type. Each view starts masked and hides values again on tab switches.

The minimap and general hover previews are disabled; encrypted values have their
own explicit **Decrypt value** action.

&nbsp;

</details>

<details><summary>Does the Dotenv Editor follow my editor settings? <strong>Yes.</strong></summary><br>

Fonts and basic editor settings follow VS Code. It uses Monaco, the editor
component behind VS Code.

Custom theme token rules, arbitrary user keybindings, and other extensions don't
automatically carry into the embedded editor.

&nbsp;

</details>

<details><summary>Can I use the native VS Code text editor? <strong>Yes.</strong></summary><br>

Choose **Reopen Editor With → Text Editor**.

Cloaking there uses temporary decorations, so values can briefly flash during
file opens or tab switches.

The toggle is remembered in extension storage, and `dotenv.enableAutocloaking`
controls cloaking in that view.

&nbsp;

</details>

<details><summary>Does it preserve my syntax-color settings? <strong>Yes.</strong></summary><br>

Cloaking no longer writes syntax-color settings.

On upgrade, the extension removes only the exact invisible TextMate rules inserted
by older versions from `editor.tokenColorCustomizations`. Your other custom rules
stay intact.

&nbsp;

</details>

<details><summary>Can I cloak environment values in YAML? <strong>Yes.</strong></summary><br>

In the normal YAML editor, values under `env_variables`, `environment`, and
`env` are masked.

This includes Docker Compose maps and lists and Kubernetes `name`/`value` entries.
Quotes and comments stay visible.

Values can briefly flash on file opens or tab switches. Invalid YAML is handled
on a best-effort basis. YAML isn't a source for completion or secret peeking.

&nbsp;

</details>

<details><summary>Can I customize which YAML sections are cloaked? <strong>Yes.</strong></summary><br>

Set `dotenv.yamlSections` to replace the defaults, or use `[]` to disable YAML cloaking.

```json
{
  "dotenv.yamlSections": ["env_variables", "environment", "env", "secrets"]
}
```

&nbsp;

</details>

&nbsp;

## CHANGELOG

See [CHANGELOG](CHANGELOG.md)

&nbsp;

Thank you for using dotenv-vscode.
