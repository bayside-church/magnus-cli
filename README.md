# Magnus CLI

A command-line tool to pull source code files from a Rock RMS server, built with TypeScript.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/magnus-cli.git
cd magnus-cli

# Install dependencies
pnpm install

# Build the project
pnpm build

# Link the CLI globally (optional)
pnpm link --global
```

## Development

```bash
# Watch for changes and rebuild
pnpm dev

# Run linter
pnpm lint
```

## Usage

### Configuration

Before using the CLI, you need to configure your Rock RMS server connection:

```bash
magnus config
```

You will be prompted to enter:

- Rock RMS server URL
- Username
- Password

### Change Directory

Navigate through directories on the Rock RMS server and set your current working directory:

```bash
magnus cd /Themes
```

This command:

1. Changes your current directory on the server
2. Stores the path in a local `.magnus` file in your current directory
3. Lists the contents of the directory

The stored directory is used as the default for the `list` command when no path is specified.

### List items from Rock RMS

List files and directories on the Rock RMS server:

```bash
magnus list
```

When run without an argument, the list command uses your current directory (set with `cd`).

Specify a specific directory to list:

```bash
magnus list "~/Themes/MyTheme/Styles"
```

### Pull a file from Rock RMS

Pull a file from the Rock RMS server to your local machine:

```bash
magnus pull "~/Themes/MyTheme/Styles/theme.scss"
```

Specify an output path (optional):

```bash
magnus pull "~/Themes/MyTheme/Styles/theme.scss" -o "./local/theme.scss"
```

## License

MIT
