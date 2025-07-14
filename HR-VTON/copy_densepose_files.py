#!/usr/bin/env python3
"""
Script to copy existing densepose files from Kaggle dataset
Since densepose generation requires external tools, we'll use the pre-generated files
"""

import os
import shutil
from pathlib import Path
from tqdm import tqdm

def copy_densepose_files():
    """Copy densepose files from Kaggle dataset to working directory"""
    
    # Source and destination paths
    source_train = "kaggle/input/high-resolution-viton-zalando-dataset/train/image-densepose"
    source_test = "kaggle/input/high-resolution-viton-zalando-dataset/test/image-densepose"
    
    dest_train = "kaggle/working/data/train/image-densepose"
    dest_test = "kaggle/working/data/test/image-densepose"
    
    # Create destination directories
    Path(dest_train).mkdir(parents=True, exist_ok=True)
    Path(dest_test).mkdir(parents=True, exist_ok=True)
    
    print("Copying densepose files...")
    
    # Copy training files
    if Path(source_train).exists():
        train_files = list(Path(source_train).glob("*.jpg"))
        print(f"Found {len(train_files)} training densepose files")
        
        for file_path in tqdm(train_files, desc="Copying training files"):
            dest_path = Path(dest_train) / file_path.name
            shutil.copy2(file_path, dest_path)
    else:
        print(f"Warning: Source training directory not found: {source_train}")
    
    # Copy test files
    if Path(source_test).exists():
        test_files = list(Path(source_test).glob("*.jpg"))
        print(f"Found {len(test_files)} test densepose files")
        
        for file_path in tqdm(test_files, desc="Copying test files"):
            dest_path = Path(dest_test) / file_path.name
            shutil.copy2(file_path, dest_path)
    else:
        print(f"Warning: Source test directory not found: {source_test}")
    
    # Verify copy
    print("\nVerification:")
    if Path(dest_train).exists():
        train_count = len(list(Path(dest_train).glob("*.jpg")))
        print(f"  Training densepose files: {train_count}")
    
    if Path(dest_test).exists():
        test_count = len(list(Path(dest_test).glob("*.jpg")))
        print(f"  Test densepose files: {test_count}")
    
    print("\nDensepose files copied successfully!")
    print("Note: These are pre-generated densepose files from the Kaggle dataset.")

if __name__ == "__main__":
    copy_densepose_files() 