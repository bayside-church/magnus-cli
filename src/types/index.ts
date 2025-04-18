/**
 * Configuration interface
 */
export interface Config {
  serverUrl: string;
  username: string;
  password: string;
  cookie: string;
}

/**
 * Rock RMS file interface
 */
export interface RockFile {
  DisplayName: string;
  Uri: string;
  IsFolder: boolean;
  Icon: string;
}

/**
 * Rock RMS API response interface
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}
