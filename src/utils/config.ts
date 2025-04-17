import Conf from 'conf';
import { Config } from '../types/index.js';

// Create a new instance of Conf
const config = new Conf({
  projectName: 'magnus-cli',
  defaults: {
    serverUrl: '',
    username: '',
    password: ''
  }
}) as Conf<Config>;

/**
 * Get a configuration value
 * @param {keyof Config} key - Configuration key
 * @returns {any} Configuration value
 */
export function getConfig<K extends keyof Config>(key: K): Config[K] {
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
  const serverUrl = config.get('serverUrl');
  const username = config.get('username');
  const password = config.get('password');
  
  return Boolean(serverUrl && username && password);
}

// Return type for getAllConfig
interface ConfigSummary {
  serverUrl: string;
  username: string;
  hasPassword: boolean;
}

/**
 * Get all configuration
 * @returns {ConfigSummary} Configuration summary
 */
export function getAllConfig(): ConfigSummary {
  return {
    serverUrl: config.get('serverUrl'),
    username: config.get('username'),
    hasPassword: Boolean(config.get('password'))
  };
} 