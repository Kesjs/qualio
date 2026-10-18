import { afterEach, describe, expect, it, vi } from 'vitest'
import { isConfirmedBillingStatus, startBillingConfirmationPoll } from './success-poll'

describe('billing confirmation poll', () => {
  afterEach(() => vi.useRealTimers())

  it('confirms a successful status immediately', async () => {
    const onState = vi.fn()
    const stop = startBillingConfirmationPoll({
      fetchStatus: async () => ({ state: 'confirmed', data: { plan: 'pro', status: 'active' } }),
      onState,
    })
    await vi.waitFor(() => expect(onState).toHaveBeenCalledWith('confirmed'))
    stop()
  })

  it('keeps checking until a late confirmation', async () => {
    vi.useFakeTimers()
    const onState = vi.fn()
    const fetchStatus = vi.fn()
      .mockResolvedValueOnce({ state: 'pending' as const })
      .mockResolvedValueOnce({ state: 'confirmed' as const, data: { plan: 'pro', status: 'active' } })
    const stop = startBillingConfirmationPoll({ fetchStatus, onState })
    await vi.waitFor(() => expect(fetchStatus).toHaveBeenCalledTimes(1))
    await vi.advanceTimersByTimeAsync(1_500)
    expect(onState).toHaveBeenCalledWith('confirmed')
    stop()
  })

  it('shows a delayed state after the maximum wait', async () => {
    vi.useFakeTimers()
    const onState = vi.fn()
    const stop = startBillingConfirmationPoll({
      fetchStatus: async () => ({ state: 'pending' as const }),
      onState,
    })
    for (const delay of [1_500, 3_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000]) {
      await vi.advanceTimersByTimeAsync(delay)
    }
    expect(onState).toHaveBeenCalledWith('delayed')
    stop()
  })

  it('stops on an expired session', async () => {
    const onState = vi.fn()
    const stop = startBillingConfirmationPoll({
      fetchStatus: async () => ({ state: 'unauthorized' as const }),
      onState,
    })
    await vi.waitFor(() => expect(onState).toHaveBeenCalledWith('unauthorized'))
    stop()
  })

  it('does not update state after unmount/cancellation', async () => {
    vi.useFakeTimers()
    const onState = vi.fn()
    const stop = startBillingConfirmationPoll({
      fetchStatus: async () => ({ state: 'pending' as const }),
      onState,
    })
    stop()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(onState).not.toHaveBeenCalled()
  })

  it('recognizes only active paid plans as confirmed', () => {
    expect(isConfirmedBillingStatus({ plan: 'pro', status: 'active' })).toBe(true)
    expect(isConfirmedBillingStatus({ plan: 'agency', status: 'trialing' })).toBe(true)
    expect(isConfirmedBillingStatus({ plan: 'free', status: 'active' })).toBe(false)
    expect(isConfirmedBillingStatus({ plan: 'pro', status: 'pending' })).toBe(false)
  })
})
