import React from "react";
import { useSelector } from "react-redux";
import { FaBalanceScale  } from "react-icons";
import logo from '../assets/scale.png';
const PrintModal = ({ show, slipType, onClose }) => {
  const { selectedRecord: record } = useSelector(state => state.records || {});
  console.log(record)
  // console.log('PrintModal - show:', show, 'slipType:', slipType, 'record:', record);
  
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


  const handleOldPrinterPrint = (record, slipType) => {
  const win = window.open("", "", "width=1000,height=600");
  if (!win) {
    alert("Popup blocked! Please allow popups for this site.");
    return;
  }

  const { sign, munds, remKg } = kgToMundsString(record.net_weight);

  const html = `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Weighbridge Slip (Old Printer)</title>
    <style>
      @page { size: landscape; margin: 8mm; }
      body {
        font-family: Arial, sans-serif;
        direction: ltr;
        text-align: left;
        font-size: 14px;
        margin: 0;
        line-height: 1.6;
      }
      .slip-container {
        width: 95%; 
        margin: 10px auto; 
        border:1px solid #000; 
        padding:10px; 
        background:#fff;
      }
      .row {
        display: flex;
        justify-content: space-between;
        margin: 6px 0;
        font-size: 13px;
        border-bottom: 1px dotted #888;
        padding-bottom: 4px;
      }
      .row span { flex: 1; }
      .center-row {
        text-align: center;
        font-weight: bold;
        font-size: 16px;
        margin: 10px 0;
      }
      .footer {
        margin-top: 10px;
        text-align: center;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="slip-container">

      <!-- Row 1 -->
      <div class="row">
        <span>Party Name: ${record.party_name || "N/A"}</span>
      </div>

      <!-- Row 2 -->
      <div class="row">
        <span>Serial No: ${record.vehicle_id || "N/A"}</span>
        <span>First Weight: ${record.first_weight ? Number(record.first_weight).toFixed(2) : "0.00"} Kg</span>
        <span>Time: ${record.first_weight_time || "N/A"}</span>
      </div>

      <!-- Row 3 -->
      <div class="row">
        <span>Vehicle No: ${record.vehicle_number || "N/A"}</span>
        <span>Second Weight: ${record.second_weight ? Number(record.second_weight).toFixed(2) : "0.00"} Kg</span>
        <span>Time: ${record.second_weight_time || "N/A"}</span>
      </div>

      <!-- Row 4 -->
      <div class="row">
        <span>Product: ${record.product || "N/A"}</span>
        <span>Net Weight: ${record.net_weight ? Number(record.net_weight).toFixed(2) : "0.00"} Kg</span>
      </div>

      <!-- Row 5 -->
      <div class="center-row">
        Net Weight: ${sign}${munds} Munds ${remKg} Kg
      </div>

      <!-- Footer -->
      <div class="footer">
        Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}
      </div>
    </div>
  </body>
  </html>
  `;

  win.document.write(html);
  win.document.close();

  win.onload = () => {
    win.focus();
    win.print();
    win.close();
  };
};

 const handlePrint = () => {
  const win = window.open("", "", "width=950,height=500");
  if (!win) {
    alert("پاپ اپ بلاک ہو گیا ہے! براہ کرم اس سائٹ کے لیے پاپ اپ کی اجازت دیں۔");
    return;
  }

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
        @page { margin: 0; size: 80mm 220mm; }
        html,body { margin:0; padding:0; }
        body {
          font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif;
          direction: rtl;
          text-align: right;
          font-size: 14px;
          margin: 0;
          line-height: 1.6;          /* better Urdu readability */
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

        .slip-container { width:70mm; margin:0 auto; border:1px solid #000; padding:6px; background:#fff; box-sizing:border-box; }
        .header { text-align:center; border-bottom:1px solid #000; padding-bottom:6px; margin-bottom:8px; }
        .company-name { font-size:18px; font-weight:bold; }
        .company-details { font-size:10px; margin:1px 0; }
        .copy-label { text-align:center; font-size:14px; font-weight:bold; margin-bottom:6px; }
        .content-section { margin:6px 0; }
        .info-row { display:flex; justify-content:space-between; gap:6px; margin:4px 0; border-bottom:1px dotted #999; font-size:11px; align-items:center; }
        .info-row .info-label { font-weight:bold; display:inline-block; min-width:70px; white-space:normal; }
        .info-row .info-value { font-size:13px; font-weight:bold; display:inline-block; white-space:normal; word-break:break-word; }
        .weight-section { border:1px solid #000; margin:6px 0; padding:6px; }
        .weight-row { display:flex; justify-content:space-between; margin:3px 0; font-weight:bold; font-size:13px; gap:6px; align-items:center; }
        .net-weight { border:1px solid #000; padding:4px; font-size:14px; margin-top:4px; }
        .warning { border:1px solid #000; padding:4px; font-size:10px; text-align:center; font-weight:bold; margin-top:6px; }
        .footer { padding-top:6px; margin-top:8px; text-align:center; font-size:10px; }
        .footer .eng { margin-top:8px; text-align:center; font-family: Arial, sans-serif; direction:ltr; font-size:8px; letter-spacing:1px; display:block; }
        .page-break { page-break-after: always; margin:10px 0; }
      </style>
    </head>
    <body>
      ${(slipType === "first" 
    ? ["کسٹمر کاپی"] 
    : ["کسٹمر کاپی","ٹھیکیدار کاپی"]
).map((copyType, index) => `
        <div class="slip-container">
          <div class="copy-label">${copyType}</div>
          <hr style="border: 1px dashed #000; margin: 5px 0 10px;" />
          <div class="header">
            <img src="${logo}" alt="logo" style="width:30px;height:30px;display:block;margin:0 auto 4px auto" />
            <div class="company-name">عوامی کمپیوٹرائزڈ کانٹا</div>
            <div class="company-details">میرو خان روڈ، لاڑکانہ</div>
            <div class="company-details">فون: 03420721023</div>
            <div class="company-details" style="font-weight:bold;font-size:12px;margin-top:6px;">
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
                <span style="font-size:18px">${record.first_weight ? Number(record.first_weight).toFixed(2) : "0.00"} کلو</span>
              </div>
              <div class="info-row">
                <span class="info-label" style="font-size:11px;">پہلے وزن کا وقت:</span>
                <span class="info-value" style="font-size:11px;">${record.first_weight_time || "N/A"}</span>
              </div>` : ""}

            ${slipType === "final" && record.first_weight ? `
              <div class="weight-row">
                <span>موجودہ وزن:</span>
                <span style="font-size:18px">${Number(record.first_weight).toFixed(2)} کلو</span>
              </div>
              <div class="info-row">
                <span class="info-label" style="font-size:11px;">وقت:</span>
                <span class="info-value" style="font-size:11px;">${record.first_weight_time || "N/A"}</span>
              </div>` : ""}

            ${slipType !== "first" && record.second_weight ? `
              <div class="weight-row">
                <span>${slipType === "final" ? "خالی وزن:" : "دوسرا وزن:"}</span>
                <span style="font-size:18px">${Number(record.second_weight).toFixed(2)} کلو</span>
              </div>
              ${slipType !== "final" ? `
                <div class="info-row">
                  <span class="info-label" style="font-size:11px;">دوسرے وزن کا وقت:</span>
                  <span class="info-value" style="font-size:11px;">${record.second_weight_time || "N/A"}</span>
                </div>` : ""}` : ""}

            ${slipType !== "first" && record.net_weight ? `
              <div class="net-weight">
                <div class="weight-row">
                  <span>خالص وزن:</span>
                  <span style="font-size:18px">${Number(record.net_weight).toFixed(2)} کلو</span>
                </div>
                <div class="weight-row">
  <span>من:</span>
  <span style="font-size:18px">
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

          <div class="footer">
            <div>تاریخ: ${new Date().toLocaleDateString()} | وقت: ${new Date().toLocaleTimeString()}</div>
            <div class="eng">Software by <span style="display:inline-block;padding:2px 8px;font-weight:bold;border:1px solid #000;border-radius:6px;background:#f0f0f0">AKS</span> Solutions 0333-7227847</div>
          </div>
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
                    {record.first_weight_time}
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
                      {record.second_weight_time}
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
                    {record.first_weight_time}
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
              <button className="btn btn-warning" onClick={handleOldPrinterPrint}>
    Print with Old Printer
  </button>
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
