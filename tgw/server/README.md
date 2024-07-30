# Theta Game World server setup:

1. Install dependencies
```
npm i
```


2. Run the Edge Storage node

```
# all are in this directory

git clone https://github.com/thetatoken/theta-edge-store-demos
mkdir bin
wget -O bin/edgestore https://theta-downloader.s3.amazonaws.com/edgestore/alpha-preview/linux/edgestore
chmod +x bin/edgestore

mkdir -p privatenet/single-node

cp -r ./theta-edge-store-demos/configs/single-node/node privatenet/single-node

./bin/edgestore start --config=./privatenet/single-node/node --password=qwertyuiop

```

3. Make the appropriate changes in .env file.

4. Run the server
```
npm run dev
```