import fs from 'fs/promises';
import ora from 'ora';
import path from 'path';
import { getFileContent, listFiles } from '../utils/api.js';
import { isAuthenticated } from '../utils/config.js';
import { getCurrentDirectory } from './cd.js';

export async function pullPath(pullPath: string): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated. Run "magnus config" first.');
  }

  if (!pullPath) {
    const currentDirectory = await getCurrentDirectory();
    console.log(currentDirectory);
    const items = await listFiles(currentDirectory);

    for (const item of items) {
      if (item.IsFolder) {
        console.log(item.DisplayName);
      } else {
        pullFile(item.Uri);
      }
    }

    return;
  }
}

/**
 * Pull a file from Rock RMS and save it locally
 * @param {string} serverFilePath - Path to the file on the server
 * @param {string | undefined} outputPath - Local path to save the file (optional)
 * @returns {Promise<void>}
 */
export async function pullFile(serverFilePath: string, outputPath?: string): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated. Run "magnus config" first.');
  }

  const spinner = ora(`Pulling ${serverFilePath} from Rock RMS...`).start();

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
