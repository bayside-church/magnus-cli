/**
 * Configuration interface
 */
export interface Config {
  serverUrl: string;
  username: string;
  password: string;
}

/**
 * Rock RMS file interface
 */
export interface RockFile {
  Name: string;
  Size: number;
  IsDirectory: boolean;
  ModifiedDateTime: string;
}

/**
 * Rock RMS API response interface
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * File save request interface
 */
export interface FileSaveRequest {
  fileName: string;
  content: string;
} 