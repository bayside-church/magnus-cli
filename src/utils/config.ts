import Conf from 'conf';
import dotenv from 'dotenv';
import { Config } from '../types/index.js';

dotenv.config();

// Conf uses the following paths:
// macOS: ~/Library/Preferences/MyApp-nodejs
// Windows: %APPDATA%\MyApp-nodejs\Config (for example, C:\Users\USERNAME\AppData\Roaming\MyApp-nodejs\Config)
// Linux: ~/.config/MyApp-nodejs (or $XDG_CONFIG_HOME/MyApp-nodejs)

// Create a new instance of Conf
const config = new Conf({
  projectName: 'magnus-cli',
  defaults: {
    serverUrl: '',
    username: '',
    password: '',
    cookie: '',
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

  return Boolean(serverUrl && username && password);
}
