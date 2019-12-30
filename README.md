# prerendering-with-cloudflare-workers
This allows you to set up prerendering of your site through cloudflare workers

# You just need to set these 2 constants at the to of file
`MAX_ATTEMPTS`: The maximum number of times this should attempt to prerend page after failure. It considers success when middleware returns 200 http status code and failed when anyother is returned
`PRERENDER_MIDDLEWARE`: The prerender midddleware to use. By default we use rendertron one