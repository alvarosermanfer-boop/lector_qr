
// URL DE TU APLICACIÓN WEB DE GOOGLE (Pega aquí la URL que obtuviste en el paso 1)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzooOwK97GjqB3Mw593mzD64c1lkGkS8eoNXQVcGMxeS8lCT0dAB_Rv1PWt92NFI2Ld/exec";


document.addEventListener('DOMContentLoaded', () => {
    const mainForm = document.getElementById('main-form');
    const inputChapa = document.getElementById('input-chapa');
    const inputCaf = document.getElementById('input-caf');
    const btnSubmit = document.getElementById('btn-submit');

    if (localStorage.getItem('chapa_operario')) {
        inputChapa.value = localStorage.getItem('chapa_operario');
    }

    mainForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        btnSubmit.disabled = true;
        btnSubmit.textContent = "ENVIANDO...";

        const ahora = new Date();
        const payload = {
            soloFecha: ahora.toLocaleDateString('es-ES'),
            soloHora: ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            caf: inputCaf.value,
            cantidad: document.getElementById('input-cantidad').value,
            ot: document.getElementById('input-ot').value,
            chapa: inputChapa.value
        };

        // Guardamos la chapa
        localStorage.setItem('chapa_operario', inputChapa.value);

        // Usamos la API de baliza o un fetch con modo 'no-cors'
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            alert("¡Salida de material registrada!");
            // Limpiamos campos menos la chapa
            inputCaf.value = "";
            document.getElementById('input-cantidad').value = "";
            document.getElementById('input-ot').value = "";
        })
        .catch(err => {
            console.error("Fallo de red:", err);
            alert("Error de conexión. Verifica internet.");
        })
        .finally(() => {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Enviar Salida de Material";
        });
    });
});
