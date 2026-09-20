<div align="center">
  <table>
    <tr>
      <td>
        <a href="https://res.cloudinary.com/dotenv-org/image/upload/v1679528507/dotenv-vscode-autocloaking_kpr0ly.png"><img src="https://res.cloudinary.com/dotenv-org/image/upload/v1679528507/dotenv-vscode-autocloaking_kpr0ly.png"/></a>
      </td>
      <td>
        <a href="https://res.cloudinary.com/dotenv-org/image/upload/v1679528507/dotenv-vscode-autocompletion_rqlanf.png"><img src="https://res.cloudinary.com/dotenv-org/image/upload/v1679528507/dotenv-vscode-autocompletion_rqlanf.png"/></a>
      </td>
      <td>
        <a href="https://res.cloudinary.com/dotenv-org/image/upload/v1679528506/dotenv-vscode-secretpeeking_byznii.png"><img src="https://res.cloudinary.com/dotenv-org/image/upload/v1679528506/dotenv-vscode-secretpeeking_byznii.png"/></a>
      </td>
    </tr>
  </table>
</div>

# Dotenv Official

#### Syntax highlighting, auto-cloaking, auto-completion, and in-code secret peeking.

<a href="https://marketplace.visualstudio.com/items?itemName=dotenv.dotenv-vscode"><img src="https://img.shields.io/badge/VS%20Marketplace-Install-blue" alt="Install from VS Marketplace"></a>

## Usage

### Syntax Highlighting

It just works. Open your `.env` files in VSCode, and they will now be syntax highlighted.

### Auto-cloaking

It just works. Open your `.env` files in VSCode, and they will be auto-cloaked. Click the 'Toggle auto-cloaking' link at the top of your `.env` file to toggle it off. Feel safer sharing your screen!

<img src="https://res.cloudinary.com/dotenv-org/image/upload/v1664140588/toggle_itemcq.gif">

Supported files:

* .env
* .env.example
* .env.development
* .env.staging
* .env.production
* .env.*
* .flaskenv
* docker-compose.yaml
* docker-compose.yml

You can also run `Dotenv: Toggle auto-cloaking` from the Command Palette, or use the toggle
above a dotenv file, to show or hide its values.

### Auto-completion

Start typing `process.env.` (or a language-specific environment statement) to see
variables from your dotenv files.

<img src="https://res.cloudinary.com/dotenv-org/image/upload/v1664140944/autocomplete_snic6t.gif"/>

