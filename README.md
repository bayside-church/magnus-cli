# Magnus CLI

A command-line tool to pull and push source code files from a Rock RMS server, built with TypeScript.

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

### List items from Rock RMS

List files and directories on the Rock RMS server:

```bash
magnus list
```

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

### Push a file to Rock RMS

Push a local file to the Rock RMS server:

```bash
magnus push "./local/theme.scss"
```

Specify a target path on the server (optional):

```bash
magnus push "./local/theme.scss" -t "~/Themes/MyTheme/Styles/theme.scss"
```

## License

MIT 