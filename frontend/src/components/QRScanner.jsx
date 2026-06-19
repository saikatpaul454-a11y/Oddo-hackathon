import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, ShieldAlert, Loader2 } from 'lucide-react';

const QRScanner = ({ onScanComplete, onClose }) => {
  const [status, setStatus] = useState('initializing'); // initializing, scanning, error
  const [errorMessage, setErrorMessage] = useState('');
  const qrScannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode('qr-reader-container');
    qrScannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        };

        await html5QrCode.start(
          { facingMode: 'user' },
          config,
          (decodedText) => {
            // Success
            html5QrCode.stop().then(() => {
              onScanComplete(decodedText);
            }).catch((err) => console.error('Error stopping QR scanner:', err));
          },
          (errorMessage) => {
            // Silent error callbacks for frame mismatches
          }
        );
        setStatus('scanning');
      } catch (err) {
        console.error('QR Scanner Start Error:', err);
        setStatus('error');
        setErrorMessage('Unable to access camera. Please verify camera permissions.');
      }
    };

    startScanner();

    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current
          .stop()
          .catch((err) => console.error('Error in QR scanner cleanup stop:', err));
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl">
        <h3 className="text-xl font-bold tracking-tight text-center mb-1">
          Scan Attendance QR Code
        </h3>
        <p className="text-xs text-slate-400 text-center mb-6">
          Scan the QR code displayed on the HR/Admin screen
        </p>

        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-indigo-500/20 bg-black shadow-inner">
          <div id="qr-reader-container" className="h-full w-full object-cover"></div>

          {status === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-xs text-slate-400">Initializing Scanner...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 p-6 text-center">
              <ShieldAlert className="h-10 w-10 text-rose-500" />
              <p className="text-sm font-semibold text-rose-400">{errorMessage}</p>
              <button
                onClick={onClose}
                className="mt-2 rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {status === 'scanning' && (
          <div className="mt-6 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <QrCode className="h-4 w-4 animate-pulse" />
              SCANNER ACTIVE - CENTER THE QR CODE
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              if (qrScannerRef.current && qrScannerRef.current.isScanning) {
                qrScannerRef.current.stop().then(() => onClose()).catch(() => onClose());
              } else {
                onClose();
              }
            }}
            className="rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 px-5 py-2 text-sm font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
