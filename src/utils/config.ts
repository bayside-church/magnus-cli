import chalk from 'chalk';
import Conf from 'conf';
import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { Config } from '../types/index.js';

dotenv.config();

// Conf uses the following paths:
// macOS: ~/Library/Preferences/magnus-cli-nodejs
// Windows: %APPDATA%\magnus-cli-nodejs\Config (for example, C:\Users\USERNAME\AppData\Roaming\magnus-cli-nodejs\Config)
// Linux: ~/.config/magnus-cli-nodejs (or $XDG_CONFIG_HOME/magnus-cli-nodejs)

// Create a new instance of Conf
const config = new Conf({
  projectName: 'magnus-cli',
  defaults: {
    serverUrl: '',
    username: '',
    password: '',
    cookie: '',
    token: '',
  },
}) as Conf<Config>;

/**
 * Get a configuration value
 * @param {keyof Config} key - Configuration key
 * @returns {any} Configuration value
 */
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  // Check if the key exists in environment variables first
  const envKey = `MAGNUS_${key.toUpperCase()}`;
  if (process.env[envKey] !== undefined) {
    return process.env[envKey] as Config[K];
  }
  return config.get(key);
}

/**
 * Set a configuration value
 * @param {keyof Config} key - Configuration key
 * @param {Config[K]} value - Configuration value
 */
export function setConfig<K extends keyof Config>(key: K, value: Config[K]): void {
  config.set(key, value);
}

/**
 * Check if the user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated(): boolean {
  const serverUrl = getConfig('serverUrl');
  const username = getConfig('username');
  const password = getConfig('password');
  const token = getConfig('token');

  return Boolean(serverUrl && ((username && password) || token));
}

/**
 * Run the configuration setup interactively
 * @returns {Promise<void>}
 */
export async function runConfig(): Promise<void> {
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
}
