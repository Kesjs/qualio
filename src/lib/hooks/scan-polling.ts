export const TERMINAL_SCAN_STATUSES: readonly string[] = ['completed', 'failed', 'partial', 'blocked']

/** Keep observing an active scan, including after a transient status fetch error. */
export function scanPollInterval(status?: string): number | false {
  return status && TERMINAL_SCAN_STATUSES.includes(status) ? false : 2000
}

export function scanListPollInterval(scans?: ReadonlyArray<{ status: string }>): number | false {
  return scans?.some(scan => !TERMINAL_SCAN_STATUSES.includes(scan.status)) ? 2000 : false
}
