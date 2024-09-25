# #!/bin/bash
# export CUSTOMER_URL=https://api.myvictoria.co.id/customer
# # export CUSTOMER_URL=https://vgh-api.otesuto.com/customer
# export DIFFERENCE_CUSTOMER=true
# export K6_WEB_DASHBOARD=true
# k6 run ./src/customer/redeem.js --summary-export ./result/redeem/redeem-1.json

export CUSTOMER_URL=https://vgh-api.otesuto.com/customer
# export CUSTOMER_URL=http://localhost:3700/customer/v0
# export CUSTOMER_URL=https://api.myvictoria.co.id/customer
export DIFFERENCE_CUSTOMER=true
export K6_WEB_DASHBOARD=true
export ACTUAL_CUSTOMER=20

# Use the first parameter as the dynamic part
if [ -z "$1" ]; then
  echo "Usage: $0 <redeem_number>"
  exit 1
fi

redeem_number=$1

# Use redeem_number here
k6 run ./src/customer/redeem.js --summary-export ./result/redeem/redeem-${redeem_number}.json
