"""Cookie 解析单测。"""

from app.domain.cookie_parser import parse_cookie_header


def test_parse_basic_pairs():
    result = parse_cookie_header("moka-jwt=abc; moka-uid=xyz")
    assert result["moka-jwt"] == "abc"
    assert result["moka-uid"] == "xyz"


def test_skip_attributes():
    result = parse_cookie_header("token=1; Path=/; Secure; Domain=example.com")
    assert result == {"token": "1"}


def test_empty():
    assert parse_cookie_header("") == {}
    assert parse_cookie_header("   ") == {}
