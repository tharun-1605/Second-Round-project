# TODO: Modify Postmark Transporter for Domain Restriction Errors

## Steps to Complete:
- [x] Remove special handling for 422/412 errors in backend/src/utils/emailService.js to treat them as general failures

## Notes:
- This ensures consistent error handling without differentiating domain restriction errors.
