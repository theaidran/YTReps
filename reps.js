// Dodaj tę linię na początku pliku, zaraz po deklaracji translations
let currentLanguage = 'en'; // Domyślnie ustawiamy język angielski
lastScrollPosition = 0;

// Dodaj te zmienne globalne na początku pliku
let flashcardsToReview = [];
let currentFlashcardIndex = 0;
let currentReviewMode = null;


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
    streak: 0,
    lastReviewed: null,
    firstReviewDate: null, // dodajemy nowe pole
    createdAt: new Date().toISOString(),
    difficulty: 'medium', // domyślna trudność
    nextReview: null,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    leitnerBox: 1
  };
  flashcards.push(newFlashcard);
  saveFlashcards();
  updateFlashcardTable();
  updateStats();
  drawLearningProgressChart();
  showSection('view');
  const message = translations[currentLanguage].flashcardAdded || 'Flashcard has been added!';
  alert(message);
}

// Funkcja do aktualizacji tabeli fiszek
function updateFlashcardTable() {
    const tableBody = document.querySelector('#flashcardTable tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';

    flashcards.forEach((flashcard, index) => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', flashcard.id);
        
        // Określamy, czy fiszka jest opanowana w zależności od algorytmu
        let isMastered = false;
        switch(algorithm) {
            case 'supermemo':
                // Dla SuperMemo - fiszka jest opanowana, gdy EF > 2.0 i repetitions >= 5
                isMastered = (flashcard.easinessFactor > 2.0 && flashcard.repetitions >= 5);
                break;
            case 'leitner':
                // Dla systemu Leitnera - fiszka jest opanowana, gdy jest w pudełku 4 lub 5
                isMastered = (flashcard.leitnerBox >= 5);// or 5 repetitions
                break;
            default:
                // Dla standardowego algorytmu - fiszka jest opanowana po 5 poprawnych odpowiedziach
                isMastered = (flashcard.streak >= 5); // or 5 repetitions
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${flashcard.word}</td>
            <td>${flashcard.context || ''}</td>
            <td>${flashcard.translation}</td>
            <td>${isMastered ? translations[currentLanguage].yes : translations[currentLanguage].no2}</td>
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



// Funkcja do rozpoczęcia powtórki
function startReview() {
    console.log('Rozpoczęcie powtórki');
    showReviewModeSelection();
}

function showReviewModeSelection() {
    const reviewSection = document.getElementById('reviewCard');
    reviewSection.innerHTML = `
        <div class="review-mode-selection">
            <h3 data-translate="selectMode">Select review mode</h3>
            <div class="review-modes">
                <div class="review-mode-card" onclick="selectReviewMode('dueToday')">
                    <h4 data-translate="dueToday">Due Today</h4>
                    <p class="card-count" id="dueTodayCount">0</p>
                </div>
                <div class="review-mode-card" onclick="selectReviewMode('new')">
                    <h4 data-translate="newFlashcardsOnly">New Flashcards Only</h4>
                    <p class="card-count" id="newCount">0</p>
                </div>
                <div class="review-mode-card" onclick="selectReviewMode('newToday')">
                    <h4 data-translate="newTodayOnly">New Today Only</h4>
                    <p class="card-count" id="newTodayCount">0</p>
                </div>
                <div class="review-mode-card" onclick="selectReviewMode('hard')">
                    <h4 data-translate="hardFlashcardsOnly">Hard Flashcards Only</h4>
                    <p class="card-count" id="hardCount">0</p>
                </div>
                <div class="review-mode-card" onclick="selectReviewMode('random')">
                    <h4 data-translate="randomFlashcards">Random Selection</h4>
                    <p class="card-count" id="totalCount">0</p>
                </div>
            </div>
            <div class="review-options">
                <div class="cards-number-options">
                    <label data-translate="numberOfCards">Number of cards:</label>
                    <div class="checkbox-group">
                        <label class="checkbox-option">
                            <input type="radio" name="cardsNumber" value="all" checked 
                                   onchange="toggleCustomNumberInput()">
                            <span data-translate="allCards">All cards</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="radio" name="cardsNumber" value="10" 
                                   onchange="toggleCustomNumberInput()">
                            <span>10</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="radio" name="cardsNumber" value="20" 
                                   onchange="toggleCustomNumberInput()">
                            <span>20</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="radio" name="cardsNumber" value="custom" 
                                   onchange="toggleCustomNumberInput()">
                            <span data-translate="customNumber">Custom number</span>
                            <input type="number" id="customNumberInput" class="hidden" 
                                   min="1" value="30" onclick="event.stopPropagation()">
                        </label>
                    </div>
                </div>
                <button onclick="startSelectedReview()" class="start-review-button" 
                        data-translate="startReview">Start Review</button>
            </div>
        </div>
    `;
    
    updateCardCounts();
    changeLanguage();
}

// Zmodyfikuj funkcję toggleCustomNumberInput
function toggleCustomNumberInput() {
    const customInput = document.getElementById('customNumberInput');
    const selectedValue = document.querySelector('input[name="cardsNumber"]:checked').value;
    customInput.classList.toggle('hidden', selectedValue !== 'custom');
}

// Zmodyfikuj funkcję startSelectedReview
function startSelectedReview() {
    if (!currentReviewMode) {
        currentReviewMode = 'dueToday';
    }

    const selectedValue = document.querySelector('input[name="cardsNumber"]:checked').value;
    const customInput = document.getElementById('customNumberInput');
    let maxCards = null;

    if (selectedValue === 'custom') {
        maxCards = parseInt(customInput.value);
    } else if (selectedValue !== 'all') {
        maxCards = parseInt(selectedValue);
    }

    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Ustaw dueToday jako domyślny tryb
    if (!currentReviewMode) currentReviewMode = 'dueToday';
    switch (currentReviewMode) {
       case 'newToday':
        flashcardsToReview = flashcards.filter(f => {
            if (!f.firstReviewDate) return false;
            const reviewDate = new Date(f.firstReviewDate);
            return reviewDate.getFullYear() === today.getFullYear() &&
                   reviewDate.getMonth() === today.getMonth() &&
                   reviewDate.getDate() === today.getDate();
        });
        break;
        case 'dueToday':
            switch (algorithm) {
                case 'supermemo':
                    // Dla SuperMemo - fiszki z lastReviewed i nextReview <= now
                    flashcardsToReview = flashcards.filter(f => 
                        f.lastReviewed && // musi być już przeglądana
                        (!f.nextReview || new Date(f.nextReview) <= now)
                    );
                    break;
                case 'leitner':
                    // Dla Leitnera - fiszki z lastReviewed i nextReview <= now
                    flashcardsToReview = flashcards.filter(f => 
                        f.lastReviewed && // musi być już przeglądana
                        (!f.nextReview || new Date(f.nextReview) <= now)
                    );
                    break;
                default:
                    // Dla standardowego algorytmu - fiszki z lastReviewed i nextReview <= now
                    flashcardsToReview = flashcards.filter(f => 
                        f.lastReviewed && // musi być już przeglądana
                        (!f.nextReview || new Date(f.nextReview) <= now)
                    );
            }
            break;
        case 'new':
            switch (algorithm) {
                case 'supermemo':
                    flashcardsToReview = flashcards.filter(f => !f.lastReviewed);
                    break;
                case 'leitner':
                    flashcardsToReview = flashcards.filter(f => !f.lastReviewed);
                    break;
                default:
                    flashcardsToReview = flashcards.filter(f => !f.lastReviewed);
            }
            break;
        case 'hard':
            switch (algorithm) {
                case 'supermemo':
                    flashcardsToReview = flashcards.filter(f => 
                      f.lastReviewed && f.easinessFactor && f.easinessFactor < 2.1
                    );
                    break;
                case 'leitner':
                    // Dla Leitnera, trudne fiszki to te w pudełkach 1
                    flashcardsToReview = flashcards.filter(f => 
                      f.lastReviewed &&  f.leitnerBox && f.leitnerBox < 2
                    );
                    break;
                default:
                    flashcardsToReview = flashcards.filter(f => 
                      f.lastReviewed &&  f.difficulty === 'hard' || f.difficulty === 'veryHard'
                    );
            }
            break;
        case 'random':
            flashcardsToReview = [...flashcards.filter(f => 
              f.lastReviewed )].sort(() => Math.random() - 0.5);
            break;

    }
    if (currentReviewMode === 'new' && !maxCards ) // dla wybranej ilosci fisek
       maxCards = 5; //nowe fiszki , dobierz tylko 5 lub tyle ile w polu maxCards

    if (maxCards && maxCards > 0) {
        flashcardsToReview = flashcardsToReview.slice(0, maxCards);
    }

    currentFlashcardIndex = 0;
    if (flashcardsToReview.length > 0) {
        showNextFlashcard();
    } 
    else if (currentReviewMode === 'new' || currentReviewMode === 'newToday') {

        showNoNewFlashcardsMessage();
    }
    else {
        showNoFlashcardsMessage();
    }
}

// Funkcja do pokazywania tłumaczenia
function showTranslation(index) {
    const translationDiv = document.getElementById(`translation-${index}`);
    const qualityButtons = document.querySelector('.quality-buttons');
    const showTranslationButton = document.querySelector('.show-translation');
    
    if (translationDiv) {
        translationDiv.classList.remove('hidden');
    }
    
    if (qualityButtons) {
        qualityButtons.classList.remove('hidden');
    }
    
    if (showTranslationButton) {
        showTranslationButton.classList.add('hidden');
    }
}

// Modyfikacja funkcji gradeAnswer
function gradeAnswer(grade) {
    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
    const flashcard = flashcardsToReview[currentFlashcardIndex];
    const now = new Date();
    const wasCorrect = grade >= 3;

    // Ustaw firstReviewDate jeśli to pierwsza powtórka
    if (!flashcard.lastReviewed)  flashcard.firstReviewDate = now.toISOString();
    
    switch (algorithm) {
        case 'supermemo':
            // Użyj algorytmu SuperMemo
            const result = calculateSuperMemoInterval(flashcard, grade);
            flashcard.easinessFactor = result.easinessFactor;
            flashcard.interval = result.interval;
            flashcard.repetitions = result.repetitions;
            flashcard.lastReviewed = now.toISOString();
            flashcard.nextReview = new Date(now.getTime() + result.interval * 24 * 60 * 60 * 1000).toISOString();
            break;

        case 'leitner':
            // Użyj systemu Leitnera
            updateLeitnerBox(flashcard, wasCorrect);
            break;

        default:
            // Standardowy algorytm
            // Aktualizuj trudność na podstawie oceny
            if (grade <= 1) {
                flashcard.difficulty = 'veryHard'; // will not be used for 4 buttons grade
            } else if (grade === 2) {
                flashcard.difficulty = 'hard';
            } else if (grade === 3) {
                flashcard.difficulty = 'medium';
            } else {
                flashcard.difficulty = 'easy';
            }

            // Aktualizuj streak i oblicz następny interwał
            if (wasCorrect) {
               flashcard.streak = flashcard.repetitions; // to have simialr results between standard and SuperMemo
               flashcard.streak = (flashcard.streak || 0) + 1;
               flashcard.repetitions++; // potentially to remove
            } else {
                flashcard.streak = 0;
                flashcard.repetitions = 0; // potentially to remove
            }

            const interval = calculateNextInterval(flashcard, wasCorrect);
            flashcard.lastReviewed = now.toISOString();
            flashcard.nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000).toISOString();
            break;
    }

    saveFlashcards();
    currentFlashcardIndex++;
    showNextFlashcard();
    updateStats();
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
  // Przygotuj dane w formacie CSV
  let csvContent = "front;back;context;MediaUrl;AudioUrl;Algorithm;FirstReviewDate;LastReviewed;NextReview;Difficulty;Streak;EasinessFactor;Interval;Repetitions;LeitnerBox\n";
  
  const currentAlgorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
    flashcards.forEach(card => {
        const row = [
            // Podstawowe pola (zachowane oryginalne nazwy)
            card.word.replace(/;/g, ','),          // front
            card.translation.replace(/;/g, ','),   // back
            card.context ? card.context.replace(/;/g, ',') : '', // context
            
            // Pozostałe pola
            card.mediaUrl || '',
            card.audioUrl || '',
            currentAlgorithm,
            card.firstReviewDate || '',
            card.lastReviewed || '',
            card.nextReview || '',
            
            // Pola dla standardowego algorytmu
            card.difficulty || '',
            card.streak || 0,
            
            // Pola dla SuperMemo
            card.easinessFactor || 2.5,
            card.interval || 0,
            card.repetitions || 0,
            
            // Pola dla systemu Leitnera
            card.leitnerBox || 1
        ].join(';');
        
        csvContent += row + '\n';
    });

    // Utwórz i pobierz plik
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'flashcards_export.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                    const [
                        front, 
                        back, 
                        context, 
                        mediaUrl, 
                        audioUrl,
                        algorithm,  // Możemy zignorować tę wartość
                        firstReviewDate,
                        lastReviewed,
                        nextReview,
                        difficulty,
                        streak,
                        easinessFactor,
                        interval,
                        repetitions,
                        leitnerBox
                    ] = line.split(';').map(item => item.replace(/^"|"$/g, '').trim());

                    if (front && back) {
                        const newFlashcard = {
                            id: Date.now() + Math.random(),
                            word: front,
                            translation: back,
                            context: context || '',
                            mediaUrl: mediaUrl || '',
                            audioUrl: audioUrl || '',
                            firstReviewDate: firstReviewDate || null,
                            lastReviewed: lastReviewed || null,
                            nextReview: nextReview || null,
                            difficulty: difficulty || 'medium',
                            streak: parseInt(streak) || 0,
                            easinessFactor: parseFloat(easinessFactor) || 2.5,
                            interval: parseInt(interval) || 0,
                            repetitions: parseInt(repetitions) || 0,
                            leitnerBox: parseInt(leitnerBox) || 1,
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
					<li data-translate="algorithmNote">The exact number of days is determined by the selected algorithm in settings (three dots)</li>
				</ul>
				<p data-translate="reviewTip">If you don't remember a word, it will return to the beginning of the cycle. Regular reviews are the key to success!</p>
				<h4 data-translate="reviewModes">Review modes:</h4>
				<ul>
					<li data-translate="dueTodayDescription">Due Today - Scheduled reviews according to the selected learning algorithm.</li>
					<li data-translate="newFlashcardsDescription2">Show 5 New Cards - Add 5 new flashcards to your learning pool. Choose your own learning pace, you can select a different amount via 'Number of cards' (on average, a person can learn 8/day).</li>
					<li data-translate="newTodayDescription">New Today Only - Repeatedly review only flashcards added today.</li>
					<li data-translate="hardFlashcardsDescription2">Hard Cards Only - Review only difficult flashcards that have already been reviewed, starting from the beginning of the deck.</li>
					<li data-translate="randomFlashcardsDescription">Random Selection - Review all flashcards that have already been reviewed, starting from the beginning of the deck.</li>
					<li data-translate="numberOfCardsDescription">Number of cards - Number of cards to display in one review session. For 'Show 5 New Cards' changes the default amount from 5 to selected (10, 20, custom).</li>
				</ul>
				<button onclick="toggleReviewInfo()" class="close-button" data-translate="close">Close</button>
			`;
      changeLanguage();
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
    loadSavedLanguage();
    debugLocalStorage();
    
    // Ustawienie domyślnych wartości przy pierwszym uruchomieniu
    if (!localStorage.getItem('reviewAlgorithm')) {
        localStorage.setItem('reviewAlgorithm', 'supermemo');
    }
    if (!localStorage.getItem('gradeButtonMode')) {
        localStorage.setItem('gradeButtonMode', 'four');
    }
    
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
  //updateStats();
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
  const updatedFlashcards = [...flashcards]; // Zachowaj istniejce fiszki
  
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

// Modyfikujemy istniejce nasłuchiwanie na załadowanie strony
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
  let nextReview = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // Ustaw na rok w przyszość jako wartość domyślną
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

    // Dodaj nowy nagłówek z ikoną strzałki powrotu, ikoną trzech kropek i przyciskiem Info
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <div class="review-header-left">
        <h2 data-translate="review">${translations[currentLanguage].review}</h2>
      </div>
      <div class="review-header-right">
        <button onclick="goBackFlashcard()" class="go-back-button" data-tooltip="${translations[currentLanguage].goBack}">←</button>
        <button onclick="openReviewSettings()" class="more-options-button" data-tooltip="${translations[currentLanguage].settings}">⋮</button>
        <button onclick="toggleReviewInfo()" class="info-button" data-translate="info">${translations[currentLanguage].info}</button>
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

// Dodaj nową funkcję do obsługi kliknięcia przycisku ustawień
function openReviewSettings() {
    let settingsForm = document.getElementById('review-settings-form');
    if (settingsForm) {
        settingsForm.remove();
    }

    // Zmiana domyślnych wartości
    const currentAlgorithm = localStorage.getItem('reviewAlgorithm') || 'supermemo'; // Zmieniono z 'standard' na 'supermemo'
    const currentButtonMode = localStorage.getItem('gradeButtonMode') || 'four';     // Zmieniono z 'six' na 'four'
    
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    overlay.id = 'settings-overlay';
    
    settingsForm = document.createElement('div');
    settingsForm.id = 'review-settings-form';
    settingsForm.className = 'settings-form';
    settingsForm.innerHTML = `
        <h3 data-translate="algorithmSettings">Algorithm Settings</h3>
        <div class="settings-group">
            <label data-translate="currentAlgorithm">Current Algorithm:</label>
            <select id="algorithmSelect">
                <option value="standard" ${currentAlgorithm === 'standard' ? 'selected' : ''} 
                        data-translate="standardAlgorithm">Standard Algorithm</option>
                <option value="supermemo" ${currentAlgorithm === 'supermemo' ? 'selected' : ''} 
                        data-translate="superMemoAlgorithm">SuperMemo Algorithm</option>
                <option value="leitner" ${currentAlgorithm === 'leitner' ? 'selected' : ''} 
                        data-translate="leitnerAlgorithm">Leitner System</option>
            </select>
        </div>
        <div class="settings-group">
            <label data-translate="gradeButtonsOption">Grade buttons:</label>
            <select id="buttonModeSelect">
                <option value="four" ${currentButtonMode === 'four' ? 'selected' : ''} 
                        data-translate="fourButtons">4 buttons</option>
                <option value="six" ${currentButtonMode === 'six' ? 'selected' : ''} 
                        data-translate="sixButtons">6 buttons</option>
            </select>
        </div>
        <div class="algorithm-description">
            <p data-translate="algorithmDescription">Algorithm Description:</p>
            <p id="algorithmInfo" class="description-text">
                ${getAlgorithmDescription(currentAlgorithm)}
            </p>
        </div>
        <div class="more-info">
            <p><span data-translate="moreInfo">More information</span>: <a href="https://github.com/theaidran/6_minutes_English_with_Reps" target="_blank">https://github.com/theaidran/6_minutes_English_with_Reps</a></p>
        </div>
        <div class="button-group">
            <button type="button" onclick="saveAlgorithmSettings()" 
                    class="submit-button" data-translate="saveSettings">Save Settings</button>
            <button type="button" onclick="closeReviewSettings()" 
                    class="cancel-button" data-translate="cancel">Cancel</button>
        </div>
    `;

    const reviewSection = document.getElementById('review');
    reviewSection.appendChild(overlay);
    reviewSection.appendChild(settingsForm);
    
    document.getElementById('algorithmSelect').addEventListener('change', function(e) {
        document.getElementById('algorithmInfo').textContent = getAlgorithmDescription(e.target.value);
    });

    overlay.addEventListener('click', closeReviewSettings);
    changeLanguage();
}

// Dodaj funkcję pomocniczą do pobierania opisu algorytmu
function getAlgorithmDescription(algorithm) {
    switch(algorithm) {
        case 'standard':
            return translations[currentLanguage].standardDescription;
        case 'supermemo':
            return translations[currentLanguage].superMemoDescription;
        case 'leitner':
            return translations[currentLanguage].leitnerDescription;
        default:
            return translations[currentLanguage].standardDescription;
    }
}
/*
// Dodaj podstawową strukturę dla systemu Leitnera
function initializeLeitnerSystem(flashcard) {
    if (!flashcard.leitnerBox) {
        flashcard.leitnerBox = 1;  // Wszystkie nowe fiszki zaczynają w pudełku 1
    }
} */

function closeReviewSettings() {
    const settingsForm = document.getElementById('review-settings-form');
    const overlay = document.getElementById('settings-overlay');
    if (settingsForm) {
        settingsForm.remove();
    }
    if (overlay) {
        overlay.remove();
    }
}

function saveAlgorithmSettings() {
    const algorithm = document.getElementById('algorithmSelect').value;
    const buttonMode = document.getElementById('buttonModeSelect').value;
    
    localStorage.setItem('reviewAlgorithm', algorithm);
    localStorage.setItem('gradeButtonMode', buttonMode);
    
    updateStats();
    updateCardCounts();
    drawLearningProgressChart();
    updateFlashcardTable();
    
    closeReviewSettings();
}

function initializeAddSection() {
  const addSection = document.getElementById('add');
  if (addSection) {
    // Usuń wszystkie istniejące nagłwki
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
        if (element.classList.contains('grade-0')) {
            // Specjalne traktowanie dla przycisku grade-0
            element.setAttribute('data-tooltip', translations[currentLanguage].startOverTooltip);
        } else {
            const key = element.getAttribute('data-tooltip');
            if (translations[currentLanguage] && translations[currentLanguage][key]) {
                element.setAttribute('data-tooltip', translations[currentLanguage][key]);
            }
        }
    });
    // Aktualizuj tooltips w sekcji statystyk
    const statsTooltips = {
      'currentKnowledgeState': 'currentKnowledgeStateTooltip',
      'masteredLast7Days': 'masteredLast7DaysTooltip'
  };

  Object.entries(statsTooltips).forEach(([selector, tooltipKey]) => {
      const element = document.querySelector(`p:has(span[data-translate="${selector}"])`);
      if (element) {
          element.setAttribute('data-tooltip', translations[currentLanguage][tooltipKey]);
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


function updateCardCounts() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
    
    // Fiszki na dziś
    const dueTodayCount = flashcards.filter(f => f.lastReviewed && f.nextReview && new Date(f.nextReview) <= now).length;   
    // Nowe fiszki - te, które nigdy nie były pokazywane
    const newCount = flashcards.filter(f => !f.lastReviewed).length;
    
    // Nowe fiszki z dzisiaj - pierwsza powtórka była dzisiaj
    const newTodayCount = flashcards.filter(f => {
      if (!f.firstReviewDate) return false;
      const reviewDate = new Date(f.firstReviewDate);
      return reviewDate.getFullYear() === today.getFullYear() &&
             reviewDate.getMonth() === today.getMonth() &&
             reviewDate.getDate() === today.getDate();
  }).length;


    // Trudne fiszki - zależnie od algorytmu
    let hardCount = 0;
    switch (algorithm) {
      case 'supermemo':
        hardCount = flashcards.filter(f => 
            f.lastReviewed && f.easinessFactor && f.easinessFactor < 2.1
        ).length;
        break;
    case 'leitner':
        hardCount = flashcards.filter(f => 
            f.lastReviewed && f.leitnerBox && f.leitnerBox < 2
        ).length;
        break;
    default:
        hardCount = flashcards.filter(f => 
            f.lastReviewed && (f.difficulty === 'hard' || f.difficulty === 'veryHard')
        ).length;
   }
    
    const totalCount = flashcards.filter(f => // fiszki dla funkcji random 
      f.lastReviewed ).length;

    document.getElementById('dueTodayCount').textContent = dueTodayCount; // na dziś
    document.getElementById('newCount').textContent = newCount;// wszytkie nowe fiszki
    document.getElementById('newTodayCount').textContent = newTodayCount;
    document.getElementById('hardCount').textContent = hardCount;
    document.getElementById('totalCount').textContent = totalCount; //funkcja random
}

function updateCustomNumberInput() {
    const select = document.getElementById('cardNumberSelect');
    const customInput = document.getElementById('customNumberInput');
    customInput.classList.toggle('hidden', select.value !== 'custom');
}

// Zmodyfikuj funkcję selectReviewMode
function selectReviewMode(mode) {
    document.querySelectorAll('.review-mode-card').forEach(card => {
        card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`.review-mode-card[onclick*="${mode}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    currentReviewMode = mode;
}

function showNoFlashcardsMessage() {
    document.getElementById('reviewCard').innerHTML = `
        <p data-translate="noFlashcardsToReview">No flashcards to review!</p>
        <button onclick="startReview()" class="review-button" data-translate="backToModes">
            Back to review modes
        </button>
    `;
    changeLanguage();
}

function showNoNewFlashcardsMessage() {
  document.getElementById('reviewCard').innerHTML = `
      <p data-translate="noNewFlashcardsToReview">No new flashcards to review, add some!</p>
      <button onclick="startReview()" class="review-button" data-translate="backToModes">
          Back to review modes
      </button>
  `;
  changeLanguage();
}

// Dodaj funkcje do wyświetlania postępu w systemie Leitnera
function updateLeitnerProgress() {
  const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
  if (algorithm === 'leitner') {
      const flashcard = flashcardsToReview[currentFlashcardIndex];
      if (flashcard) {
          const progressInfo = document.createElement('div');
          progressInfo.className = 'leitner-progress';
          progressInfo.innerHTML = `
              <div class="progress-header" data-translate="leitnerProgress">
                  Progress in Leitner system
              </div>
              <div class="box-progress">
                  <div class="current-box">
                      <span data-translate="leitnerBoxDescription">Current box: </span>
                      <strong>${flashcard.leitnerBox || 1}/5</strong>
                  </div>
                  <div class="next-box">
                      <span data-translate="leitnerNextReview">Next review: </span>
                      <strong>${calculateLeitnerInterval(flashcard.leitnerBox)|| 1} 
                      <span data-translate="leitnerDays">days</span></strong>
                  </div>
              </div>
          `;
          
          const cardContent = document.querySelector('.card-content');
          if (cardContent) {
              const existingProgress = cardContent.querySelector('.leitner-progress');
              if (existingProgress) {
                  existingProgress.replaceWith(progressInfo);
              } else {
                  cardContent.insertBefore(progressInfo, cardContent.firstChild);
              }
          }
      }
  }
}

// Dodaj style dla systemu Leitnera
const leitnerStyles = {
  box1: { color: '#dc3545', label: '1 day' },      // czerwony
  box2: { color: '#fd7e14', label: '3 days' },     // pomarańczowy
  box3: { color: '#ffc107', label: '7 days' },     // żółty
  box4: { color: '#28a745', label: '14 days' },    // zielony
  box5: { color: '#17a2b8', label: '30 days' }     // niebieski
};



// Modyfikacja funkcji showNextFlashcard
function showNextFlashcard() {
    if (currentFlashcardIndex < flashcardsToReview.length) {
        const flashcard = flashcardsToReview[currentFlashcardIndex];
        const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
        const buttonMode = localStorage.getItem('gradeButtonMode') || 'six';
        
        let leitnerInfo = '';
        if (algorithm === 'leitner') {
            const box = flashcard.leitnerBox || 1;
            const style = leitnerStyles[`box${box}`];
            leitnerInfo = `
                <div class="leitner-info" style="border-left: 4px solid ${style.color}">
                    <div class="box-info">
                        <span data-translate="leitnerBox">Box</span>: ${box}/5 
                        (${style.label})
                    </div>
                    <div class="next-review">
                        <span data-translate="leitnerNextReview">Next review</span>: 
                        ${flashcard.nextReview ? new Date(flashcard.nextReview).toLocaleDateString() : 'Today'}
                    </div>
                </div>
            `;
        }

        // Przygotuj przyciski oceny w zależności od wybranego trybu
        const qualityButtons = buttonMode === 'four' ? `
            <button onclick="gradeAnswer(0)" class="grade-button grade-0" data-tooltip="${translations[currentLanguage].startOverTooltip}" data-translate="completelyForgot">Completely forgot</button>
            <button onclick="gradeAnswer(2)" class="grade-button grade-2" data-translate="hard">Hard</button>
            <button onclick="gradeAnswer(3)" class="grade-button grade-3" data-translate="good">Good</button>
            <button onclick="gradeAnswer(4)" class="grade-button grade-4" data-translate="easy">Easy</button>
        ` : `
            <button onclick="gradeAnswer(0)" class="grade-button grade-0" data-tooltip="${translations[currentLanguage].startOverTooltip}" data-translate="completelyForgot">Completely forgot</button>
            <button onclick="gradeAnswer(1)" class="grade-button grade-1" data-translate="wrong">Wrong</button>
            <button onclick="gradeAnswer(2)" class="grade-button grade-2" data-translate="hard">Hard</button>
            <button onclick="gradeAnswer(3)" class="grade-button grade-3" data-translate="good">Good</button>
            <button onclick="gradeAnswer(4)" class="grade-button grade-4" data-translate="easy">Easy</button>
            <button onclick="gradeAnswer(5)" class="grade-button grade-5" data-translate="perfect">Perfect</button>
        `;

        document.getElementById('reviewCard').innerHTML = `
            <div class="card-content">
                ${algorithm === 'leitner' ? leitnerInfo : ''}
                <p><strong data-translate="wordPhrase">Word / Phrase:</strong></p>
                <pre>${flashcard.word}</pre>
                <p><strong data-translate="contextExample">Context / Example:</strong></p>
                <pre>${flashcard.context || 'No context provided'}</pre>
                ${flashcard.mediaUrl ? `<img src="${flashcard.mediaUrl}" alt="media" width="200">` : ''}
                ${flashcard.audioUrl ? `<audio controls><source src="${flashcard.audioUrl}" type="audio/mpeg"></audio>` : ''}
                <div class="button-row">
                    <button onclick="showTranslation(${currentFlashcardIndex})" class="show-translation" data-translate="showTranslation">Show translation</button>
                    <div class="quality-buttons hidden">
                        ${qualityButtons}
                    </div>
                </div>
                <div id="translation-${currentFlashcardIndex}" class="translation hidden">
                    <p><strong data-translate="translation">Translation:</strong></p>
                    <pre>${flashcard.translation}</pre>
                </div>
            </div>
        `;
        
        updateLeitnerProgress();
        changeLanguage();
    } else {
        document.getElementById('reviewCard').innerHTML = `
            <div class="review-complete">
                <h3 data-translate="endOfReview">End of review!</h3>
                <p data-translate="redirecting">Returning to review mode selection...</p>
            </div>
        `;
        
        updateFlashcardTable();
        updateStats();
        
        setTimeout(() => {
            showReviewModeSelection();
        }, 2000);
    }
}














