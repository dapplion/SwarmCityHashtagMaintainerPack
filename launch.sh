rm -rf shortcode/ && git clone https://github.com/dapplion/SwarmCityShortcode.git shortcode
rm -rf faucet/ && git clone https://github.com/dapplion/SwarmCityFaucet.git faucet
rm -rf shortener/ && git clone https://github.com/dapplion/SwarmCityShortener.git shortener
rm -rf chat/ && git clone https://github.com/dapplion/SwarmCityChat.git chat

docker-compose up --build
