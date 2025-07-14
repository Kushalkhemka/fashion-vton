from __future__ import annotations

import json

import requests
from flask import Blueprint, current_app, jsonify, request

from ..services.recommendations import FILTER_FIELDS

catalog_bp = Blueprint("catalog", __name__)


@catalog_bp.get("/api/catalog")
def catalog():
    catalog_service = current_app.config["catalog"]
    return jsonify(
        {
            "products": catalog_service.products(),
            "filterOptions": catalog_service.filter_options(),
        }
    )


@catalog_bp.post("/api/recommendations/similar")
@catalog_bp.post("/similar")
def similar():
    payload = request.get_json(silent=True) or {}
    file_name = payload.get("file_name") or payload.get("fileName")
    if not file_name:
        return jsonify({"error": "file_name is required"}), 400

    recommendation_index = current_app.config["recommendation_index"]
    try:
        similar_files = recommendation_index.similar(file_name, int(payload.get("limit", 10)))
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 503
    except KeyError:
        return jsonify({"error": "file_name not found"}), 404

    return jsonify({"similar": similar_files})


@catalog_bp.post("/api/search/parse")
def parse_search():
    settings = current_app.config["settings"]
    if not settings.openai_api_key:
        return jsonify({"error": "OPENAI_API_KEY is not configured on the backend."}), 503

    payload = request.get_json(silent=True) or {}
    query = (payload.get("query") or "").strip()
    if not query:
        return jsonify({"error": "query is required"}), 400

    options = current_app.config["catalog"].filter_options()
    option_lines = "\n".join(
        f"{field}: {', '.join(values)}"
        for field, values in options.items()
    )
    system_prompt = (
        "Map the user fashion search query to available catalog filters. "
        "Return only a JSON object with these keys: "
        f"{', '.join(FILTER_FIELDS.keys())}. "
        "Use an empty string when a filter is absent. Only use values from these options:\n"
        f"{option_lines}"
    )

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.openai_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            "temperature": 0,
            "max_tokens": 256,
        },
        timeout=60,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    filters = json.loads(content)
    return jsonify({"filters": {field: filters.get(field, "") for field in FILTER_FIELDS}})
