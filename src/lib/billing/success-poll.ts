export type BillingConfirmationState = 'checking' | 'confirmed' | 'delayed' | 'unauthorized'

export type BillingStatusResponse = {
  plan?: string
  status?: string
}

type PollOutcome =
  | { state: 'confirmed'; data: BillingStatusResponse }
  | { state: 'pending' }
  | { state: 'unauthorized' }

const MAX_WAIT_MS = 60_000
const RETRY_DELAYS_MS = [1_500, 3_000, 5_000]

export function isConfirmedBillingStatus(data: BillingStatusResponse) {
  return data.plan !== 'free' && (data.status === 'active' || data.status === 'trialing')
}

export function startBillingConfirmationPoll({
  fetchStatus,
  onState,
}: {
  fetchStatus: () => Promise<PollOutcome>
  onState: (state: BillingConfirmationState) => void
}) {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let elapsed = 0
  let attempt = 0

  const stop = () => {
    cancelled = true
    if (timer) clearTimeout(timer)
  }

  const check = async () => {
    if (cancelled) return
    const result = await fetchStatus()
    if (cancelled) return
    if (result.state === 'confirmed') {
      onState('confirmed')
      return
    }
    if (result.state === 'unauthorized') {
      onState('unauthorized')
      return
    }
    const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]
    attempt += 1
    if (elapsed + delay >= MAX_WAIT_MS) {
      onState('delayed')
      return
    }
    elapsed += delay
    timer = setTimeout(() => { timer = null; void check() }, delay)
  }

  void check()
  return stop
}
