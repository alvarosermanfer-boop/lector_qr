// URL DE TU APLICACIÓN WEB DE GOOGLE (Pega aquí la URL que obtuviste en el paso 1)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_bOvSBN9bzSblDcQwLeqVqJhjCcD4et3b6i2yZMggSdzNd3QAfQjJGMDVd1txSJmt/exec";

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

    // 1. Persistencia: Cargar chapa guardada
    const savedChapa = localStorage.getItem('chapa_operario');
    if (savedChapa) inputChapa.value = savedChapa;

    // 2. Lógica del Escáner
    const openScanner = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            scannerModal.hidden = false;
            scanning = true;
            requestAnimationFrame(tick);
        } catch (err) {
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
                closeScanner(); // Cerrar cámara al detectar
                return;
            }
        }
        requestAnimationFrame(tick);
    };

    // 3. Envío de datos
    mainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Guardar chapa para la próxima vez
        localStorage.setItem('chapa_operario', inputChapa.value);

        const btnSubmit = document.getElementById('btn-submit');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Enviando...";

        const payload = {
            fecha: new Date().toLocaleString(),
            caf: inputCaf.value,
            cantidad: document.getElementById('input-cantidad').value,
            //clase: document.getElementById('select-clase').value,
            ot: document.getElementById('input-ot').value,
            chapa: inputChapa.value
        };

        try {
            // Usamos mode: 'no-cors' si hay problemas de redirección, 
            // pero Google Apps Script funciona mejor con fetch estándar si está bien configurado
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Necesario para Google Apps Script desde el navegador
                cache: 'no-cache',
                body: JSON.stringify(payload)
            });

            alert("¡Datos guardados correctamente!");
            // Limpiar campos menos Chapa y Clase
            inputCaf.value = "";
            document.getElementById('input-cantidad').value = "";
            document.getElementById('input-ot').value = "";
            
        } catch (error) {
            console.error(error);
            alert("Error al enviar los datos. Revisa la consola.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "REGISTRAR SALIDA DE MATERIAL";
        }
    });

    document.getElementById('btn-open-scanner').addEventListener('click', openScanner);
    document.getElementById('btn-close-scanner').addEventListener('click', closeScanner);
});
