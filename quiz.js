// Dodaj tę linię na początku pliku, zaraz po deklaracji translations
let currentLanguage = 'en'; // Domyślnie ustawiamy język angielski
lastScrollPosition = 0;

// Dodaj te zmienne globalne na początku pliku
let flashcardsToReview = [];
let currentFlashcardIndex = 0;

const translations = {
    en: {
        review: "Review",
        browseFlashcards: "Browse Flashcards",
        addFlashcard: "Add Flashcard",
        statistics: "Statistics",
        exportToFile: "Export to File",
        importFromFile: "Import from File",
        repetitions: "Repetitions",
        myPlaylists: "My Playlists",
        addNewFlashcard: "Add New Flashcard",
        wordPhrase: "Word / Phrase",
        contextExample: "Context / Example",
        translation: "Translation",
        imageLink: "Image link (http)",
        audioLink: "Audio link (http)",
        addFlashcardButton: "Add Flashcard",
        yourFlashcards: "Your Flashcards",
        no: "No.",
        known: "Known",
        media: "Media",
        audio: "Audio",
        actions: "Actions",
        info: "Info",
        howDoReviewsWork: "How do reviews work?",
        reviewExplanation: "Our system uses a spaced repetition method to help you effectively memorize words:",
        firstRecall: "After 1st correct recall: next review in 2 days",
        secondRecall: "After 2nd correct recall: next review in 4 days",
        thirdRecall: "After 3rd correct recall: next review in 8 days",
        fourthRecall: "After 4th correct recall: next review in 16 days",
        andSoOn: "and so on...",
        reviewTip: "If you don't remember a word, it will return to the beginning of the cycle. Regular reviews are the key to success!",
        close: "Close",
        totalFlashcards: "Total number of flashcards:",
        numberOfReviews: "Number of reviews:",
        currentKnowledgeState: "Current knowledge state of all flashcards",
        masteredLast7Days: "Number mastered in the last 7 days:",
        masteredTooltip: "This is the number of flashcards that:\n1. Have been reviewed correctly at least 5 times (considered mastered).\n2. Their last review was within the last 7 days.",
        showTranslation: "Show translation",
        iKnow: "I know",
        iDontKnow: "I don't know",
        endOfReview: "End of review!",
        checkNewFlashcards: "Check new flashcards",
        repeatUnknown: "Repeat unknown only",
        repeatAll: "Repeat all",
        flashcardAdded: "Flashcard has been added!",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        cancel: "Cancel",
        noFlashcardsToReview: "No flashcards to review today!",
        nextReviewAvailable: "Next review will be available:",
        flashcardCategories: "Flashcard categories:",
        newFlashcards: "New",
        newFlashcardsDescription: "(green): Flashcards that haven't been reviewed yet or weren't remembered.",
        learningFlashcards: "Learning",
        learningFlashcardsDescription: "(blue): Flashcards that were correctly reviewed 1 to 4 times.",
        masteredFlashcards: "Mastered",
        masteredFlashcardsDescription: "(turquoise): Flashcards that were correctly reviewed 5 or more times.",
        currentKnowledgeStateTooltip: "Number of flashcards with correct answers to the total number of flashcards",
        masteredLast7DaysTooltip: "This is the number of flashcards that:\n1. Have been reviewed correctly at least 5 times (considered mastered).\n2. Their last review was within the last 7 days.",
        flashcardStatistics: "Flashcard Statistics",
        deleteAll: "Delete All",
        confirmDeleteAll: "Are you sure you want to delete all flashcards? This action cannot be undone.",
        goBack: "Go back to previous flashcard",
        yes: "Yes",
        no2: "No",
        dictionary: "Dictionary",
    },
    pl: {
        review: "Powtórki",
        browseFlashcards: "Przeglądaj fiszki",
        addFlashcard: "Dodaj fiszkę",
        statistics: "Statystyki",
        exportToFile: "Eksportuj do pliku",
        importFromFile: "Importuj z pliku",
        repetitions: "Powtórki",
        myPlaylists: "Moje playlisty",
        addNewFlashcard: "Dodaj nową fiszkę",
        wordPhrase: "Słowo / Fraza",
        contextExample: "Kontekst / Przykład",
        translation: "Tłumaczenie",
        imageLink: "Link do obrazu (http)",
        audioLink: "Link do audio (http)",
        addFlashcardButton: "Dodaj fiszkę",
        yourFlashcards: "Twoje fiszki",
        no: "Lp.",
        known: "Znane",
        media: "Media",
        audio: "Audio",
        actions: "Akcje",
        info: "Info",
        howDoReviewsWork: "Jak działają powtórki?",
        reviewExplanation: "Nasz system wykorzystuje metodę powtórek rozłożonych w czasie, aby pomóc Ci efektywnie zapamiętać słówka:",
        firstRecall: "Po 1. poprawnym zapamiętaniu: następna powtórka za 2 dni",
        secondRecall: "Po 2. poprawnym zapamiętaniu: następna powtórka za 4 dni",
        thirdRecall: "Po 3. poprawnym zapamiętaniu: następna powtórka za 8 dni",
        fourthRecall: "Po 4. poprawnym zapamiętaniu: następna powtrka za 16 dni",
        andSoOn: "itd.",
        reviewTip: "Jeśli nie zapamiętasz słówka, wróci ono do początku cyklu. Regularne powtórki to klucz do sukcesu!",
        close: "Zamknij",
        totalFlashcards: "Całkowita liczba fiszek:",
        numberOfReviews: "Liczba powtórek:",
        currentKnowledgeState: "Obecny stan znajomości wszystkich fiszek",
        masteredLast7Days: "Liczba opanowanych przez ostatnie 7 dni:",
        masteredTooltip: "To liczba fiszek, które:\n1. Zostały powtórzone co najmniej 5 razy (uznawane za opanowane).\n2. Ich ostatnie powtórzenie miało miejsce w ciągu ostatnich 7 dni.",
        showTranslation: "Pokaż tłumaczenie",
        iKnow: "Znam",
        iDontKnow: "Nie znam",
        endOfReview: "Koniec powtórki!",
        checkNewFlashcards: "Sprawdź nowe fiszki",
        repeatUnknown: "Powtórz tylko nieznane",
        repeatAll: "Powtórz wszystkie",
        flashcardAdded: "Fiszka została dodana!",
        edit: "Edytuj",
        delete: "Usuń",
        save: "Zapisz",
        cancel: "Anuluj",
        noFlashcardsToReview: "Brak fiszek do powtórki na dziś!",
        nextReviewAvailable: "Następna powtórka będzie dostępna:",
        flashcardCategories: "Kategorie fiszek:",
        newFlashcards: "Nowe",
        newFlashcardsDescription: "(zielony): Fiszki, które nie były jeszcze powtarzane lub nie zostały zapamiętane.",
        learningFlashcards: "Uczone",
        learningFlashcardsDescription: "(niebieski): Fiszki, które były poprawnie powtórzone od 1 do 4 razy.",
        masteredFlashcards: "Opanowane",
        masteredFlashcardsDescription: "(turkusowy): Fiszki, które były poprawnie powtórzone 5 lub więcej razy.",
        currentKnowledgeStateTooltip: "Liczba fiszek z poprawną odpowiedzią do liczby wszystkich fiszek",
        masteredLast7DaysTooltip: "To liczba fiszek, które:\n1. Zostały powtórzone co najmniej 5 razy (uznawane za opanowane).\n2. Ich ostatnie powtórzenie miało miejsce w ciągu ostatnich 7 dni.",
        flashcardStatistics: "Statystyki fiszek",
        deleteAll: "Usuń wszystkie",
        confirmDeleteAll: "Czy na pewno chcesz usunąć wszystkie fiszki? Tej akcji nie można cofnąć.",
        goBack: "Wróć do poprzedniej fiszki",
        yes: "Tak",
        no2: "Nie",
        dictionary: "Słownik",
    }
};

