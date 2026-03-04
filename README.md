# Control de Gastos Personales - Google Apps Script

Este proyecto consiste en un sistema de **Control de Gastos** basado en Google Sheets (Excel en la nube), diseñado para realizar un seguimiento mensual y diario de consumos personales. El script automatiza la conversión de los montos registrados en Bolívares (VES) a su equivalente en Dólares (USD) utilizando la tasa oficial del **Banco Central de Venezuela (BCV)**.

## 📊 Metodología del Control de Gastos

- **Registro Diario**: El usuario debe actualizar su hoja excel/Sheets diariamente, ingresando los gastos realizados en Bolívares según el mes y la fecha actual.
- **Cálculo de Conversión**: El script localiza automáticamente la fila correspondiente a la fecha de hoy, toma el monto en Bolívares ingresado por el usuario y calcula su valor en Dólares basándose en la tasa del día extraída en tiempo real.
- **Histórico**: Permite llevar un control preciso de cuánto se está gastando realmente en divisas, evitando la desactualización por inflación.

## 🚀 Funcionalidades del Script

- **Extracción BCV**: Obtiene la tasa del USD oficial directamente desde el portal del Banco Central.
- **Automatización**: Busca la fila de la fecha actual y registra la conversión sin necesidad de cálculos manuales.
- **Menú de Usuario**: Añade un botón de "Gestión de Precios" en la interfaz de la hoja para ejecutar el proceso con un clic.

## 🛠️ Configuración inicial (Desde Excel a Sheets)

Con el archivo `.xlsx` descargado, procede a subirlo a tu Drive personal y sigue estos pasos para activar el sistema:

### 1. Convertir a Google Sheets

El Apps Script **no funciona** directamente sobre el formato `.xlsx`.

* Abre el archivo en Drive.
* Ve a **Archivo > Guardar como hoja de cálculo de Google**.
* *Esto creará un nuevo archivo con el icono verde de Sheets.*
  
<img width="537" height="317" alt="image" src="https://github.com/user-attachments/assets/95db94a6-2cc1-4953-aa71-10591cca811b" />

* Procederemos a trabajar sobre este archivo, asi que puedes borrar el anterior tranquilamente.

### 2. Vincular el script a tu Hoja de Cálculo (Drive)
1. En el nuevo archivo ve al menú superior y selecciona **Extensiones** > **Apps Script**.
2. Se abrirá una nueva pestaña con el editor de código. Borra cualquier código existente y pega el contenido del archivo [codigo.gs](codigo.gs).
3. Cambia el nombre del proyecto (arriba a la izquierda) a algo como "Conversor de Precios" (opcional).
4. Haz clic en el icono del **disco (Guardar)**.

### 3. Autorización de permisos
Al ser un script que consulta una web externa (`UrlFetchApp`) y modifica tu hoja, Google te pedirá permisos la primera vez:
1. En el editor de Apps Script, selecciona la función `onOpen` en el desplegable superior y dale a **Ejecutar**.
2. Aparecerá un cuadro de diálogo de "Autorización necesaria". Haz clic en **Revisar permisos**.
3. Elige tu cuenta de Google.
4. Si aparece un aviso de "Google no ha verificado esta aplicación", haz clic en **Configuración avanzada** y luego en **Ir a Conversor de Precios (no seguro)**.
5. Haz clic en **Permitir**.

### 4. Uso en la Hoja de Cálculo
1. Regresa a tu hoja de cálculo y **recarga la página** (F5).
2. Verás que aparece un nuevo menú al final llamado **Gestión de Precios**.
3. Para realizar la conversión, simplemente haz clic en **Gestión de Precios** > **Convertir BCV a Dólar**.

## 📋 Requisitos de la Hoja
Para que el script funcione correctamente sin modificaciones, la hoja debe cumplir:
- La columna 1 debe contener las fechas.
- El script busca la fecha de "hoy".
- Los resultados se escriben en las columnas 17 (Q) y 18 (R).

---
*Nota: Este script depende de la estructura HTML de la página del BCV. Si la página cambia su diseño, la función `getTasaBCV` podría requerir ajustes.*
