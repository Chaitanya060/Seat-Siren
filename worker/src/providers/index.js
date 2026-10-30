// Provider registry. A provider's integration_status decides whether a live
// adapter may run; anything not 'active' falls back to the mock adapter so v1
// is fully testable without authorized access (spec §8, §16).

import { createMockAdapter } from './mock.js'

export function getAdapter(env, provider) {
  // provider: row from the `providers` table.
  if (!provider || provider.integration_status !== 'active') {
    return createMockAdapter(env)
  }
  // Live adapters are registered here once an authorized integration is recorded.
  // e.g. if (provider.provider_id === 'district') return createDistrictAdapter(env)
  // Until then, stay on mock.
  return createMockAdapter(env)
}
