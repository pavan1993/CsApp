'use strict';

// Load test processor for Artillery
module.exports = {
  setRandomOrganization,
  generateRandomEmail,
  generateRandomString,
  logResponse,
};

// Set a random organization for testing
function setRandomOrganization(requestParams, context, ee, next) {
  const organizations = [
    'Acme Corporation',
    'TechCorp Inc',
    'Global Solutions',
    'Innovation Labs',
    'Digital Dynamics',
  ];
  
  context.vars.organization = organizations[Math.floor(Math.random() * organizations.length)];
  return next();
}

// Generate random email for testing
function generateRandomEmail(requestParams, context, ee, next) {
  const domains = ['example.com', 'test.org', 'demo.net'];
  const username = Math.random().toString(36).substring(7);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  context.vars.email = `${username}@${domain}`;
  return next();
}

// Generate random string
function generateRandomString(requestParams, context, ee, next) {
  context.vars.randomString = Math.random().toString(36).substring(7);
  return next();
}

// Log response for debugging
function logResponse(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.log(`Error ${response.statusCode}: ${requestParams.url}`);
    if (response.body) {
      console.log('Response body:', response.body.substring(0, 200));
    }
  }
  return next();
}
