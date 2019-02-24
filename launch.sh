#!/bin/bash

# Install preriquisites
# =====================
wget -O - https://github.com/dappnode/DAppNode/releases/download/v0.1.18/dappnode_install_pre.sh | bash

# Auto-configure the server
# =========================

# Load previously set envs (if file exists)
ENV_FILE=".env" && test -f $ENV_FILE && source $ENV_FILE

if [ -z "$PRIVATE_KEY" ]
then
    echo "Enter the private key of the faucet account"
    echo "  i.e. 144a10dfcce26b149372b2d978e61278..."
    read -p "  Private key: " PRIVATE_KEY
else
    echo "Reading previously set PRIVATE_KEY: $PRIVATE_KEY"
fi

if [ -z "$WEB3_PROVIDER" ]
then
    echo "Enter the URL of a kovan node JSON RPC to be used by the faucet. Leave empty to use Infura"
    echo "  i.e. 'http://87.241.23.5/kovan:8545', 'https://kovan.infura.io/v3/your-token', ... "
    read -p "  Kovan node JSON RPC URL: " WEB3_PROVIDER
else
    echo "Reading previously set WEB3_PROVIDER: $WEB3_PROVIDER"
fi

# Save envs

cat >$ENV_FILE <<EOL
PRIVATE_KEY=$PRIVATE_KEY
WEB3_PROVIDER=$WEB3_PROVIDER
EOL

# Download repos and launch
# =========================

rm -rf shortcode/ && git clone https://github.com/dapplion/SwarmCityShortcode.git shortcode
rm -rf faucet/ && git clone https://github.com/dapplion/SwarmCityFaucet.git faucet
rm -rf shortener/ && git clone https://github.com/dapplion/SwarmCityShortener.git shortener
rm -rf chat/ && git clone https://github.com/dapplion/SwarmCityChat.git chat

docker-compose up --build
