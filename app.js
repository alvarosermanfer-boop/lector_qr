const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx3hILf2GnsfAjL4VlPcI13NY_nOhIgbHsNPZoWrmctDi4BdBbjhqzUCEZcbX8X4ydo/exec";

document.addEventListener('DOMContentLoaded', () => {
    const mainForm = document.getElementById('main-form');
    const inputChapa = document.getElementById('input-chapa');
    const inputCaf = document.getElementById('input-caf');
    const scannerModal = document.getElementById('scanner-modal');
    const video = document.getElementById('qr-video');
    const canvasElement = document.getElementById('qr-canvas');
    const canvas = canvasElement.getContext('2d');
    
    let scanning = false;
    let stream = null;

    // Cargar Chapa persistente
    const savedChapa = localStorage.getItem('chapa_operario');
    if (savedChapa) inputChapa.value = savedChapa;

    // Función Abrir Cámara
    const openScanner = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            scannerModal.hidden = false;
            scanning = true;
            requestAnimationFrame(tick);
        } catch (err) {
            alert("Error: No se pudo acceder a la cámara.");
        }
    };

    // Función Cerrar Cámara
    const closeScanner = () => {
        scanning = false;
        if (stream) stream.getTracks().forEach(t => t.stop());
        scannerModal.hidden = true;
    };

    // Bucle de lectura QR
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

    // Envío de Datos a Google
    mainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Guardar chapa localmente
        localStorage.setItem('chapa_operario', inputChapa.value);

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

        try {
            // Envío en modo no-cors para evitar bloqueos del navegador
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                body: JSON.stringify(payload)
            });

            alert("Registro guardado con éxito.");
            
            // Limpiar formulario (excepto chapa)
            inputCaf.value = "";
            document.getElementById('input-cantidad').value = "";
            document.getElementById('input-ot').value = "";
            
        } catch (error) {
            alert("Error de conexión. Verifica que la URL del Script sea correcta.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "ENVIAR REGISTRO";
        }
    });

    document.getElementById('btn-open-scanner').addEventListener('click', openScanner);
    document.getElementById('btn-close-scanner').addEventListener('click', closeScanner);
});

    document.getElementById('btn-open-scanner').addEventListener('click', openScanner);
    document.getElementById('btn-close-scanner').addEventListener('click', closeScanner);
});
