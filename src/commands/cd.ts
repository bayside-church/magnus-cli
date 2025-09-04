import chalk from 'chalk';
import fs from 'fs/promises';
import ora from 'ora';
import path from 'path';
import { RockFile } from '../types/index.js';
import { listFiles, MAGNUS_PATH } from '../utils/api.js';
import { isAuthenticated } from '../utils/config.js';

// Local configuration file name
const CONFIG_FILENAME = '.magnus';

/**
 * Find the best matching directory from available items
 * @param {string} searchPath - Path to search for
 * @param {RockFile[]} items - Available items to search through
 * @returns {RockFile | null} Best matching item or null
 */
function findBestMatch(searchPath: string, items: RockFile[]): RockFile | null {
  // Only consider directories for navigation
  const directories = items.filter((item) => item.IsFolder);

  if (directories.length === 0) {
    return null;
  }

  // First, try exact Uri match (case-insensitive)
  const exactUriMatch = directories.find(
    (dir) =>
      dir.Uri.toLowerCase() === searchPath.toLowerCase() ||
      dir.Uri.replace(MAGNUS_PATH, '').toLowerCase() === searchPath.toLowerCase()
  );

  if (exactUriMatch) {
    return exactUriMatch;
  }

  // If no exact Uri match, find best DisplayName match
  let bestMatch: RockFile | null = null;
  let bestScore = 0;

  for (const dir of directories) {
    const displayName = dir.DisplayName.toLowerCase();
    const search = searchPath.toLowerCase();

    // Calculate similarity score
    let score = 0;

    // Exact match gets highest score
    if (displayName === search) {
      score = 1000;
    }
    // Starts with search term gets high score
    else if (displayName.startsWith(search)) {
      score = 500 + (search.length / displayName.length) * 100;
    }
    // Contains search term gets medium score
    else if (displayName.includes(search)) {
      score = 200 + (search.length / displayName.length) * 50;
    }
    // Partial word matches get lower score
    else {
      const searchWords = search.split(/\s+/);
      const displayWords = displayName.split(/\s+/);

      for (const searchWord of searchWords) {
        for (const displayWord of displayWords) {
          if (displayWord.includes(searchWord)) {
            score += 50 * (searchWord.length / displayWord.length);
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = dir;
    }
  }

  return bestMatch;
}

/**
 * Change the current working directory and save it to a local config file
 * @param {string} directoryPath - Path to change to
 * @returns {Promise<void>}
 */
export async function changeDirectory(directoryPath: string): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated. Run "magnus config" first.');
  }

  const spinner = ora(`Looking for directory: ${directoryPath}...`).start();

  try {
    // Get current directory to search within
    const currentDir = await getCurrentDirectory();

    // Get items in current directory to find matches
    const currentItems = await listFiles(currentDir);

    // Find the best matching directory
    const matchedDir = findBestMatch(directoryPath, currentItems);

    if (!matchedDir) {
      // If no match found in current directory, try the original behavior
      spinner.text = `No match found in current directory. Trying direct path: ${directoryPath}...`;
      const items = await listFiles(directoryPath);

      if (items.length === 0) {
        spinner.warn(`Directory appears to be empty or doesn't exist: ${directoryPath}`);
      }

      await saveCurrentDirectory(directoryPath);
      spinner.succeed(`Current directory changed to: ${directoryPath}`);
      await displayDirectoryContents(directoryPath, items);
      return;
    }

    // Use the matched directory's Uri for navigation
    const targetPath = matchedDir.Uri.replace(MAGNUS_PATH, '') || matchedDir.Uri;

    if (matchedDir.DisplayName !== directoryPath) {
      spinner.text = `Found match: "${matchedDir.DisplayName}" for "${directoryPath}"...`;
    }

    // Verify the matched directory exists and get its contents
    const items = await listFiles(targetPath);

    // Save the directory to the local config file
    await saveCurrentDirectory(targetPath);

    const message =
      matchedDir.DisplayName !== directoryPath
        ? `Current directory changed to: ${targetPath} (matched "${matchedDir.DisplayName}")`
        : `Current directory changed to: ${targetPath}`;

    spinner.succeed(message);

    // Display the contents of the directory
    await displayDirectoryContents(targetPath, items);
  } catch (error) {
    spinner.fail(
      `Failed to change directory: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

/**
 * Display the contents of a directory
 * @param {string} directoryPath - Path of the directory
 * @param {RockFile[]} items - Items in the directory
 */
async function displayDirectoryContents(directoryPath: string, items: RockFile[]): Promise<void> {
  console.log(chalk.cyan(`\nContents of ${directoryPath}:`));

  if (items.length === 0) {
    console.log(chalk.yellow('  Directory is empty.'));
  } else {
    // Display directories first
    const dirs = items.filter((item) => item.IsFolder);
    if (dirs.length > 0) {
      console.log(chalk.blue('\n  Directories:'));
      dirs.forEach((dir) => {
        console.log(
          chalk.blue(
            `  📁 ${dir.Uri.replace(MAGNUS_PATH, '')} ${chalk.gray(`(${dir.DisplayName})`)}`
          )
        );
      });
    }

    // Then display files
    const files = items.filter((item) => !item.IsFolder);
    if (files.length > 0) {
      console.log(chalk.green('\n  Files:'));
      files.forEach((file) => {
        console.log(chalk.green(`  📄 ${file.Uri} ${chalk.gray(`(${file.DisplayName})`)}`));
      });
    }
  }
}

/**
 * Save the current directory to the local config file
 * @param {string} directoryPath - Directory path to save
 * @returns {Promise<void>}
 */
async function saveCurrentDirectory(directoryPath: string): Promise<void> {
  try {
    const configPath = path.join(process.cwd(), CONFIG_FILENAME);

    // Check if config file exists and read it if it does
    let config: Record<string, string> = {};
    try {
      const configContents = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configContents);
    } catch (error) {
      // If file doesn't exist or can't be parsed, use empty config
      config = {};
    }

    // Update the current directory in the config
    config.currentDirectory = directoryPath;

    // Write the updated config back to the file
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    throw new Error(
      `Failed to save current directory: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get the current directory from the local config file
 * @returns {Promise<string>} The current directory path or '/' if not set
 */
export async function getCurrentDirectory(): Promise<string> {
  try {
    const configPath = path.join(process.cwd(), CONFIG_FILENAME);

    // Check if config file exists and read it if it does
    try {
      const configContents = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContents);
      return config.currentDirectory || 'root';
    } catch (error) {
      // If file doesn't exist or can't be parsed, return default
      return 'root';
    }
  } catch (error) {
    return 'root';
  }
}
