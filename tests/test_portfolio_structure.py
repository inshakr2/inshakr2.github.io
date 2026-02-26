from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class AttrParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.nav_hrefs = []
        self.animate_count = 0
        self.kpi_count = 0
        self.timeline_count = 0

    def handle_starttag(self, tag, attrs):
        attr_map = dict(attrs)
        node_id = attr_map.get("id")
        if node_id:
            self.ids.add(node_id)

        if attr_map.get("data-nav") is not None and attr_map.get("href"):
            self.nav_hrefs.append(attr_map["href"])

        if attr_map.get("data-animate") is not None:
            self.animate_count += 1

        if attr_map.get("data-kpi") is not None:
            self.kpi_count += 1

        if attr_map.get("data-timeline") is not None:
            self.timeline_count += 1


def parse(path: Path) -> AttrParser:
    parser = AttrParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def test_top_navigation_links_exist_on_all_pages():
    expected = {"/", "/projects/", "/career/", "/about/"}
    pages = [
        ROOT / "index.html",
        ROOT / "projects" / "index.html",
        ROOT / "career" / "index.html",
        ROOT / "about" / "index.html",
    ]

    for page in pages:
        parsed = parse(page)
        assert expected.issubset(set(parsed.nav_hrefs)), f"missing nav links in {page}"


def test_home_has_required_v2_sections_and_data_attributes():
    parsed = parse(ROOT / "index.html")
    expected_sections = {
        "impact-dashboard",
        "featured-projects",
        "impact-timeline",
        "now-next",
        "contact",
    }
    assert expected_sections.issubset(parsed.ids)
    assert parsed.kpi_count >= 4
    assert parsed.animate_count >= 8
    assert parsed.timeline_count >= 1


def test_projects_keeps_legacy_anchor_ids():
    parsed = parse(ROOT / "projects" / "index.html")
    expected = {
        "br-ra",
        "br-b-portal",
        "oauth-server",
        "beanchive",
        "cleanbot-poc",
        "message-server",
        "samsung-si",
        "shinhan-ai",
        "lg-portal",
    }
    assert expected.issubset(parsed.ids)


def test_career_has_timeline_block():
    parsed = parse(ROOT / "career" / "index.html")
    assert parsed.timeline_count >= 1
