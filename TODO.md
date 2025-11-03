# TODO: Replace Mailgun with Postmark for Email Service

## Steps to Complete:
- [x] Add 'postmark' dependency to backend/package.json
- [x] Modify backend/src/utils/emailService.js to use Postmark instead of Mailgun
- [ ] Update environment variables in .env (add POSTMARK_API_KEY and POSTMARK_FROM_EMAIL)
- [ ] Test the email sending functionality

## Notes:
- Ensure Postmark API key and from email are set in .env before running.
- The code will fallback to Gmail or Ethereal if Postmark fails.
- Dependencies installed successfully.