// Globalna zmienna do przechowywania fiszek
let flashcards = [];

// Funkcja do ładowania fiszek z localStorage
function loadFlashcards() {
  const savedFlashcards = localStorage.getItem('flashcards');
  const savedFiszki = localStorage.getItem('fiszki');
  
  if (savedFlashcards) {
    flashcards = JSON.parse(savedFlashcards);
  } else if (savedFiszki) {
    const fiszki = JSON.parse(savedFiszki);
    flashcards = fiszki.map(fiszka => ({
      id: Date.now() + Math.random(),
      word: fiszka.word,
      context: fiszka.context,
      translation: fiszka.translation,
      mediaUrl: '',
      audioUrl: '',
      repeats: 0,
      lastReviewed: null
    }));
  } else {
    flashcards = [];
  }
  
  console.log('Załadowano fiszki:', flashcards);
  saveFlashcards();
}

// Funkcja do zapisywania fiszek w localStorage
function saveFlashcards() {
  localStorage.setItem('fiszki', JSON.stringify(flashcards));
  console.log('Zapisano fiszki:', flashcards);
}

// Funkcja do dodawania nowej fiszki
function addFlashcard(word, context, translation, mediaUrl = '', audioUrl = '') {
  const newFlashcard = {
    id: Date.now(),
    word,
    context,
    translation,
    mediaUrl,
    audioUrl,
    repeats: 0,
    lastReviewed: null,
    createdAt: new Date().toISOString()
  };
  flashcards.push(newFlashcard);
  saveFlashcards();
  updateFlashcardTable();
  updateStats();
  drawLearningProgressChart(); // Dodajemy tę linię
  showSection('view');
  const message = translations[currentLanguage].flashcardAdded || 'Flashcard has been added!';
  alert(message);
}

