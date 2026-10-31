// Provider registry.
// Returns the registered provider adapter (District, BookMyShow, or Mock).
// A provider's integration_status decides whether a live adapter runs:
// - 'active' -> calls real provider adapter (District / BookMyShow)
// - 'mock' (or anything else) -> falls back to mock adapter (spec §8, §16).

import { createMockAdapter } from './mock.js'
import { createDistrictAdapter } from './district.js'
import { createBookMyShowAdapter } from './bookmyshow.js'

export { createMockAdapter, createDistrictAdapter, createBookMyShowAdapter }

/**
 * Returns the appropriate adapter based on provider record and env.
 *
 * @param {object} env - Cloudflare Worker environment / secrets
 * @param {object|string} providerRecord - Row from `providers` table or provider_id string
 * @returns {object} Provider adapter instance with checkTarget(target)
 */
export function getAdapter(env = {}, providerRecord = null) {
  if (!providerRecord) {
    return createMockAdapter(env)
  }

  // Handle both provider row object { provider_id, integration_status } and string ID
  const pId = typeof providerRecord === 'string' ? providerRecord : providerRecord.provider_id
  const status = typeof providerRecord === 'object' ? providerRecord.integration_status : 'active'

  // If status is 'mock', fallback to mock adapter
  if (status === 'mock') {
    return createMockAdapter(env)
  }

  // If status is 'active', instantiate the real provider adapter
  if (status === 'active') {
    if (pId === 'district') {
      return createDistrictAdapter(env)
    }
    if (pId === 'bookmyshow') {
      return createBookMyShowAdapter(env)
    }
  }

  // Default fallback for pending_approval, paused, disabled, or unrecognized
  return createMockAdapter(env)
}

/**
 * Registry helper: provider(providerId, env)
 * Returns the adapter instance for the given provider ID and env.
 */
export function provider(providerId, env = {}) {
  return getAdapter(env, providerId)
}
