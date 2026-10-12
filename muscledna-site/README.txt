MuscleDNA: upload-ready site

TO PUT IT ONLINE (no build, no edits, no accounts' settings to fill in)
  Upload index.html to the root of any static host and publish:
  Netlify (drag the folder onto app.netlify.com/drop), Vercel, Cloudflare Pages, GitHub Pages,
  S3 / CloudFront, or ordinary web hosting. Build command: none. Publish directory: the folder that holds index.html.

WHAT IS INSIDE
  index.html   The whole site. Every image, the free-guide PDF and all code are embedded, so there is nothing else to upload.
  source/      The parts index.html is made from, for anyone who wants to change the site later.
               Rebuild with:  sh source/build.sh   (needs only a shell; it rewrites ../index.html)
               source/prompt-v20.md is the full written spec of the site (every section, rule and source).

NEEDS THE INTERNET (loaded by the visitor's browser)
  three.js r128 from cdnjs.cloudflare.com and the fonts from Google Fonts.

WORKS ON ITS OWN
  Scrolling, the sections menu (click the page number at the top right), the calculators, the hoodie and
  pre-workout racks and the pre-workout detail card, the sources lists, and the free guide PDF download.

NOT CONNECTED TO A SERVICE YET (the page says so itself)
  The contact form, the free sample download and the affiliate "Shop" links.
