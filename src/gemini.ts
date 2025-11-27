import { GitLogResult } from './git';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

export async function generateReportWithGemini(
  result: GitLogResult,
  repoName: string,
  apiKey: string
): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  const prompt = `以下のgit logの情報から、マークダウン形式の日報を作成してください。

日付: ${today}
リポジトリ: ${repoName}

コミット一覧:
${result.commits.map(c => `- ${c.hash}: ${c.message} (${c.author})`).join('\n')}

統計:
- コミット数: ${result.commits.length}
- 追加行数: +${result.stats.insertions}
- 削除行数: -${result.stats.deletions}

要件:
1. 見出しは「# 日報 - ${today}」から始める
2. コミット内容を要約して「## 作業内容」セクションにまとめる
3. 統計情報は「## 統計」セクションに記載
4. 簡潔でわかりやすい日本語で書く`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as GeminiResponse;

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned no content');
  }

  return text;
}
