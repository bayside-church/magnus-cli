#!/usr/bin/env node

import chalk from 'chalk';
import { program } from 'commander';
import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { changeDirectory, getCurrentDirectory } from './commands/cd.js';
import { listFiles } from './commands/list.js';
import { pullPath } from './commands/pull.js';
import { getConfig, setConfig } from './utils/config.js';

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
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'serverUrl',
        message: 'Rock RMS server URL:',
        default: getConfig('serverUrl') || 'https://rock.example.org',
      },
      {
        type: 'input',
        name: 'username',
        message: 'Username:',
        default: getConfig('username') || '',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
      },
    ]);

    // Process answers and set configuration values
    if (answers.serverUrl) {
      setConfig('serverUrl', answers.serverUrl);
    }
    if (answers.username) {
      setConfig('username', answers.username);
    }
    if (answers.password) {
      setConfig('password', answers.password);
    }

    console.log(chalk.green('Configuration saved successfully.'));
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
