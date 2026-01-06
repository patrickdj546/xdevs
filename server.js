const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 8080;

// Middleware per parsare i dati del form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servire i file statici dalla cartella public
app.use(express.static('public'));

// Webhook Discord
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1457755984393932863/v6oEgqypVcyC-6leg0inPRbSlszPXsNAGNWoeLRNhuk6eAyhLEQKXlQXZWEpNgWycyq4';

// File JSON per il database dei codici
const CODICI_FILE = 'codici.json';

// Carica i codici dal file JSON
function caricaCodiciDalFile() {
    try {
        if (fs.existsSync(CODICI_FILE)) {
            const data = fs.readFileSync(CODICI_FILE, 'utf8');
            return JSON.parse(data);
        } else {
            // Crea file iniziale se non esiste
            const datiIniziali = {
                codici: [],
                codiciUsati: [],
                ultimoAggiornamento: new Date().toISOString(),
                statistiche: {
                    totali: 0,
                    usati: 0,
                    disponibili: 0
                }
            };
            salvaCodiciSuFile(datiIniziali);
            return datiIniziali;
        }
    } catch (error) {
        console.error('Errore nel caricamento del file:', error);
        return {
            codici: [],
            codiciUsati: [],
            ultimoAggiornamento: null,
            statistiche: { totali: 0, usati: 0, disponibili: 0 }
        };
    }
}

// Salva i codici sul file JSON
function salvaCodiciSuFile(dati) {
    try {
        dati.ultimoAggiornamento = new Date().toISOString();
        // Aggiorna statistiche
        dati.statistiche = {
            totali: dati.codici.length,
            usati: dati.codiciUsati.length,
            disponibili: dati.codici.length - dati.codiciUsati.length
        };
        
        fs.writeFileSync(CODICI_FILE, JSON.stringify(dati, null, 2));
        console.log('✅ Codici salvati su file');
        return true;
    } catch (error) {
        console.error('❌ Errore nel salvataggio del file:', error);
        return false;
    }
}

// Funzione helper per normalizzare i codici
function normalizzaCodice(codice) {
    return codice.trim().toLowerCase();
}

// Carica dati iniziali
let database = caricaCodiciDalFile();

// Inizializza array e set con i dati dal file
let codiciValidi = database.codici;
let codiciUsati = new Set(database.codiciUsati);

// Credenziali admin
const ADMIN_EMAIL = 'lorisenabbo@gmail.com';
const ADMIN_PASSWORD = 'Patrick27';

// Middleware per verificare token admin
function verificaAdmin(req, res, next) {
    const token = req.headers.authorization;
    if (token === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ successo: false, messaggio: 'Accesso non autorizzato' });
    }
}

