const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Middleware per parsare i dati del form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servire i file statici dalla cartella public
app.use(express.static('public'));

// Webhook Discord
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1457755984393932863/v6oEgqypVcyC-6leg0inPRbSlszPXsNAGNWoeLRNhuk6eAyhLEQKXlQXZWEpNgWycyq4';

// Array con i codici validi
const codiciValidi = [
    'K7M9-3XP2-H4N6-Q8R1',
    'F2D5-W9B3-Y7T4-L6K8',
    'V3H8-J5N2-P9M4-R7C1',
    'X6Q2-T8D4-K3B9-N5L7',
    'A9F4-G2H6-M8P3-W7R5',
    'C5T8-V3K9-B7N2-J4X6',
    'D8P3-L6M9-H2T5-Q4K7',
    'R7B4-N9F2-X6D8-V3P5',
    'M2K6-W8H4-T3L9-J7Q1',
    'P5X8-B3N7-K9D2-F4R6',
    'H4T9-L2V6-M8C3-N5P7',
    'Q8K3-R6D9-W2B5-X7H4',
    'T6N2-F9J4-P7M8-K3V5',
    'B3H7-D5Q9-L8T2-R6N4',
    'W9M4-X2K7-V6P3-H8D5',
    'J5R8-N3F6-T9K2-L4B7',
    'G7P3-M9D5-H6W2-Q8C4',
    'K2T6-V8N4-R3J9-P5X7',
    'L4M8-D6B3-F9H5-K7W2',
    'N6X4-P2T8-J5Q9-R3M7',
    'C9D5-H7K3-V2N8-B4T6',
    'F8Q2-L4P7-M6R9-W3K5',
    'X3B6-T9H4-N7D2-V5J8',
    'R4K9-P6M3-L8F5-Q2T7',
    'H7N5-W3D8-K2B6-J9P4',
    'D5V8-M2X6-T4K9-N7R3',
    'P8F4-B6H9-L3Q5-K2W7',
    'T3M7-R9N2-V5D8-X4J6',
    'K6W3-H8P5-F2B9-L7Q4',
    'N9T4-D7K2-M5V8-R3H6',
    'B2P7-X5M9-W3N4-K8J6',
    'Q4H8-L6T3-R9D5-V2F7',
    'M5K2-N8V6-P3W9-T7B4',
    'J7D3-F9R5-H4K8-L2X6',
    'W6N4-B8M2-Q5P7-K9T3',
    'V8R5-T3D7-X2K6-N4H9',
    'F3Q8-M6B4-P9L2-W5R7',
    'H9K6-D2V5-T7N3-J4M8',
    'L5T9-R7P3-K2F6-B8X4',
    'P7W2-N4H8-M6D5-V9K3',
    'X4B7-K9T5-Q3L8-R6N2',
    'D6M3-F8P9-H5W4-T2V7',
    'R8N5-L3K7-B9M2-J6D4',
    'T2Q6-V8F4-P5X9-K3H7',
    'K9H3-W5R8-N2D6-M7L4',
    'B4P8-T6V3-F9K5-Q2N7',
    'N7M2-D5J9-L8R4-H3K6',
    'V3T7-X9B5-K4P2-W6F8',
    'J6K4-M8N3-R5D9-L2T7',
    'Q5F9-H3W7-P8B2-K4V6'
];

// Set per tenere traccia dei codici già utilizzati
const codiciUsati = new Set();

// Funzione per inviare notifica a Discord
async function inviaNotificaDiscord(codice, linkDiscord) {
    const embed = {
        embeds: [{
            title: "🎉 Nuovo Codice Utilizzato!",
            color: 5814783, // Colore viola
            fields: [
                {
                    name: "📝 Codice",
                    value: `\`${codice}\``,
                    inline: false
                },
                {
                    name: "🔗 Link Server Discord",
                    value: linkDiscord,
                    inline: false
                },
                {
                    name: "⏰ Data e Ora",
                    value: new Date().toLocaleString('it-IT'),
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: "Sistema Verifica Codici"
            }
        }]
    };

    try {
        const response = await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(embed)
        });

        return response.ok;
    } catch (error) {
        console.error('Errore invio webhook Discord:', error);
        return false;
    }
}

// Route per verificare il codice
app.post('/verifica-codice', async (req, res) => {
    const codiceInserito = req.body.codice.toUpperCase().trim();
    const linkDiscord = req.body.linkDiscord.trim();
    const captchaToken = req.body.captchaToken;
    
    // Verifica che tutti i campi siano compilati
    if (!codiceInserito || !linkDiscord || !captchaToken) {
        return res.json({ 
            valido: false, 
            messaggio: 'Compila tutti i campi!' 
        });
    }

    // Verifica formato link Discord
    const discordRegex = /discord\.(gg|com\/invite)\//i;
    if (!discordRegex.test(linkDiscord)) {
        return res.json({ 
            valido: false, 
            messaggio: 'Link Discord non valido!' 
        });
    }
    
    // Controlla se il codice è valido
    if (codiciValidi.includes(codiceInserito)) {
        // Controlla se il codice è già stato usato
        if (codiciUsati.has(codiceInserito)) {
            res.json({ 
                valido: false, 
                messaggio: 'Codice già utilizzato!' 
            });
        } else {
            // Aggiungi il codice ai codici usati
            codiciUsati.add(codiceInserito);
            
            // Invia notifica su Discord
            const notificaInviata = await inviaNotificaDiscord(codiceInserito, linkDiscord);
            
            if (notificaInviata) {
                res.json({ 
                    valido: true, 
                    messaggio: 'Codice valido! Accesso consentito.' 
                });
            } else {
                res.json({ 
                    valido: true, 
                    messaggio: 'Codice valido! (Errore invio notifica)' 
                });
            }
        }
    } else {
        res.json({ 
            valido: false, 
            messaggio: 'Codice non valido!' 
        });
    }
});

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
    console.log(`Apri il browser e vai su http://localhost:${PORT}`);
});