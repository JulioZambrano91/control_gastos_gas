const hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
const lastRow = hoja.getLastRow();

function onOpen(){
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("Gestión de Precios")
    .addItem('Convertir BCV a Dólar', 'bcvToDolar')
    .addToUi();
}


/**
 * Setea la conversion de los gastos y lo transforma a dolares, ademas de setear la tasa 
 */

function bcvToDolar(){
  
  const items = getBolivares();
  const bolivares = items.monto;
  const row = items.fila;
  Logger.log("Items que llego: "+items);
  
  const tasa = hoja.getRange(row, 18).getValue() > 0 ? hoja.getRange(row, 18).getValue() : getTasaBCV();
  Logger.log("Tasa: "+tasa)

  Logger.log("Fila a cambiar: "+ row)

  if (isNaN(tasa)) throw new Error("Tasa Invalida: "+tasa);

  const conversion = bolivares/tasa;

  if (!conversion ||  conversion <= 0 || conversion == null) throw new Error("Monto Invalido: "+conversion);

  Logger.log("Conversion de BS a $: "+ conversion);

  hoja.getRange(row, 17).setValue(conversion);
  hoja.getRange(row, 18).setValue(tasa);

}

/**
 * Obtiene la tasa BCV del dolar en la pagina oficial
 */

function getTasaBCV() {
  const response = UrlFetchApp.fetch("https://www.bcv.org.ve/").getContentText();

  const posicionUSD = response.indexOf("USD");
  try{
    if (posicionUSD !== -1) {

      const inicio = response.indexOf("<strong>", posicionUSD) + 8; 
      const fin = response.indexOf("</strong>", inicio);
      
      let textoTasa = response.substring(inicio, fin).trim(); // "339,14950000"
      
      const tasaLimpia = textoTasa.replace(/\./g, "").replace(",", ".");
      const numeroFinal = parseFloat(tasaLimpia.substring(0, 6));
      
      Logger.log("Tasa del dia: " + numeroFinal);
      return numeroFinal;
    }
  } catch(e){
    Logger.log(e);
    return "NOT_DATA";
  }
}

/**
 * Obtiene un array de elementos de los gastos en BS
 */

function getBolivares(){
    try{
      const today = new Date();
      today.setHours(0,0,0,0);

      const fechas = hoja.getRange(1, 1, lastRow - 2, 1).getValues();  
      Logger.log("Fecha de hoy: "+ today);

      for (let i = 0; i < fechas.length; i++){

        let dateRow = new Date(fechas[i][0]);
        dateRow.setHours(0,0,0,0);

        if (dateRow.getTime() === today.getTime()){
           Logger.log("Fecha a comparar: "+ dateRow);

          const bolivares = hoja.getRange(i+1, 16).getValues();

          Logger.log("Gastos de hoy (monto): "+bolivares);
          return {monto: bolivares, fila: i+1}; 
        } 
      }

      throw new Error("Fecha no encontrada:  " + today.getTime());

    } catch (e){
      Logger.log(e);
      return "NOT_DATA";
    }

}


