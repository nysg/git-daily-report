#!/usr/bin/env node
import { Command } from 'commander';
import { loadConfig, getConfigPath } from './env';
import { getGitLog, isGitRepository, getRepositoryName } from './git';
import { formatAsMarkdown } from './formatter';
import { generateReportWithGemini } from './gemini';

const program = new Command();

program
  .name('git-nippo')
  .description('git logから日報を生成するCLIツール')
  .version('1.0.0')
  .option('-s, --since <date>', '対象期間の開始日時', 'midnight')
  .option('-u, --until <date>', '対象期間の終了日時', 'now')
  .option('-a, --author <name>', '特定の作者のコミットのみ')
  .option('--no-ai', 'AI要約を無効化（git logのみ出力）')
  .addHelpText('after', `
設定:
  ${getConfigPath()}
  にGEMINI_API_KEYを設定するとAIで日報を要約します。

  例:
    GEMINI_API_KEY=your-api-key-here

使用例:
  $ git-nippo                        今日のコミットから日報生成
  $ git-nippo --since "2 days ago"   2日前からの日報生成
  $ git-nippo --since "2024-01-01"   特定日からの日報生成
  $ git-nippo --author "username"    特定の作者のコミットのみ
  $ git-nippo --no-ai                AI要約なしで出力
`);

interface ProgramOptions {
  since: string;
  until: string;
  author?: string;
  ai: boolean;
}

async function main(): Promise<void> {
  program.parse();
  const options = program.opts<ProgramOptions>();

  if (!isGitRepository()) {
    console.error('エラー: gitリポジトリではありません。');
    process.exit(1);
  }

  const config = loadConfig();
  const repoName = getRepositoryName();
  const result = getGitLog({
    since: options.since,
    until: options.until,
    author: options.author,
  });

  if (result.commits.length === 0) {
    console.log(`# 日報 - ${new Date().toISOString().split('T')[0]}\n`);
    console.log(`## リポジトリ: ${repoName}\n`);
    console.log('本日のコミットはありません。');
    return;
  }

  if (config.geminiApiKey && options.ai) {
    try {
      const report = await generateReportWithGemini(result, repoName, config.geminiApiKey);
      console.log(report);
    } catch (error) {
      console.error(`AI要約に失敗しました: ${error instanceof Error ? error.message : error}`);
      console.error('フォールバック: 通常のフォーマットで出力します。\n');
      console.log(formatAsMarkdown(result, repoName));
    }
  } else {
    console.log(formatAsMarkdown(result, repoName));
  }
}

main().catch((error) => {
  console.error('エラー:', error instanceof Error ? error.message : error);
  process.exit(1);
});
