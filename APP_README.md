# App de Control de Gastos Personales (VES/USD)

Esta es una aplicación web completa (Full-Stack) diseñada para modernizar tu sistema de control de gastos. Permite registrar gastos diarios en Bolívares y realizar la conversión automática a Dólares basada en la tasa oficial del BCV.

## 🚀 Arquitectura del Proyecto

- **Frontend**: React.js + Vite + Tailwind CSS + Lucide Icons.
- **Backend**: Node.js + Express.
- **Base de Datos**: SQLite gestionada con Prisma ORM.
- **Web Scraping**: Integración de Axios para obtener la tasa del BCV en tiempo real.

## 🛠️ Requisitos previos

- Tener instalado **Node.js** (v18 o superior).
- Tener instalado **npm**.

## 📦 Configuración e Instalación

### 1. Preparar el Backend
1. Abre una terminal y navega a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicializa la base de datos (SQLite):
   ```bash
   npx prisma migrate dev --name init
   ```
4. Inicia el servidor de backend:
   ```bash
   node index.js
   ```
   *El servidor correrá en `http://localhost:3001`.*

### 2. Preparar el Frontend
1. Abre una nueva terminal y navega a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible en `http://localhost:5173`.*

## 💡 Cómo funciona

1. **Tasa en Tiempo Real**: Al iniciar, el backend consulta la página del BCV para obtener la tasa del día. Si ya existe una tasa para la fecha actual en la base de datos, la utiliza.
2. **Registro de Gastos**: El usuario ingresa la descripción y el monto en Bolívares.
3. **Conversión Automática**: El backend calcula el equivalente en USD usando la tasa recuperada y guarda toda la información en la base de datos SQLite.
4. **Historial**: Puedes ver todos tus gastos ordenados por fecha con su respectiva conversión.

---
*Este proyecto es una evolución del script original de Google Apps Script hacia una aplicación web independiente.*
