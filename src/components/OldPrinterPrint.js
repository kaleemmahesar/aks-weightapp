import React from "react";

// Custom date formatting function for the specific format required
const formatDateTimeForPrint = (dateString) => {
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  
  // Format date as DD/MM/YY
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are 0-indexed
  const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
  const formattedDate = `${day}/${month}/${year}`;
  
  // Format time as H:MM AM/PM or HH:MM AM/PM
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  // Format minutes to always have 2 digits
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  const formattedTime = `${hours}:${formattedMinutes} ${ampm}`;
  
  return `${formattedDate} @ ${formattedTime}`;
};

const OldPrinterPrint = ({ record, slipType }) => {
  // Function to calculate Munds from net weight
  const kgToMundsString = (inputKg) => {
    const n = Number(inputKg) || 0;
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);

    let munds = Math.floor(abs / 40);
    let remKg = Math.round(abs % 40);

    // handle edge case: 40 kg remainder
    if (remKg === 40) {
      munds += 1;
      remKg = 0;
    }

    return { sign, munds, remKg };
  };

  const { sign, munds, remKg } = kgToMundsString(record.net_weight);

  const handlePrint = () => {
    const win = window.open("", "", "width=800,height=600");
    if (!win) return alert("Popup blocked! Please allow popups.");

    const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Weighbridge Slip</title>
      <style>
        @media print {
          @page { 
            size: 8in 5.5in; 
            margin: 0; 
          }

          html, body {
            margin: 0; 
            padding: 0;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            line-height: 1.3;
            width: 8in;
            height: 5.5in;
            overflow: hidden;
          }

          .slip-container {
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            padding: 3mm 8mm 3mm 20mm;
            background: #fff;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .center-content {
            width: 100%;
            margin: 0 auto;
            text-align: left;
          }

          .party-line {
            font-size: 16px;
            margin-bottom: 5px;
            font-weight: bold;
          }

          .product-line {
            font-size: 14px;
            margin-bottom: 10px;
            font-weight: bold;
          }

          .weight-line {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 3px;
            align-items: center;
          }

          .vehicle-info {
            width: 15%;
          }

          .serial-info {
            width: 15%;
          }

          .datetime-info {
            width: 25%;
          }

          .weight-info {
            width: 20%;
            text-align: right;
            font-size: 22px;
            font-weight: bolder;
          }

          .weight-type {
            width: 5%;
            text-align: left;
            font-size: 16px;
            font-weight: bold;
          }

          .net-weight-line {
            text-align: right;
            font-size: 16px;
            font-weight: bold;
            margin: 5px 0;
            padding-right: 60px;
          }

          .result-line {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 3px;
          }

          .result-label {
            width: 30%;
          }

          .result-value {
            width: 30%;
            text-align: right;
          }

          .footer-line {
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            color: #0000ff;
            margin-top: 15px;
          }
          
          .price-line {
            display: flex;
            justify-content: flex-end;
            font-size: 12px;
            margin-top: 15px;
            align-items: center;
            padding-right: 30px;
          }
          .price-line.munds {
            padding-right: 22px;
          }
          .price-label {
            font-weight: bold;
            margin-right: 12px;
          }
          
          .price-value {
            font-size: 20px;
            font-weight: bolder;
            width: auto;
            min-width: 60px;
            text-align: right;
            white-space: nowrap;
          }
          
          .munds-line {
            display: flex;
            justify-content: flex-end;
            font-size: 12px;
            margin-bottom: 3px;
          }
          
          .munds-label {
            font-weight: normal;
            margin-right: 10px;
          }
          
          .munds-value {
            font-size: 20px;
            font-weight: bolder;
            width: auto;
            min-width: 60px;
            text-align: right;
            white-space: nowrap;
          }
          
          hr {
            border: none;
            border-top: 1px solid #000;
            margin: 15px 0 25px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="slip-container">
        <div class="center-content">
          <div class="party-line">
           ${record.party_name || "N/A"}
          </div>
          
          <div class="product-line">
            ${record.product || "N/A"}
          </div>
          
          <hr>
          ${
            slipType === "first" ? 
            `<div class="weight-line">
              <span class="vehicle-info">${record.vehicle_type || "N/A"}</span>
              <span class="serial-info">${record.vehicle_id || "N/A"}</span>
              <span class="datetime-info">${formatDateTimeForPrint(record.first_weight_time)}</span>
              <span class="weight-info">${record.first_weight || "0.00"} KG</span>
              <span class="weight-type">G</span>
            </div>
            <hr>
            <div class="price-line">
              <span class="price-label">Price:</span>
              <span class="price-value">${record.total_price || "0"}</span>
            </div>` : 
            `<div class="weight-line">
              <span class="vehicle-info">${record.vehicle_type || "N/A"}</span>
              <span class="serial-info">${record.vehicle_id || "N/A"}</span>
              <span class="datetime-info">${formatDateTimeForPrint(record.first_weight_time)}</span>
              <span class="weight-info">${record.first_weight || "0.00"} KG</span>
              <span class="weight-type">G</span>
            </div>
            <div class="weight-line">
              <span class="vehicle-info">${record.vehicle_type || "N/A"}</span>
              <span class="serial-info">${record.vehicle_id || "N/A"}</span>
              <span class="datetime-info">${formatDateTimeForPrint(record.second_weight_time)}</span>
              <span class="weight-info">${record.second_weight || "0.00"} KG</span>
              <span class="weight-type">T</span>
            </div>
            <div class="weight-line">
              <span class="vehicle-info"></span>
              <span class="serial-info"></span>
              <span class="datetime-info"></span>
              <span class="weight-info">${record.net_weight || "0.00"} KG</span>
              <span class="weight-type">N</span>
            </div>`
          }
          <hr>
          
          ${
            slipType !== "first" ? 
            `<div class="price-line munds">
              <span class="price-label">Munds @40 kg:</span>
              <span class="price-value">${sign}${munds}-${remKg}</span>
            </div>
            <div class="price-line">
              <span class="price-label">Price:</span>
              <span class="price-value">${record.total_price || "0"}</span>
            </div>` : ""
          }
        </div>
      </div>
    </body>
    </html>`;

    win.document.write(html);
    win.document.close();
    win.onload = () => { win.print(); win.close(); };
  };

  return (
    <button className="btn btn-warning" onClick={handlePrint}>
      Print with Old Printer
    </button>
  );
};

export default OldPrinterPrint;