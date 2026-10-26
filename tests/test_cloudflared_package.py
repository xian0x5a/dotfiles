from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
PACKAGE_ROOT = REPO_ROOT / "packages/linux/cloudflared"


def test_package_knows_no_particular_service_or_tunnel() -> None:
    """A tunnel is owned by the package that publishes a service, not this one."""
    for path in sorted(PACKAGE_ROOT.rglob("*")):
        if path.is_file():
            text = path.read_text(encoding="utf-8").lower()
            assert "devspace" not in text, f"{path} names a specific service"
