from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from ..config import Settings


class PipelineInputError(ValueError):
    pass


class LocalTryOnService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.settings.output_dir.mkdir(parents=True, exist_ok=True)

    def is_dataset_image(self, filename: str) -> bool:
        if filename.startswith("._"):
            return False
        return any((directory / filename).exists() for directory in self.settings.dataset_image_dirs)

    def save_upload(self, upload: FileStorage, field_name: str) -> Path:
        if not upload or not upload.filename:
            raise PipelineInputError(f"Missing uploaded file: {field_name}")

        filename = secure_filename(upload.filename)
        destination = self.settings.output_dir / filename
        upload.save(destination)
        return destination

    def resolve_cloth_path(self, cloth_filename: str, cloth_upload: FileStorage | None = None) -> Path:
        if cloth_upload and cloth_upload.filename:
            return self.save_upload(cloth_upload, "cloth_image_file")

        safe_name = secure_filename(cloth_filename)
        for directory in self.settings.dataset_cloth_dirs:
            candidate = directory / safe_name
            if candidate.exists():
                return candidate

        raise PipelineInputError(f"Cloth image not found in configured dataset dirs: {safe_name}")

    def run_local_pipeline(self, model_filename: str, cloth_filename: str) -> Path:
        self.settings.scw_test_pairs_path.parent.mkdir(parents=True, exist_ok=True)
        self.settings.scw_test_pairs_path.write_text(f"{model_filename} {cloth_filename}\n", encoding="utf-8")

        self._run_step(
            self.settings.scw_step1_script,
            [
                "--dataroot",
                str(self.settings.scw_data_root),
                "--datamode",
                "test",
                "--pair_mode",
                "unpaired",
                "--data_list",
                self.settings.scw_test_pairs_path.name,
                "--ckpt_dir",
                str(self.settings.scw_ckpt_dir),
                "--outdir",
                "results",
            ],
        )
        self._run_step(
            self.settings.scw_step2_script,
            [
                "--dataroot",
                str(self.settings.scw_data_root),
                "--pair_mode",
                "unpaired",
                "--ckpt_dir",
                str(self.settings.scw_ckpt_dir),
                "--outdir",
                "results",
                "--pre_data_dir",
                "results/unpaired",
                "--config",
                str(self.settings.scw_config),
            ],
        )

        output_name = Path(model_filename).with_suffix(".png").name
        result = self.settings.scw_root / "results" / "unpaired" / "try_on" / output_name
        if not result.exists():
            raise FileNotFoundError(f"SCW-VTON output image not found: {result}")

        destination = self.settings.output_dir / result.name
        shutil.copy(result, destination)
        return destination

    def _run_step(self, script: Path, args: list[str]) -> None:
        if not script.exists():
            raise FileNotFoundError(f"Pipeline script not found: {script}")

        base_command = [self.settings.python_executable, str(script)]
        if self.settings.conda_env:
            base_command = ["conda", "run", "-n", self.settings.conda_env, *base_command]

        subprocess.run(
            [*base_command, *args],
            check=True,
            cwd=self.settings.scw_root,
            env=os.environ.copy(),
        )
