from __future__ import annotations

from flask import Flask, jsonify
from flask_cors import CORS

from .config import Settings, load_settings
from .routes.catalog import catalog_bp
from .routes.tryon import tryon_bp
from .services.recommendations import Catalog, RecommendationIndex
from .services.scw_vton import LocalTryOnService
from .services.segmind import SegmindClient


def create_app(settings: Settings | None = None) -> Flask:
    settings = settings or load_settings()
    app = Flask(__name__)
    CORS(app, origins=settings.cors_origins)

    settings.output_dir.mkdir(parents=True, exist_ok=True)
    catalog = Catalog(settings)
    app.config.update(
        settings=settings,
        catalog=catalog,
        recommendation_index=RecommendationIndex(settings, catalog),
        local_tryon=LocalTryOnService(settings),
        segmind=SegmindClient(settings),
    )

    app.register_blueprint(catalog_bp)
    app.register_blueprint(tryon_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app
