import { DEFAULT_QA_CONFIG, type QAConfig } from '../types'

export class QAConfigManager {
  private config: QAConfig

  constructor(overrides?: Partial<QAConfig>) {
    this.config = { ...DEFAULT_QA_CONFIG, ...overrides }
  }

  getConfig(): QAConfig { return this.config }
  getMaxPages(): number { return this.config.maxPages }
  getMaxCrawlDepth(): number { return this.config.maxCrawlDepth }
  getMaxScanTime(): number { return this.config.maxScanTime }
  getViewports() { return this.config.viewports }

  validate(): boolean {
    return this.config.maxPages > 0 && this.config.maxCrawlDepth > 0 && this.config.maxScanTime > 0
  }
}
