import React from "react";
import { useSelector } from "react-redux";
import { FaBalanceScale  } from "react-icons";
import logo from '../assets/scale.png';
import { formatToPST } from '../utils/dateUtils';
import OldPrinterPrint from './OldPrinterPrint'; // Import the new component

const PrintModal = ({ show, slipType, onClose }) => {
  const { selectedRecord: record } = useSelector(state => state.records || {});
  // console.log('PrintModal - vehicle_type:', record?.vehicle_type, 'record:', record);
  
  if (!show || !record) return null; // Completely unmount when hidden

  // Helper function to format weight without unnecessary decimals
  const formatWeight = (weight) => {
    if (weight === null || weight === undefined || weight === "") return "0";
    const num = Number(weight);
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  function kgToMundsString(inputKg) {
  const n = Number(inputKg) || 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  // Use Math.trunc() instead of Math.floor() to handle negative numbers correctly
  let munds = Math.trunc(abs / 40);
  let remKg = Math.round(abs % 40); // integer remainder

  // handle edge case: 40 kg remainder
  if (remKg === 40) {
    munds += 1;
    remKg = 0;
  }

  return { sign, munds, remKg };
}


  const handleOldPrinterPrint = (slipType) => {
  const win = window.open("", "", "width=800,height=600");
  if (!win) return alert("Popup blocked! Please allow popups.");

  // Define vehicle types that require vehicle number display
  const vehicleTypesWithVehicleNumber = ['Truck', 'SixWheeler', 'DahWheeler', 'Rocket Double', 'Container', 'Shahzore', 'Datson', 'Mazda'];
  const shouldShowVehicleNumber = record.vehicle_number && vehicleTypesWithVehicleNumber.includes(record.vehicle_type);

  // Helper function to format weight without unnecessary decimals
  const formatWeight = (weight) => {
    if (weight === null || weight === undefined || weight === "") return "0";
    const num = Number(weight);
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const { sign, munds, remKg } = kgToMundsString(record.net_weight);

  // Check if vehicle type is Daalo/Daala or GadahGano for smaller print view
  const vehicleType = (record.vehicle_type || '').toLowerCase();
  const isSmallVehicle = vehicleType === "daalo" || vehicleType === "daala" || vehicleType === "gadahgano";

  // adjust top padding based on slip type
   let topPadding = isSmallVehicle ? "18mm" : "26mm"; // default for "first"
  if (slipType === "second" || slipType === "final") {
    topPadding = isSmallVehicle ? "14mm" : "20mm";
  }

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
        }

        .slip-container {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 3mm 8mm 3mm 20mm; /* More space from left for sidebar */
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

        .vehicle-number-line {
          font-size: 14px;
          margin-bottom: 5px;
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
          width: 250px;
          text-align: right;
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
          font-size: 22px;
          font-weight: bolder;
          width: 60px;
          text-align: right;
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
        
        ${shouldShowVehicleNumber ? `
        <div class="vehicle-number-line">
          Vehicle: ${record.vehicle_number}
        </div>` : ''}
        
        <hr>
        ${
          slipType === "first" ? 
          `<div class="weight-line">
            <span class="vehicle-info">${record.vehicle_type || "N/A"}</span>
            <span class="serial-info">${record.vehicle_id || "N/A"}</span>
            <span class="datetime-info">${formatToPST(record.first_weight_time)}</span>
            <span class="weight-info">${formatWeight(record.first_weight)} KG</span>
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
            <span class="datetime-info">${formatToPST(record.first_weight_time)}</span>
            <span class="weight-info">${formatWeight(record.first_weight)} KG</span>
            <span class="weight-type">G</span>
          </div>
          <div class="weight-line">
            <span class="vehicle-info">${record.vehicle_type || "N/A"}</span>
            <span class="serial-info">${record.vehicle_id || "N/A"}</span>
            <span class="datetime-info">${formatToPST(record.second_weight_time)}</span>
            <span class="weight-info">${formatWeight(record.second_weight)} KG</span>
            <span class="weight-type">T</span>
          </div>
          <div class="weight-line">
            <span class="vehicle-info"></span>
            <span class="serial-info"></span>
            <span class="datetime-info"></span>
            <span class="weight-info">${formatWeight(record.net_weight)} KG</span>
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


 const handlePrint = () => {
  const win = window.open("", "", "width=950,height=500");
  if (!win) {
    alert("پاپ اپ بلاک ہو گیا ہے! براہ کرم اس سائٹ کے لیے پاپ اپ کی اجازت دیں۔");
    return;
  }

  // Helper function to format weight without unnecessary decimals
  const formatWeight = (weight) => {
    if (weight === null || weight === undefined || weight === "") return "0";
    const num = Number(weight);
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  // Check if vehicle type is Daalo/Daala or GadahGano for smaller print view
  const vehicleType = (record.vehicle_type || '').toLowerCase();
  const isSmallVehicle = vehicleType === "daaloss" || vehicleType === "daalass" || vehicleType === "gadahganoss";

  const html = `
    <!doctype html>
    <html lang="ur">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
      <title>وزن سلپ</title>
      <style>
        @page { margin: 0; size: ${isSmallVehicle ? '80mm 160mm' : '80mm 220mm'}; }
        html,body { margin:0; padding:0; }
        body {
          font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif;
          direction: rtl;
          text-align: right;
          font-size: ${isSmallVehicle ? '8px' : '14px'};
          margin: 0;
          line-height: ${isSmallVehicle ? '1.3' : '1.6'};          /* better Urdu readability */
          word-spacing: 0.18em;     /* increase space between words */
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          -webkit-text-size-adjust: none;
          white-space: normal;
        }

        /* If you ever need to disable heavy ligatures, uncomment next block for testing:
        body.no-ligatures {
          font-variant-ligatures: none;
          font-feature-settings: "liga" 0, "clig" 0, "calt" 0;
          -webkit-font-feature-settings: "liga" 0, "clig" 0, "calt" 0;
        }
        */

        .slip-container { width:${isSmallVehicle ? '70mm' : '70mm'}; margin:0 auto; border:1px solid #000; padding:${isSmallVehicle ? '4px' : '6px'}; background:#fff; box-sizing:border-box; }
        .header { text-align:center; border-bottom:1px solid #000; padding-bottom:${isSmallVehicle ? '2px' : '6px'}; margin-bottom:${isSmallVehicle ? '3px' : '8px'}; }
        .company-name { font-size:${isSmallVehicle ? '11px' : '18px'}; font-weight:bold; }
        .company-details { font-size:${isSmallVehicle ? '8px' : '10px'}; margin:1px 0; }
        .copy-label { text-align:center; font-size:${isSmallVehicle ? '9px' : '14px'}; font-weight:bold; margin-bottom:${isSmallVehicle ? '4px' : '6px'}; }
        .content-section { margin:${isSmallVehicle ? '4px 0' : '6px 0'}; }
        .info-row { display:flex; justify-content:space-between; gap:${isSmallVehicle ? '4px' : '6px'}; margin:${isSmallVehicle ? '2px 0' : '4px 0'}; border-bottom:1px dotted #999; font-size:${isSmallVehicle ? '7px' : '11px'}; align-items:center; }
        .info-row .info-label { font-weight:bold; display:inline-block; min-width:${isSmallVehicle ? '50px' : '70px'}; white-space:normal; }
        .info-row .info-value { font-size:${isSmallVehicle ? '8px' : '13px'}; font-weight:bold; display:inline-block; white-space:normal; word-break:break-word; }
        .weight-section { border:1px solid #000; margin:${isSmallVehicle ? '4px 0' : '6px 0'}; padding:${isSmallVehicle ? '4px' : '6px'}; }
        .weight-row { display:flex; justify-content:space-between; margin:${isSmallVehicle ? '2px 0' : '3px 0'}; font-weight:bold; font-size:${isSmallVehicle ? '8px' : '13px'}; gap:${isSmallVehicle ? '4px' : '6px'}; align-items:center; }
        .net-weight { border:1px solid #000; padding:${isSmallVehicle ? '3px' : '4px'}; font-size:${isSmallVehicle ? '9px' : '14px'}; margin-top:${isSmallVehicle ? '3px' : '4px'}; }
        .warning { border:1px solid #000; padding:${isSmallVehicle ? '3px' : '4px'}; font-size:${isSmallVehicle ? '6px' : '10px'}; text-align:center; font-weight:bold; margin-top:${isSmallVehicle ? '4px' : '6px'}; }
        .footer { padding-top:${isSmallVehicle ? '4px' : '6px'}; margin-top:${isSmallVehicle ? '5px' : '8px'}; text-align:center; font-size:${isSmallVehicle ? '8px' : '10px'}; }
        .footer .eng { margin-top:${isSmallVehicle ? '5px' : '8px'}; text-align:center; font-family: Courier New, sans-serif; direction:ltr; font-size:${isSmallVehicle ? '6px' : '8px'}; letter-spacing:1px; display:block; }
        .page-break { page-break-after: always; margin:${isSmallVehicle ? '6px 0' : '10px 0'}; }
      </style>
    </head>
    <body>
      ${(slipType === "first" 
    ? ["کسٹمر کاپی"] 
    : ["کسٹمر کاپی","ٹھیکیدار کاپی"]
).map((copyType, index) => `
        <div class="slip-container">
          <div class="copy-label">${copyType}</div>
          <hr style="border: 1px dashed #000; margin: ${isSmallVehicle ? '3px 0 6px' : '5px 0 10px'};" />
          <div class="header">
            ${!isSmallVehicle ? `<img src="${logo}" alt="logo" style="width:30px;height:30px;display:block;margin:0 auto 4px auto" />` : ''}
            <div class="company-name">الحسینی کمپیوٹرائزڈ کانٹا</div>
            ${!isSmallVehicle ? `
            <div class="company-details">Near Bhand Chowk, Taulka Sijawal Junejo</div>
            <div class="company-details">Phone: 0331 4812277</div>
            ` : ''}
            <div class="company-details" style="font-weight:bold;font-size:${isSmallVehicle ? '9px' : '12px'};margin-top:${isSmallVehicle ? '4px' : '6px'};">
              ${slipType === "first" ? "پہلا وزن سلپ" : slipType === "second" ? "دوسرا وزن سلپ" : "حتمی وزن سلپ"}
            </div>
          </div>

          <div class="content-section">
            <div class="info-row">
              <span class="info-label">سیرئیل نمبر:</span>
              <span class="info-value">${record.vehicle_id || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">گاڑی نمبر:</span>
              <span class="info-value">${record.vehicle_number || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">پارٹی کا نام:</span>
              <span class="info-value">${record.party_name || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">پروڈکٹ:</span>
              <span class="info-value">${record.product || "N/A"}</span>
            </div>
          </div>

          <div class="weight-section">
            ${slipType !== "final" ? `
              <div class="weight-row">
                <span>پہلا وزن:</span>
                <span style="font-size:${isSmallVehicle ? '14px' : '18px'}">${record.first_weight ? formatWeight(record.first_weight) : "0"} کلو</span>
              </div>
              <div class="info-row">
                <span class="info-label" style="font-size:${isSmallVehicle ? '8px' : '11px'};">پہلے وزن کا وقت:</span>
                <span class="info-value" style="font-size:${isSmallVehicle ? '8px' : '11px'};  direction:ltr;">${formatToPST(record.first_weight_time)}</span>
              </div>` : ""}

            ${slipType === "final" && record.first_weight ? `
              <div class="weight-row">
                <span>موجودہ وزن:</span>
                <span style="font-size:${isSmallVehicle ? '14px' : '18px'}">${formatWeight(record.first_weight)} کلو</span>
              </div>
              <div class="info-row">
                <span class="info-label" style="font-size:${isSmallVehicle ? '8px' : '11px'};">وقت:</span>
                <span class="info-value" style="font-size:${isSmallVehicle ? '8px' : '11px'};">${formatToPST(record.first_weight_time)}</span>
              </div>` : ""}

            ${slipType !== "first" && record.second_weight ? `
              <div class="weight-row">
                <span>${slipType === "final" ? "خالی وزن:" : "دوسرا وزن:"}</span>
                <span style="font-size:${isSmallVehicle ? '14px' : '18px'}">${formatWeight(record.second_weight)} کلو</span>
              </div>
              ${slipType !== "final" ? `
                <div class="info-row">
                  <span class="info-label" style="font-size:${isSmallVehicle ? '8px' : '11px'};">دوسرے وزن کا وقت:</span>
                  <span class="info-value" style="font-size:${isSmallVehicle ? '8px' : '11px'}; direction:ltr;">${formatToPST(record.second_weight_time)}</span>
                </div>` : ""}` : ""}

            ${slipType !== "first" && record.net_weight ? `
              <div class="net-weight">
                <div class="weight-row">
                  <span>خالص وزن:</span>
                  <span style="font-size:${isSmallVehicle ? '14px' : '18px'}">${formatWeight(record.net_weight)} کلو</span>
                </div>
                <div class="weight-row">
  <span>من:</span>
  <span style="font-size:${isSmallVehicle ? '14px' : '18px'}; white-space: nowrap;">
    ${(({ sign, munds, remKg }) => `${sign}${munds} من ${remKg} کلو`)(kgToMundsString(record.net_weight))}
  </span>
</div>

              </div>` : ""}

            <div class="info-row" style="border-bottom:2px solid #333;font-size:16px;">
              <span class="info-label">کل قیمت:</span>
              <span class="info-value" style="font-weight:bold;color:#000;font-size:20px">${record.total_price || "0"}</span>
            </div>
          </div>

          <div class="warning">⚠️ براہ کرم روانگی سے پہلے وزن کی درستگی چیک کریں۔ بعد میں کوئی تبدیلی قبول نہیں کی جائے گی۔</div>

          ${!isSmallVehicle ? `
          <div class="footer">
            <div>تاریخ: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | وقت: ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
            <div class="eng">Software by <span style="display:inline-block;padding:2px 8px;font-weight:bold;border:1px solid #000;border-radius:6px;background:#f0f0f0">AKS</span> Solutions 0333-7227847</div>
          </div>
          ` : ''}
        </div>
        ${index === 0 ? '<div class="page-break"></div>' : ''}
      `).join('')}
    </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();

  // wait for fonts & images to load before printing
  const waitForResourcesAndPrint = async () => {
    try {
      // wait for the fonts (explicitly request the Urdu font)
      if (win.document.fonts && win.document.fonts.load) {
        // try to load at least one glyph / size for layout
        await win.document.fonts.load('16px "Noto Nastaliq Urdu"');
        await win.document.fonts.ready;
      }
    } catch (e) {
      // ignore: fallback to next step
    }

    // wait for images to load (logo)
    try {
      const imgs = Array.from(win.document.images || []);
      if (imgs.length) {
        await new Promise((resolve) => {
          let done = 0;
          const mark = () => {
            done++;
            if (done >= imgs.length) resolve();
          };
          imgs.forEach(img => {
            if (img.complete) mark();
            else {
              img.addEventListener('load', mark);
              img.addEventListener('error', mark);
            }
          });
          // safety timeout
          setTimeout(resolve, 3000);
        });
      }
    } catch (e) { /*ignore*/ }

    // small delay to let layout settle in print engine
    setTimeout(() => {
      try { win.focus(); win.print(); } catch (e) { /*ignore*/ }
      try { win.close(); } catch (e) {}
    }, 80);
  };

  // start the wait/print flow
  // if doc is already complete, run immediately; otherwise wait for load
  if (win.document.readyState === 'complete') waitForResourcesAndPrint();
  else {
    win.onload = waitForResourcesAndPrint;
    setTimeout(() => {
      if (!win.closed) waitForResourcesAndPrint();
    }, 1200);
  }
};




  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>

      {/* Modal */}
      <div
        className="modal d-block fade show"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-dialog-centered" style={{ 
          maxWidth: '860px', 
          width: '90%',
          margin: '0 auto'
        }}>
          <div className="modal-content" style={{ 
            minHeight: '370px',
            minWidth: '100%',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div className="modal-header" style={{ 
              padding: '1rem 2rem',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #dee2e6'
            }}>
              <h5 className="modal-title fw-bold" style={{ fontSize: '1.5rem' }}>
                Weighbridge Slip
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close">
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem 2rem' }}>
              <div className="text-center mb-4">
                <h3 className="mt-2 fw-bold">Al Hussaini Computerised Kanta</h3>
                <p>Near Bhand Chowk, Taulka Sijawal Junejo | Phone: 0331 4812277</p>
                <hr />
              </div>
              <h4 className="text-center mb-4 fw-bold">
                {slipType === "first"
                  ? "First Weight Slip"
                  : slipType === "second"
                    ? "Second Weight Slip"
                    : "Final Weight Slip"}
              </h4>

              {/* ✅ Common Info in 2-column grid */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="d-flex">
                    <strong className="me-2">Business Name:</strong>
                    <span className="text-uppercase">{record.business_name || 'N/A'}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <strong className="me-2">Vehicle Number:</strong>
                    <span className="text-uppercase">{record.vehicle_number || 'N/A'}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <strong className="me-2">Party Name:</strong>
                    <span className="text-uppercase">{record.party_name || 'N/A'}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <strong className="me-2">Product:</strong>
                    <span>{record.product || 'N/A'}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <strong className="me-2">Driver:</strong>
                    <span>{record.driver_name || record.driver || 'N/A'}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <strong className="me-2">Vehicle Type:</strong>
                    <span className="text-uppercase">{record.vehicle_type || 'N/A'}</span>
                  </div>
                </div>
                {record.bilty_number && (
                  <div className="col-md-6">
                    <div className="d-flex">
                      <strong className="me-2">Bilty Number:</strong>
                      <span>{record.bilty_number}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Weight Details */}
              <div className="row g-4">
                {/* ✅ First Slip Details */}
                {slipType !== "final" && (
                  <>
                    <div className="col-md-6">
                      <div className="d-flex">
                        <strong className="me-2">First Weight:</strong>
                        <span>{formatWeight(record.first_weight)} Kg</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex">
                        <strong className="me-2">First Weight Time:</strong>
                        <span>{formatToPST(record.first_weight_time)}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* ✅ Second Slip Details */}
                {slipType !== "first" && record.second_weight && (
                  <>
                    <div className="col-md-6">
                      <div className="d-flex">
                        <strong className="me-2">
                          {slipType === "final"
                            ? "Empty Weight:"
                            : "Second Weight:"}
                        </strong>
                        <span>{formatWeight(record.second_weight)} Kg</span>
                      </div>
                    </div>
                    {slipType !== "final" && (
                      <div className="col-md-6">
                        <div className="d-flex">
                          <strong className="me-2">Second Weight Time:</strong>
                          <span>{formatToPST(record.second_weight_time)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ✅ Final Slip Extra Details */}
                {slipType === "final" && record.second_weight && (
                  <>
                    <div className="col-md-6">
                      <div className="d-flex">
                        <strong className="me-2">Current Weight:</strong>
                        <span>{formatWeight(record.first_weight)} kg</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex">
                        <strong className="me-2">Current Weight Time:</strong>
                        <span>{formatToPST(record.first_weight_time)}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* ✅ Net Weight & Munds */}
                {slipType !== "first" && record.net_weight && (
                  <>
                    <div className="col-md-6">
                      <div className="d-flex">
                        <strong className="me-2">Net Weight:</strong>
                        <span>{formatWeight(record.net_weight)} kg</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex">
                        <strong className="me-2">Munds:</strong>
                        <span>
                          {`${kgToMundsString(record.net_weight).sign}${kgToMundsString(record.net_weight).munds}`}{" "}
                          Munds{" "}
                          {kgToMundsString(record.net_weight).remKg} Kg
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* ✅ Price Calculation */}
                <div className="col-md-12 mt-3">
                  <div className="d-flex justify-content-center">
                    <strong className="me-2">Price:</strong>
                    <span className="fw-bold fs-5">{record.total_price || '0'} PKR</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '1rem 0' }}>
              <div className="d-flex justify-content-center w-100">
                {/* <button className="btn btn-primary me-3" onClick={handlePrint}>
                  Print
                </button> */}
                {/* Use the new component for old printer printing */}
                <OldPrinterPrint record={record} slipType={slipType} />
                <button className="btn btn-secondary ms-3" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintModal;
