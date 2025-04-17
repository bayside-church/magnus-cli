import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { updateFileContent } from '../utils/api.js';
import { isAuthenticated } from '../utils/config.js';

/**
 * Push a local file to Rock RMS
 * @param {string} localFilePath - Path to the local file
 * @param {string | undefined} targetPath - Path on the server to save the file (optional)
 * @returns {Promise<void>}
 */
export async function pushFile(localFilePath: string, targetPath?: string): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated. Run "magnus config" first.');
  }

  const spinner = ora(`Pushing ${localFilePath} to Rock RMS...`).start();
  
  try {
    // Make sure the file exists
    await fs.access(localFilePath);
    
    // Read file content
    const content = await fs.readFile(localFilePath, 'utf8');
    
    // Determine target path on server
    const finalTargetPath = targetPath || path.basename(localFilePath);
    
    // Push file to server
    await updateFileContent(finalTargetPath, content);
    
    spinner.succeed(`File pushed successfully to ${finalTargetPath}`);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      spinner.fail(`File not found: ${localFilePath}`);
      throw new Error(`File not found: ${localFilePath}`);
    }
    spinner.fail(`Failed to push file: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
} 