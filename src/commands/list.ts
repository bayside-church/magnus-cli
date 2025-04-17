import chalk from 'chalk';
import ora from 'ora';
import { listFiles as fetchFilesList } from '../utils/api.js';
import { isAuthenticated } from '../utils/config.js';
import { RockFile } from '../types/index.js';

/**
 * Format file size in a human-readable way
 * @param {number} size - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

/**
 * List files from Rock RMS
 * @param {string} directoryPath - Path to the directory on the server
 * @returns {Promise<void>}
 */
export async function listFiles(directoryPath = '/'): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated. Run "magnus config" first.');
  }

  const spinner = ora(`Listing files in ${directoryPath}...`).start();
  
  try {
    // Fetch files list from server
    const files = await fetchFilesList(directoryPath);
    spinner.succeed(`Found ${files.length} items in ${directoryPath}`);

    if (files.length === 0) {
      console.log(chalk.yellow('No files found in this directory.'));
      return;
    }

    // Sort files: directories first, then by name
    const sortedFiles = [...files].sort((a: RockFile, b: RockFile) => {
      if (a.IsDirectory !== b.IsDirectory) {
        return a.IsDirectory ? -1 : 1;
      }
      return a.Name.localeCompare(b.Name);
    });

    // Print directories
    sortedFiles.filter(file => file.IsDirectory).forEach(dir => {
      console.log(chalk.blue(`📁 ${dir.Name}/`));
    });

    // Print files
    sortedFiles.filter(file => !file.IsDirectory).forEach(file => {
      console.log(`📄 ${chalk.green(file.Name)} ${chalk.gray(`(${formatFileSize(file.Size)})`)}`);
    });
  } catch (error) {
    spinner.fail(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
} 