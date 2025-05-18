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

Pull a file or directory contents from the Rock RMS server to your local machine:

```bash
magnus pull "~/Themes/MyTheme/Styles/theme.scss"
```

When run without a path argument, the pull command uses your current directory (set with `cd`):

```bash
magnus pull
```

Specify an output path (optional):

```bash
magnus pull "~/Themes/MyTheme/Styles/theme.scss" -o "./local/theme.scss"
```

Special handling for application endpoints:

- When pulling from `/lavaapplication/application-endpoints/`, the command will:
- Automatically create directories for each endpoint
- Name files based on the endpoint name (converted to kebab-case)
- Include all files within each endpoint folder

For example:

```bash
magnus pull "/lavaapplication/application-endpoints/My Custom Endpoint"
# Creates: my-custom-endpoint.lava
```

Notes:

- If no output path is specified, files are saved in the current directory
- Directory structure is automatically created if it doesn't exist
- Folders outside of application endpoints are not currently supported for recursive pulling

## License

MIT
