from __future__ import annotations

import json
import os
import pickle
from dataclasses import dataclass
from functools import cached_property
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.neighbors import NearestNeighbors

from ..config import Settings

FILTER_FIELDS = {
    "itemType": "item",
    "look": "looks",
    "color": "colors",
    "sleeveLength": "sleeveLength",
    "length": "length",
    "neckline": "neckLine",
    "prints": "prints",
}


@dataclass(frozen=True)
class CatalogEntry:
    file_name: str
    category_name: str
    tags: dict[str, str]


def tag_dict(tag_info: list[dict[str, Any]]) -> dict[str, str]:
    return {
        tag["tag_name"]: tag["tag_category"]
        for tag in tag_info
        if tag.get("tag_name") and tag.get("tag_category")
    }


class Catalog:
    def __init__(self, settings: Settings):
        self.settings = settings

    @cached_property
    def entries(self) -> list[CatalogEntry]:
        with self.settings.recommendation_metadata_path.open("r", encoding="utf-8") as file:
            raw_entries = json.load(file).get("data", [])

        entries: list[CatalogEntry] = []
        for raw in raw_entries:
            file_name = raw.get("file_name", "")
            if not file_name or file_name.startswith("._"):
                continue
            entries.append(
                CatalogEntry(
                    file_name=file_name,
                    category_name=raw.get("category_name", ""),
                    tags=tag_dict(raw.get("tag_info", [])),
                )
            )
        return entries

    @cached_property
    def by_filename(self) -> dict[str, CatalogEntry]:
        return {entry.file_name: entry for entry in self.entries}

    def filter_options(self) -> dict[str, list[str]]:
        options: dict[str, set[str]] = {field: set() for field in FILTER_FIELDS}
        for entry in self.entries:
            for frontend_field, tag_name in FILTER_FIELDS.items():
                value = entry.tags.get(tag_name)
                if value:
                    options[frontend_field].add(value)
        return {field: sorted(values) for field, values in options.items()}

    def products(self) -> list[dict[str, Any]]:
        products = []
        for index, entry in enumerate(self.entries, start=1):
            tags = entry.tags
            products.append(
                {
                    "id": index,
                    "fileName": entry.file_name,
                    "name": tags.get("item") or Path(entry.file_name).stem,
                    "price": self.settings.default_product_price,
                    "modelImages": [f"{self.settings.catalog_image_base_url}/{entry.file_name}"],
                    "clothImage": f"{self.settings.catalog_cloth_base_url}/{entry.file_name}",
                    "category": entry.category_name,
                    "itemType": tags.get("item", ""),
                    "color": tags.get("colors", ""),
                    "look": tags.get("looks", ""),
                    "sleeveLength": tags.get("sleeveLength", ""),
                    "length": tags.get("length", ""),
                    "neckline": tags.get("neckLine", ""),
                    "prints": tags.get("prints", ""),
                }
            )
        return products


class RecommendationIndex:
    def __init__(self, settings: Settings, catalog: Catalog):
        self.settings = settings
        self.catalog = catalog

    @cached_property
    def feature_list(self) -> np.ndarray:
        with self.settings.embeddings_path.open("rb") as file:
            return np.array(pickle.load(file))

    @cached_property
    def filenames(self) -> list[str]:
        with self.settings.filenames_path.open("rb") as file:
            return pickle.load(file)

    @cached_property
    def filename_to_index(self) -> dict[str, int]:
        return {os.path.basename(filename): index for index, filename in enumerate(self.filenames)}

    @cached_property
    def nearest_neighbors(self) -> NearestNeighbors:
        neighbors = NearestNeighbors(n_neighbors=min(50, len(self.feature_list)), algorithm="brute", metric="euclidean")
        neighbors.fit(self.feature_list)
        return neighbors

    def similar(self, file_name: str, limit: int = 10) -> list[str]:
        if file_name not in self.filename_to_index:
            raise KeyError(file_name)

        query_index = self.filename_to_index[file_name]
        query_feature = self.feature_list[query_index]
        distances, indices = self.nearest_neighbors.kneighbors([query_feature], n_neighbors=min(limit + 1, len(self.feature_list)))
        return [
            os.path.basename(self.filenames[index])
            for index in indices[0]
            if index != query_index
        ][:limit]
