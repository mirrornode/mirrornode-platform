# Vercel environment variables

Set these in **Project Settings → Environment Variables** for Production and Preview, then redeploy.


| Variable                             | Notes                                                          |
| ------------------------------------ | -------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                | Production: `https://mirrornode.xyz` (or canonical Vercel URL) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Live key for Production                                        |
| `STRIPE_SECRET_KEY`                  | Live key for Production                                        |
| `STRIPE_WEBHOOK_SECRET`              | From Stripe Dashboard webhook endpoint                         |
| `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project URL                                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Required for Librarian client auth                             |
| `SUPABASE_SERVICE_ROLE_KEY`          | Webhook ledger writes (server only)                            |
| `OPENAI_API_KEY`                     | Librarian ingest                                               |
| `PINECONE_API_KEY`                   | Vault indexing                                                 |
| `PINECONE_INDEX_NAME`                | e.g. `mirrornode-vault`                                        |
| `SRIITAG_JWT_SECRET`                 | Governance JWT                                                 |


## Stripe webhook events

Enable on your Stripe webhook endpoint:

- `checkout.session.completed`
- `checkout.session.expired`
- `charge.refunded`
- `payment_intent.payment_failed`
- `charge.dispute.created`
- `customer.subscription.created`
- `customer.subscription.updated`