Supports JavaScript, TypeScript, Python, Ruby, Go, and more. See [Advanced](#advanced) for language details.

### In-code secret peeking

Hover your mouse over a `process.env.SECRET_KEY` or a `ENV["SECRET_KEY"]`, and you will be able to peek at its value without having to open your .env file. Convenient!

<img src="https://res.cloudinary.com/dotenv-org/image/upload/v1664141169/secret-peeking_byzwex.gif"/>

Works across the same languages as auto-completion.

&nbsp;

## Advanced

<details>
<summary>Supported languages and examples</summary>

Auto-completion and secret peeking support:

* JavaScript/TypeScript/NodeJS
* Ruby
* Python
* PHP
* Go
* Java
* .NET (C#, F#, Visual Basic)
* C/C++
* Julia
* Erlang
* Perl
* Swift
* Clojure
* Rust

#### .NET

Completion and hover support `Environment.GetEnvironmentVariable("NAME")` in C#,
F#, and Visual Basic, including `System.Environment` calls and the overload with
an `EnvironmentVariableTarget` argument. Type `(` or `"` in the first argument,
or request completion while typing a variable name. Hover over the name to peek
at its values from the dotenv files found for that source file.

```csharp
var secret = System.Environment.GetEnvironmentVariable("SECRET_KEY");
```

This displays `.env` values, not the running application's environment or Windows
registry values. It does not read `appsettings.json` or resolve `IConfiguration`.

#### Other language examples

Complete environment variable names and hover over them to see values from the
dotenv files found for the source file:

```c
const char *secret = getenv("SECRET_KEY");
```

C++ also supports `std::getenv("SECRET_KEY")` and `::getenv("SECRET_KEY")`.

```julia
secret = ENV["SECRET_KEY"]
secret = get(ENV, "SECRET_KEY", "fallback")
```

```erlang
Secret = os:getenv("SECRET_KEY").
Secret = os:getenv("SECRET_KEY", "fallback").
```

Erlang files must use the `erlang` language mode provided by an Erlang extension.

```perl
my $secret = $ENV{SECRET_KEY};
my $secret = $ENV{'SECRET_KEY'};
my $secret = $ENV{"SECRET_KEY"};
```

Perl suggestions preserve bare keys, single quotes, or double quotes.

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

Suggestions work inside quotes and while typing a name. Hover respects the secret
peeking setting. Values reflect `.env`, not the running process; Julia and Erlang defaults
are not evaluated when a key is missing.

</details>

<details>
<summary>Monorepos and file discovery</summary>

Completion and secret peeking look in the source file's directory and each parent
directory up to its workspace root. This supports nested apps and monorepos without
mixing in sibling projects or other workspace folders. Supported names include
`.env`, `.env.*`, `*.env`, and `.flaskenv`. Custom filenames such as `.dev.vars` work
when associated with the `dotenv` language through `files.associations`; open files
with Dotenv selected as their language work too.

Each key appears once in completion, with its source filenames. When files define
different values for the same key, completion details and hover show each value
with its filename, nearest directories first. The extension does not guess which
environment your application runs. Unsaved dotenv edits appear immediately, and
your project does not need to install the `dotenv` package.

</details>

<details>
<summary>Custom dotenv files</summary>

Use VS Code's `files.associations` setting to enable syntax highlighting, cloaking,
and the auto-cloaking toggle for custom filenames. For example, in your project's
`.vscode/settings.json`:

```json
{
  "files.associations": {
    ".dev.vars": "dotenv",
    "**/.env.d/*": "dotenv"
  }
}
```

In the native editor, cloaking follows the file’s language mode. Files associated
with Dotenv are also included in completion and secret-peeking discovery.

</details>

<details>
<summary>Editor behavior and cloaking</summary>

Autocomplete values start masked. Open a suggestion’s details and click **Reveal value**
to reveal only that source’s value in the popup; click **Hide value** to mask it again.
The suggestion row stays masked. This does not change the secret-peeking setting for hover.

Dotenv files open in a Monaco source editor: the same editor component used by VS
Code, with line numbers, multiple cursors, find/replace, folding, comments, and
normal text editing. Values are masked before the editor becomes visible and the
mask updates locally as you type. You can edit and copy while masked; copied text
contains the actual value. Toggle auto-cloaking to reveal values. Each view starts
masked and hides again when you switch tabs.

Edits update the underlying document. Use the usual save, undo, and redo shortcuts.
Font and basic editor settings follow VS Code. Custom theme token rules, arbitrary
user keybindings, and other extensions do not automatically carry into embedded
Monaco. The minimap and hover previews are disabled to avoid displaying values
outside the masked source lines. If a concurrent edit conflicts, your draft remains
in the view for copying instead of overwriting the other edit.

Use **Reopen Editor With → Text Editor** to use the native VS Code editor. Its
cloaking uses temporary decorations and can flash values during file opens or tab
switches. In that native view, the toggle is remembered in extension storage and
`dotenv.enableAutocloaking` controls cloaking.

On upgrade, the extension removes only the exact invisible TextMate rules inserted
by older versions from your global `editor.tokenColorCustomizations`. Other custom
rules are preserved. Once those legacy rules are removed, cloaking no longer writes
to your settings.

</details>

<details>
<summary>YAML cloaking</summary>

YAML uses the normal editor and masks values under `env_variables`, `environment`,
and `env`, including Docker maps and lists and Kubernetes `name`/`value` entries.
Quotes and comments stay visible. Values can briefly flash before masking on file
opens or tab switches; invalid YAML is parsed on a best-effort basis.

Customize section names with `dotenv.yamlSections` (replaces the defaults), or set
it to `[]` to disable YAML cloaking. YAML is not a source for completion or peeking.

```json
{
  "dotenv.yamlSections": ["env_variables", "environment", "env", "secrets"]
}
```

</details>

&nbsp;

## CHANGELOG

See [CHANGELOG](CHANGELOG.md)

&nbsp;

Thank you for using dotenv-vscode.
