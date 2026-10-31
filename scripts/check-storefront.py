"""Read-only production smoke checks. Run against `npm run start -- -p 3001`."""
import argparse
import json
import statistics
import re
import html
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = None
        self.robots = ""
        self.h1 = 0
        self.schemas = []
        self.script = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href")
        if tag == "meta" and attrs.get("name") == "robots":
            self.robots = attrs.get("content", "")
        if tag == "h1":
            self.h1 += 1
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.script = ""
    def handle_data(self, data):
        if self.script is not None:
            self.script += data
    def handle_endtag(self, tag):
        if tag == "script" and self.script is not None:
            self.schemas.append(json.loads(self.script))
            self.script = None

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

parser = argparse.ArgumentParser()
parser.add_argument("--base-url", default="http://localhost:3001")
args = parser.parse_args()
base = args.base_url.rstrip("/")

def get(path):
    start = time.perf_counter()
    with urllib.request.urlopen(base + path, timeout=60) as response:
        first_byte = response.read(1)
        ttfb = (time.perf_counter() - start) * 1000
        body = first_byte + response.read()
        return body, response.headers, round(ttfb, 1)

sitemap, _, _ = get("/sitemap.xml")
urls = [element.text for element in ET.fromstring(sitemap).iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
product_paths = [urllib.parse.urlsplit(url).path for url in urls if "/products/" in url]
assert product_paths, "Expected at least one product in the production database"
assert not any("/admin" in url or "/api/" in url for url in urls)
paths = ["/", "/catalog", "/catalog?metal=Silver&sort=name", product_paths[0] + "?metal=Silver", "/faq", "/privacy"]
service_paths = [urllib.parse.urlsplit(url).path for url in urls if "/services/" in url]
paths += ["/services", *service_paths]
result = {"environment": "local production build; not a Lighthouse or mobile-network benchmark", "sitemap_urls": len(urls), "pages": []}
for path in paths:
    body, _, cold = get(path)
    page = Page()
    page.feed(body.decode())
    assert page.h1 == 1, (path, "Expected one main heading", page.h1)
    assert page.canonical and page.canonical.startswith("https://"), (path, "Missing public canonical")
    if path.startswith("/products/"):
        assert "?" not in page.canonical and len(page.schemas) >= 2
    if path.startswith("/services/"):
        nodes = [node for schema in page.schemas for node in schema.get("@graph", [schema])]
        assert any(node.get("@type") == "Service" for node in nodes), (path, "Missing service schema")
        assert any(node.get("@type") == "BreadcrumbList" for node in nodes), (path, "Missing service breadcrumb")
        assert urllib.parse.urlsplit(page.canonical).path == path
    if "metal=" in path and path.startswith("/catalog"):
        assert "noindex" in page.robots
    warm = [get(path)[2] for _ in range(3)]
    result["pages"].append({"path": path, "first_request_ttfb_ms": cold, "median_warm_ttfb_ms": statistics.median(warm), "html_bytes": len(body), "canonical": page.canonical, "schemas": len(page.schemas)})
robots, _, _ = get("/robots.txt")
assert b"Disallow: /admin" in robots and b"sitemap.xml" in robots.lower()
for path in ["/cart", "/wishlist"]:
    body, _, _ = get(path)
    page = Page(); page.feed(body.decode())
    assert "noindex" in page.robots, path
opener = urllib.request.build_opener(NoRedirect())
try:
    opener.open(base + "/admin/analytics", timeout=30)
    raise AssertionError("Analytics must require sign-in")
except urllib.error.HTTPError as error:
    assert error.code in (303, 307), error.code
    assert "/admin/login" in error.headers["Location"]
manifest = json.load(open("src/components/remotion/hero-images.json"))
asset = next(iter(manifest.values()))["src"]
_, headers, _ = get(asset)
assert "immutable" in headers.get("Cache-Control", "")
result["checks"] = ["public pages respond", "one H1 per checked page", "public canonical URLs", "valid product and business JSON-LD", "filtered catalogue noindex", "cart/wishlist noindex", "sitemap XML", "robots.txt", "analytics requires login", "hero asset immutable cache"]
product_html, _, _ = get(product_paths[0])
image_sources = list(dict.fromkeys(html.unescape(value) for value in re.findall(r'<img[^>]+src="([^"]+)"', product_html.decode())))
image_checks = []
for source in image_sources:
    parsed = urllib.parse.urlsplit(source)
    original = urllib.parse.parse_qs(parsed.query).get("url", [source])[0]
    if original == "/logo.png":
        continue
    try:
        with urllib.request.urlopen(urllib.parse.urljoin(base + "/", source), timeout=30) as response:
            status = response.status
    except urllib.error.HTTPError as error:
        status = error.code
    image_checks.append({"source": original, "status": status})
    if len(image_checks) == 4:
        break
result["sample_product_images"] = image_checks
result["launch_blockers"] = ["Sample product photos fail in production. Development-only /media/products URLs must be migrated to permanent storage; confirm the production image runtime is installed."] if any(image["status"] != 200 for image in image_checks) else []
print(json.dumps(result, indent=2))
sys.exit(1 if result["launch_blockers"] else 0)
