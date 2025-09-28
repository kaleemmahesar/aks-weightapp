import React from "react";
import { useSelector } from "react-redux";
import { FaBalanceScale  } from "react-icons";
import logo from '../assets/scale.png';
import { formatToPST } from '../utils/dateUtils';
const PrintModal = ({ show, slipType, onClose }) => {
  const { selectedRecord: record } = useSelector(state => state.records || {});
  // console.log('PrintModal - vehicle_type:', record?.vehicle_type, 'record:', record);
  
  if (!show || !record) return null; // Completely unmount when hidden



  function kgToMundsString(inputKg) {
  const n = Number(inputKg) || 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  let munds = Math.floor(abs / 40);
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
        @page { size: ${isSmallVehicle ? '140mm 140mm' : '180mm 180mm'}; margin: 0; }

        html, body {
          margin: 0; padding: 0;
          font-family: Tahoma, Verdana, Arial, sans-serif;
          font-size: ${isSmallVehicle ? '9px' : '14px'};
          text-transform: uppercase;
          color: #000;
          line-height: ${isSmallVehicle ? '1.2' : '1.4'};
          letter-spacing: ${isSmallVehicle ? '0.3px' : '0.5px'};
        }

        .slip-container {
          width: 100%;
          box-sizing: border-box;
          padding: ${topPadding} ${isSmallVehicle ? '10mm' : '15mm'} 0mm; /* 👈 simulate 10mm margins */
          background: #fff;
          page-break-inside: avoid;
        }

        .row {
          display: flex;
          justify-content: space-between;
          margin: ${isSmallVehicle ? '1.5mm 15mm 0 10mm' : '2mm 21mm 0 14mm'};
          font-size: ${isSmallVehicle ? '10px' : '13px'};
          border-bottom: 1px solid #000;
          padding-bottom: ${isSmallVehicle ? '0.5mm' : '1mm'};
        }

        .center-row {
          text-align: center;
          font-size: ${isSmallVehicle ? '12px' : '15px'};
          font-weight: bold;
          margin: ${isSmallVehicle ? '2mm 0' : '3mm 0'};
          letter-spacing: ${isSmallVehicle ? '0.5px' : '1px'};
        }

        .footer { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="slip-container">
      <div class="row"><span>Party Name: ${record.party_name || "N/A"}</span></div>
      <div class="row"><span>Serial No: ${record.vehicle_id || "N/A"}</span><span>Time: ${formatToPST(record.first_weight_time)}</span><span>${record.first_weight || "0.00"} Kg</span></div>
        <div class="row"><span>Vehicle No: ${record.vehicle_number || "N/A"}</span><span>Time: ${formatToPST(record.second_weight_time)}</span><span>${record.second_weight || "0.00"} Kg</span></div>
      <div class="row"><span>Product: ${record.product || "N/A"}</span><span>${record.net_weight || "0.00"} Kg</span></div>
      <div class="center-row">Net Weight: ${sign}${munds} Munds ${remKg} Kg</div>
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

  // Check if vehicle type is Daalo/Daala or GadahGano for smaller print view
  const vehicleType = (record.vehicle_type || '').toLowerCase();
  const isSmallVehicle = vehicleType === "daalo" || vehicleType === "daala" || vehicleType === "gadahgano";

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
        .footer .eng { margin-top:${isSmallVehicle ? '5px' : '8px'}; text-align:center; font-family: Arial, sans-serif; direction:ltr; font-size:${isSmallVehicle ? '6px' : '8px'}; letter-spacing:1px; display:block; }
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
            <div class="company-name">عوامی کمپیوٹرائزڈ کانٹا</div>
            ${!isSmallVehicle ? `
            <div class="company-details">میرو خان روڈ، لاڑکانہ</div>
            <div class="company-details">فون: 03420721023</div>
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
                <span style="font-size:${isSmallVehicle ? '14px' : '18px'}">${record.first_weight ? Number(record.first_weight).toFixed(2) : "0.00"} کلو</span>
              </div>
              <div class="info-row">
                <span class="info-label" style="font-size:${isSmallVehicle ? '8px' : '11px'};">پہلے وزن کا وقت:</span>
                <span class="info-value" style="font-size:${isSmallVehicle ? '8px' : '11px'};  direction:ltr;">${formatToPST(record.first_weight_time)}</span>
              </div>` : ""}

            ${slipType === "final" && record.first_weight ? `
              <div class="weight-row">
                <span>موجودہ وزن:</span>
                <span style="font-size:${isSmallVehicle ? '14px' : '18px'}">${Number(record.first_weight).toFixed(2)} کلو</span>
              </div>
              <div class="info-row">
                <span class="info-label" style="font-size:${isSmallVehicle ? '8px' : '11px'};">وقت:</span>
                <span class="info-value" style="font-size:${isSmallVehicle ? '8px' : '11px'};">${formatToPST(record.first_weight_time)}</span>
              </div>` : ""}

            ${slipType !== "first" && record.second_weight ? `
              <div class="weight-row">
                <span>${slipType === "final" ? "خالی وزن:" : "دوسرا وزن:"}</span>
                <span style="font-size:${isSmallVehicle ? '14px' : '18px'}">${Number(record.second_weight).toFixed(2)} کلو</span>
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
                  <span style="font-size:${isSmallVehicle ? '14px' : '18px'}">${Number(record.net_weight).toFixed(2)} کلو</span>
                </div>
                <div class="weight-row">
  <span>من:</span>
  <span style="font-size:${isSmallVehicle ? '14px' : '18px'}">
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
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Weighbridge Slip</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body" id="print-area">
              <div className="text-center mb-3">
                <img src="/logo512.png" alt="Logo" style={{ height: "50px" }} />
                <h4>Awami Computerized Kanta</h4>
                <p>Miro Khan Road, Larkana | Phone: 03420721023</p>
                <hr />
              </div>
              <h4 className="text-center">
                {slipType === "first"
                  ? "First Weight Slip"
                  : slipType === "second"
                    ? "Second Weight Slip"
                    : "Final Weight Slip"}
              </h4>
              <hr />

              {/* ✅ Common Info */}
              <p>
                <strong>Vehicle Number:</strong> {record.vehicle_number}
              </p>
              <p>
                <strong>Party Name:</strong> {record.party_name}
              </p>
              <p>
                <strong>Product:</strong> {record.product}
              </p>
              <p>
                <strong>Driver:</strong> {record.driver_name || record.driver || 'N/A'}
              </p>

              {/* ✅ First Slip Details */}
              {slipType !== "final" && (
                <>
                  <p>
                    <strong>First Weight:</strong>{" "}
                    {Number(record.first_weight).toFixed(2)} Kg
                  </p>

                  <p>
                    <strong>First Weight Time:</strong>{" "}
                    {formatToPST(record.first_weight_time)}
                  </p>
                </>
              )}
              {/* ✅ Second Slip Details */}
              {slipType !== "first" && record.second_weight && (
                <>
                  <p>
                    <strong>
                      {slipType === "final"
                        ? "Empty Weight:"
                        : "Second Weight:"}
                    </strong>{" "}
                    {Number(record.second_weight).toFixed(2)} Kg
                  </p>
                  {slipType !== "final" && (
                    <p>
                      <strong>Second Weight Time:</strong>{" "}
                      {formatToPST(record.second_weight_time)}
                    </p>
                  )}
                </>
              )}

              

              {/* ✅ Final Slip Extra Details */}
              {slipType === "final" && record.second_weight && (
                <>
                  <p>
                    <strong>Current Weight:</strong>{" "}
                    {Number(record.first_weight).toFixed(2)} kg
                  </p>
                  <p>
                    <strong>Current Weight Time:</strong>{" "}
                    {formatToPST(record.first_weight_time)}
                  </p>
                </>
              )}

              {/* ✅ Net Weight & Munds */}
              {slipType !== "first" && record.net_weight && (
                <p>
  <strong>Net Weight:</strong>{" "}
  {Number(record.net_weight).toFixed(2)} kg &nbsp;
  <strong>Munds:</strong>{" "}
  {`${kgToMundsString(record.net_weight).sign}${kgToMundsString(record.net_weight).munds}`}{" "}
  Munds{" "}
  {kgToMundsString(record.net_weight).remKg} Kg
</p>

              )}

              {/* ✅ Price Calculation */}
              <p>
                <strong>Price:</strong> {record.total_price} PKR
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handlePrint}>
                Print
              </button>
              {/* <button className="btn btn-warning" onClick={() => handleOldPrinterPrint(slipType)}>
    Print with Old Printer
  </button> */}
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintModal;
