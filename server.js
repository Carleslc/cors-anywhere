// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

var cors_proxy = require('./lib/cors-anywhere');

const removeHeaders = [
  // Strip Heroku-specific headers
  'x-heroku-queue-wait-time',
  'x-heroku-queue-depth',
  'x-heroku-dynos-in-use',
  'x-request-start',
];

const allowCookies = process.env.COOKIES === 'true';

if (allowCookies) {
  console.log('Cookies are enabled');
} else {
  removeHeaders.push('cookie', 'cookie2');
  console.log('Cookies are disabled');
}

cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,
  removeHeaders,
  redirectSameOrigin: true,
  cookies: allowCookies,
  httpProxyOptions: {
    xfwd: true, // Set to false if deployed on Heroku (it already adds X-Forwarded-For headers)
  },
}).listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