// Funkcja do aktualizacji tabeli fiszek
function updateFlashcardTable() {
    const tableBody = document.querySelector('#flashcardTable tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    flashcards.forEach((flashcard, index) => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', flashcard.id);
        const isKnown = flashcard.repeats > 0 ? translations[currentLanguage].yes : translations[currentLanguage].no2;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${flashcard.word}</td>
            <td>${flashcard.context || ''}</td>
            <td>${flashcard.translation}</td>
            <td>${isKnown}</td>
            <td>${flashcard.mediaUrl ? '<img src="' + flashcard.mediaUrl + '" alt="media" width="50">' : ''}</td>
            <td>${flashcard.audioUrl ? '<audio controls><source src="' + flashcard.audioUrl + '" type="audio/mpeg"></audio>' : ''}</td>
            <td>
                <button onclick="editFlashcard(${flashcard.id})" data-translate="edit">Edit</button>
                <button onclick="deleteFlashcard(${flashcard.id})" data-translate="delete">Delete</button>
            </td>
        `;
        
        // Dodaj obsługę pojedynczego kliknięcia na wiersz
        row.addEventListener('click', function(event) {
            // Sprawdź, czy kliknięcie nie było na przyciskach
            if (!event.target.closest('button')) {
                toggleRowSelection(this);
            }
        });

        // Dodaj obsługę podwójnego kliknięcia na wiersz
        row.addEventListener('dblclick', function(event) {
            // Sprawdź, czy kliknięcie nie było na przyciskach
            if (!event.target.closest('button')) {
                editFlashcard(flashcard.id);
            }
        });
        
        tableBody.appendChild(row);
    });

    // Dodaj nowy wiersz z przyciskiem "Usuń wszystkie"
    const deleteAllRow = document.createElement('tr');
    deleteAllRow.innerHTML = `
        <td colspan="7"></td>
        <td>
            <button onclick="deleteAllFlashcards()" class="delete-all-button" data-translate="deleteAll">Delete All</button>
        </td>
    `;
    tableBody.appendChild(deleteAllRow);
    
    changeLanguage();
}

// Funkcja do wyświetlania sekcji
function showSection(sectionId) {
    console.log(`Próba wyświetlenia sekcji: ${sectionId}`);
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
        console.log(`Ukryto sekcję: ${section.id}`);
    });
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        console.log(`Wyświetlono sekcję: ${sectionId}`);
        if (sectionId === 'add') {
            setupAutoResizingTextareas();
        }
        if (sectionId === 'review') {
            initializeReviewSection();
        }
    } else {
        console.error(`Nie znaleziono sekcji o id: ${sectionId}`);
    }
    
    // Aktualizuj aktywny przycisk w menu nawigacyjnym
    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Znajdź odpowiedni przycisk i dodaj klasę 'active'
    let activeButton;
    if (sectionId === 'review') {
        activeButton = document.querySelector('.nav-button[onclick*="showSection(\'review\')"]');
    } else {
        activeButton = document.querySelector(`.nav-button[onclick="showSection('${sectionId}')"]`);
    }
    
    if (activeButton) {
        activeButton.classList.add('active');
    } else {
        console.error(`Nie znaleziono przycisku dla sekcji: ${sectionId}`);
    }
}

// Funkcja do aktualizacji statystyk
function updateStats() {
  let totalFlashcards = flashcards.length;
  let knownFlashcards = countKnownFlashcards();
  let masteredLast7Days = countMasteredLast7Days();
  
  const statsSection = document.getElementById('stats');
  statsSection.innerHTML = generateStatsHTML();
  
  document.getElementById('totalFlashcards').textContent = totalFlashcards;
  
  // Oblicz procent znanych fiszek
  let knownPercentage = totalFlashcards > 0 ? (knownFlashcards / totalFlashcards * 100).toFixed(1) : 0;
  document.getElementById('knownFlashcards').textContent = `${knownPercentage}%`;
  
  document.getElementById('masteredLast7Days').textContent = masteredLast7Days;

  drawLearningProgressChart();
  changeLanguage(); // Dodajemy to wywołanie, aby przetłumaczyć nowo wygenerowaną zawartość
}

// Funkcja do rozpoczęcia powtórki
function startReview() {
    console.log('Rozpoczęcie powtórki');
    if (flashcardsToReview.length === 0) {
        flashcardsToReview = flashcards.filter(flashcard => shouldReview(flashcard));
        currentFlashcardIndex = 0;
    }
    if (flashcardsToReview.length > 0) {
        showNextFlashcard();
    } else {
        let nextReviewDate = getNextReviewDate(flashcards);
        document.getElementById('reviewCard').innerHTML = `
            <p data-translate="noFlashcardsToReview">No flashcards to review today!</p>
            <p><span data-translate="nextReviewAvailable">Next review will be available:</span> ${formatDate(nextReviewDate)}</p>
            <div class="button-container">
                <button onclick="startReview()" class="review-button" data-translate="checkNewFlashcards">Check new flashcards</button>
                <button onclick="restartUnknownReview()" class="review-button" data-translate="repeatUnknown">Repeat unknown only</button>
                <button onclick="restartReview()" class="review-button" data-translate="repeatAll">Repeat all</button>
            </div>
        `;
    }
    showSection('review');
    changeLanguage();
    updateFlashcardTable();
}

// Funkcja do sprawdzania, czy fiszka powinna być powtórzona
function shouldReview(flashcard) {
  if (!flashcard.lastReviewed) return true;
  const now = new Date();
  const lastReviewed = new Date(flashcard.lastReviewed);
  const daysSinceLastReview = (now - lastReviewed) / (1000 * 60 * 60 * 24);
  return daysSinceLastReview >= Math.pow(2, flashcard.repeats);
}

// Funkcja do wyświetlania następnej fiszki
function showNextFlashcard() {
    if (currentFlashcardIndex < flashcardsToReview.length) {
        const flashcard = flashcardsToReview[currentFlashcardIndex];
        document.getElementById('reviewCard').innerHTML = `
            <div class="card-content">
                <p><strong data-translate="wordPhrase">Word / Phrase:</strong></p>
                <pre>${flashcard.word}</pre>
                <p><strong data-translate="contextExample">Context / Example:</strong></p>
                <pre>${flashcard.context || 'No context provided'}</pre>
                ${flashcard.mediaUrl ? `<img src="${flashcard.mediaUrl}" alt="media" width="200">` : ''}
                ${flashcard.audioUrl ? `<audio controls><source src="${flashcard.audioUrl}" type="audio/mpeg"></audio>` : ''}
                <div class="button-row">
                    <button onclick="showTranslation(${currentFlashcardIndex})" class="show-translation" data-translate="showTranslation">Show translation</button>
                    <button id="knownButton-${currentFlashcardIndex}" class="known-button hidden" onclick="markAsKnown(true)" data-translate="iKnow">I know</button>
                    <button id="unknownButton-${currentFlashcardIndex}" class="unknown-button hidden" onclick="markAsKnown(false)" data-translate="iDontKnow">I don't know</button>
                </div>
                <div id="translation-${currentFlashcardIndex}" class="translation hidden">
                    <p><strong data-translate="translation">Translation:</strong></p>
                    <pre>${flashcard.translation}</pre>
                </div>
            </div>
        `;
    } else {
        document.getElementById('reviewCard').innerHTML = `
            <p data-translate="endOfReview">End of review!</p>
            <div class="button-container">
                <button onclick="startReview()" class="review-button" data-translate="checkNewFlashcards">Check new flashcards</button>
                <button onclick="restartUnknownReview()" class="review-button" data-translate="repeatUnknown">Repeat unknown only</button>
                <button onclick="restartReview()" class="review-button" data-translate="repeatAll">Repeat all</button>
            </div>
        `;
        updateFlashcardTable();
    }
    changeLanguage();
}

// Funkcja do pokazywania tłumaczenia
function showTranslation(index) {
  document.getElementById(`translation-${index}`).classList.remove('hidden');
  document.getElementById(`knownButton-${index}`).classList.remove('hidden');
  document.getElementById(`unknownButton-${index}`).classList.remove('hidden');
  document.querySelector('.show-translation').classList.add('hidden');
}

// Funkcja do oznaczania fiszki jako znanej lub nieznanej
function markAsKnown(isKnown) {
  const flashcard = flashcardsToReview[currentFlashcardIndex];
  const previousRepeats = flashcard.repeats;
  if (isKnown) {
    flashcard.repeats++;
  } else {
    flashcard.repeats = 0;
  }
  flashcard.lastReviewed = new Date().toISOString();
  flashcard.previousAnswer = { repeats: previousRepeats, lastReviewed: flashcard.lastReviewed };
  saveFlashcards();
  currentFlashcardIndex++;
  showNextFlashcard();
  updateStats();
  updateFlashcardTable();
}

// Funkcja do restartu powtórki
function restartReview() {
  flashcardsToReview = [...flashcards];
  currentFlashcardIndex = 0;
  showNextFlashcard();
  updateFlashcardTable();
}

// Funkcja do edycji fiszki
function editFlashcard(id) {
    lastScrollPosition = window.scrollY;
    const flashcard = flashcards.find(f => f.id === id);
    if (flashcard) {
        // Znajdź i odznacz wszystkie wcześniej zaznaczone wiersze
        document.querySelectorAll('#flashcardTable tbody tr.selected-row').forEach(row => {
            row.classList.remove('selected-row');
        });

        // Znajdź i zaznacz wiersz odpowiadający edytowanej fiszce
        const row = document.querySelector(`#flashcardTable tbody tr[data-id="${id}"]`);
        if (row) {
            row.classList.add('selected-row');
        }

        const editForm = document.createElement('div');
        editForm.className = 'section edit-form';
        editForm.id = 'edit';
        editForm.innerHTML = `
            <h2 data-translate="editFlashcard">Edit Flashcard</h2>
            <form id="editFlashcardForm">
                <textarea id="editWord" data-placeholder="wordPhrase" required>${flashcard.word}</textarea>
                <textarea id="editContext" data-placeholder="contextExample">${flashcard.context || ''}</textarea>
                <textarea id="editTranslation" data-placeholder="translation" required>${flashcard.translation}</textarea>
                <input type="text" id="editMediaUrl" value="${flashcard.mediaUrl || ''}" data-placeholder="imageLink">
                <input type="text" id="editAudioUrl" value="${flashcard.audioUrl || ''}" data-placeholder="audioLink">
                <div class="button-group">
                    <button type="submit" class="submit-button" data-translate="save">Save</button>
                    <button type="button" class="cancel-button" onclick="cancelEdit()" data-translate="cancel">Cancel</button>
                </div>
            </form>
        `;
        editForm.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            updateFlashcard(id, {
                word: document.getElementById('editWord').value,
                context: document.getElementById('editContext').value,
                translation: document.getElementById('editTranslation').value,
                mediaUrl: document.getElementById('editMediaUrl').value,
                audioUrl: document.getElementById('editAudioUrl').value
            });
        });
        
        const container = document.querySelector('.container');
        const existingEditForm = document.getElementById('edit');
        if (existingEditForm) {
            container.removeChild(existingEditForm);
        }
        container.appendChild(editForm);
        showSection('edit');
        
        // Dostosuj wysokość pól tekstowych
        adjustTextareaHeight('editWord', flashcard.word);
        adjustTextareaHeight('editContext', flashcard.context);
        adjustTextareaHeight('editTranslation', flashcard.translation);
        
        changeLanguage(); // Przetłumacz nowo dodane elementy
    }
}

