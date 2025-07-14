#!/bin/bash
# Test script with minimal samples to verify setup
echo "Testing SCW-VTON with minimal samples..."

# Test only the warping step with 1 sample
python test_for_step1.py --outdir ./results --dataroot ./data --ckpt_dir ./ckpts --pair_mode unpaired --batch-size 1 --only_warping

echo "Test completed! Check results/unpaired/warp_cloth/ and results/unpaired/warp_mloth/ for output files." 