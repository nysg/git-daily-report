import { GitLogResult } from './git';

export function formatAsMarkdown(result: GitLogResult, repoName: string): string {
  const today = new Date().toISOString().split('T')[0];
  const lines: string[] = [];

  lines.push(`# 日報 - ${today}`);
  lines.push('');
  lines.push(`## リポジトリ: ${repoName}`);
  lines.push('');

  if (result.commits.length === 0) {
    lines.push('本日のコミットはありません。');
    return lines.join('\n');
  }

  lines.push('## コミット一覧');
  lines.push('');

  for (const commit of result.commits) {
    lines.push(`- \`${commit.hash}\` ${commit.message}`);
  }

  lines.push('');
  lines.push('## 統計');
  lines.push('');
  lines.push(`- コミット数: ${result.commits.length}`);
  lines.push(`- 追加行数: +${result.stats.insertions}`);
  lines.push(`- 削除行数: -${result.stats.deletions}`);

  return lines.join('\n');
}
