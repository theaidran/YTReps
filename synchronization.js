// Stałe konfiguracyjne
const PUSHBULLET_API_URL = 'https://api.pushbullet.com/v2';
const NOTE_SIZE_LIMIT = 10000;
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minut
let syncInterval = null;

// Zmiana stałej na początku pliku
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minut w milisekundach (zmienione z 30)
let lastActivityTime = Date.now();
let inactivityTimeout = null;

// Dodaj na początku pliku
const SYNC_CHECK_INTERVAL = 60000; // Sprawdzaj co minutę

// Funkcja pomocnicza do sprawdzania dostępności flashcards
function getFlashcards() {
    return new Promise((resolve, reject) => {
        const maxAttempts = 10;
        let attempts = 0;

        function checkFlashcards() {
            if (typeof window.flashcards !== 'undefined' && window.flashcards) {
                resolve(window.flashcards);
            } else if (attempts >= maxAttempts) {
                reject(new Error('Flashcards not initialized'));
            } else {
                attempts++;
                setTimeout(checkFlashcards, 500);
            }
        }

        checkFlashcards();
    });
}

// Funkcja pomocnicza do bezpiecznego zapisywania fiszek
function safeSaveFlashcards() {
    if (typeof window.saveFlashcards === 'function') {
        window.saveFlashcards();
    } else {
        console.error('saveFlashcards function not available');
    }
}

