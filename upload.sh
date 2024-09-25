#!/bin/bash
# export CUSTOMER_URL=https://api.myvictoria.co.id/identity
# # export CUSTOMER_URL=https://vgh-api.otesuto.com/identity
# export DIFFERENCE_IDENTITY=true
# export K6_WEB_DASHBOARD=true
# export TOTAL_DATA_NASABAH=200
# k6 run ./src/cms/upload_customer.js --summary-export ./result/upload/upload-1.json

export IDENTITY_URL=https://vgh-api.otesuto.com/identity
# export IDENTITY_URL=http://localhost:3100/identity/v0
# export IDENTITY_URL=https://api.myvictoria.co.id/identity
export DIFFERENCE_IDENTITY=true
export K6_WEB_DASHBOARD=true
export TOTAL_DATA_NASABAH=10000

# Use the first parameter as the dynamic part
if [ -z "$1" ]; then
  echo "Usage: $0 <upload_number>"
  exit 1
fi

upload_number=$1

# Use upload_number here
k6 run ./src/cms/upload_customer.js --summary-export ./result/upload/upload-${upload_number}.json
