import { spawnSync } from 'child_process';

export interface GitLogOptions {
  since?: string;
  until?: string;
  author?: string;
}

export interface CommitInfo {
  hash: string;
  date: string;
  author: string;
  message: string;
}

export interface GitStats {
  insertions: number;
  deletions: number;
}

export interface GitLogResult {
  commits: CommitInfo[];
  stats: GitStats;
  rawLog: string;
}

export function getGitLog(options: GitLogOptions = {}): GitLogResult {
  const since = options.since || 'midnight';
  const until = options.until || 'now';

  const args: string[] = [
    'log',
    `--since=${since}`,
    `--until=${until}`,
    '--pretty=format:%h|%ai|%an|%s',
  ];

  if (options.author) {
    args.push(`--author=${options.author}`);
  }

  let rawLog = '';
  let commits: CommitInfo[] = [];

  try {
    const result = spawnSync('git', args, { encoding: 'utf-8' });
    rawLog = (result.stdout || '').trim();

    if (rawLog) {
      commits = rawLog.split('\n').map(line => {
        const [hash, date, author, ...messageParts] = line.split('|');
        return {
          hash,
          date,
          author,
          message: messageParts.join('|'),
        };
      });
    }
  } catch {
    // No commits found or not a git repository
  }

  const stats = getGitStats(options);

  return { commits, stats, rawLog };
}

function getGitStats(options: GitLogOptions): GitStats {
  const since = options.since || 'midnight';
  const until = options.until || 'now';

  const args: string[] = [
    'log',
    `--since=${since}`,
    `--until=${until}`,
    '--numstat',
    '--pretty=format:',
  ];

  if (options.author) {
    args.push(`--author=${options.author}`);
  }

  let insertions = 0;
  let deletions = 0;

  try {
    const result = spawnSync('git', args, { encoding: 'utf-8' });
    const output = result.stdout || '';

    for (const line of output.split('\n')) {
      const match = line.match(/^(\d+)\s+(\d+)\s+/);
      if (match) {
        insertions += parseInt(match[1], 10);
        deletions += parseInt(match[2], 10);
      }
    }
  } catch {
    // No stats found
  }

  return { insertions, deletions };
}

export function isGitRepository(): boolean {
  const result = spawnSync('git', ['rev-parse', '--git-dir'], { encoding: 'utf-8', stdio: 'pipe' });
  return result.status === 0;
}

export function getRepositoryName(): string {
  const remoteResult = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf-8', stdio: 'pipe' });
  if (remoteResult.status === 0 && remoteResult.stdout) {
    const remoteUrl = remoteResult.stdout.trim();
    const match = remoteUrl.match(/\/([^/]+?)(?:\.git)?$/);
    if (match) return match[1];
  }

  const dirResult = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf-8', stdio: 'pipe' });
  if (dirResult.status === 0 && dirResult.stdout) {
    return dirResult.stdout.trim().split('/').pop() || 'unknown';
  }

  return 'unknown';
}
