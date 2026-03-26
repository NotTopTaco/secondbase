.PHONY: run install install-backend install-frontend install-pipeline \
       dev-backend dev-frontend build clean pipeline pipeline-incremental \
       check stop

# ── Run everything ───────────────────────────────────────────────
run: install
	@echo "Starting SecondBase..."
	@mkdir -p data
	@trap 'kill 0' INT TERM; \
	cd /Users/jacob/src/github.com/NotTopTaco/secondbase && npx tsx src/index.ts & \
	cd /Users/jacob/src/github.com/NotTopTaco/secondbase/client && npx vite --host & \
	wait

# ── Install ──────────────────────────────────────────────────────
install: install-backend install-frontend

install-backend:
	npm install

install-frontend:
	cd client && npm install

install-pipeline:
	pip install -r requirements.txt

# ── Individual dev servers ───────────────────────────────────────
dev-backend:
	npx tsx watch src/index.ts

dev-frontend:
	cd client && npx vite --host

# ── Build ────────────────────────────────────────────────────────
build:
	npx tsc
	cd client && npx vite build

# ── Pipeline ─────────────────────────────────────────────────────
pipeline:
	python -m pipeline.run --full --season $(or $(SEASON),2026)

pipeline-incremental:
	python -m pipeline.run --incremental --days $(or $(DAYS),7)

# ── Checks ───────────────────────────────────────────────────────
check:
	npx tsc --noEmit
	cd client && npx tsc --noEmit

# ── Cleanup ──────────────────────────────────────────────────────
clean:
	rm -rf dist client/dist

stop:
	@-pkill -f "tsx src/index.ts" 2>/dev/null || true
	@-pkill -f "vite" 2>/dev/null || true
	@echo "Stopped."
