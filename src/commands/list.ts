import chalk from 'chalk';
import ora from 'ora';
import { RockFile } from '../types/index.js';
import { listFiles as fetchFilesList, MAGNUS_PATH } from '../utils/api.js';
import { isAuthenticated } from '../utils/config.js';

/**
 * List items from Rock RMS
 * @param {string} directoryPath - Path to the directory on the server
 * @returns {Promise<void>}
 */
export async function listFiles(directoryPath: string): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated. Run "magnus config" first.');
  }

  const spinner = ora(`Listing items in ${directoryPath}...`).start();

  try {
    // Fetch files list from server
    const items = await fetchFilesList(directoryPath);
    spinner.succeed(`Found ${items.length} items in ${directoryPath}`);

    if (items.length === 0) {
      console.log(chalk.yellow('No items found in this directory.'));
      return;
    }

    // Sort items: directories first, then by name
    const sortedItems = [...items].sort((a: RockFile, b: RockFile) => {
      if (a.IsFolder !== b.IsFolder) {
        return a.IsFolder ? -1 : 1;
      }
      return a.DisplayName.localeCompare(b.DisplayName);
    });

    // Print directories
    const directories = sortedItems.filter((item) => item.IsFolder);
    if (directories.length > 0) {
      directories.forEach((dir) => {
        console.log(chalk.blue(`📁 ${dir.Uri.replace(MAGNUS_PATH, '')}`));
      });
    }

    // Print files
    const files = sortedItems.filter((item) => !item.IsFolder);
    if (files.length > 0) {
      console.log(chalk.green('\nFiles:'));
      files.forEach((file) => {
        console.log(`📄 ${chalk.green(file.Uri.replace(MAGNUS_PATH, ''))}`);
      });
    }
  } catch (error) {
    spinner.fail(`Failed to list items: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
