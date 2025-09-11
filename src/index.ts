#!/usr/bin/env node

import chalk from 'chalk';
import { program } from 'commander';
import dotenv from 'dotenv';
import { changeDirectory, getCurrentDirectory } from './commands/cd.js';
import { listFiles } from './commands/list.js';
import { pullPath } from './commands/pull.js';
import { runConfig } from './utils/config.js';

dotenv.config();

const VERSION = '1.0.0';

program
  .name('magnus')
  .description('Command line tool to pull source code files from a Rock RMS server')
  .version(VERSION);

program
  .command('config')
  .description('Configure Rock RMS server connection')
  .action(async () => {
    await runConfig();
  });

program
  .command('cd [directoryPath]')
  .description('Change current directory on the Rock RMS server')
  .action(async (directoryPath = 'root') => {
    try {
      await changeDirectory(directoryPath);
    } catch (error) {
      console.error(
        chalk.red(
          `Error changing directory: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

program
  .command('ls [directoryPath]')
  .description('List available items on Rock RMS server')
  .action(async (directoryPath) => {
    try {
      // If no directoryPath is provided, use the current directory from the local config
      if (!directoryPath) {
        directoryPath = await getCurrentDirectory();
      }
      await listFiles(directoryPath);
    } catch (error) {
      console.error(
        chalk.red(`Error listing items: ${error instanceof Error ? error.message : String(error)}`)
      );
      process.exit(1);
    }
  });

program
  .command('pull [path]')
  .description('Pull a file or directory from Rock RMS server to the current directory')
  .action(async (path) => {
    try {
      await pullPath(path);
      console.log(chalk.green('Pull Done 🚀'));
    } catch (error) {
      console.error(
        chalk.red(`Error pulling file: ${error instanceof Error ? error.message : String(error)}`)
      );
      process.exit(1);
    }
  });

program.parse(process.argv);