// Funkcja do aktualizacji fiszki
function updateFlashcard(id, updatedData) {
    const index = flashcards.findIndex(f => f.id === id);
    if (index !== -1) {
        flashcards[index] = { ...flashcards[index], ...updatedData };
        saveFlashcards();
        showSection('view');
        updateFlashcardTable();
        changeLanguage(); // Zaktualizuj tłumaczenie
        window.scrollTo(0, lastScrollPosition);

        // Znajdź i zaznacz wiersz odpowiadający zaktualizowanej fiszce
        setTimeout(() => {
            const updatedRow = document.querySelector(`#flashcardTable tbody tr[data-id="${id}"]`);
            if (updatedRow) {
                updatedRow.classList.add('selected-row');
                updatedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100); // Małe opóźnienie, aby dać czas na renderowanie tabeli
    }
}

// Funkcja do anulowania edycji
function cancelEdit() {
    showSection('view');
    changeLanguage(); // Przywróć tłumaczenia
    window.scrollTo(0, lastScrollPosition);  // Dodaj tę linię
}

// Funkcja do eksportu fiszek
function exportFlashcards() {
  let csvContent = "front;back;context;media;audio\n";
  
  flashcards.forEach(flashcard => {
    let front = escapeCSV(flashcard.word);
    let back = escapeCSV(flashcard.translation);
    let context = escapeCSV(flashcard.context || '');
    let media = escapeCSV(flashcard.mediaUrl || '');
    let audio = escapeCSV(flashcard.audioUrl || '');
    
    csvContent += `${front};${back};${context};${media};${audio}\n`;
  });

  // Tworzenie i pobieranie pliku
  let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  let link = document.createElement("a");
  if (link.download !== undefined) {
    let url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "anki_flashcards.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function escapeCSV(str) {
  if (str == null) return '';
  return '"' + str.replace(/"/g, '""').replace(/\n/g, ' ') + '"';
}

// Funkcja do importu fiszek
function importFlashcards() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      const lines = content.split('\n');
      let importedCount = 0;

      // Pomijamy pierwszy wiersz (nagłówki)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [front, back, context, media, audio] = line.split(';').map(item => item.replace(/^"|"$/g, '').trim());
          if (front && back) {
            const newFlashcard = {
              id: Date.now() + Math.random(),
              word: front,
              translation: back,
              context: context || '',
              mediaUrl: media || '',
              audioUrl: audio || '',
              repeats: 0,
              lastReviewed: null,
              createdAt: new Date().toISOString()
            };
            flashcards.push(newFlashcard);
            importedCount++;
          }
        }
      }

      saveFlashcards();
      updateFlashcardTable();
      updateStats();
      alert(`Zaimportowano ${importedCount} nowych fiszek.`);
    };
    reader.readAsText(file);
  };
  input.click();
}

// Funkcja do przełączania informacji o powtórkach
function toggleReviewInfo() {
  console.log('Funkcja toggleReviewInfo została wywołana');
  const infoBox = document.getElementById('review-info');
  if (infoBox) {
    if (infoBox.style.display === 'none' || infoBox.style.display === '') {
      infoBox.style.display = 'block';
      infoBox.innerHTML = `
        <h3 data-translate="howDoReviewsWork">How do reviews work?</h3>
        <p data-translate="reviewExplanation">Our system uses a spaced repetition method to help you effectively memorize words:</p>
        <ul>
          <li data-translate="firstRecall">After 1st correct recall: next review in 2 days</li>
          <li data-translate="secondRecall">After 2nd correct recall: next review in 4 days</li>
          <li data-translate="thirdRecall">After 3rd correct recall: next review in 8 days</li>
          <li data-translate="fourthRecall">After 4th correct recall: next review in 16 days</li>
          <li data-translate="andSoOn">and so on...</li>
        </ul>
        <p data-translate="reviewTip">If you don't remember a word, it will return to the beginning of the cycle. Regular reviews are the key to success!</p>
        <button onclick="toggleReviewInfo()" class="close-button" data-translate="close">Close</button>
      `;
      changeLanguage(); // Dodaj to wywołanie, aby zaktualizować język po wygenerowaniu nowej zawartości
      console.log('Info box w powtórkach został wyświetlony');
    } else {
      infoBox.style.display = 'none';
      console.log('Info box w powtórkach został ukryty');
    }
  } else {
    console.error('Nie znaleziono elementu review-info');
  }
}

