# Love Liberia REST API

Base URL: `/api`

Authenticated endpoints use the `love_liberia_token` HTTP-only cookie. JSON requests use `Content-Type: application/json`. Resource IDs are opaque CUID strings.

## Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create an account and start a session |
| POST | `/auth/login` | Authenticate and start a session |
| POST | `/auth/logout` | End the current session |

## Users and profiles

| Method | Path | Purpose |
|---|---|---|
| GET | `/users?search=` | Search active users |
| GET | `/profile` | Get the current profile and preferences |
| PUT | `/profile` | Update profile and dating preferences |
| POST/DELETE | `/profile/photo` | Set or remove the main photo |
| POST/DELETE/PATCH | `/profile/photos` | Add, remove, or select gallery photos |
| GET/PATCH | `/privacy` | Read or update privacy controls |
| GET/PUT | `/privacy/cookies` | Read or save cookie preferences |
| GET | `/account/export` | Download account data as JSON |
| DELETE | `/account/delete` | Permanently delete the account with confirmation |

## Discovery and connections

| Method | Path | Purpose |
|---|---|---|
| GET | `/discover` | Filter and rank recommended profiles |
| POST/DELETE | `/likes` | Like, Super Like, or remove a like |
| GET | `/matches` | List mutual matches |
| GET | `/matches/:userId` | View a matched profile |
| GET | `/conversations` | List message conversations |
| GET/POST | `/messages?userId=` | Read or send messages |
| GET/POST/PATCH | `/calls` | List, start, or update calls |
| GET/PATCH | `/notifications` | List or mark notifications read |
| POST/DELETE/GET | `/blocks` | Block, unblock, list, or inspect blocks |
| GET/POST/DELETE | `/hidden-profiles` | List, hide, or restore hidden profiles |

## Stories and events

| Method | Path | Purpose |
|---|---|---|
| GET/POST/DELETE | `/stories` | List, create, or soft-delete stories |
| GET/POST/PATCH | `/events` | List, create, or register for events |
| GET | `/profile/views` | List profile visitors |
| PATCH | `/profile/views` | Enable or disable visitor tracking |

## Commerce

| Method | Path | Purpose |
|---|---|---|
| GET/POST/PATCH | `/subscriptions` | Read, create, or cancel subscriptions |
| GET/POST | `/payments` | List or create payment records |
| GET/POST | `/wallet` | Read wallet or start a credit purchase |
| GET/POST | `/gifts` | List received gifts or send a gift |
| GET/POST | `/boosts` | List or start profile boosts |
| POST | `/billing/checkout` | Start a billing checkout session |

## Safety and verification

| Method | Path | Purpose |
|---|---|---|
| POST | `/reports` | Report a member or safety issue |
| GET/POST | `/verification` | Read or request email/phone verification |
| POST | `/verification/photo` | Submit a photo verification request |
| POST | `/verification/identity` | Submit an identity verification request |
| POST | `/status` | Update online status |

## Admin

Admin endpoints require an authorized admin role and permission.

| Method | Path | Purpose |
|---|---|---|
| GET/PATCH | `/admin/users` | List and manage users |
| DELETE | `/admin/users/:userId/photos` | Remove a user photo |
| GET/PATCH | `/admin/reports` | Review and resolve reports |
| GET/PATCH | `/admin/risk` | Review, dismiss, or escalate risk flags |
| GET | `/admin/commerce` | View commerce data |

## Support

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/support` | List support tickets or create a ticket |

## Common responses

Successful JSON responses use the resource name, for example `{ "users": [] }`, `{ "call": {} }`, or `{ "success": true }`.

Errors use `{ "error": "Human-readable message" }` and standard HTTP status codes: `401` unauthenticated, `403` forbidden, `404` missing resource, `409` conflict, `429` rate limited, and `500` server failure.

## Security

State-changing endpoints require the same origin, validate ownership, use Prisma parameterized queries, and inherit the application rate limits and secure headers.
