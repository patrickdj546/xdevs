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
    '14xK7M9-3XP2-H4N6-Q8R1',
    '14xF2D5-W9B3-Y7T4-L6K8',
    '14-V3H8-J5N2-P9M4-R7C1',
    '14xX6Q2-T8D4-K3B9-N5L7',
    '14-A9F4-G2H6-M8P3-W7R5',

    '2xC5T8-V3K9-B7N2-J4X6',
    '2xD8P3-L6M9-H2T5-Q4K7',
    '2xR7B4-N9F2-X6D8-V3P5',
    '2xM2K6-W8H4-T3L9-J7Q1',
    '2xP5X8-B3N7-K9D2-F4R6',

    '4xH4T9-L2V6-M8C3-N5P7',
    '4xQ8K3-R6D9-W2B5-X7H4',
    '4xT6N2-F9J4-P7M8-K3V5',
    '4xB3H7-D5Q9-L8T2-R6N4',
    '4xW9M4-X2K7-V6P3-H8D5',

    '6xJ5R8-N3F6-T9K2-L4B7',
    '6xG7P3-M9D5-H6W2-Q8C4',
    '6xK2T6-V8N4-R3J9-P5X7',
    '6xL4M8-D6B3-F9H5-K7W2',
    '6xN6X4-P2T8-J5Q9-R3M7',

    '8xC9D5-H7K3-V2N8-B4T6',
    '8xF8Q2-L4P7-M6R9-W3K5',
    '8xX3B6-T9H4-N7D2-V5J8',
    '8xR4K9-P6M3-L8F5-Q2T7',
    '8xH7N5-W3D8-K2B6-J9P4',

    '10xD5V8-M2X6-T4K9-N7R3',
    '10xP8F4-B6H9-L3Q5-K2W7',
    '10xT3M7-R9N2-V5D8-X4J6',
    '10xK6W3-H8P5-F2B9-L7Q4',
    '10xN9T4-D7K2-M5V8-R3H6',

    '12xB2P7-X5M9-W3N4-K8J6',
    '12xQ4H8-L6T3-R9D5-V2F7',
    '12xM5K2-N8V6-P3W9-T7B4',
    '12xJ7D3-F9R5-H4K8-L2X6',
    '12xW6N4-B8M2-Q5P7-K9T3'
];

// Set per tenere traccia dei codici già utilizzati
const codiciUsati = new Set();

// Funzione per rilevare il tipo di boost dal codice
function getTipoBoost(codice) {
    if (codice.startsWith('14X-')) return '14x Boost';
    if (codice.startsWith('12X-')) return '12x Boost';
    if (codice.startsWith('10X-')) return '10x Boost';
    if (codice.startsWith('8X-')) return '8x Boost';
    if (codice.startsWith('6X-')) return '6x Boost';
    if (codice.startsWith('4X-')) return '4x Boost';
    if (codice.startsWith('2X-')) return '2x Boost';
    return 'Boost Standard';
}

// Funzione per ottenere l'emoji del boost
function getEmojiBoost(codice) {
    if (codice.startsWith('14X-')) return '🚀🔥';
    if (codice.startsWith('12X-')) return '🚀⚡';
    if (codice.startsWith('10X-')) return '🚀';
    if (codice.startsWith('8X-')) return '⚡⚡';
    if (codice.startsWith('6X-')) return '⚡';
    if (codice.startsWith('4X-')) return '⭐⭐';
    if (codice.startsWith('2X-')) return '⭐';
    return '✨';
}