// Funzione per inviare notifica a Discord
async function inviaNotificaDiscord(codice, idInvoice, linkDiscord, email) {
    const embed = {
        embeds: [{
            title: "🎉 Nuovo Codice Utilizzato!",
            color: 5814783,
            fields: [
                {
                    name: "📝 Codice",
                    value: `\`${codice}\``,
                    inline: false
                },
                {
                    name: "🧾 ID Invoice/Ordine",
                    value: `\`${idInvoice}\``,
                    inline: false
                },
                {
                    name: "📧 Email",
                    value: email,
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
                },
                {
                    name: "🎁 Tipo Boost",
                    value: codice.split('-')[0] + ' Boost',
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
    let codiceInserito = req.body.codice.trim();
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
    
    // Normalizza il codice
    codiceInserito = normalizzaCodice(codiceInserito);
    
    // Controlla se il codice è valido
    if (codiciValidi.includes(codiceInserito)) {
        // Controlla se il codice è già stato usato
        if (codiciUsati.has(codiceInserito)) {
            return res.json({ 
                valido: false, 
                messaggio: 'Codice già utilizzato!' 
            });
        } else {
            // Aggiungi il codice ai codici usati
            codiciUsati.add(codiceInserito);
            
            // Aggiorna database
            database.codiciUsati = Array.from(codiciUsati);
            salvaCodiciSuFile(database);
            
            // Invia notifica su Discord
            const notificaInviata = await inviaNotificaDiscord(codiceInserito, idInvoice, linkDiscord, email);
            
            return res.json({ 
                valido: true, 
                messaggio: '✅ Codice valido! Il riscatto è stato processato.',
                boostType: codiceInserito.split('-')[0] + ' Boost',
                notificaInviata: notificaInviata
            });
        }
    } else {
        return res.json({ 
            valido: false, 
            messaggio: '❌ Codice non valido!' 
        });
    }
});

// === ROUTE ADMIN ===

// Login admin
app.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
    
    if ((email === 'lorisenabbo@gmail.com' || email === 'wasonontop@gmail.com') && 
        (password === 'Patrick27' || password === '029411')) {
        res.json({ 
            successo: true, 
            messaggio: 'Login effettuato con successo!',
            token: ADMIN_PASSWORD
        });
    } else {
        res.json({ 
            successo: false, 
            messaggio: 'Email o password errati!' 
        });
    }
});

// Route per ottenere tutti i codici
app.get('/admin/codici', verificaAdmin, (req, res) => {
    const codiciPerCategoria = {
        '2x': [],
        '4x': [],
        '6x': [],
        '8x': [],
        '10x': [],
        '12x': [],
        '14x': []
    };

    // Organizza i codici per categoria
    codiciValidi.forEach(codice => {
        const categoria = codice.split('-')[0].toLowerCase();
        if (codiciPerCategoria[categoria]) {
            codiciPerCategoria[categoria].push({
                codice: codice,
                usato: codiciUsati.has(codice)
            });
        }
    });

    res.json({
        successo: true,
        codici: codiciPerCategoria,
        statistiche: {
            totale: codiciValidi.length,
            usati: codiciUsati.size,
            disponibili: codiciValidi.length - codiciUsati.size
        }
    });
});

// Aggiungi codice singolo
app.post('/admin/codici/aggiungi', verificaAdmin, (req, res) => {
    const { codice } = req.body;
    
    if (!codice) {
        return res.json({ successo: false, messaggio: 'Codice mancante!' });
    }

    const codiceNormalized = normalizzaCodice(codice);
    
    if (codiciValidi.includes(codiceNormalized)) {
        return res.json({ successo: false, messaggio: 'Codice già esistente!' });
    }

    codiciValidi.push(codiceNormalized);
    database.codici = codiciValidi;
    salvaCodiciSuFile(database);
    
    res.json({ 
        successo: true, 
        messaggio: 'Codice aggiunto con successo!',
        codice: codiceNormalized
    });
});

// Aggiungi codici multipli
app.post('/admin/codici/aggiungi-multi', verificaAdmin, (req, res) => {
    const { codici } = req.body;
    
    if (!codici || !Array.isArray(codici)) {
        return res.json({ successo: false, messaggio: 'Nessun codice fornito!' });
    }

    const nuoviCodici = [];
    const duplicati = [];
    
    codici.forEach(codice => {
        const codiceNormalized = normalizzaCodice(codice);
        if (!codiciValidi.includes(codiceNormalized)) {
            codiciValidi.push(codiceNormalized);
            nuoviCodici.push(codiceNormalized);
        } else {
            duplicati.push(codiceNormalized);
        }
    });

    if (nuoviCodici.length > 0) {
        database.codici = codiciValidi;
        salvaCodiciSuFile(database);
    }

    res.json({ 
        successo: true, 
        messaggio: `Operazione completata!`,
        aggiunti: nuoviCodici.length,
        duplicati: duplicati.length,
        totaleCodici: codiciValidi.length
    });
});

// Modifica codice
app.post('/admin/codici/modifica', verificaAdmin, (req, res) => {
    const { vecchioCodice, nuovoCodice } = req.body;
    
    if (!vecchioCodice || !nuovoCodice) {
        return res.json({ successo: false, messaggio: 'Dati mancanti!' });
    }

    const vecchioNormalized = normalizzaCodice(vecchioCodice);
    const nuovoNormalized = normalizzaCodice(nuovoCodice);
    
    const index = codiciValidi.indexOf(vecchioNormalized);
    if (index === -1) {
        return res.json({ successo: false, messaggio: 'Codice non trovato!' });
    }

    // Se il vecchio codice era usato, aggiorna il set
    if (codiciUsati.has(vecchioNormalized)) {
        codiciUsati.delete(vecchioNormalized);
        codiciUsati.add(nuovoNormalized);
    }

    codiciValidi[index] = nuovoNormalized;
    database.codici = codiciValidi;
    database.codiciUsati = Array.from(codiciUsati);
    salvaCodiciSuFile(database);
    
    res.json({ 
        successo: true, 
        messaggio: 'Codice modificato con successo!'
    });
});

// Elimina codice
app.post('/admin/codici/elimina', verificaAdmin, (req, res) => {
    const { codice } = req.body;
    
    if (!codice) {
        return res.json({ successo: false, messaggio: 'Codice mancante!' });
    }

    const codiceNormalized = normalizzaCodice(codice);
    const index = codiciValidi.indexOf(codiceNormalized);
    
    if (index === -1) {
        return res.json({ successo: false, messaggio: 'Codice non trovato!' });
    }

    // Rimuovi dal set se era usato
    codiciUsati.delete(codiceNormalized);
    
    // Rimuovi dall'array
    codiciValidi.splice(index, 1);
    
    // Aggiorna database
    database.codici = codiciValidi;
    database.codiciUsati = Array.from(codiciUsati);
    salvaCodiciSuFile(database);
    
    res.json({ 
        successo: true, 
        messaggio: 'Codice eliminato con successo!'
    });
});

// Elimina TUTTI i codici
app.post('/admin/codici/elimina-tutti', verificaAdmin, (req, res) => {
    codiciValidi = [];
    codiciUsati.clear();
    
    database.codici = [];
    database.codiciUsati = [];
    salvaCodiciSuFile(database);
    
    res.json({ 
        successo: true, 
        messaggio: 'Tutti i codici sono stati eliminati!'
    });
});

// Route per resettare i codici usati
app.post('/admin/reset-codici', verificaAdmin, (req, res) => {
    codiciUsati.clear();
    database.codiciUsati = [];
    salvaCodiciSuFile(database);
    
    res.json({ 
        successo: true, 
        messaggio: `Tutti i codici sono stati resettati! (${codiciValidi.length} codici disponibili)` 
    });
});

// Route per scaricare il file JSON
app.get('/admin/codici/download', verificaAdmin, (req, res) => {
    res.setHeader('Content-Disposition', 'attachment; filename="codici-backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(database, null, 2));
});

// Route per caricare codici da file JSON
app.post('/admin/codici/carica', verificaAdmin, (req, res) => {
    const { contenuto } = req.body;
    
    if (!contenuto) {
        return res.json({ successo: false, messaggio: 'Nessun contenuto fornito!' });
    }

    try {
        const datiCaricati = JSON.parse(contenuto);
        
        if (!Array.isArray(datiCaricati.codici)) {
            return res.json({ successo: false, messaggio: 'Formato file non valido!' });
        }

        // Sostituisci i codici esistenti
        codiciValidi = [];
        codiciUsati = new Set();
        
        datiCaricati.codici.forEach(codice => {
            const codiceNormalized = normalizzaCodice(codice);
            if (!codiciValidi.includes(codiceNormalized)) {
                codiciValidi.push(codiceNormalized);
            }
        });

        if (Array.isArray(datiCaricati.codiciUsati)) {
            datiCaricati.codiciUsati.forEach(codice => {
                codiciUsati.add(normalizzaCodice(codice));
            });
        }

        // Aggiorna database
        database.codici = codiciValidi;
        database.codiciUsati = Array.from(codiciUsati);
        salvaCodiciSuFile(database);
        
        res.json({ 
            successo: true, 
            messaggio: `Codici caricati con successo! (${codiciValidi.length} codici totali)`
        });
    } catch (error) {
        console.error('Errore nel caricamento:', error);
        res.json({ successo: false, messaggio: 'Errore nel caricamento del file!' });
    }
});

// Route per vedere le statistiche (pubblica)
app.get('/admin/stats', (req, res) => {
    res.json({
        totaliCodici: codiciValidi.length,
        codiciUsati: codiciUsati.size,
        codiciDisponibili: codiciValidi.length - codiciUsati.size,
        listaUsati: Array.from(codiciUsati)
    });
});

// Route per vedere le statistiche (protetta)
app.get('/admin/stats-protette', verificaAdmin, (req, res) => {
    res.json({
        totaliCodici: codiciValidi.length,
        codiciUsati: codiciUsati.size,
        codiciDisponibili: codiciValidi.length - codiciUsati.size,
        listaUsati: Array.from(codiciUsati),
        listaCompleta: codiciValidi,
        ultimoAggiornamento: database.ultimoAggiornamento
    });
});

// Route per testare un codice (non lo attiva)
app.post('/test-codice', (req, res) => {
    const { codice } = req.body;
    
    if (!codice) {
        return res.json({ successo: false, messaggio: 'Codice mancante!' });
    }

    const codiceNormalized = normalizzaCodice(codice);
    const codiceEsiste = codiciValidi.includes(codiceNormalized);
    
    res.json({
        successo: codiceEsiste,
        disponibile: codiceEsiste && !codiciUsati.has(codiceNormalized),
        messaggio: codiceEsiste ? 
            (codiciUsati.has(codiceNormalized) ? 'Codice già utilizzato!' : 'Codice valido!') : 
            'Codice non trovato!',
        tipo: codiceEsiste ? codiceNormalized.split('-')[0] + ' Boost' : null
    });
});

// Test endpoint
app.get('/test-server', (req, res) => {
    res.json({
        status: 'online',
        serverTime: new Date().toISOString(),
        codiciTotali: codiciValidi.length,
        codiciUsati: codiciUsati.size,
        fileDatabase: CODICI_FILE,
        ultimoBackup: database.ultimoAggiornamento
    });
});

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route per admin.html
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Route per test.html
app.get('/test.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Gestione errori 404
app.use((req, res) => {
    res.status(404).json({ 
        errore: true, 
        messaggio: 'Pagina non trovata' 
    });
});

// Gestione errori generici
app.use((err, req, res, next) => {
    console.error('Errore server:', err);
    res.status(500).json({ 
        errore: true, 
        messaggio: 'Errore interno del server' 
    });
});

// Avvio server
app.listen(PORT, () => {
    console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
    console.log(`🌐 Apri il browser e vai su http://localhost:${PORT}`);
    console.log(`🔐 Admin login: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password admin: ${ADMIN_PASSWORD}`);
    console.log(`📊 Dashboard admin: http://localhost:${PORT}/admin.html`);
    console.log(`🧪 Test server: http://localhost:${PORT}/test-server`);
    console.log(`📝 File database: ${CODICI_FILE}`);
    console.log(`💾 Codici caricati: ${codiciValidi.length}`);
    console.log(`🎮 Categorie: 2x, 4x, 6x, 8x, 10x, 12x, 14x`);
    console.log(`⏰ Ultimo aggiornamento: ${database.ultimoAggiornamento || 'Mai'}`);
});