// Funkcja inicjalizująca aplikację
function initializeApp() {
  console.log('Inicjalizacja aplikacji...');
  loadSavedLanguage(); // Dodaj tę linię
  debugLocalStorage();
  
  // Najpierw próbujemy załadować fiszki z localStorage
  const savedFlashcards = localStorage.getItem('fiszki');
  if (savedFlashcards) {
    flashcards = JSON.parse(savedFlashcards);
    console.log('Załadowano fiszki z localStorage:', flashcards);
  } else {
    flashcards = [];
  }

  // Pobieramy dane z watchedVideos
  const watchedVideos = JSON.parse(localStorage.getItem('watchedVideos')) || {};
  const wordList = [];
  
  Object.values(watchedVideos).forEach(playlist => {
    playlist.forEach(video => {
      if (video.notes) {
        video.notes.forEach(note => {
          wordList.push({
            word: note.word,
            context: note.context,
            translation: note.translation
          });
        });
      }
    });
  });
  
  console.log('Pobrana lista słów z watchedVideos:', wordList);
  
  // Aktualizujemy istniejące i dodajemy nowe fiszki
  flashcards = updateExistingAndAddNewFlashcards(wordList);
  
  console.log('Liczba fiszek po inicjalizacji:', flashcards.length);
  saveFlashcards();
  updateFlashcardTable();
  updateStats();
  ensureCanvasExists();
  initializeStatsSection();
  initializeReviewSection(); // Dodajemy tę linię
  showSection('view');  // Zmienione z 'add' na 'view'

  // Dodaj to na końcu funkcji
  console.log('Sprawdzanie obecności elementu canvas po inicjalizacji');
  const canvas = document.getElementById('learningProgressChart');
  console.log('Element canvas:', canvas ? 'znaleziony' : 'nie znaleziony');

  initializeAddSection();
  initializeViewSection();
  initializeStatsSection();
  initializeReviewSection();
  updateStats();
  showSection('view');  // Zmienione z 'add' na 'view'
  loadSavedLanguage();
  setupAutoResizingTextareas(); // Dodaj tę linię
}

// Dodaj tę funkcję, aby upewnić się, że przycisk Info jest prawidłowo dodany
function ensureStatsInfoButtonExists() {
  const statsSection = document.getElementById('stats');
  if (statsSection) {
    let infoButton = statsSection.querySelector('.info-button');
    if (!infoButton) {
      const statsHeader = statsSection.querySelector('.stats-header');
      if (statsHeader) {
        infoButton = document.createElement('button');
        infoButton.className = 'info-button';
        infoButton.textContent = 'Info';
        infoButton.onclick = toggleStatsInfo;
        statsHeader.appendChild(infoButton);
        console.log('Przycisk Info został dodany do sekcji statystyk');
      } else {
        console.error('Nie znaleziono nagłówka statystyk');
        // Jeśli nie ma nagłówka, utwórz go
        const header = document.createElement('div');
        header.className = 'stats-header';
        header.innerHTML = `
          <h2>Statystyki</h2>
          <button onclick="toggleStatsInfo()" class="info-button">Info</button>
        `;
        statsSection.insertBefore(header, statsSection.firstChild);
        console.log('Utworzono nagłówek statystyk z przyciskiem Info');
      }
    } else {
      console.log('Przycisk Info już istnieje w sekcji statystyk');
    }
  } else {
    console.error('Nie znaleziono sekcji statystyk');
  }
}

// Dodaj nową funkcję do aktualizacji istniejących i dodawania nowych fiszek
function updateExistingAndAddNewFlashcards(wordList) {
  const updatedFlashcards = [...flashcards]; // Zachowaj istniejące fiszki
  
  wordList.forEach(word => {
    const existingFlashcard = updatedFlashcards.find(f => 
      f.word === word.word && f.translation === word.translation
    );
    
    if (existingFlashcard) {
      // Aktualizuj istniejącą fiszkę
      existingFlashcard.context = word.context; // Aktualizuj kontekst, jeśli się zmienił
    } else {
      // Dodaj nową fiszkę
      updatedFlashcards.push({
        id: Date.now() + Math.random(),
        word: word.word,
        context: word.context,
        translation: word.translation,
        media: '',
        audio: '',
        repeats: 0,
        lastReviewed: null
      });
    }
  });
  
  return updatedFlashcards;
}

function debugLocalStorage() {
  console.log('Zawartość localStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`${key}: ${localStorage.getItem(key)}`);
  }
}

function isLocalStorageAvailable() {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch(e) {
    console.error('localStorage nie jest dostępny:', e);
    return false;
  }
}

// Modyfikujemy istniejące nasłuchiwanie na załadowanie strony
window.addEventListener('load', function() {
  if (isLocalStorageAvailable()) {
    initializeApp();
    changeLanguage();
  } else {
    alert('Twoja przeglądarka nie obsługuje localStorage. Aplikacja może nie działać poprawnie.');
  }
});

// Nasłuchiwanie na załadowanie strony
window.addEventListener('load', initializeApp);

// Nasłuchiwanie na submit formularza dodawania fiszki
document.getElementById('addForm').addEventListener('submit', function(e) {
  e.preventDefault();
  let word = document.getElementById('word').value.trim();
  let context = document.getElementById('context').value.trim();
  let translation = document.getElementById('translation').value.trim();
  let mediaUrl = document.getElementById('mediaUrl').value.trim();
  let audioUrl = document.getElementById('audioUrl').value.trim();
  if (word && translation) {
    addFlashcard(word, context, translation, mediaUrl, audioUrl);
    this.reset();
  }
});

// Funkcja do restartu powtórki nieznanych fiszek
function restartUnknownReview() {
  flashcardsToReview = flashcards.filter(flashcard => flashcard.repeats === 0);
  currentFlashcardIndex = 0;
  showNextFlashcard();
  updateFlashcardTable();
}

function getNextReviewDate(flashcards) {
  let now = new Date();
  let nextReview = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // Ustaw na rok w przyszłość jako wartość domyślną
  flashcards.forEach(flashcard => {
    if (flashcard.lastReviewed) {
      let lastReviewed = new Date(flashcard.lastReviewed);
      let interval = Math.pow(2, flashcard.repeats) * 24 * 60 * 60 * 1000;
      let nextReviewForCard = new Date(lastReviewed.getTime() + interval);
      if (nextReviewForCard < nextReview) {
        nextReview = nextReviewForCard;
      }
    }
  });
  return nextReview;
}

