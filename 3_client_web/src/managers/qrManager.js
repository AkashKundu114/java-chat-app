export class QRManager {
    constructor(onSuccess) {
        this.onSuccess = onSuccess;
        this.scanner = null;
        this.html5QrCode = new Html5Qrcode("qr-reader");
    }

    startScanner(elementId) {
        this.html5QrCode.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: 250 },
            (decodedText) => {
                this.stopScanner();
                this.onSuccess(decodedText);
            },
            (errorMessage) => {
            }
        ).catch(err => {
            console.error("Camera error:", err);
            alert("Could not start camera. Check permissions.");
        });
    }

    scanFromFile(file) {
        if (!file) return;

        this.html5QrCode.scanFile(file, true)
            .then(decodedText => {
                console.log("File Scanned:", decodedText);
                this.onSuccess(decodedText);
            })
            .catch(err => {
                console.error("File scan error:", err);
                alert("Could not find a QR code in this image.");
            });
    }

    stopScanner() {
        if (this.html5QrCode.isScanning) {
            this.html5QrCode.stop().then(() => {
                this.html5QrCode.clear();
            }).catch(err => console.error("Stop failed", err));
        }
    }
}