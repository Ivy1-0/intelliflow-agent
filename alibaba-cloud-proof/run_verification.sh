#!/bin/bash
# Run Alibaba Cloud verification

echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Running Alibaba Cloud services verification..."
python alibaba_cloud_services.py

echo ""
echo "Verification complete. Screenshot this output for proof of deployment."
