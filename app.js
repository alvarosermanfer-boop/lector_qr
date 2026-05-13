
// URL DE TU APLICACIÓN WEB DE GOOGLE (Pega aquí la URL que obtuviste en el paso 1)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8m6Tc4xI5Yf2LB6GiT7X0muqf0lQvB7jH9kNRSYYy5ZdVwoDR3xaG008TUc1uqFC6/exec";

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

    // Cargar chapa guardada
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
            console.error("Error cámara:", err);
            alert("No se pudo acceder a la cámara");
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
                if (navigator.vibrate) navigator.vibrate(100);
                inputCaf.value = code.data;
                closeScanner();
                return;
            }
        }
        requestAnimationFrame(tick);
    };

    mainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = document.getElementById('btn-submit');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Registrando...";

        // Guardar la chapa para el futuro
        localStorage.setItem('chapa_operario', inputChapa.value);

        const ahora = new Date();
        const payload = {
            soloFecha: ahora.toLocaleDateString('es-ES'),
            soloHora: ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            caf: inputCaf.value,
            cantidad: document.getElementById('input-cantidad').value,
            ot: document.getElementById('input-ot').value,
            chapa: inputChapa.value
        };

        console.log("Enviando datos:", payload);

        try {
            // El modo no-cors es vital para Google Apps Script
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                body: JSON.stringify(payload)
            });

            alert("Material registrado correctamente.");
            
            // Limpiar campos menos Chapa
            inputCaf.value = "";
            document.getElementById('input-cantidad').value = "";
            document.getElementById('input-ot').value = "";
            
        } catch (error) {
            console.error("Error en el envío:", error);
            alert("Hubo un error al conectar con Google Sheets.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Enviar Salida de Material";
        }
    });

    document.getElementById('btn-open-scanner').addEventListener('click', openScanner);
    document.getElementById('btn-close-scanner').addEventListener('click', closeScanner);
});
