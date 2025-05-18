# Magnus CLI

A command-line tool to pull source code files from a Rock RMS server.

Like the [VSCode Magnus plugin](https://www.triumph.tech/magnus), but for the command like.

## Prerequisites

This tool uses the same connection endpoints as the VSCode Magnus plugin, so make its setup and working using [the Magnus instructions](https://marketplace.visualstudio.com/items?itemName=TriumphTech.magnus).

## Usage

### Configuration

Before using the CLI, you need to configure your Rock RMS server connection:

```bash
npx magnus-cli config
```

You will be prompted to enter:

- Rock RMS server URL
- Username
- Password

### Change Directory

Navigate through directories on the Rock RMS server and set your current working directory:

```bash
npx magnus-cli cd /Themes
```

This command:

1. Changes your current directory on the server
2. Stores the path in a local `.magnus` file in your current directory
3. Lists the contents of the directory

The stored directory is used as the default for the `list` command when no path is specified.

### List items from Rock RMS

List files and directories on the Rock RMS server:

```bash
❯ npx magnus-cli list

✔ Found 6 items in root
📁 /appletvapps/ Apple TV Apps
📁 /lavaapplication/ Helix
📁 /shortcodes/ Lava Shortcodes
📁 /mobileapps/ Mobile Apps
📁 /serverfs/ Server Filesystem
📁 /websites/ Websites
```

### Change Endpoint/Directory

Change the directory on the Rock RMS server:

```bash
npx magnus-cli cd /lavaapplication/
```

### Pull a directory from Rock RMS

Once you `cd` into your target directory you can pull the contents from the Rock RMS server to your local machine:

```bash
npx magnus-cli pull
```

Special handling for application endpoints:

- When pulling from `/lavaapplication/application-endpoints/`, the command will:
- Automatically create directories for each endpoint
- Name files based on the endpoint name (converted to kebab-case)
- Include all files within each endpoint folder

Notes:

- If no output path is specified, files are saved in the current directory
- Directory structure is automatically created if it doesn't exist
- Folders outside of application endpoints are not currently supported for recursive pulling

## Development

### Setup

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

### Code

```bash
# Watch for changes and rebuild
pnpm dev

# Run linter
pnpm lint
```
