import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: class Stripe {
    checkout = {
      sessions: {
        create: mocks.createSession,
      },
    };
  },
}));

vi.mock('@/lib/env/stripe', () => ({
  stripeEnv: {
    STRIPE_SECRET_KEY: 'sk_test',
    STRIPE_AUDIT_PRICE_ID: 'price_osiris_149',
  },
}));

import { POST } from './route';

function request(body: unknown = {}) {
  return new Request('https://mirrornode.xyz/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    mocks.createSession.mockReset();
    mocks.createSession.mockResolvedValue({
      id: 'cs_test_osiris',
      url: 'https://checkout.stripe.com/c/pay/cs_test_osiris',
    });
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('creates a one-time Checkout Session for the canonical Osiris price', async () => {
    const res = await POST(
      request({ cancelPath: '/osiris-audit?canceled=1' }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      url: 'https://checkout.stripe.com/c/pay/cs_test_osiris',
    });
    expect(mocks.createSession).toHaveBeenCalledWith({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: 'price_osiris_149', quantity: 1 }],
      metadata: { flow: 'osiris-audit-v1' },
      success_url:
        'https://mirrornode.xyz/osiris-audit/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://mirrornode.xyz/osiris-audit?canceled=1',
    });
  });

  it('falls back to the audit cancel route when cancelPath is not local', async () => {
    await POST(request({ cancelPath: 'https://evil.example/cancel' }) as never);

    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        cancel_url: 'https://mirrornode.xyz/audit?canceled=1',
      })
    );
  });

  it('uses NEXT_PUBLIC_APP_URL when production origin is explicitly configured', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://mirrornode.xyz';

    await POST(request() as never);

    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url:
          'https://mirrornode.xyz/osiris-audit/success?session_id={CHECKOUT_SESSION_ID}',
      })
    );
  });

  it('returns 500 without fabricating a checkout URL when Stripe creation fails', async () => {
    mocks.createSession.mockRejectedValueOnce(new Error('Stripe unavailable'));

    const res = await POST(request() as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Stripe unavailable' });
  });
});
