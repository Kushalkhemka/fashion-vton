"""Compatibility entry point for recommendation endpoints.

The canonical API now lives under backend/vton_api and also exposes the
legacy /similar route used by the old frontend.
"""

from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.vton_api import create_app  # noqa: E402

app = create_app()


if __name__ == "__main__":
    settings = app.config["settings"]
    app.run(host=settings.host, port=settings.port, debug=settings.debug)
