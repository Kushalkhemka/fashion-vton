import argparse
import os
import pickle
from pathlib import Path

import numpy as np
import tensorflow
from numpy.linalg import norm
from tensorflow.keras.applications import EfficientNetB7
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import GlobalMaxPooling2D
from tensorflow.keras.preprocessing import image
from tqdm import tqdm


def build_model():
    base_model = EfficientNetB7(weights="imagenet", include_top=False, input_shape=(600, 600, 3))
    base_model.trainable = False
    return tensorflow.keras.Sequential([base_model, GlobalMaxPooling2D()])


def extract_features(img_path: Path, model) -> np.ndarray:
    img = image.load_img(img_path, target_size=(600, 600))
    img_array = image.img_to_array(img)
    expanded_img_array = np.expand_dims(img_array, axis=0)
    preprocessed_img = preprocess_input(expanded_img_array)
    result = model.predict(preprocessed_img, verbose=0).flatten()
    return result / norm(result)


def parse_args():
    parser = argparse.ArgumentParser(description="Build fashion item embeddings.")
    parser.add_argument(
        "--image-dir",
        default=os.getenv("RECOMMENDER_IMAGE_DIR", "images/cloth"),
        help="directory containing catalog clothing images",
    )
    parser.add_argument(
        "--embeddings-output",
        default=os.getenv("RECOMMENDER_EMBEDDINGS_PATH", "embeddings.pkl"),
        help="output pickle path for embedding vectors",
    )
    parser.add_argument(
        "--filenames-output",
        default=os.getenv("RECOMMENDER_FILENAMES_PATH", "filenames.pkl"),
        help="output pickle path for image filenames",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    image_dir = Path(args.image_dir)
    if not image_dir.exists():
        raise FileNotFoundError(f"Image directory not found: {image_dir}")

    filenames = sorted(path for path in image_dir.iterdir() if path.is_file() and not path.name.startswith("._"))
    model = build_model()
    feature_list = [extract_features(path, model) for path in tqdm(filenames)]

    with Path(args.embeddings_output).open("wb") as file:
        pickle.dump(feature_list, file)
    with Path(args.filenames_output).open("wb") as file:
        pickle.dump([str(path) for path in filenames], file)


if __name__ == "__main__":
    main()
