# Makefile para Control de Gastos

.PHONY: install setup-db run-backend run-frontend run-all

# Instalación de todas las dependencias
install:
	cd backend && npm install
	cd frontend && npm install

# Iniciar el servidor con MOCK (Instala dependencias y usa flag --mock)
run-mock:
	cd backend && npm install && node index.js --mock

# Iniciar el servidor CON base de datos (Instala dependencias)
run-server:
	cd backend && npm install && node index.js

# Iniciar el Frontend (Instala dependencias antes de npm run dev)
run-front:
	cd frontend && npm install && npm run dev

# Configuración inicial de la base de datos
setup-db:
	cd backend && npx prisma migrate dev --name init

# Ayuda
help:
	@echo "Comandos disponibles:"
	@echo "  make install      - Instala todo"
	@echo "  make run-mock     - Backend en memoria (Sin DB)"
	@echo "  make run-server   - Backend con SQLite (Con DB)"
	@echo "  make run-front    - Levanta el Frontend"
