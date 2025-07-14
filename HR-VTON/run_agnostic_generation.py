#!/usr/bin/env python3
"""
Runner script for generate_agnostic_images.py
This script will generate agnostic images and masks for the HR-VTON dataset.
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    # Get current directory
    current_dir = Path.cwd()
    print(f"Current directory: {current_dir}")
    
    # Check if we're in the right directory
    if not (current_dir / "HR-VITON").exists():
        print("Error: HR-VITON directory not found!")
        print("Please run this script from the root directory where HR-VITON is located.")
        return
    
    # Change to HR-VITON directory
    os.chdir("HR-VITON")
    print(f"Changed to directory: {Path.cwd()}")
    
    # Check if generate_agnostic_images.py exists
    if not Path("generate_agnostic_images.py").exists():
        print("Error: generate_agnostic_images.py not found in HR-VITON directory!")
        return
    
    # Create output directories
    output_dirs = [
        "../kaggle/working/data/train/agnostic-v3.2",
        "../kaggle/working/data/train/agnostic-mask",
        "../kaggle/working/data/test/agnostic-v3.2",
        "../kaggle/working/data/test/agnostic-mask"
    ]
    
    for dir_path in output_dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {dir_path}")
    
    # Check if input data exists
    train_data_path = "../kaggle/input/high-resolution-viton-zalando-dataset/train"
    test_data_path = "../kaggle/input/high-resolution-viton-zalando-dataset/test"
    
    if not Path(train_data_path).exists():
        print(f"Error: Training data not found at {train_data_path}")
        return
    
    if not Path(test_data_path).exists():
        print(f"Error: Test data not found at {test_data_path}")
        return
    
    print("Input data directories found!")
    
    # Run the script for training data
    print("\n" + "="*50)
    print("PROCESSING TRAINING DATA")
    print("="*50)
    
    train_cmd = [
        "python", "generate_agnostic_images.py",
        "--data_path", train_data_path,
        "--agnostic_output", "../kaggle/working/data/train/agnostic-v3.2",
        "--mask_output", "../kaggle/working/data/train/agnostic-mask"
    ]
    
    print(f"Running command: {' '.join(train_cmd)}")
    
    try:
        result = subprocess.run(train_cmd, check=True, capture_output=True, text=True)
        print("Training data processing completed successfully!")
        print("Output:", result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error processing training data: {e}")
        print("Error output:", e.stderr)
        return
    
    # Run the script for test data
    print("\n" + "="*50)
    print("PROCESSING TEST DATA")
    print("="*50)
    
    test_cmd = [
        "python", "generate_agnostic_images.py",
        "--data_path", test_data_path,
        "--agnostic_output", "../kaggle/working/data/test/agnostic-v3.2",
        "--mask_output", "../kaggle/working/data/test/agnostic-mask"
    ]
    
    print(f"Running command: {' '.join(test_cmd)}")
    
    try:
        result = subprocess.run(test_cmd, check=True, capture_output=True, text=True)
        print("Test data processing completed successfully!")
        print("Output:", result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error processing test data: {e}")
        print("Error output:", e.stderr)
        return
    
    print("\n" + "="*50)
    print("ALL PROCESSING COMPLETED SUCCESSFULLY!")
    print("="*50)
    
    # Show results
    print("\nGenerated files:")
    for dir_path in output_dirs:
        if Path(dir_path).exists():
            file_count = len(list(Path(dir_path).glob("*")))
            print(f"  {dir_path}: {file_count} files")

if __name__ == "__main__":
    main() 