import chalk from 'chalk';
import fs from 'fs/promises';
import ora, { Ora } from 'ora';
import path from 'path';
import { getFileContent, listFiles } from '../utils/api.js';
import { isAuthenticated, runConfig } from '../utils/config.js';
import { getCurrentDirectory } from './cd.js';

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
  if (pullPath.startsWith('/lavaapplication/application-endpoints/')) {
    await pullEndpoint(pullPath, spinner);
  } else {
    const items = await listFiles(pullPath);
    if (items.length === 0) {
      spinner.succeed('No items found');
      return;
    }
    for (const item of items) {
      if (item.IsFolder) {
        console.log(`Folder pull is not supported yet: ${item.DisplayName}`);
      } else {
        await pullFile(item.Uri, spinner);
      }
    }
    spinner.stop();
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
