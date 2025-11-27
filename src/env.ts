import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';

export interface Config {
  geminiApiKey: string | null;
}

const CONFIG_DIR = path.join(os.homedir(), '.git-nippo');
const ENV_FILE = path.join(CONFIG_DIR, '.env');

export function loadConfig(): Config {
  if (fs.existsSync(ENV_FILE)) {
    dotenv.config({ path: ENV_FILE });
  }

  return {
    geminiApiKey: process.env.GEMINI_API_KEY || null,
  };
}

export function getConfigPath(): string {
  return ENV_FILE;
}