// Funkcja inicjalizująca połączenie z Pushbullet
async function initPushbullet(apiKey) {
    try {
        const response = await fetch(`${PUSHBULLET_API_URL}/users/me`, {
            headers: {
                'Access-Token': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            localStorage.setItem('pushbullet_api_key', apiKey);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Pushbullet initialization failed:', error);
        return false;
    }
}

// Funkcja do wysyłania notatki przez Pushbullet
async function pushNote(title, body) {
    const apiKey = localStorage.getItem('pushbullet_api_key');
    if (!apiKey) return null;

    try {
        const response = await fetch(`${PUSHBULLET_API_URL}/pushes`, {
            method: 'POST',
            headers: {
                'Access-Token': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'note',
                title: title,
                body: body
            })
        });

        if (!response.ok) throw new Error('Push failed');
        return await response.json();
    } catch (error) {
        console.error('Push failed:', error);
        throw error;
    }
}

// Funkcja do pobierania notatek z Pushbullet
async function fetchNotes() {
    const apiKey = localStorage.getItem('pushbullet_api_key');
    if (!apiKey) {
        console.log('No API key found');
        return [];
    }

    try {
        console.log('Fetching notes from Pushbullet API...');
        let allNotes = [];
        let cursor = null;
        let hasMore = true;
        
        // Ustaw datę początkową na 5 lat temu
       // const fiveYearsAgo = new Date();
      //  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
     //   const modifiedAfter = Math.floor(fiveYearsAgo.getTime() / 1000);

        // Używamy czasu ostatniej synchronizacji
        const lastSyncTime = localStorage.getItem('last_sync_time') || '0';
        // Konwertujemy na sekundy dla API Pushbullet
       const modifiedAfter = Math.floor(parseInt(lastSyncTime) / 1000);

        while (hasMore) {
            const url = new URL(`${PUSHBULLET_API_URL}/pushes`);
            url.searchParams.append('limit', '500');
            url.searchParams.append('active', 'true');
            url.searchParams.append('modified_after', modifiedAfter);
            if (cursor) {
                url.searchParams.append('cursor', cursor);
            }

            const response = await fetch(url, {
                headers: {
                    'Access-Token': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.pushes && data.pushes.length > 0) {
                // Filtruj notatki już podczas pobierania
                const syncNotes = data.pushes.filter(note => 
                    note.type === 'note' && 
                    (note.title?.startsWith('sync_') || note.title?.startsWith('flashcards_sync_'))
                );
                allNotes = allNotes.concat(syncNotes);
                console.log(`Fetched ${data.pushes.length} notes, found ${syncNotes.length} sync notes, total sync notes: ${allNotes.length}`);
                
                if (data.cursor) {
                    cursor = data.cursor;
                    await new Promise(resolve => setTimeout(resolve, 250));
                } else {
                    hasMore = false;
                }
            } else {
                hasMore = false;
            }
        }

        console.log('Total sync notes fetched:', allNotes.length);
        return allNotes;
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
}

// Funkcja pomocnicza do obsługi czasu na początku pliku
function toUTCTimestamp(date) {
    if (!date) return null;
    return Math.floor(new Date(date).getTime() / 1000);
}

function fromUTCTimestamp(timestamp) {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toISOString();
}

function getCurrentUTCTimestamp() {
    return Math.floor(Date.now() / 1000);
}

// Funkcja do przygotowania danych do synchronizacji
async function prepareDataForSync() {
    try {
        const flashcards = await getFlashcards();
        if (!flashcards.length) {
            console.log('No flashcards available for sync');
            return [];
        }

        const lastSync = localStorage.getItem('last_sync_time');// +3000 ?
        const lastSyncTimestamp = lastSync ? toUTCTimestamp(lastSync) : 0;

        const modifiedFlashcards = flashcards.filter(card => {
            const cardLastSync = toUTCTimestamp(card.lastSync) || 0;
            const cardLastReviewed = toUTCTimestamp(card.lastReviewed) || 0;
            const cardLastModified = toUTCTimestamp(card.lastModified) || 0;

            return !lastSync || 
                   !card.lastSync ||
                   cardLastReviewed > cardLastSync ||
                   cardLastModified > cardLastSync ||
                   (card.repeats > 0 && !card.lastSync); //potencjalnie do usuniecia, karta ma powtorzenia ale niema synca
        });

        const currentTimestamp = getCurrentUTCTimestamp();
        return modifiedFlashcards.map(card => ({
            id: card.id,
            lastReviewed: card.lastReviewed,
            lastSync: fromUTCTimestamp(currentTimestamp),
            lastModified: card.lastModified,
            data: {...card, lastSync: fromUTCTimestamp(currentTimestamp)}
        }));
    } catch (error) {
        console.error('Error preparing data for sync:', error);
        return [];
    }
}

// Funkcja do podziału danych na części mieszczące się w limicie
function splitDataIntoChunks(data) {
    const maxChunkSize = Math.floor(NOTE_SIZE_LIMIT * 0.8); // Używamy 80% limitu
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    for (const item of data) {
        const itemString = JSON.stringify(item);
        const itemSize = itemString.length;

        // Jeśli pojedynczy element jest większy niż limit
        if (itemSize > maxChunkSize) {
            console.warn('Item too large, will be split:', item.id);
            continue;
        }

        if (currentSize + itemSize > maxChunkSize) {
            chunks.push(currentChunk);
            currentChunk = [item];
            currentSize = itemSize;
        } else {
            currentChunk.push(item);
            currentSize += itemSize;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}

// Funkcja do synchronizacji danych
async function syncWithPushbullet() {
    const modifiedData = await prepareDataForSync();
    if (modifiedData.length === 0) {
        console.log('No data to sync');
        return;
    }

    console.log('Preparing to sync', modifiedData.length, 'flashcards');
    const chunks = splitDataIntoChunks(modifiedData);
    const deviceId = localStorage.getItem('device_id') || 
                    Math.random().toString(36).substring(7);

    console.log('Sending chunks:', chunks.length);
    const timestamp = Date.now();

    for (let i = 0; i < chunks.length; i++) {
        const chunkData = chunks[i];
        const title = `sync_${deviceId}_${i + 1}_${chunks.length}`;
        const syncData = {
            command: 'sync_data',
            device_id: deviceId,
            chunk_number: i + 1,
            total_chunks: chunks.length,
            data: chunkData,
            timestamp: timestamp
        };

        try {
            console.log(`Sending chunk ${i + 1}/${chunks.length} with ${chunkData.length} items`);
            const result = await pushNote(title, JSON.stringify(syncData));
            console.log('Push result:', result);
            await new Promise(resolve => setTimeout(resolve, 250)); // Dodaj opóźnienie między wysyłaniem
        } catch (error) {
            console.error('Error sending chunk:', error);
            throw error;
        }
    }

    console.log('All chunks sent successfully');
    localStorage.setItem('last_sync_time', new Date().toISOString());
    localStorage.setItem('device_id', deviceId);

    // Po udanej synchronizacji zaktualizuj czas
    updateLastSyncTime();
    
    return true;
}

// Funkcja do pobierania i przetwarzania zsynchronizowanych danych
async function fetchFromPushbullet() {
    console.log('Fetching notes from Pushbullet...');
    const notes = await fetchNotes();
    const lastSync = localStorage.getItem('last_sync_time');
    const deviceId = localStorage.getItem('device_id');

    console.log('Found notes:', notes.length);
    console.log('Last sync:', lastSync);
    console.log('Device ID:', deviceId);

    // Grupuj notatki według zestawów (timestamp i device_id)
    const noteSets = new Map(); // Map<setKey, Map<chunkNumber, note>>
    
    const lastSyncTime = parseInt(localStorage.getItem('last_sync_time') || '0');

    // Najpierw pogrupuj wszystkie notatki
    for (const note of notes) {
        try {
            if (!note.title?.startsWith('sync_')) continue;
            
            const syncData = JSON.parse(note.body);
            if (syncData.device_id === deviceId && lastSyncTime > 0 ) continue; // Pomiń własne notatki
            
            const setKey = `${syncData.device_id}_${syncData.timestamp}`;
            if (!noteSets.has(setKey)) {
                noteSets.set(setKey, new Map());
            }

            // Obsługa zarówno głównych chunków jak i sub-chunków
            if (syncData.sub_chunk) {
                const mainChunkKey = syncData.chunk_number;
                if (!noteSets.get(setKey).has(mainChunkKey)) {
                    noteSets.get(setKey).set(mainChunkKey, {
                        subChunks: new Map(),
                        total_sub_chunks: syncData.total_sub_chunks
                    });
                }
                noteSets.get(setKey).get(mainChunkKey).subChunks.set(syncData.sub_chunk, syncData);
            } else {
                noteSets.get(setKey).set(syncData.chunk_number, syncData);
            }

            console.log(`Added ${syncData.sub_chunk ? 'sub-chunk' : 'chunk'} to set ${setKey}`);
        } catch (error) {
            console.error('Error processing note:', error);
            continue;
        }
    }

    // Przetwórz każdy kompletny zestaw
    for (const [setKey, chunks] of noteSets) {
        try {
            let allData = [];
            let isComplete = true;

            // Sprawdź kompletność i zbierz dane
            for (const [chunkNumber, chunkData] of chunks) {
                if (chunkData.subChunks) {
                    // Sprawdź kompletność sub-chunków
                    if (chunkData.subChunks.size !== chunkData.total_sub_chunks) {
                        console.log(`Incomplete sub-chunks for chunk ${chunkNumber} in set ${setKey}`);
                        isComplete = false;
                        break;
                    }
                    // Połącz dane z sub-chunków
                    const orderedSubChunks = Array.from({ length: chunkData.total_sub_chunks }, 
                        (_, i) => chunkData.subChunks.get(i + 1)?.data || []).flat();
                    allData.push(...orderedSubChunks);
                } else {
                    allData.push(...(chunkData.data || []));
                }
            }

            if (isComplete) {
                console.log(`Processing complete set ${setKey} with ${allData.length} items`);
                await processChunks([{ data: allData }]);
            } else {
                console.log(`Incomplete set ${setKey}`);
            }
        } catch (error) {
            console.error('Error processing set:', setKey, error);
        }
    }

    // Aktualizuj czas ostatniej synchronizacji
    if (noteSets.size > 0) {
        const latestSync = Math.max(...Array.from(noteSets.values())
            .flatMap(chunks => Array.from(chunks.values()))
            .map(chunk => chunk.created || 0)); // Używamy timestamp z body zamiast created
        localStorage.setItem('last_sync_time', new Date(latestSync).toISOString());
    }
}
// Funkcja do przetwarzania otrzymanych chunków danych
async function processChunks(chunks) {
    console.log('Processing chunks:', chunks.length);
    const receivedData = chunks
        .flatMap(chunk => chunk.data)
        .filter(item => item && item.data);

    console.log('Received data items:', receivedData.length);
    let hasChanges = false;
    const flashcards = await getFlashcards();

    for (const item of receivedData) {
        try {
            const existingIndex = flashcards.findIndex(card => card.id === item.data.id);
            const duplicateIndex = flashcards.findIndex(card => 
                card.word === item.data.word &&
                card.context === item.data.context &&
                card.translation === item.data.translation
            );

            if (existingIndex === -1 && duplicateIndex === -1) {
                console.log('Adding new flashcard:', item.data.word);
                flashcards.push(item.data);
                hasChanges = true;
            } else if (existingIndex !== -1) {
                const existingCard = flashcards[existingIndex];
                const contentChanged = 
                    existingCard.word !== item.data.word ||
                    existingCard.context !== item.data.context ||
                    existingCard.translation !== item.data.translation;
                    


                const itemLastModified = toUTCTimestamp(item.data.lastModified) || 0;
                const existingLastModified = toUTCTimestamp(existingCard.lastModified) || 0;
                const itemLastSync = toUTCTimestamp(item.data.lastSync) || 0;
                const existingLastSync = toUTCTimestamp(existingCard.lastSync) || 0;
                const itemLastReviewed = toUTCTimestamp(item.data.lastReviewed) || 0;
                const existingLastReviewed = toUTCTimestamp(existingCard.lastReviewed) || 0;
                // To pozwalal na przegladanie fiszek podczas synchroznijacji. Fiszki które zostana powtorzone, ich stan nie bedzie aktualizowane synchronizacja z serwera
                if ((itemLastModified > existingLastModified)|| itemLastReviewed > existingLastReviewed || itemLastSync > existingLastSync ) {
                    console.log('Updating existing flashcard:', { //(itemLastSync > existingLastSync 
                        old: {  
                            word: existingCard.word,
                            lastSync: fromUTCTimestamp(existingLastSync),
                            lastReviewed: fromUTCTimestamp(existingLastReviewed)
                        },
                        new: {
                            word: item.data.word,
                            lastSync: fromUTCTimestamp(itemLastSync),
                            lastReviewed: fromUTCTimestamp(itemLastReviewed)
                        }
                    });
                    flashcards[existingIndex] = item.data;
                    hasChanges = true;
                }
            }
        } catch (error) {
            console.error('Error processing item:', error);
        }
    }

    if (hasChanges) {
        console.log('Saving updated flashcards');
        window.flashcards = flashcards;
        safeSaveFlashcards();
        
        // Odśwież tabelę w interfejsie użytkownika
        if (typeof window.updateFlashcardTable === 'function') {
            window.updateFlashcardTable();
        }
        
        console.log('Flashcards updated after sync');
    } else {
        console.log('No changes to save');
    }
}

// Funkcja do ustawienia automatycznej synchronizacji
function setupAutomaticSync(customInterval = null) {
    if (window.syncInterval) {
        clearInterval(window.syncInterval);
        window.syncInterval = null;
    }

    const autoSync = localStorage.getItem('auto_sync') === 'true';
    if (!autoSync) {
        console.log('Automatic sync is disabled');
        return;
    }

    const interval = customInterval || parseInt(localStorage.getItem('sync_interval') || '5') * 60 * 1000;
    console.log(`Setting up automatic sync with interval: ${interval}ms`);

    window.syncInterval = setInterval(async () => {
        try {
            if (isUserActive() && !isSyncing) {
                await handleSync();
            } else if (!isUserActive()) {
                console.log('Skipping sync due to user inactivity');
            }
        } catch (error) {
            console.error('Auto sync failed:', error);
        }
    }, interval);

    const events = ['mousedown', 'keydown', 'mousemove', 'wheel', 'touchstart', 'scroll'];
    events.forEach(event => {
        document.addEventListener(event, resetActivityTimer, { passive: true });
    });

    resetActivityTimer();

    console.log('Automatic sync has been set up with inactivity monitoring');
}

// Funkcja do resetowania timera aktywności
function resetActivityTimer() {
    lastActivityTime = Date.now();
    
    if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
    }
    
    inactivityTimeout = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
}

// Funkcja obsługująca brak aktywności
function handleInactivity() {
    console.log('User inactive for 30 minutes, pausing sync');
    if (window.syncInterval) {
        clearInterval(window.syncInterval);
        window.syncInterval = null;
    }
}

// Funkcja do sprawdzania czy użytkownik jest aktywny
function isUserActive() {
    return (Date.now() - lastActivityTime) < INACTIVITY_TIMEOUT;
}

// Funkcja do usuwania notatek (logika biznesowa)
async function deleteAllPushbulletNotes(progressCallback) {
    const apiKey = localStorage.getItem('pushbullet_api_key');
    if (!apiKey) {
        throw new Error('No API key found');
    }

    try {
        // Najpierw spróbuj usunąć wszystkie notatki za jednym razem
        const response = await fetch(`${PUSHBULLET_API_URL}/pushes`, {
            method: 'DELETE',
            headers: {
                'Access-Token': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            localStorage.removeItem('last_sync_time');
            return { 
                deletedCount: 1, 
                skippedCount: 0, 
                errorCount: 0, 
                totalNotes: 1,
                message: 'All notes deleted successfully' 
            };
        }

        // Jeśli zbiorcze usuwanie nie zadziała, wróć do usuwania pojedynczo
        console.log('Bulk delete failed, falling back to individual deletion');
        const notes = await fetchNotes();
        const totalNotes = notes.length;

        if (totalNotes === 0) {
            return { deletedCount: 0, skippedCount: 0, errorCount: 0, totalNotes: 0 };
        }

        let deletedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const note of notes) {
            try {
                const response = await fetch(`${PUSHBULLET_API_URL}/pushes/${note.iden}`, {
                    method: 'DELETE',
                    headers: {
                        'Access-Token': apiKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 404) {
                    skippedCount++;
                } else if (response.ok) {
                    deletedCount++;
                } else {
                    throw new Error(`Unexpected status: ${response.status}`);
                }

                // Wywołaj callback z postępem
                if (progressCallback) {
                    progressCallback(deletedCount, skippedCount, totalNotes);
                }

                await new Promise(resolve => setTimeout(resolve, 250));
            } catch (error) {
                console.error(`Error deleting note ${note.title}:`, error);
                errorCount++;
            }
        }

        localStorage.removeItem('last_sync_time');
        return { deletedCount, skippedCount, errorCount, totalNotes };
    } catch (error) {
        console.error('Delete operation failed:', error);
        throw error;
    }
}

// Dodaj inicjalizację przycisku usuwania notatek
function initializeDeleteNotesButton() {
    const deleteButton = document.getElementById('delete-notes-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', async function(e) {
            e.preventDefault();
            const confirmMessage = translations[currentLanguage].confirmDeleteNotes || 
                                 'Are you sure you want to delete all sync notes? This action cannot be undone.';
            
            if (confirm(confirmMessage)) {
                try {
                    deleteButton.disabled = true;
                    deleteButton.classList.add('deleting');
                    await deleteAllPushbulletNotes();
                } finally {
                    deleteButton.disabled = false;
                    deleteButton.classList.remove('deleting');
                }
            }
        });
    }
}

// Funkcja do czyszczenia automatycznej synchronizacji
function clearAutomaticSync() {
    if (window.syncInterval) {
        clearInterval(window.syncInterval);
        window.syncInterval = null;
    }
    
    if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
        inactivityTimeout = null;
    }
    
    // Usuń nasłuchiwanie zdarzeń
    const events = ['mousedown', 'keydown', 'mousemove', 'wheel', 'touchstart', 'scroll'];
    events.forEach(event => {
        document.removeEventListener(event, resetActivityTimer);
    });

    console.log('Automatic sync has been cleared');
}

// Eksportuj funkcje do globalnego obiektu window
window.initPushbullet = initPushbullet;
window.syncWithPushbullet = syncWithPushbullet;
window.fetchFromPushbullet = fetchFromPushbullet;
window.setupAutomaticSync = setupAutomaticSync;
window.clearAutomaticSync = clearAutomaticSync;
window.deleteAllPushbulletNotes = deleteAllPushbulletNotes;

// Funkcja sprawdzająca nowe synchronizacje
async function checkNewSyncs() {
    const apiKey = localStorage.getItem('pushbullet_api_key');
    if (!apiKey) return;

    try {
        const lastSyncTime = localStorage.getItem('last_sync_time') || '0';
        console.log('Checking syncs with last sync time:', new Date(parseInt(lastSyncTime)).toLocaleString());

        const response = await fetch(`${PUSHBULLET_API_URL}/pushes?limit=1`, {
            headers: {
                'Access-Token': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.pushes && data.pushes.length > 0) {
            const latestPush = data.pushes[0];
            
            // Debugowanie zawartości pusha
            console.log('Latest push data:', latestPush);
            
            const latestTimestamp = latestPush.created * 1000;
            const lastSyncTimeMs = parseInt(lastSyncTime);

            // Wyświetl daty w konsoli
            console.log('Last sync time:', new Date(lastSyncTimeMs + 3000).toLocaleString());
            console.log('Latest push created:', new Date(latestTimestamp).toLocaleString());
            console.log('New sync available:', latestTimestamp > (lastSyncTimeMs + 3000));

            const syncButton = document.getElementById('sync-button');
            if (syncButton) {
                if (latestTimestamp >  (lastSyncTimeMs + 3000)) // add 3 seconds 
                {
                    // Jest nowa synchronizacja
                    syncButton.classList.add('new-sync');
                    console.log('Sync button changed to red: New data available on server');
                    
                    // Automatycznie uruchom synchronizację
                    console.log('Starting automatic sync due to new data...');
                    showNotification(translations[currentLanguage].newSyncAvailable || 'New data available, starting sync...', 'info');
                    
                    // Krótkie opóźnienie przed rozpoczęciem synchronizacji
                    setTimeout(async () => {
                        try {
                            await handleSync();
                        } catch (error) {
                            console.error('Auto sync failed:', error);
                        }
                    }, 1000); // 1 sekunda opóźnienia
                } else {
                    syncButton.classList.remove('new-sync');
                }
            }
        }
    } catch (error) {
        console.error('Error checking new syncs:', error);
    }
}

// Funkcja inicjalizująca sprawdzanie
function initSyncCheck() {
    // Sprawdź od razu po uruchomieniu
    checkNewSyncs();
    
    // Ustaw interwał sprawdzania
   // setInterval(checkNewSyncs, SYNC_CHECK_INTERVAL); // nie potrzebuje narazie
}

// Dodaj funkcję do aktualizacji czasu synchronizacji
function updateLastSyncTime() {
    const currentTime = Date.now();
    localStorage.setItem('last_sync_time', currentTime.toString());
    console.log('Sync time updated:', new Date(currentTime).toLocaleString());
       
    // Zaktualizuj timestamp dla wszystkich fiszek
        flashcards.forEach(flashcard => {
            flashcard.lastSync = currentTime;
        });
        saveFlashcards();
}
// Dodaj do window
window.updateLastSyncTime = updateLastSyncTime;
window.checkNewSyncs = checkNewSyncs;
window.initSyncCheck = initSyncCheck;

// Funkcja do wysyłania pliku CSV przez Pushbullet
async function sendCsvToPushbullet(csvContent) {
    const apiKey = localStorage.getItem('pushbullet_api_key');
    if (!apiKey) {
        throw new Error('No API key found');
    }

    try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const now = new Date();
        const dateStr = now.getFullYear() + '_' +
            String(now.getMonth() + 1).padStart(2, '0') + '_' +
            String(now.getDate()).padStart(2, '0') + '_' +
            String(now.getHours()).padStart(2, '0') + '_' +
            String(now.getMinutes()).padStart(2, '0') + '_' +
            String(now.getSeconds()).padStart(2, '0');
            
        const fileName = `flashcards_save_${dateStr}.csv`;

        const uploadRequestData = {
            file_name: fileName,
            file_type: 'text/csv'
        };

        const uploadResponse = await fetch(`${PUSHBULLET_API_URL}/upload-request`, {
            method: 'POST',
            headers: {
                'Access-Token': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadRequestData)
        });

        if (!uploadResponse.ok) {
            throw new Error('Failed to get upload URL');
        }

        const uploadData = await uploadResponse.json();
        console.log('Upload data received:', uploadData);

        const formData = new FormData();
        for (const [key, value] of Object.entries(uploadData.data)) {
            formData.append(key, value);
        }
        formData.append('file', blob, fileName);

        const fileUploadResponse = await fetch(uploadData.upload_url, {
            method: 'POST',
            body: formData
        });

        if (!fileUploadResponse.ok) {
            console.error('Upload response:', fileUploadResponse);
            throw new Error('Failed to upload file');
        }

        const pushResponse = await fetch(`${PUSHBULLET_API_URL}/pushes`, {
            method: 'POST',
            headers: {
                'Access-Token': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'file',
                file_name: fileName,
                file_type: 'text/csv',
                file_url: uploadData.file_url,
                title: 'Flashcards Save'
            })
        });

        if (!pushResponse.ok) {
            throw new Error('Failed to create push');
        }

        console.log('CSV file successfully sent to Pushbullet');
        return uploadData; // Zwracamy cały obiekt uploadData, który zawiera file_url
    } catch (error) {
        console.error('Error sending CSV to Pushbullet:', error);
        throw error;
    }
}

// Eksportuj funkcję do globalnego obiektu window
window.sendCsvToPushbullet = sendCsvToPushbullet;

// Funkcja do sprawdzania plików save na serwerze
async function checkSaveFiles() {
    const apiKey = localStorage.getItem('pushbullet_api_key');
    const exportToServer = localStorage.getItem('export_to_server') === 'true';
    if (!apiKey ) return; //|| !exportToServer

    try {
        const response = await fetch(`${PUSHBULLET_API_URL}/pushes?limit=500&active=true`, {
            headers: {
                'Access-Token': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.pushes && data.pushes.length > 0) {
            const saveFile = data.pushes
                .find(push => push.file_name && 
                            push.file_name.startsWith('flashcards_save_') && 
                            push.file_url);

            if (saveFile) {
                const saveLinkContainer = document.getElementById('save-link');
                if (saveLinkContainer) {
                    saveLinkContainer.innerHTML = `
                        <a href="${saveFile.file_url}" target="_blank">
                            Download ${saveFile.file_name}
                        </a>
                    `;
                    saveLinkContainer.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error('Error checking save files:', error);
    }
}

// Eksportuj funkcję
window.checkSaveFiles = checkSaveFiles;