function formatDate(date) {
  return date.toLocaleString('pl-PL', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function restoreOriginalContent() {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <section id="add" class="section hidden">
      <div class="section-header">
        <h2>Dodaj nową fiszkę</h2>
      </div>
      <form id="addForm">
        <textarea id="word" placeholder="Słowo / Fraza" required></textarea>
        <textarea id="context" placeholder="Kontekst / Przykład"></textarea>
        <textarea id="translation" placeholder="Tłumaczenie" required></textarea>
        <input type="text" id="mediaUrl" placeholder="Link do obrazu (http)">
        <input type="text" id="audioUrl" placeholder="Link do audio (http)">
        <button type="submit" class="submit-button">Dodaj fiszkę</button>
      </form>
    </section>
    <section id="view" class="section hidden">
      <div class="section-header">
        <h2>Twoje fiszki</h2>
      </div>
      <table id="flashcardTable">
        <thead>
          <tr>
            <th>Lp.</th>
            <th>Słowo / Fraza</th>
            <th>Kontekst / Przykład</th>
            <th>Tłumaczenie</th>
            <th>Znam</th>
            <th>Media</th>
            <th>Audio</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <!-- Wiersze tabeli będą generowane dynamicznie -->
        </tbody>
      </table>
    </section>
    <section id="review" class="section hidden">
      <div class="section-header">
        <h2>Powtórki</h2>
        <button onclick="toggleReviewInfo()" class="info-button">Info</button>
      </div>
      <div id="reviewCard"></div>
      <div id="review-info" class="info-box" style="display: none;">
        <!-- Zawartość info-box -->
      </div>
    </section>
    <section id="stats" class="section hidden">
      <div class="section-header">
        <h2>Statystyki</h2>
        <button onclick="toggleStatsInfo()" class="info-button">Info</button>
      </div>
      <div class="stats">
        <p>Całkowita liczba fiszek: <span id="totalFlashcards">0</span></p>
        <p>Obecny stan znajomości fiszek: <span id="knownFlashcards">0%</span></p>
        <p class="info-tooltip" data-tooltip="To liczba fiszek, które:&#10;1. Zostały powtórzone co najmniej 5 razy (uznawane za opanowane).&#10;2. Ich ostatnie powtórzenie miało miejsce w ciągu ostatnich 7 dni.">
          Liczba opanowanych przez ostatnie 7 dni: <span id="masteredLast7Days">0</span>
        </p>
      </div>
      <canvas id="learningProgressChart" width="300" height="200"></canvas>
      <canvas id="learningProgressLineChart" width="300" height="275"></canvas>
      <div id="stats-info" class="info-box" style="display: none;">
        <!-- Zawartość info-box dla statystyk -->
      </div>
    </section>
  `;
  
  // Ponowne dodanie nasuchiwania na formularz
  document.getElementById('addForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let word = document.getElementById('word').value.trim();
    let context = document.getElementById('context').value.trim();
    let translation = document.getElementById('translation').value.trim();
    let mediaUrl = document.getElementById('mediaUrl').value.trim();
    let audioUrl = document.getElementById('audioUrl').value.trim();
    if (word && translation) {
      addFlashcard(word, context, translation, mediaUrl, audioUrl);
      this.reset();
    }
  });

  // Dodajemy wywołanie setupAutoResizingTextareas
  setupAutoResizingTextareas();

  // Aktualizujemy statystyki i wykresy
  updateStats();
}

// Funkcja do usuwania fiszki
function deleteFlashcard(id) {
  const index = flashcards.findIndex(f => f.id === id);
  if (index !== -1) {
    if (confirm('Czy na pewno chcesz usunąć tę fiszkę?')) {
      flashcards.splice(index, 1);
      saveFlashcards();
      updateFlashcardTable();
      updateStats();
    }
  }
}

function setupAutoResizingTextareas() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.setAttribute('rows', 1);
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
}

// Dodaj tę nową funkcję do dostosowywania wysokości pól tekstowych
function adjustTextareaHeight(id, content) {
  const textarea = document.getElementById(id);
  if (textarea) {
    // Ustawiamy minimalną wysokość
    textarea.style.height = '18px';
    
    // Ustawiamy zawartość textarea
    textarea.value = content;
    
    // Obliczamy liczbę wierszy
    const lineHeight = 18; // Zakładamy, że wysokość jednej linii to 18px
    const lines = content.split('\n').length;
    
    // Ustawiamy wysokość na podstawie liczby wierszy, ale nie mniej niż 18px
    const newHeight = Math.max(18, lines * lineHeight);
    textarea.style.height = newHeight + 'px';
    
    // Dodajemy nasłuchiwanie na zdarzenie input
    textarea.addEventListener('input', function() {
      this.style.height = '18px';
      const newHeight = Math.max(18, this.scrollHeight);
      this.style.height = newHeight + 'px';
    });
  }
}

// Dodajemy na końcu pliku .vscode/quiz.js

function ensureCanvasExists() {
  const statsSection = document.getElementById('stats');
  if (statsSection) {
    let canvas = document.getElementById('learningProgressChart');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'learningProgressChart';
      canvas.width = 300;
      canvas.height = 200;
      statsSection.appendChild(canvas);
      console.log('Canvas został utworzony i dodany do sekcji statystyk');
    } else {
      console.log('Canvas już istnieje');
    }
    return canvas;
  }
  console.error('Nie znaleziono sekcji statystyk');
  return null;
}

function drawLearningProgressChart() {
  console.log('Rozpoczęcie rysowania wykresu');
  const canvas = ensureCanvasExists();
  if (!canvas) {
    console.error('Nie można utworzyć lub znaleźć elementu canvas');
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  console.log(`Wymiary canvas: ${width}x${height}`);

  // Oblicz statystyki
  const newCards = flashcards.filter(f => f.repeats === 0).length;
  const learningCards = flashcards.filter(f => f.repeats > 0 && f.repeats < 5).length;
  const masteredCards = flashcards.filter(f => f.repeats >= 5).length;

  const total = flashcards.length;
  const barWidth = width / 4;

  console.log(`Statystyki: Nowe: ${newCards}, Uczone: ${learningCards}, Opanowane: ${masteredCards}`);

  // Wyczyść canvas
  ctx.clearRect(0, 0, width, height);

  // Dodaj tytuł wykresu
  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(translations[currentLanguage].flashcardStatistics || 'Statystyki fiszek', width / 2, 30);

  // Funkcja do rysowania słupka
  function drawBar(x, count, color, label) {
    const barHeight = (count / total) * (height - 120);
    const y = height - barHeight - 40;

    // Rysuj słupek
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth - 20, barHeight);

    // Dodaj efekt 3D
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 10, y - 10);
    ctx.lineTo(x + barWidth - 10, y - 10);
    ctx.lineTo(x + barWidth - 20, y);
    ctx.closePath();
    ctx.fill();

    // Dodaj etykietę
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + (barWidth - 20) / 2, height - 20);

    // Dodaj liczbę
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(count, x + (barWidth - 20) / 2, y - 25);
  }

  // Rysuj słupki
  if (total > 0) {
    drawBar(width / 8, newCards, '#4CAF50', translations[currentLanguage].newFlashcards || 'Nowe');
    drawBar(width * 3 / 8, learningCards, '#36A2EB', translations[currentLanguage].learningFlashcards || 'Uczone');
    drawBar(width * 5 / 8, masteredCards, '#4BC0C0', translations[currentLanguage].masteredFlashcards || 'Opanowane');
  } else {
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Brak danych do wyświetlenia', width / 2, height / 2);
  }

  console.log('Zakończono rysowanie wykresu');
}

// Dodajemy funkcję testową dla canvas
function testCanvas() {
  const canvas = document.getElementById('learningProgressChart');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'green';
    ctx.fillRect(10, 10, 100, 100);
    console.log('Canvas działa poprawnie');
  } else {
    console.error('Canvas nie jest obsługiwany w tej przeglądarce lub nie został znaleziony');
  }
}

// Wywołujemy funkcję testową po załadowaniu DOM
document.addEventListener('DOMContentLoaded', testCanvas);

function toggleStatsInfo() {
  console.log('Funkcja toggleStatsInfo została wywołana');
  const infoBox = document.getElementById('stats-info');
  if (infoBox) {
    if (infoBox.style.display === 'none' || infoBox.style.display === '') {
      infoBox.style.display = 'block';
      infoBox.innerHTML = `
        <h3 data-translate="flashcardCategories">Flashcard categories:</h3>
        <ol>
          <li><strong data-translate="newFlashcards">New</strong> <span data-translate="newFlashcardsDescription">(green): Flashcards that haven't been reviewed yet or weren't remembered.</span></li>
          <li><strong data-translate="learningFlashcards">Learning</strong> <span data-translate="learningFlashcardsDescription">(blue): Flashcards that were correctly reviewed 1 to 4 times.</span></li>
          <li><strong data-translate="masteredFlashcards">Mastered</strong> <span data-translate="masteredFlashcardsDescription">(turquoise): Flashcards that were correctly reviewed 5 or more times.</span></li>
        </ol>
        <button onclick="toggleStatsInfo()" class="close-button" data-translate="close">Close</button>
      `;
      changeLanguage(); // Dodajemy to wywołanie, aby przetłumaczyć nowo wygenerowaną zawartość
      console.log('Info box w statystykach został wyświetlony');
    } else {
      infoBox.style.display = 'none';
      console.log('Info box w statystykach został ukryty');
    }
  } else {
    console.error('Nie znaleziono elementu stats-info');
  }
}

// Dodaj tę funkcję na końcu pliku
function initializeStatsSection() {
  const statsSection = document.getElementById('stats');
  if (statsSection) {
    // Usuń wszystkie istniejące nagłówki i dodatkowe napisy "Statystyki"
    statsSection.querySelectorAll('.section-header, .stats-header, h2').forEach(el => el.remove());

    // Dodaj nowy nagłówek
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <h2>Statystyki</h2>
      <button onclick="toggleStatsInfo()" class="info-button">Info</button>
    `;
    statsSection.insertBefore(header, statsSection.firstChild);

    // Upewnij się, że istnieje kontener na informacje
    if (!statsSection.querySelector('#stats-info')) {
      const infoBox = document.createElement('div');
      infoBox.id = 'stats-info';
      infoBox.className = 'info-box';
      infoBox.style.display = 'none';
      statsSection.appendChild(infoBox);
    }

    ensureCanvasExists();
  }
}

// Dodajemy na końcu pliku .vscode/quiz.js

function initializeReviewSection() {
  const reviewSection = document.getElementById('review');
  if (reviewSection) {
    // Usuń wszystkie istniejące nagłówki i przyciski Info
    reviewSection.querySelectorAll('.section-header, .review-header, h2, .info-button').forEach(el => el.remove());

    // Dodaj nowy nagłówek z ikoną strzałki powrotu i przyciskiem Info
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <div class="review-header-left">
        <h2 data-translate="review">Review</h2>
      </div>
      <div class="review-header-right">
        <button onclick="goBackFlashcard()" class="go-back-button" data-tooltip="${translations[currentLanguage].goBack}">←</button>
        <button onclick="toggleReviewInfo()" class="info-button" data-translate="info">Info</button>
      </div>
    `;
    reviewSection.insertBefore(header, reviewSection.firstChild);

    // Upewnij się, że istnieje kontener na informacje
    if (!reviewSection.querySelector('#review-info')) {
      const infoBox = document.createElement('div');
      infoBox.id = 'review-info';
      infoBox.className = 'info-box';
      infoBox.style.display = 'none';
      reviewSection.appendChild(infoBox);
    }

    // Upewnij się, że istnieje kontener na kartę do powtórki
    if (!reviewSection.querySelector('#reviewCard')) {
      const reviewCard = document.createElement('div');
      reviewCard.id = 'reviewCard';
      reviewSection.appendChild(reviewCard);
    }
  }
}

// Modyfikujemy funkcję toggleReviewInfo
function toggleReviewInfo() {
  console.log('Funkcja toggleReviewInfo została wywołana');
  const infoBox = document.getElementById('review-info');
  if (infoBox) {
    if (infoBox.style.display === 'none' || infoBox.style.display === '') {
      infoBox.style.display = 'block';
      infoBox.innerHTML = `
        <h3 data-translate="howDoReviewsWork">How do reviews work?</h3>
        <p data-translate="reviewExplanation">Our system uses a spaced repetition method to help you effectively memorize words:</p>
        <ul>
          <li data-translate="firstRecall">After 1st correct recall: next review in 2 days</li>
          <li data-translate="secondRecall">After 2nd correct recall: next review in 4 days</li>
          <li data-translate="thirdRecall">After 3rd correct recall: next review in 8 days</li>
          <li data-translate="fourthRecall">After 4th correct recall: next review in 16 days</li>
          <li data-translate="andSoOn">and so on...</li>
        </ul>
        <p data-translate="reviewTip">If you don't remember a word, it will return to the beginning of the cycle. Regular reviews are the key to success!</p>
        <button onclick="toggleReviewInfo()" class="close-button" data-translate="close">Close</button>
      `;
      changeLanguage(); // Dodaj to wywołanie, aby zaktualizować język po wygenerowaniu nowej zawartości
      console.log('Info box w powtórkach został wyświetlony');
    } else {
      infoBox.style.display = 'none';
      console.log('Info box w powtórkach został ukryty');
    }
  } else {
    console.error('Nie znaleziono elementu review-info');
  }
}

function initializeAddSection() {
  const addSection = document.getElementById('add');
  if (addSection) {
    // Usuń wszystkie istniejące nagłówki
    addSection.querySelectorAll('.section-header, h2').forEach(el => el.remove());

    // Dodaj nowy nagłówek
    const newHeader = document.createElement('div');
    newHeader.className = 'section-header';
    newHeader.innerHTML = `<h2 data-translate="addNewFlashcard">Add New Flashcard</h2>`;
    addSection.insertBefore(newHeader, addSection.firstChild);

    // Ustaw automatyczne rozszerzanie się pól tekstowych
    setupAutoResizingTextareas();
  }
}

function initializeViewSection() {
  const viewSection = document.getElementById('view');
  if (viewSection) {
    // Usuń wszystkie istniejące nagłówki
    viewSection.querySelectorAll('.section-header, h2').forEach(el => el.remove());

    // Dodaj nowy nagłówek bez przycisku "Usuń wszystkie"
    const newHeader = document.createElement('div');
    newHeader.className = 'section-header';
    newHeader.innerHTML = `
      <h2 data-translate="yourFlashcards">Your Flashcards</h2>
    `;
    viewSection.insertBefore(newHeader, viewSection.firstChild);
  }
}

// Dodaj tę funkcję gdzieś w pliku quiz.js
function countMasteredLast7Days() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return flashcards.filter(flashcard => 
        flashcard.repeats >= 5 && 
        flashcard.lastReviewed && 
        new Date(flashcard.lastReviewed) >= sevenDaysAgo
    ).length;
}

// Dodaj tę nową funkcję
function generateStatsHTML() {
  return `
    <div class="section-header">
      <h2 data-translate="statistics">Statistics</h2>
      <button onclick="toggleStatsInfo()" class="info-button" data-translate="info">Info</button>
    </div>
    <div class="stats">
      <p><span data-translate="totalFlashcards">Total number of flashcards:</span> <span id="totalFlashcards">0</span></p>
      <p class="info-tooltip" data-tooltip="currentKnowledgeStateTooltip">
        <span data-translate="currentKnowledgeState">Current knowledge state of all flashcards:</span> <span id="knownFlashcards">0%</span>
      </p>
      <p class="info-tooltip" data-tooltip="masteredLast7DaysTooltip">
        <span data-translate="masteredLast7Days">Number mastered in the last 7 days:</span> <span id="masteredLast7Days">0</span>
      </p>
    </div>
    <canvas id="learningProgressChart" width="300" height="200"></canvas>
    <div id="stats-info" class="info-box" style="display: none;">
      <!-- Zawartość info-box dla statystyk -->
    </div>
  `;
}

// Dodaj tę funkcję do obliczania liczby znanych fiszek
function countKnownFlashcards() {
    return flashcards.filter(f => f.repeats > 0).length;
}

function changeLanguage() {
    currentLanguage = document.getElementById('language-select').value;
    console.log('Zmieniono język na:', currentLanguage);
    
    // Aktualizuj teksty na stronie
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    
    // Aktualizuj placeholdery
    document.querySelectorAll('[data-placeholder]').forEach(element => {
        const key = element.getAttribute('data-placeholder');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
    
    // Aktualizuj tooltipy
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        const key = element.getAttribute('data-tooltip');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.setAttribute('data-tooltip', translations[currentLanguage][key]);
        }
    });
    
    // Aktualizuj przycisk Dictionary
    const dictionaryButton = document.getElementById('toggle-dictionary');
    if (dictionaryButton) {
        dictionaryButton.textContent = translations[currentLanguage].dictionary;
    }
    
    // Aktualizuj wykres
    drawLearningProgressChart();
    
    // Inicjalizuj sekcję powtórek, aby zaktualizować tekst dymka
    initializeReviewSection();
    
    // Zapisz wybrany język w localStorage
    localStorage.setItem('selectedLanguage', currentLanguage);
    
    // Dodaj to wywołanie na końcu funkcji
    //updateFlashcardTable();
}

// Dodaj tę funkcję, aby załadować zapisany język przy starcie
function loadSavedLanguage() {
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) {
        currentLanguage = savedLang;
        document.getElementById('language-select').value = currentLanguage;
        changeLanguage();
    }
}

function deleteAllFlashcards() {
  const confirmMessage = translations[currentLanguage].confirmDeleteAll || 'Are you sure you want to delete all flashcards? This action cannot be undone.';
  if (confirm(confirmMessage)) {
    flashcards = [];
    saveFlashcards();
    updateFlashcardTable();
    updateStats();
    drawLearningProgressChart();
  }
}

function goBackFlashcard() {
  if (currentFlashcardIndex > 0) {
    currentFlashcardIndex--;
    showNextFlashcard();
  } else {
    alert(translations[currentLanguage].noMoreFlashcardsToGoBack || "No more flashcards to go back to.");
  }
}

// Dodaj tę funkcję do obsługi zaznaczania wierszy
function toggleRowSelection(row) {
  row.classList.toggle('selected-row');
}

// Dodaj tę funkcję, aby umożliwić zaznaczanie wielu wierszy
function toggleMultipleRowSelection(event) {
  if (event.shiftKey) {
    const rows = document.querySelectorAll('#flashcardTable tbody tr');
    let startIndex = -1;
    let endIndex = -1;

    rows.forEach((row, index) => {
      if (row.classList.contains('selected-row')) {
        if (startIndex === -1) startIndex = index;
        endIndex = index;
      }
    });

    if (startIndex !== -1 && endIndex !== -1) {
      for (let i = Math.min(startIndex, endIndex); i <= Math.max(startIndex, endIndex); i++) {
        rows[i].classList.add('selected-row');
      }
    }
  }
}

// Dodaj nasłuchiwanie na kliknięcia z wciśniętym Shiftem
document.addEventListener('click', toggleMultipleRowSelection);