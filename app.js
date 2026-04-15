document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const video = document.getElementById('qr-video');
    const canvasElement = document.getElementById('qr-canvas');
    const canvas = canvasElement.getContext('2d');
    const statusIndicator = document.getElementById('status-indicator');
    const scanRegion = document.getElementById('scan-region-highlight');
    const fallbackContainer = document.getElementById('fallback-container');
    const fileInput = document.getElementById('file-input');
    
    // Botones
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnSwitch = document.getElementById('btn-switch');
    
    // Resultados
    const resultSection = document.getElementById('result-section');
    const resultText = document.getElementById('result-text');
    const btnCopy = document.getElementById('btn-copy');
    const btnOpenLink = document.getElementById('btn-open-link');
    const btnClear = document.getElementById('btn-clear');

    // Estado
    let stream = null;
    let scanning = false;
    let currentFacingMode = 'environment'; // 'environment' (trasera) o 'user' (frontal)
    let pauseTimeout = null;

    // Utilidades de UI
    const setStatus = (msg, type) => {
        statusIndicator.textContent = msg;
        statusIndicator.className = `status ${type}`;
    };

    // Función para validar si el texto es una URL
    const isValidURL = (string) => {
        try {
            const url = new URL(string);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch (_) {
            return false;
        }
    };

    // Iniciar Cámara WebRTC
    const startCamera = async () => {
        if (stream) stopCamera(); // Limpiar tracks previos si existen

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: currentFacingMode }
            });
            
            video.srcObject = stream;
            video.setAttribute("playsinline", true); // Requerido para iOS Safari
            video.hidden = false;
            scanRegion.hidden = false;
            fallbackContainer.hidden = true;
            
            btnStart.hidden = true;
            btnStop.hidden = false;
            btnSwitch.hidden = false;
            
            setStatus("Buscando QR...", "scanning");
            scanning = true;
            
            // Esperar a que el video tenga datos para iniciar el loop
            video.addEventListener('loadeddata', tick, { once: true });
        } catch (err) {
            console.error("Error accediendo a la cámara:", err);
            setStatus("Cámara denegada o no disponible. Usa una imagen.", "error");
            showFallback();
        }
    };

    // Detener Cámara y limpiar tracks
    const stopCamera = () => {
        scanning = false;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        video.hidden = true;
        scanRegion.hidden = true;
        
        btnStart.hidden = false;
        btnStop.hidden = true;
        btnSwitch.hidden = true;
        setStatus("Cámara detenida.", "idle");
        clearTimeout(pauseTimeout);
    };

    // Mostrar fallback de archivo
    const showFallback = () => {
        stopCamera();
        video.hidden = true;
        scanRegion.hidden = true;
        fallbackContainer.hidden = false;
        btnStart.hidden = false;
    };

    // Bucle de renderizado y decodificación (throttled a ~10fps)
    const tick = () => {
        if (!scanning) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            
            // Dibujar frame en el canvas
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            
            // Extraer pixels
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            
            // jsQR decodifica la imagen
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert", // Optimiza rendimiento
            });

            if (code) {
                handleQRResult(code.data);
                return; // Romper el loop temporalmente
            }
        }
        
        // Ejecutar de nuevo en ~100ms (10 fps) para salvar batería
        setTimeout(() => { requestAnimationFrame(tick); }, 100);
    };

    // Procesar el resultado encontrado
    const handleQRResult = (data) => {
        // 1. Feedback háptico si está disponible (vibración)
        if (navigator.vibrate) navigator.vibrate(200);
        
        // 2. Pausar escaneo
        scanning = false;
        setStatus("QR Detectado", "success");
        scanRegion.style.borderColor = "var(--success)";
        
        // 3. Mostrar UI
        resultSection.hidden = false;
        resultText.textContent = data;
        
        if (isValidURL(data)) {
            btnOpenLink.hidden = false;
            btnOpenLink.onclick = () => window.open(data, '_blank', 'noopener,noreferrer');
        } else {
            btnOpenLink.hidden = true;
        }

        // 4. Reanudar escaneo después de 2 segundos para evitar lecturas repetidas del mismo código
        pauseTimeout = setTimeout(() => {
            scanRegion.style.borderColor = "rgba(255, 255, 255, 0.5)";
            setStatus("Buscando QR...", "scanning");
            scanning = true;
            requestAnimationFrame(tick);
        }, 2000);
    };

    // --- LECTURA DESDE ARCHIVO (Fallback) ---
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                canvasElement.width = img.width;
                canvasElement.height = img.height;
                canvas.drawImage(img, 0, 0, img.width, img.height);
                const imageData = canvas.getImageData(0, 0, img.width, img.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "attemptBoth",
                });

                if (code) {
                    handleQRResult(code.data);
                } else {
                    setStatus("No se detectó QR en la imagen.", "error");
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // --- EVENT LISTENERS UI ---
    btnStart.addEventListener('click', startCamera);
    btnStop.addEventListener('click', stopCamera);
    
    btnSwitch.addEventListener('click', () => {
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        startCamera();
    });

    btnCopy.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(resultText.textContent);
            const originalText = btnCopy.textContent;
            btnCopy.textContent = "¡Copiado!";
            setTimeout(() => btnCopy.textContent = originalText, 2000);
        } catch (err) {
            console.error("Error al copiar", err);
            alert("No se pudo copiar el texto");
        }
    });

    btnClear.addEventListener('click', () => {
        resultSection.hidden = true;
        resultText.textContent = "";
        fileInput.value = ""; // Limpiar input file si se usó
        if (!scanning && stream) {
            scanning = true;
            setStatus("Buscando QR...", "scanning");
            requestAnimationFrame(tick);
        } else if (!stream) {
            setStatus("Esperando acción...", "idle");
        }
    });
});
