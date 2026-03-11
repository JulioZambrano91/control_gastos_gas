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

## 📦 Configuración e Instalación (Automatizada con Make)

Para simplificar la ejecución, utiliza el `Makefile` incluido en la raíz del proyecto.

### 1. Instalación Inicial
Ejecuta el siguiente comando para instalar todas las dependencias (Backend y Frontend):
```bash
make install
```

### 2. Configurar Base de Datos
Crea la base de datos SQLite y las tablas necesarias:
```bash
make setup-db
```

### 3. Ejecución de la Aplicación
Necesitarás **dos terminales** abiertas:

- **Terminal 1 (Backend/Server)**:
  ```bash
  make run-server
  ```
  *El servidor correrá en `http://localhost:3001`.*

- **Terminal 2 (Frontend/Client)**:
  ```bash
  make run-front
  ```
  *La aplicación estará disponible en `http://localhost:5173`.*

---

## 🛠️ Comandos Manuales (Alternativa si no usas Make)

- **Backend**: `cd backend && node index.js`
- **Frontend**: `cd frontend && npm run dev`

## 💡 Cómo funciona

1. **Tasa en Tiempo Real**: Al iniciar, el backend consulta la página del BCV para obtener la tasa del día. Si ya existe una tasa para la fecha actual en la base de datos, la utiliza.
2. **Registro de Gastos**: El usuario ingresa la descripción y el monto en Bolívares.
3. **Conversión Automática**: El backend calcula el equivalente en USD usando la tasa recuperada y guarda toda la información en la base de datos SQLite.
4. **Historial**: Puedes ver todos tus gastos ordenados por fecha con su respectiva conversión.

---
*Este proyecto es una evolución del script original de Google Apps Script hacia una aplicación web independiente.*
