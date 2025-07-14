from __future__ import annotations

from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_from_directory, url_for
from werkzeug.utils import secure_filename

from ..services.segmind import ExternalServiceNotConfigured
from ..services.scw_vton import PipelineInputError

tryon_bp = Blueprint("tryon", __name__)


def _public_output_url(path: Path) -> str:
    settings = current_app.config["settings"]
    filename = path.name
    if settings.public_base_url:
        return f"{settings.public_base_url.rstrip('/')}/output/{filename}"
    return url_for("tryon.serve_output_file", filename=filename, _external=True)


@tryon_bp.post("/api/tryon")
@tryon_bp.post("/tryon")
def tryon():
    local_tryon = current_app.config["local_tryon"]
    segmind = current_app.config["segmind"]

    try:
        model_upload = request.files.get("model_image")
        model_path = local_tryon.save_upload(model_upload, "model_image")
        model_filename = secure_filename(model_upload.filename)
        cloth_filename = secure_filename(request.form.get("cloth_image", ""))
        if not cloth_filename:
            return jsonify({"status": "error", "message": "cloth_image is required"}), 400

        if local_tryon.is_dataset_image(model_filename):
            output_path = local_tryon.run_local_pipeline(model_filename, cloth_filename)
            return jsonify({"status": "success", "source": "local", "output_image": _public_output_url(output_path)})

        cloth_path = local_tryon.resolve_cloth_path(cloth_filename, request.files.get("cloth_image_file"))
        result = segmind.try_on(model_path, cloth_path, request.form.get("garment_description", "Virtual Try-On"))
        output_path = current_app.config["settings"].output_dir / f"segmind_result_{model_path.stem}.jpg"
        output_path.write_bytes(result)
        return jsonify({"status": "success", "source": "segmind", "output_image": _public_output_url(output_path)})
    except (PipelineInputError, ExternalServiceNotConfigured, FileNotFoundError) as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 500


@tryon_bp.post("/api/uploads/model-image")
@tryon_bp.post("/upload_image")
def upload_model_image():
    try:
        model_upload = request.files.get("model_image")
        path = current_app.config["local_tryon"].save_upload(model_upload, "model_image")
        return jsonify({"status": "success", "public_url": _public_output_url(path)})
    except PipelineInputError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400


@tryon_bp.post("/api/video/360")
@tryon_bp.post("/generate_360_video")
def generate_360_video():
    payload = request.get_json(silent=True) or {}
    image_url = payload.get("image_url")
    if not image_url:
        return jsonify({"status": "error", "message": "image_url is required"}), 400
    try:
        return jsonify(current_app.config["segmind"].start_360_video(image_url))
    except ExternalServiceNotConfigured as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400


@tryon_bp.post("/api/video/360/poll")
@tryon_bp.post("/poll_360_video")
def poll_360_video():
    payload = request.get_json(silent=True) or {}
    poll_url = payload.get("poll_url")
    if not poll_url:
        return jsonify({"status": "error", "message": "poll_url is required"}), 400
    try:
        return jsonify(current_app.config["segmind"].poll(poll_url))
    except ExternalServiceNotConfigured as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400


@tryon_bp.get("/output/<path:filename>")
def serve_output_file(filename: str):
    return send_from_directory(current_app.config["settings"].output_dir, filename)
