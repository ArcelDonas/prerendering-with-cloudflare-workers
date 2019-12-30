/**
 * The maximum number of times this should attempt to prerend page after failure. It considers success when middleware
 * returns 200 http status code and failed when anyother is returned
 *
 * @constant {String}
 */
const MAX_ATTEMPTS = 2;

/**
 * The prerender midddleware to use. By default we use rendertron one
 *
 * @constant {String}
 */
const PRERENDER_MIDDLEWARE = 'https://render-tron.appspot.com/render/';

/**
 * Test wheither url passed is for a page and then could need prerendering or is a resource as a css
 * file for example and then do not need being prerendered
 *
 * @param {String} url The url to test
 */
const isResource = url => /\.[a-z0-9A-Z]+$/.test(url);

/**
 * Test wheither or nor incoming user-agent is concerned by prerendering
 *
 * @param {String} userAgent The useer agent request came with
 */
const isUserAgentConcerned = userAgent => /googlebot|adsbot\-google|Feedfetcher\-Google|bingbot|whatsapp|WhatsApp|skype|telegram|yandex|baiduspider|Facebot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|flipboard|tumblr|bitlybot/.test(userAgent.toLowerCase())

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Handle a request
 *
 * @param {Request} request
 */
async function handleRequest(request) {
  const requestUrl = request.url;
  if (!isResource(requestUrl)) {
    const userAgent = request.headers.has('User-Agent')
                      ? request.headers.get('User-Agent')
                      : '';
    if (isUserAgentConcerned(userAgent)) {
      const prerendered = await prerendRequest(request);

      return prerendered;
    }
  }

  // console.log('Got request', request)
  const response = await fetch(request);
  // console.log('Got response', response)
  return response;
}


/**
 * Try to fetch the prerended page, attenmting up to MAX_ATTEMPTS set above until it receive 200 http status code
 * If after MAX_ATTEMPTS it still receives failed status response form middleware, it returns the normal page
 *
 * @param {Request} request
 */
async function prerendRequest(request) {
  const init = {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  };
  let results = '';
  let failed = true;
  const finalUrl = PRERENDER_MIDDLEWARE + encodeURIComponent(request.url);
  let attemps = 0;
  do {
    attemps++;
    const response = await fetch(finalUrl, init);
    if (200 === response.status) {
      failed = false;
      results = await response.text();
    }
  } while(failed && MAX_ATTEMPTS < attemps);

  if (failed) {
    const req = new Request(request.url, { headers: request.headers });
    req.headers.set('user-agent', 'prerender-failed-agent');

    return await fetch(request);
  }

  return new Response(results, init);
}
