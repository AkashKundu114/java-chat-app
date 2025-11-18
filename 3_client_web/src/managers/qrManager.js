export class QRManager {
    constructor(onSuccess) {
        this.onSuccess = onSuccess;
        this.scanner = null;
    }

    startScanner(elementId) {
        this.scanner = new Html5Qrcode(elementId);
        this.scanner.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: 250 },
            (decodedText) => {
                this.stopScanner();
                this.onSuccess(decodedText);
            },
            () => {} // Ignore errors
        );
    }

    stopScanner() {
        if (this.scanner) {
            this.scanner.stop().then(() => this.scanner.clear());
        }
    }
}