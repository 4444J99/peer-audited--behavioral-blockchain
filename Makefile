.PHONY: install dev dev-turbo build test clean docker-up pitch test-e2e test-e2e-ui

install:
	npm install

dev:
	npm run dev

dev-turbo:
	npm run dev:turbo

build:
	npx turbo run build

test:
	npx turbo run test

clean:
	npx turbo run clean

docker-up:
	docker compose --env-file .env -f .config/docker/docker-compose.yml up -d

pitch:
	cd src/pitch && npm run build

test-e2e:
	npx playwright test

test-e2e-ui:
	npx playwright test --ui
