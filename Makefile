# ---------------------------------------------------------------------------
# Atajos del entorno dockerizado.
#
# `make` a secas levanta el mural. `make help` lista todo lo demás.
# ---------------------------------------------------------------------------
SHELL := /bin/bash
.DEFAULT_GOAL := up

DC  := docker compose
EXE := $(DC) exec mural
# Sin TTY: para usar dentro de scripts o CI, donde no hay terminal interactiva.
RUN := $(DC) exec -T mural

# Argumentos libres para `make npm`. Evita que make interprete "install"
# como un target suyo.
ARGS = $(filter-out $@,$(MAKECMDGOALS))
%:
	@:

.PHONY: help up down restart ps logs env deps build rebuild destroy \
        tv tv-down sh npm contenido url

help: ## Muestra esta ayuda
	@echo ""
	@echo "  Uso: make <target>"
	@echo ""
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo ""

## --------------------------------------------------------------------------
## Día a día
## --------------------------------------------------------------------------

up: ## Levanta el mural con recarga en vivo (esto hace `make` a secas)
	@$(MAKE) --no-print-directory env
	@$(DC) build mural
	@$(MAKE) --no-print-directory deps
	@$(DC) up -d mural
	@set -a; . ./.env; set +a; \
	 echo ""; \
	 echo "  ✔ Mural en http://localhost:$${MURAL_PORT:-4200}"; \
	 echo ""; \
	 echo "    Textos: frontend/public/contenido/mural.json"; \
	 echo "    Fotos:  frontend/public/contenido/fotos/"; \
	 echo ""; \
	 echo "    Para el televisor, usa 'make tv' (compilado, sin recarga)."; \
	 echo ""

down: ## Detiene los contenedores
	@$(DC) --profile tv down

restart: ## Reinicia el contenedor de desarrollo
	@$(DC) restart mural

ps: ## Estado de los contenedores
	@$(DC) --profile tv ps

logs: ## Logs en vivo (Ctrl-C para salir)
	@$(DC) logs -f

## --------------------------------------------------------------------------
## El televisor
## --------------------------------------------------------------------------

# La IP importa: el televisor no puede abrir `localhost`, porque ahí está él
# mismo. Necesita la IP de esta máquina dentro de la red local, y buscarla a
# mano es el paso donde siempre se pierde tiempo.
tv: ## Compila el mural y lo sirve listo para abrir desde el televisor
	@$(MAKE) --no-print-directory env
	@$(DC) --profile tv up -d --build tv
	@set -a; . ./.env; set +a; \
	 ip=$$(hostname -I 2>/dev/null | awk '{print $$1}'); \
	 echo ""; \
	 echo "  ✔ Mural compilado y sirviéndose."; \
	 echo ""; \
	 echo "    En el navegador del televisor, abre:"; \
	 echo "      http://$${ip:-<ip-de-esta-maquina>}:$${TV_PORT:-8080}"; \
	 echo ""; \
	 echo "    El televisor y esta máquina tienen que estar en la misma red."; \
	 echo ""

tv-down: ## Detiene solo el mural del televisor
	@$(DC) --profile tv stop tv

## --------------------------------------------------------------------------
## Contenido
## --------------------------------------------------------------------------

contenido: ## Recuerda dónde van los textos y las fotos
	@echo ""
	@echo "  Textos:  frontend/public/contenido/mural.json"
	@echo "  Fotos:   frontend/public/contenido/fotos/"
	@echo ""
	@echo "  Deja las fotos ahí y apúntalas desde el JSON. No hay que"
	@echo "  recompilar: el mural relee el archivo cada minuto solo."
	@echo ""
	@ls -1 frontend/public/contenido/fotos/ 2>/dev/null | grep -v '^\.' \
	  | sed 's/^/    - /' || true
	@echo ""

url: ## Muestra la URL a la que apunta el QR ahora mismo
	@grep -o '"url": *"[^"]*"' frontend/public/contenido/mural.json \
	  | sed 's/.*: *"/    /; s/"$$//'

## --------------------------------------------------------------------------
## Mantenimiento
## --------------------------------------------------------------------------

env: ## Crea el .env a partir del ejemplo si todavía no existe
	@[ -f .env ] || { cp .env.example .env; echo "  → creado .env"; }

# npm install y no npm ci: en desarrollo se agregan paquetes seguido y `ci`
# borra node_modules entero cada vez. El `ci` está donde corresponde, en la
# etapa `build` del Dockerfile, que es la que tiene que ser reproducible.
deps: ## Instala las dependencias dentro del contenedor
	@$(DC) run --rm --no-deps -T mural npm install --no-audit --no-fund

build: ## Reconstruye la imagen
	@$(DC) build mural

rebuild: ## Reconstruye la imagen desde cero, sin caché
	@$(DC) build --no-cache mural
	@$(DC) up -d mural

destroy: ## Borra contenedores Y las dependencias instaladas
	@read -p "  Esto borra el volumen de node_modules. ¿Seguro? [s/N] " ok; \
	 [[ "$$ok" == "s" || "$$ok" == "S" ]] && $(DC) --profile tv down -v || echo "  cancelado"

sh: ## Abre una shell dentro del contenedor
	@$(EXE) sh

npm: ## Ejecuta npm dentro del contenedor. Ej: make npm "install jspdf"
	@$(EXE) npm $(ARGS)
