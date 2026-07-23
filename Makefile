.PHONY: install dev dev-turbo build test clean docker-up deploy deploy-down pitch test-e2e test-e2e-ui

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

# One-command deploy. `make deploy` brings up the full local stack with zero
# config; `make deploy TARGET=render` triggers a production deploy on Render.
deploy:
	bash scripts/deploy.sh $(or $(TARGET),local)

deploy-down:
	bash scripts/deploy.sh down

pitch:
	cd src/pitch && npm run build

test-e2e:
	npx playwright test

test-e2e-ui:
	npx playwright test --ui
