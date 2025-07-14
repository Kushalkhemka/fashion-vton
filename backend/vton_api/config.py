from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _path_env(name: str, default: Path) -> Path:
    return Path(os.getenv(name, str(default))).expanduser().resolve()


def _list_env(name: str, default: list[Path]) -> list[Path]:
    raw = os.getenv(name)
    if not raw:
        return default
    return [Path(item).expanduser().resolve() for item in raw.split(os.pathsep) if item]


@dataclass(frozen=True)
class Settings:
    repo_root: Path
    host: str
    port: int
    debug: bool
    cors_origins: list[str]
    output_dir: Path
    public_base_url: str | None
    conda_env: str | None
    python_executable: str
    scw_root: Path
    scw_data_root: Path
    scw_ckpt_dir: Path
    scw_config: Path
    scw_step1_script: Path
    scw_step2_script: Path
    scw_test_pairs_path: Path
    dataset_image_dirs: list[Path]
    dataset_cloth_dirs: list[Path]
    segmind_api_key: str | None
    segmind_tryon_url: str | None
    segmind_video_url: str | None
    recommendation_metadata_path: Path
    embeddings_path: Path
    filenames_path: Path
    catalog_image_base_url: str
    catalog_cloth_base_url: str
    default_product_price: float
    openai_api_key: str | None
    openai_model: str


def load_settings() -> Settings:
    root = _repo_root()
    scw_root = _path_env("SCW_VTON_ROOT", root / "SCW-VTON")
    data_root = _path_env("SCW_VTON_DATA_ROOT", scw_root / "data")
    metadata_path = _path_env(
        "RECOMMENDER_METADATA_PATH",
        root / "fashion-recommendation-system" / "vitonhd_train_tagged.json",
    )

    cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    cors_origins = [origin.strip() for origin in cors_raw.split(",") if origin.strip()]

    return Settings(
        repo_root=root,
        host=os.getenv("VTON_API_HOST", "0.0.0.0"),
        port=int(os.getenv("VTON_API_PORT", "5002")),
        debug=os.getenv("VTON_API_DEBUG", "0") == "1",
        cors_origins=cors_origins,
        output_dir=_path_env("VTON_OUTPUT_DIR", root / "backend" / "runtime" / "output"),
        public_base_url=os.getenv("VTON_PUBLIC_BASE_URL") or None,
        conda_env=os.getenv("SCW_VTON_CONDA_ENV") or None,
        python_executable=os.getenv("SCW_VTON_PYTHON", "python"),
        scw_root=scw_root,
        scw_data_root=data_root,
        scw_ckpt_dir=_path_env("SCW_VTON_CKPT_DIR", scw_root / "ckpts"),
        scw_config=_path_env("SCW_VTON_CONFIG", scw_root / "configs" / "viton.yaml"),
        scw_step1_script=_path_env("SCW_VTON_STEP1_SCRIPT", scw_root / "test_for_step1.py"),
        scw_step2_script=_path_env("SCW_VTON_STEP2_SCRIPT", scw_root / "test_for_step2.py"),
        scw_test_pairs_path=_path_env("SCW_VTON_TEST_PAIRS_PATH", data_root / "test_pairs.txt"),
        dataset_image_dirs=_list_env(
            "VTON_DATASET_IMAGE_DIRS",
            [data_root / "test" / "image", data_root / "train" / "image"],
        ),
        dataset_cloth_dirs=_list_env(
            "VTON_DATASET_CLOTH_DIRS",
            [data_root / "test" / "cloth", data_root / "train" / "cloth"],
        ),
        segmind_api_key=os.getenv("SEGMIND_API_KEY") or None,
        segmind_tryon_url=os.getenv("SEGMIND_TRYON_URL") or None,
        segmind_video_url=os.getenv("SEGMIND_360_VIDEO_URL") or None,
        recommendation_metadata_path=metadata_path,
        embeddings_path=_path_env(
            "RECOMMENDER_EMBEDDINGS_PATH",
            root / "fashion-recommendation-system" / "embeddings.pkl",
        ),
        filenames_path=_path_env(
            "RECOMMENDER_FILENAMES_PATH",
            root / "fashion-recommendation-system" / "filenames.pkl",
        ),
        catalog_image_base_url=os.getenv("CATALOG_IMAGE_BASE_URL", "/image"),
        catalog_cloth_base_url=os.getenv("CATALOG_CLOTH_BASE_URL", "/cloth"),
        default_product_price=float(os.getenv("CATALOG_DEFAULT_PRICE", "100")),
        openai_api_key=os.getenv("OPENAI_API_KEY") or None,
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
    )