// Funzione per inviare notifica a Discord
async function inviaNotificaDiscord(codice, idInvoice, linkDiscord, email) {
    const tipoBoost = getTipoBoost(codice);
    const emojiBoost = getEmojiBoost(codice);
    
    const embed = {
        embeds: [{
            title: `${emojiBoost} Nuovo Codice Utilizzato! ${emojiBoost}`,
            description: `**🎁 Prodotto Acquistato: ${tipoBoost}**`,
            color: codice.startsWith('14X-') ? 16711680 : 
                   codice.startsWith('12X-') ? 16753920 :
                   codice.startsWith('10X-') ? 16776960 :
                   codice.startsWith('8X-') ? 65280 :
                   codice.startsWith('6X-') ? 65535 :
                   codice.startsWith('4X-') ? 255 :
                   codice.startsWith('2X-') ? 9109504 : 5814783,
            fields: [
                {
                    name: "📝 Codice Riscattato",
                    value: `\`${codice}\``,
                    inline: false
                },
                {
                    name: "🧾 ID Invoice/Ordine",
                    value: `\`${idInvoice}\``,
                    inline: true
                },
                {
                    name: "📧 Email Cliente",
                    value: email,
                    inline: true
                },
                {
                    name: "🔗 Server Discord",
                    value: linkDiscord,
                    inline: false
                },
                {
                    name: "⏰ Data e Ora",
                    value: new Date().toLocaleString('it-IT', { 
                        timeZone: 'Europe/Rome',
                        dateStyle: 'full',
                        timeStyle: 'long'
                    }),
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: `Sistema Verifica Codici • ${tipoBoost}`,
                icon_url: "https://cdn.discordapp.com/emojis/1234567890.png"
            },
            thumbnail: {
                url: "https://cdn.discordapp.com/attachments/123/456/boost.png"
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
    const idInvoice = req.body.idInvoice.trim();
    const linkDiscord = req.body.linkDiscord.trim();
    const email = req.body.email.trim();
    const captchaToken = req.body.captchaToken;
    
    // Verifica che tutti i campi siano compilati
    if (!codiceInserito || !idInvoice || !linkDiscord || !email || !captchaToken) {
        return res.json({ 
            valido: false, 
            messaggio: 'Compila tutti i campi!' 
        });
    }

    // Verifica formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.json({ 
            valido: false, 
            messaggio: 'Email non valida!' 
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
            const notificaInviata = await inviaNotificaDiscord(codiceInserito, idInvoice, linkDiscord, email);
            
            if (notificaInviata) {
                res.json({ 
                    valido: true, 
                    messaggio: '✅ Codice valido! Hai riscattato i boost. Attendi 1-10 minuti che arrivano in automatico.' 
                });
            } else {
                res.json({ 
                    valido: true, 
                    messaggio: '✅ Codice valido! Hai riscattato i boost. Attendi 1-10 minuti che arrivano in automatico.' 
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

// Credenziali admin (in produzione dovresti usare hash bcrypt)
const ADMIN_EMAIL = 'lorisenabbo@gmail.com';
const ADMIN_PASSWORD = 'Patrick27';

// Sessioni admin (semplice sistema in memoria)
const adminSessions = new Set();

// Route per login admin
app.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const sessionToken = Math.random().toString(36).substring(2);
        adminSessions.add(sessionToken);
        res.json({ 
            successo: true, 
            messaggio: 'Login effettuato!',
            token: sessionToken
        });
    } else {
        res.json({ 
            successo: false, 
            messaggio: 'Email o password errati!' 
        });
    }
});

// Middleware per verificare se è admin
function verificaAdmin(req, res, next) {
    const token = req.headers['authorization'];
    if (adminSessions.has(token)) {
        next();
    } else {
        res.status(401).json({ successo: false, messaggio: 'Non autorizzato' });
    }
}

// Route per ottenere tutti i codici organizzati per categoria
app.get('/admin/codici', verificaAdmin, (req, res) => {
    const categorizzati = {
        '2x': [],
        '4x': [],
        '6x': [],
        '8x': [],
        '10x': [],
        '12x': [],
        '14x': []
    };
    
    codiciValidi.forEach(codice => {
        const prefisso = codice.split('-')[0].toLowerCase();
        if (categorizzati[prefisso]) {
            categorizzati[prefisso].push({
                codice: codice,
                usato: codiciUsati.has(codice)
            });
        }
    });
    
    res.json({ 
        successo: true, 
        codici: categorizzati,
        statistiche: {
            totale: codiciValidi.length,
            usati: codiciUsati.size,
            disponibili: codiciValidi.length - codiciUsati.size
        }
    });
});

// Route per aggiungere un nuovo codice
app.post('/admin/codici/aggiungi', verificaAdmin, (req, res) => {
    const { codice } = req.body;
    
    if (!codice || codice.length < 10) {
        return res.json({ successo: false, messaggio: 'Codice non valido!' });
    }
    
    if (codiciValidi.includes(codice.toUpperCase())) {
        return res.json({ successo: false, messaggio: 'Codice già esistente!' });
    }
    
    codiciValidi.push(codice.toUpperCase());
    res.json({ successo: true, messaggio: 'Codice aggiunto con successo!' });
});

// Route per modificare un codice
app.post('/admin/codici/modifica', verificaAdmin, (req, res) => {
    const { vecchioCodice, nuovoCodice } = req.body;
    
    const index = codiciValidi.indexOf(vecchioCodice.toUpperCase());
    if (index === -1) {
        return res.json({ successo: false, messaggio: 'Codice non trovato!' });
    }
    
    codiciValidi[index] = nuovoCodice.toUpperCase();
    
    // Aggiorna anche nei codici usati se era stato usato
    if (codiciUsati.has(vecchioCodice.toUpperCase())) {
        codiciUsati.delete(vecchioCodice.toUpperCase());
        codiciUsati.add(nuovoCodice.toUpperCase());
    }
    
    res.json({ successo: true, messaggio: 'Codice modificato con successo!' });
});

// Route per eliminare un codice
app.post('/admin/codici/elimina', verificaAdmin, (req, res) => {
    const { codice } = req.body;
    
    const index = codiciValidi.indexOf(codice.toUpperCase());
    if (index === -1) {
        return res.json({ successo: false, messaggio: 'Codice non trovato!' });
    }
    
    codiciValidi.splice(index, 1);
    codiciUsati.delete(codice.toUpperCase());
    
    res.json({ successo: true, messaggio: 'Codice eliminato con successo!' });
});

// Route segreta per resettare i codici usati (cambia la password!)
app.post('/admin/reset-codici', verificaAdmin, (req, res) => {
    codiciUsati.clear();
    res.json({ 
        successo: true, 
        messaggio: `Tutti i codici sono stati resettati! (${codiciValidi.length} codici disponibili)` 
    });
});

// Route per vedere quanti codici sono stati usati
app.get('/admin/stats', (req, res) => {
    res.json({
        totaliCodici: codiciValidi.length,
        codiciUsati: codiciUsati.size,
        codiciDisponibili: codiciValidi.length - codiciUsati.size,
        listaUsati: Array.from(codiciUsati)
    });
});

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
    console.log(`Apri il browser e vai su http://localhost:${PORT}`);
});