import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { RockFile } from '../types/index.js';
import { getConfig, setConfig } from './config.js';

/**
 * Creates an authenticated API client for Rock RMS
 * @returns {AxiosInstance} API client
 */
export async function createApiClient(): Promise<AxiosInstance> {
  const serverUrl = getConfig('serverUrl');

  if (!serverUrl) {
    throw new Error('Server URL not configured. Run "magnus config" first.');
  }

  const cookie = await getAuthorizationCookie(serverUrl);
  if (cookie === null) {
    throw new Error('Unable to authorize with the server.');
  }

  const client = axios.create({
    baseURL: serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
  });

  return client;
}

/**
 * Get file content from Rock RMS
 * @param {string} filePath - Path to the file on the server
 * @returns {Promise<string>} File content
 */
export async function getFileContent(filePath: string): Promise<string> {
  const client = await createApiClient();
  const endpoint = `api/Files/GetContent?fileName=${encodeURIComponent(filePath)}`;
  const response: AxiosResponse<string> = await client.get(endpoint);
  return response.data;
}

/**
 * List available files on Rock RMS
 * @param {string} directoryPath - Path to the directory on the server
 * @returns {Promise<RockFile[]>} List of files
 */
export async function listFiles(directoryPath = '/'): Promise<RockFile[]> {
  const client = await createApiClient();
  const endpoint = `api/TriumphTech/Magnus/GetTreeItems/root${encodeURIComponent(directoryPath)}`;
  const response: AxiosResponse<RockFile[]> = await client.get(endpoint);
  return response.data;
}

async function getAuthorizationCookie(serverUrl: string) {
  const cookie = getConfig('cookie');
  if (!cookie) {
    return login(serverUrl);
  }
  return cookie;
}

async function login(serverUrl: string) {
  try {
    const username = getConfig('username');
    const password = getConfig('password');
    const url = `${serverUrl}/api/Auth/Login`;

    const response = await axios.request({
      method: 'post',
      maxBodyLength: Infinity,
      url,
      data: JSON.stringify({
        username,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status !== 200 && response.status !== 204) {
      return null;
    }

    if (!response.headers['set-cookie']) {
      return null;
    }

    const rockCookie = response.headers['set-cookie'].find((c) => c.startsWith('.ROCK='));

    if (!rockCookie) {
      return null;
    }

    const cookie = rockCookie.split(';')[0];
    setConfig('cookie', cookie);
    return cookie;
  } catch (error) {
    console.error('login error', error);
    return null;
  }
}
