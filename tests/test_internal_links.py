from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    ROOT / "index.html",
    ROOT / "projects" / "index.html",
    ROOT / "career" / "index.html",
    ROOT / "about" / "index.html",
]


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attr_map = dict(attrs)
        node_id = attr_map.get("id")
        if node_id:
            self.ids.add(node_id)
        href = attr_map.get("href")
        if href:
            self.links.append(href)


def parse(path: Path) -> LinkParser:
    parser = LinkParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def file_from_root_path(url_path: str) -> Path:
    if url_path == "/":
        return ROOT / "index.html"

    rel = url_path.lstrip("/")
    if rel.endswith("/"):
        rel = f"{rel}index.html"
    return ROOT / rel


def split_href(href: str):
    if "#" in href:
        path, frag = href.split("#", 1)
        return path, frag
    return href, ""


def test_internal_links_resolve_to_existing_files_and_ids():
    page_cache = {page: parse(page) for page in PAGES}

    for page in PAGES:
        parsed = page_cache[page]
        for href in parsed.links:
            if href.startswith(("mailto:", "tel:", "http://", "https://")):
                continue

            path_part, frag = split_href(href)
            if href.startswith("#"):
                assert frag in parsed.ids, f"{page} has broken local anchor: {href}"
                continue

            if href.startswith("/"):
                target_file = file_from_root_path(path_part or "/")
                assert target_file.exists(), f"{page} points to missing file: {href}"
                if frag:
                    target_parsed = page_cache.get(target_file, parse(target_file))
                    page_cache[target_file] = target_parsed
                    assert frag in target_parsed.ids, f"{page} points to missing id: {href}"
