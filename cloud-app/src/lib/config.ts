import { getConfig as getEnvConfig } from './mongo';
import { atlasDriverConfigured, driverGetConfig } from './atlas-driver';

export type RuntimeConfig = {
  prompt: string;
  keywords: string[];
  TOPK: number;
  SCORE_THRESHOLD: number;
  NUM_CANDIDATES: number;
};

const defaultCfg: RuntimeConfig = {
  prompt:
    process.env.DEFAULT_PROMPT ||
    '你是教材助教，需根據提供的段落回答學生問題。若沒有相關內容，請回覆「查無資料，請提供更多上下文」。回答控制在 6 行內，並標註來源與頁碼。',
  keywords: (process.env.DEFAULT_KEYWORDS || 'help,說明,教學').split(',').map((s) => s.trim()).filter(Boolean),
  TOPK: Number(process.env.TOPK || 6),
  SCORE_THRESHOLD: Number(process.env.SCORE_THRESHOLD || 0.35),
  NUM_CANDIDATES: Number(process.env.NUM_CANDIDATES || 400),
};

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    if (atlasDriverConfigured()) {
      const cfg = await driverGetConfig();
      if (cfg) return { ...defaultCfg, ...cfg };
    } else {
      const cfg = await getEnvConfig();
      if (cfg) return { ...defaultCfg, ...cfg };
    }
  } catch {
    // ignore and fall back to default
  }
  return defaultCfg;
}
