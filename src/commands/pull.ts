import chalk from 'chalk';
import fs from 'fs/promises';
import ora, { Ora } from 'ora';
import path from 'path';
import { getFileContent, listFiles } from '../utils/api.js';
import { isAuthenticated, runConfig } from '../utils/config.js';
import { changeDirectory, getCurrentDirectory } from './cd.js';

async function pullEndpoint(pullPath: string, spinner: Ora): Promise<void> {
  const items = await listFiles(pullPath);
  for (const item of items) {
    if (item.IsFolder) {
      const endpointName = item.DisplayName.toLocaleLowerCase()
        .replace(/\s+/g, '-')
        .replace(/\[|\]/g, '');
      const files = await listFiles(item.Uri);
      for (const file of files) {
        const extension = path.extname(file.Uri);
        const fileName = `${endpointName}${extension}`;
        await pullFile(file.Uri, spinner, fileName);
      }
    }
  }
}

export async function pullPath(pullPath: string): Promise<void> {
  if (!isAuthenticated()) {
    console.log(chalk.yellow('Not authenticated. Running configuration setup...'));
    await runConfig();
    // Check again after configuration
    if (!isAuthenticated()) {
      throw new Error('Authentication failed. Please check your credentials.');
    }
  }

  if (!pullPath) {
    pullPath = await getCurrentDirectory();
  }

  const spinner = ora(`Pulling ${pullPath}...\n`).start();
  if (
    pullPath.startsWith('/lavaapplication/application-endpoints/') ||
    pullPath.startsWith(
      '/api/TriumphTech/Magnus/GetTreeItems/lavaapplication/application-endpoints/'
    )
  ) {
    await pullEndpoint(pullPath, spinner);
  } else {
    const items = await listFiles(pullPath);
    if (items.length === 0) {
      spinner.succeed('No items found');
      return;
    }
    for (const item of items) {
      try {
        if (item.IsFolder) {
          await pullFolder(item, spinner);
        } else {
          await pullFile(item.Uri, spinner);
        }
      } catch (error) {
        // Log the error but continue with other items
        console.error(
          chalk.red(
            `Error processing ${item.IsFolder ? 'folder' : 'file'} "${item.DisplayName}": ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        );
        // Continue with the next item instead of stopping the entire process
      }
    }
    spinner.stop();
  }
}

/**
 * Check if an error is permission-related
 * @param {unknown} error - Error to check
 * @returns {boolean} True if the error is permission-related
 */
function isPermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const code = (error as NodeJS.ErrnoException).code;

  // Check for common permission error codes and messages
  return (
    // File system permission errors
    code === 'EACCES' ||
    code === 'EPERM' ||
    message.includes('permission denied') ||
    message.includes('access denied') ||
    message.includes('eacces') ||
    message.includes('eperm') ||
    // HTTP permission errors
    message.includes('status code 403') ||
    message.includes('403') ||
    message.includes('forbidden') ||
    message.includes('unauthorized') ||
    message.includes('status code 401')
  );
}

/**
 * Pull a folder from Rock RMS and set up local directory structure
 * @param {import('../types/index.js').RockFile} item - Folder item from Rock RMS
 * @param {Ora} spinner - Ora spinner
 * @returns {Promise<void>}
 */
async function pullFolder(item: import('../types/index.js').RockFile, spinner: Ora): Promise<void> {
  // Step 1: Extract folder name from DisplayName (beginning non-whitespace part)
  // Special cases that should use the whole display name
  const specialFolderNames = ['Lava Application Content', 'Application Rigging'];
  const displayName = item.DisplayName.trim();

  let folderName: string;
  if (specialFolderNames.includes(displayName)) {
    folderName = displayName;
  } else {
    folderName = displayName.split(/\s+/)[0];
  }

  try {
    if (!folderName) {
      spinner.warn(`Skipping folder with empty name: ${item.DisplayName}`);
      return;
    }

    spinner.text = `Processing folder: ${folderName}`;

    // Step 2: Check if folder exists, create if it doesn't
    const folderPath = path.resolve(process.cwd(), folderName);

    try {
      await fs.access(folderPath);
      spinner.text = `Folder ${folderName} already exists`;
    } catch (accessError) {
      try {
        await fs.mkdir(folderPath, { recursive: true });
        spinner.text = `Created folder: ${folderName}`;
      } catch (mkdirError) {
        if (isPermissionError(mkdirError)) {
          spinner.warn(`Permission denied creating folder ${folderName}. Skipping...`);
          return; // Skip this folder and continue with others
        }
        throw mkdirError; // Re-throw non-permission errors
      }
    }

    // Step 3: Execute shell cd into the folder and run magnus commands
    const originalCwd = process.cwd();
    let changedDirectory = false;

    try {
      // Change to the folder directory
      try {
        process.chdir(folderPath);
        changedDirectory = true;
      } catch (chdirError) {
        if (isPermissionError(chdirError)) {
          spinner.warn(`Permission denied accessing folder ${folderName}. Skipping...`);
          return; // Skip this folder and continue with others
        }
        throw chdirError; // Re-throw non-permission errors
      }

      // Step 4: Run magnus cd command with the directory name
      try {
        spinner.text = `Running magnus cd ${folderName}...`;
        console.log(`Running magnus cd ${folderName}...`);
        await changeDirectory(item.Uri);
      } catch (cdError) {
        if (isPermissionError(cdError)) {
          spinner.warn(`Permission denied during magnus cd for ${folderName}. Skipping...`);
          return; // Skip this folder and continue with others
        }
        throw cdError; // Re-throw non-permission errors
      }

      // Step 5: Run magnus pull command in the folder
      try {
        spinner.text = `Running magnus pull in ${folderName}...`;
        await pullPath(item.Uri);
        spinner.succeed(`Successfully pulled folder: ${folderName}`);
      } catch (pullError) {
        if (isPermissionError(pullError)) {
          spinner.warn(`Permission denied during pull for ${folderName}. Skipping...`);
          return; // Skip this folder and continue with others
        }
        throw pullError; // Re-throw non-permission errors
      }
    } finally {
      // Always restore original working directory if we changed it
      if (changedDirectory) {
        try {
          process.chdir(originalCwd);
        } catch (restoreError) {
          console.error(
            chalk.red(
              `Warning: Failed to restore original directory: ${
                restoreError instanceof Error ? restoreError.message : String(restoreError)
              }`
            )
          );
        }
      }
    }
  } catch (error) {
    // Handle any other unexpected errors
    if (isPermissionError(error)) {
      spinner.warn(`Permission denied for folder ${folderName}. Skipping...`);
      return; // Skip this folder and continue with others
    }

    spinner.fail(
      `Failed to pull folder ${item.DisplayName}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

/**
 * Pull a file from Rock RMS and save it locally
 * @param {string} serverFilePath - Path to the file on the server
 * @param {Ora} spinner - Ora spinner
 * @param {string | undefined} outputPath - Local path to save the file (optional)
 * @returns {Promise<void>}
 */
export async function pullFile(
  serverFilePath: string,
  spinner: Ora,
  outputPath?: string
): Promise<void> {
  if (!isAuthenticated()) {
    spinner.stop();
    console.log(chalk.yellow('Not authenticated. Running configuration setup...'));
    await runConfig();
    // Check again after configuration
    if (!isAuthenticated()) {
      throw new Error('Authentication failed. Please check your credentials.');
    }
    // Restart the spinner
    spinner.start();
  }

  try {
    // Get file content from server
    const content = await getFileContent(serverFilePath);

    // Determine output path
    const finalOutputPath = outputPath || path.basename(serverFilePath);

    // Create directory if it doesn't exist
    const directory = path.dirname(finalOutputPath);
    if (directory !== '.') {
      await fs.mkdir(directory, { recursive: true });
    }

    // Write file
    await fs.writeFile(finalOutputPath, content);

    spinner.succeed(`File pulled successfully to ${finalOutputPath}`);
  } catch (error) {
    spinner.fail(`Failed to pull file: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
