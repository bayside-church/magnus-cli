import chalk from 'chalk';
import fs from 'fs/promises';
import ora from 'ora';
import path from 'path';
import { listFiles } from '../utils/api.js';
import { isAuthenticated } from '../utils/config.js';

// Local configuration file name
const CONFIG_FILENAME = '.magnus';

/**
 * Change the current working directory and save it to a local config file
 * @param {string} directoryPath - Path to change to
 * @returns {Promise<void>}
 */
export async function changeDirectory(directoryPath: string): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated. Run "magnus config" first.');
  }

  const spinner = ora(`Changing to directory: ${directoryPath}...`).start();

  try {
    // Verify the directory exists on the remote server
    const items = await listFiles(directoryPath);

    // If the response is empty or doesn't contain directories, we'll still allow it
    // but we'll warn the user
    if (items.length === 0) {
      spinner.warn(`Directory appears to be empty or doesn't exist: ${directoryPath}`);
    }

    // Save the directory to the local config file
    await saveCurrentDirectory(directoryPath);

    spinner.succeed(`Current directory changed to: ${directoryPath}`);

    // Display the contents of the directory
    console.log(chalk.cyan(`\nContents of ${directoryPath}:`));

    if (items.length === 0) {
      console.log(chalk.yellow('  Directory is empty.'));
    } else {
      // Display directories first
      const dirs = items.filter((item) => item.IsFolder);
      if (dirs.length > 0) {
        console.log(chalk.blue('\n  Directories:'));
        dirs.forEach((dir) => {
          console.log(chalk.blue(`  📁 ${dir.DisplayName}`));
        });
      }

      // Then display files
      const files = items.filter((item) => !item.IsFolder);
      if (files.length > 0) {
        console.log(chalk.green('\n  Files:'));
        files.forEach((file) => {
          console.log(chalk.green(`  📄 ${file.DisplayName}`));
        });
      }
    }
  } catch (error) {
    spinner.fail(
      `Failed to change directory: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
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
    let config: Record<string, any> = {};
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
