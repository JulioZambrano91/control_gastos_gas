const hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
const lastRow = hoja.getLastRow();

function onOpen(){
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("🔹 Calcular Precio")
    .addItem('Tasa BCV a DOLAR ', 'bcvToDolar')
    .addToUi();
}


/**
 * Setea la conversion de los gastos y lo transforma a dolares, ademas de setear la tasa 
 */

function bcvToDolar(){
  
  const tasa = getTasaBCV();
  const items = getBolivares();

  Logger.log("Items que llego: "+items);
  
  const bolivares = items.monto;
  const row = items.fila;
  Logger.log("Fila a cambiar: "+ row)

  if (isNaN(tasa)) throw new Error("Tasa Invalida: "+tasa);

  const totalBs = bolivares.reduce((acc, suma) => {
    let valor = parseInt(suma) || 0;
    return acc + valor;
  }, 0);

  if (!totalBs ||  totalBs <= 0 || totalBs == null) throw new Error("Monto Invalido: "+totalBs);

  const conversion = totalBs/tasa;

  Logger.log("Monto Total BS: " + totalBs);
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

      var inicio = response.indexOf("<strong>", posicionUSD) + 8; 
      var fin = response.indexOf("</strong>", inicio);
      
      var textoTasa = response.substring(inicio, fin).trim(); // "339,14950000"
      
      var tasaLimpia = textoTasa.replace(/\./g, "").replace(",", ".");
      var numeroFinal = parseFloat(tasaLimpia.substring(0, 6));
      
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

      for (let i = 0; i < fechas.length; i++){

        let dateRow = new Date(fechas[i][0]);
        dateRow.setHours(0,0,0,0);

        if (dateRow.getTime() === today.getTime()){
                        //GetRange --> fila | columna | filas | columnas
          const bolivares = hoja.getRange(1,i+1, lastRow-2, 11).getValues();
          Logger.log(bolivares[i]);

          Logger.log("Gastos de hoy (monto): "+bolivares[i]);
          return {monto: bolivares[i], fila: i+1}; 
        } 
      }

      throw new Error("Fecha no encontrada:  " + today.getTime());

    } catch (e){
      Logger.log(e);
      return "NOT_DATA";
    }

}


