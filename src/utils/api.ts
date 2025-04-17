import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getConfig } from './config.js';
import { RockFile, FileSaveRequest } from '../types/index.js';

/**
 * Creates an authenticated API client for Rock RMS
 * @returns {AxiosInstance} API client
 */
export function createApiClient(): AxiosInstance {
  const serverUrl = getConfig('serverUrl');
  const username = getConfig('username');
  const password = getConfig('password');

  if (!serverUrl) {
    throw new Error('Server URL not configured. Run "magnus config" first.');
  }

  const client = axios.create({
    baseURL: serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Configure basic authentication
  if (username && password) {
    // Basic authentication
    const encodedCredentials = Buffer.from(`${username}:${password}`).toString('base64');
    client.defaults.headers.common['Authorization'] = `Basic ${encodedCredentials}`;
  } else {
    throw new Error('Authentication not configured. Run "magnus config" first.');
  }

  // Add response interceptor for error handling
  client.interceptors.response.use(
    response => response,
    error => {
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Authentication failed. Please check your credentials.');
        }
        if (error.response.data && error.response.data.Message) {
          throw new Error(`Server error: ${error.response.data.Message}`);
        }
      }
      throw error;
    }
  );

  return client;
}

/**
 * Get file content from Rock RMS
 * @param {string} filePath - Path to the file on the server
 * @returns {Promise<string>} File content
 */
export async function getFileContent(filePath: string): Promise<string> {
  const client = createApiClient();
  const endpoint = `api/Files/GetContent?fileName=${encodeURIComponent(filePath)}`;
  const response: AxiosResponse<string> = await client.get(endpoint);
  return response.data;
}

/**
 * Update file content on Rock RMS
 * @param {string} filePath - Path to the file on the server
 * @param {string} content - New file content
 * @returns {Promise<void>}
 */
export async function updateFileContent(filePath: string, content: string): Promise<void> {
  const client = createApiClient();
  const endpoint = 'api/Files/SaveContent';
  const payload: FileSaveRequest = {
    fileName: filePath,
    content: content
  };
  await client.post(endpoint, payload);
}

/**
 * List available files on Rock RMS
 * @param {string} directoryPath - Path to the directory on the server
 * @returns {Promise<RockFile[]>} List of files
 */
export async function listFiles(directoryPath = '/'): Promise<RockFile[]> {
  const client = createApiClient();
  const endpoint = `api/Files/List?directory=${encodeURIComponent(directoryPath)}`;
  const response: AxiosResponse<RockFile[]> = await client.get(endpoint);
  return response.data;
} 