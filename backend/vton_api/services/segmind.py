from __future__ import annotations

import base64
from pathlib import Path

import requests

from ..config import Settings


class ExternalServiceNotConfigured(RuntimeError):
    pass


class SegmindClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    def _headers(self) -> dict[str, str]:
        if not self.settings.segmind_api_key:
            raise ExternalServiceNotConfigured("SEGMIND_API_KEY is not configured.")
        return {"x-api-key": self.settings.segmind_api_key}

    @staticmethod
    def _image_to_base64(image_path: Path) -> str:
        with image_path.open("rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    def try_on(self, model_image: Path, cloth_image: Path, garment_description: str) -> bytes:
        if not self.settings.segmind_tryon_url:
            raise ExternalServiceNotConfigured("SEGMIND_TRYON_URL is not configured.")

        payload = {
            "crop": False,
            "seed": 42,
            "steps": 30,
            "category": "upper_body",
            "force_dc": False,
            "human_img": self._image_to_base64(model_image),
            "garm_img": self._image_to_base64(cloth_image),
            "mask_only": False,
            "garment_des": garment_description,
        }
        response = requests.post(
            self.settings.segmind_tryon_url,
            json=payload,
            headers=self._headers(),
            timeout=120,
        )
        response.raise_for_status()
        return response.content

    def start_360_video(self, image_url: str) -> dict:
        if not self.settings.segmind_video_url:
            raise ExternalServiceNotConfigured("SEGMIND_360_VIDEO_URL is not configured.")

        response = requests.post(
            self.settings.segmind_video_url,
            json={"Fashion_Model": image_url},
            headers={**self._headers(), "Content-Type": "application/json"},
            timeout=120,
        )
        response.raise_for_status()
        return response.json()

    def poll(self, poll_url: str) -> dict:
        response = requests.get(poll_url, headers=self._headers(), timeout=60)
        response.raise_for_status()
        return response.json()
