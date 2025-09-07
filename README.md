# Skype/Teams Call extractor

To use with messages.json from a data takeout!

## Dev
npm install
npm run dev

## Build
npm run build
npm run preview

## Docker
docker build -t call-extractor .
docker run --rm -p 8080:80 call-extractor
