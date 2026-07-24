<?php
// Copy this file to config.php (same folder) and fill in real values.
// config.php is gitignored — never commit real API keys to the repo.
//
// Setup steps on the Resend side:
//   1. Create a Resend account at https://resend.com
//   2. Add and verify the sending domain (oarestroomservices.com) under
//      Domains — this adds a few DNS records (SPF/DKIM) at your DNS host.
//      Until the domain is verified, Resend only lets you send to the
//      email address on your Resend account, which is fine for testing.
//   3. Create an API key under API Keys and paste it below.

define('RESEND_API_KEY', 're_your_api_key_here');

// Must be an address on a domain you've verified in Resend.
define('RESEND_FROM', 'O&A Restroom Portables <quotes@oarestroomservices.com>');

// Where quote requests get delivered.
define('RESEND_TO', 'oarenas@oarestroomservices.com');
