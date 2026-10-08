"""JWT 解码单测（构造假 token，不含真实密钥）。"""

import base64
import json

from app.domain.jwt_codec import extract_employee_id


def _make_token(payload: dict) -> str:
    raw = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    return f"hdr.{raw}.sig"


def test_extract_hcm_uid_from_string_sub():
    sub = json.dumps({"hcmUid": "1128846", "bus": 20})
    token = _make_token({"sub": sub})
    assert extract_employee_id(token) == 1128846


def test_extract_hcm_uid_from_object_sub():
    token = _make_token({"sub": {"hcmUid": 99}})
    assert extract_employee_id(token) == 99
