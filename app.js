const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0KXI8bfAZTGiJx-SO4zXlZg6QJBc1sOvQgvGWhmasefjMz_BQXFldxstXPdWaB167/exec";

document.addEventListener('DOMContentLoaded', () => {
    console.log("App cargada y lista"); // Verás esto en la consola al abrir la web

    const mainForm = document.getElementById('main-form');
    const inputChapa = document.getElementById('input-chapa');
    const inputCaf = document.getElementById('input-caf');
    const scannerModal = document.getElementById('scanner-modal');
    const video = document.getElementById('qr-video');
    const canvasElement = document.getElementById('qr-canvas');
    const canvas = canvasElement.getContext('2d');
    
    let scanning = false;
    let stream = null;

    const savedChapa = localStorage.getItem('chapa_operario');
    if (savedChapa) inputChapa.value = savedChapa;

    const openScanner = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            scannerModal.hidden = false;
            scanning = true;
            requestAnimationFrame(tick);
        } catch (err) {
            alert("Error cámara: " + err);
        }
    };

    const closeScanner = () => {
        scanning = false;
        if (stream) stream.getTracks().forEach(t => t.stop());
        scannerModal.hidden = true;
    };

    const tick = () => {
        if (!scanning) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
                if (navigator.vibrate) navigator.vibrate(150);
                inputCaf.value = code.data;
                closeScanner();
                return;
            }
        }
        requestAnimationFrame(tick);
    };

    // --- SECCIÓN CRÍTICA: EL ENVÍO ---
    mainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Botón Enviar pulsado. Preparando datos...");

        if (GOOGLE_SCRIPT_URL === "TU_URL_AQUI" || !GOOGLE_SCRIPT_URL.startsWith("https")) {
            alert("ERROR: No has puesto la URL de Google Script en app.js");
            return;
        }

        const btnSubmit = document.getElementById('btn-submit');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Registrando...";

        const ahora = new Date();
        const payload = {
            soloFecha: ahora.toLocaleDateString('es-ES'),
            soloHora: ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            caf: inputCaf.value,
            cantidad: document.getElementById('input-cantidad').value,
            ot: document.getElementById('input-ot').value,
            chapa: inputChapa.value
        };

        console.log("Enviando este paquete:", payload);

        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            });
            
            console.log("Petición finalizada");
            alert("Registro enviado (revisa tu Excel ahora)");
            
            inputCaf.value = "";
            document.getElementById('input-cantidad').value = "";
            document.getElementById('input-ot').value = "";
            localStorage.setItem('chapa_operario', inputChapa.value);
            
        } catch (error) {
            console.error("Error en el fetch:", error);
            alert("Error de conexión: " + error.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "ENVIAR REGISTRO";
        }
    });

    document.getElementById('btn-open-scanner').addEventListener('click', openScanner);
    document.getElementById('btn-close-scanner').addEventListener('click', closeScanner);
});
