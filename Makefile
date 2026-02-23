.PHONY: install dev build test clean docker-up pitch

install:
	npm install

dev:
	npx turbo run dev

build:
	npx turbo run build

test:
	npx turbo run test

clean:
	npx turbo run clean

docker-up:
	docker-compose up -d

pitch:
	cd src/pitch && npm run build
