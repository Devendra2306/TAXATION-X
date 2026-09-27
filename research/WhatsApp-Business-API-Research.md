# WhatsApp Business Cloud API — Research Report (2026)

## 1. Setup Process & Phone Number Registration

### Prerequisites
1. **Meta Developer Account & App:**
   - Create an app in Meta Developers under the "Connect with customers through WhatsApp" use case.
   - Add the WhatsApp product to obtain your Sandbox Test Phone Number ID and WhatsApp Business Account (WABA) ID.
2. **Meta Business Portfolio (formerly Business Manager):**
   - An admin account in Meta Business Suite linked to your developer app.
3. **Clean Phone Number Requirements:**
   - The phone number cannot be currently registered with the consumer WhatsApp Messenger or the standard WhatsApp Business mobile app.
   - Migration: If active on a mobile app, delete the WhatsApp account, uninstall, and wait 24–48 hours.

### Phone Number Registration Steps
1. In Meta Developer Console: WhatsApp > API Setup > Add Phone Number.
2. Enter Display Name, category, and business details (undergoes Meta review).
3. Verify ownership via SMS or Voice OTP.
4. Register the number via the Graph API:
```http
POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/register
Authorization: Bearer {SYSTEM_USER_ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "pin": "123456"
}
```

### Meta Business Verification
- **Where:** Meta Business Suite > Settings > Security Centre > Start Verification.
- **Requirements:** Official legal documents (Certificate of Incorporation, Tax/GST filings, utility bills) and a functioning corporate website.
- **Tiers:**
  - Unverified: 250 unique business-initiated contacts per 24 hours
  - Verified: Scales to 1k, 10k, 100k, Unlimited

---

## 2. Supported Message Types

| Message Type | Constraints & Features |
|---|---|
| **Text** | Formatting support, URLs with preview, max 4,096 chars |
| **Quick Reply Buttons** | Max 3 buttons, 20 chars each |
| **List Messages** | Up to 10 selectable options in sections |
| **WhatsApp Flows** | Native multi-step forms inside WhatsApp |
| **Documents** | PDF, DOC, XLS, PPT, TXT — max 100 MB |
| **Images** | JPG, PNG — max 5 MB, optional caption |
| **Audio** | MP3, OGG — max 16 MB |
| **Video** | MP4, 3GP — max 16 MB, optional caption |
| **Location** | GPS lat/lng, name, address |
| **Contacts** | vCard format |
| **Reactions** | Emojis on existing messages |
| **Template Messages** | Pre-approved (Utility, Authentication, Marketing) |

---

## 3. Webhook Structure

### Verification (GET)
- Query params: `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`
- Server echoes `hub.challenge` with HTTP 200

### Inbound Messages (POST)
- Validate `X-Hub-Signature-256` header (HMAC-SHA256)
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "display_phone_number": "...", "phone_number_id": "..." },
        "contacts": [{ "profile": { "name": "..." }, "wa_id": "..." }],
        "messages": [{
          "from": "USER_PHONE",
          "id": "wamid.xxx",
          "timestamp": "...",
          "type": "text",
          "text": { "body": "Hello!" }
        }]
      }
    }]
  }]
}
```

> **Critical:** Meta requires 200 OK within 3 seconds. Push to background queue immediately.

---

## 4. Rate Limits & Pricing (2026)

### Throughput
- Default: 80 MPS per phone number
- High-Throughput: 1,000 MPS for enterprise accounts

### Volume Limits (24-hour rolling)
- Unverified: 250 unique users
- Tier 1: 1,000 → Tier 2: 10,000 → Tier 3: 100,000 → Tier 4: Unlimited

### Pricing (Per-Message Delivered — effective Oct 1, 2026)
- **Service Messages:** 1,000 free/month, then per-message billing
- **Marketing Templates:** Highest rate
- **Utility Templates:** Moderate rate
- **Authentication Templates:** Specialized rate
- **Free Entry Point:** Click-to-WhatsApp ads = free for 72 hours

---

## 5. Document Upload Flow (User → Bot)

```
[User sends PDF] → [Webhook POST with media_id]
     ↓
[GET /v20.0/{MEDIA_ID}] → Returns temporary URL (valid 5 min)
     ↓
[GET {url} with Bearer Token] → Binary file download
     ↓
[Save to S3/Cloud Storage]
```

---

## 6. Recommended Python SDKs

| Library | Recommendation |
|---|---|
| **PyWa (`pywa`)** | ⭐ Top pick — async, type-safe, FastAPI integration, flow support |
| **Custom (httpx + Pydantic)** | Best for zero lock-in enterprise architecture |
| **Heyoo** | Quick scripts only, not production-ready |

---

## 7. Architecture Checklist
1. Use Meta's Cloud API (not legacy On-Premises)
2. Budget for Oct 1, 2026 per-message pricing
3. Return 200 OK instantly, process via async workers
4. Stream user documents to permanent storage before 5-min URL expiry
