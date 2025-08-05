// Dodaj tę linię na początku pliku, zaraz po deklaracji translations
let currentLanguage = 'en'; // Domyślnie ustawiamy język angielski
lastScrollPosition = 0;

// Funkcja do odtwarzania tekstu
window.speakWord2 = function(textareaId) {
    const TtsLang = localStorage.getItem('ttsLanguage') || 'en';
    const text = document.getElementById(textareaId).value;
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${TtsLang}&client=tw-ob`;
    
    const audio = new Audio(url);
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
};




// Dodaj te zmienne globalne na początku pliku
let flashcardsToReview = [];
let currentFlashcardIndex = 0;
let currentReviewMode = null;
let isSyncing = false; // Dodajemy zmienną isSyncing na początku

// Round timer variables
let reviewTimer = null;
let reviewStartTime = null;
let currentRound = 0;
let isRoundPaused = false;

// Dictionary tabs functionality
let repsTabs = [];

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
  
  // Sprawdź ustawienie domyślnego widoku
  const defaultView = localStorage.getItem('reps_default_view') || 'browse';
  if (defaultView === 'add') {
    showSection('add');
  } else {
  showSection('view');
  }
  
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
    stopRoundTimer(); // Stop timer when going back to review mode selection
    showReviewModeSelection();
}

function showReviewModeSelection() {
    const reviewSection = document.getElementById('reviewCard');
    const showNewToday = localStorage.getItem('show_new_today') !== 'false';
    const showHardCards = localStorage.getItem('show_hard_cards') !== 'false';
    const showRandom = localStorage.getItem('show_random') !== 'false';
    const showCardsNumber = localStorage.getItem('show_cards_number') === 'true';

    let reviewModesHTML = `
        <div class="review-mode-card" onclick="selectReviewMode('dueToday')">
            <h4 data-translate="dueToday">Due Today</h4>
            <p class="card-count" id="dueTodayCount">0</p>
        </div>
        <div class="review-mode-card" onclick="selectReviewMode('new')">
            <h4 data-translate="newFlashcardsOnly">Add 5 New Cards</h4>
            <p class="card-count" id="newCount">0</p>
        </div>`;

    if (showNewToday) {
        reviewModesHTML += `
            <div class="review-mode-card" onclick="selectReviewMode('newToday')">
                <h4 data-translate="newTodayOnly">New Cards From Today Only</h4>
                <p class="card-count" id="newTodayCount">0</p>
            </div>`;
    }
    if (showHardCards) {
        reviewModesHTML += `
            <div class="review-mode-card" onclick="selectReviewMode('hard')">
                <h4 data-translate="hardFlashcardsOnly">Hard Cards Only</h4>
                <p class="card-count" id="hardCount">0</p>
            </div>`;
    }
    if (showRandom) {
        reviewModesHTML += `
            <div class="review-mode-card" onclick="selectReviewMode('random')">
                <h4 data-translate="randomFlashcards">Random Selection</h4>
                <p class="card-count" id="totalCount">0</p>
            </div>`;
    }

    reviewSection.innerHTML = `
        <div class="review-mode-selection">
            <h3 data-translate="selectMode">Select review mode</h3>
            <div class="review-modes">
                ${reviewModesHTML}
            </div>
            <div class="review-options">
                <div class="cards-number-options" style="${!showCardsNumber ? 'display: none;' : ''}">
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
                case 'leitner':
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
        startRoundTimer(); // Start the round timer when review begins
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
    
    // Dodaj animację odliczania przed przejściem do następnej fiszki
    showCountdownAnimation(() => {
    showNextFlashcard();
    updateStats();
    });
}

// Funkcja do wyświetlania animacji odliczania
function showCountdownAnimation(callback) {
    // Sprawdź ustawienie czasu animacji
    const countdownTime = parseFloat(localStorage.getItem('countdown_animation_time') || '2');
    
    // Jeśli animacja jest wyłączona (0 sekund), od razu wywołaj callback
    if (countdownTime === 0) {
        callback();
        return;
    }
    
    // Ukryj przyciski oceny i pokaż animację odliczania
    const reviewCard = document.getElementById('reviewCard');
    const qualityButtons = reviewCard.querySelector('.quality-buttons');
    
    if (qualityButtons) {
        qualityButtons.style.display = 'none';
    }
    
    // Stwórz kontener dla animacji odliczania
    const countdownContainer = document.createElement('div');
    countdownContainer.className = 'countdown-container';
    countdownContainer.style.cssText = `
        text-align: center;
        margin: 20px 0;
        font-size: 2em;
        font-weight: bold;
        color: #007bff;
        animation: pulse 1s ease-in-out infinite;
    `;
    
    // Dodaj style animacji jeśli nie istnieją
    if (!document.getElementById('countdown-styles')) {
        const style = document.createElement('style');
        style.id = 'countdown-styles';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
            .countdown-container {
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    reviewCard.appendChild(countdownContainer);
    
    // Sekwencja animacji odliczania
    const messages = ['Ok!', '3', '2', '1', 'Ready', 'Steady', 'Go!'];
    let currentMessage = 0;
    
    // Oblicz czas na każdą wiadomość na podstawie ustawienia
    // Pierwsza wiadomość "Ok!" będzie wyświetlana 2x dłużej
    const totalMessages = messages.length + 1; // +1 bo pierwsza wiadomość trwa 2x dłużej
    const baseTimePerMessage = (countdownTime * 1000) / totalMessages;
    
    function showNextMessage() {
        if (currentMessage < messages.length) {
            countdownContainer.textContent = messages[currentMessage];
            
            // Pierwsza wiadomość "Ok!" wyświetla się 2x dłużej
            const displayTime = currentMessage === 0 ? baseTimePerMessage * 2 : baseTimePerMessage;
            
            currentMessage++;
            setTimeout(showNextMessage, displayTime);
        } else {
            // Usuń kontener odliczania i wywołaj callback
            countdownContainer.remove();
            callback();
        }
    }
    
    // Rozpocznij animację
    showNextMessage();
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
        <form id="editFlashcardForm" style="display: flex; flex-direction: column; gap: 10px;">
            <div class="word-container" style="display: flex; align-items: flex-start; gap: 0px; width: 100%;">
                <textarea id="editWord" data-placeholder="wordPhrase" required style="flex: 1;">${flashcard.word}</textarea>
                <button type="button" class="speaker-button" onclick="speakWord('editWord')" style="background: none; border: none; cursor: pointer; padding: 8px 0 0 0; margin-right: -12px;">
                    <svg width="23" height="23" viewBox="0 0 24 24" fill="#333333">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                </button>
            </div>
            <div class="context-container" style="display: flex; align-items: flex-start; gap: 0px; width: 100%;">
                <textarea id="editContext" data-placeholder="contextExample" style="flex: 1;">${flashcard.context || ''}</textarea>
                <button type="button" class="speaker-button" onclick="speakWord('editContext')" style="background: none; border: none; cursor: pointer; padding: 8px 0 0 0; margin-right: -12px;">
                    <svg width="23" height="23" viewBox="0 0 24 24" fill="#333333">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                </button>
            </div>
            <div class="examples-button-container">
                <button type="button" class="show-examples-button" onclick="showExamples('${flashcard.word}')">
                    <small data-translate="showExamples">Show examples</small>
                </button>
            </div>
            <div class="context-container2" style="display: flex; align-items: flex-start; gap: 0px;  margin-right: 15px;">
            <textarea id="editTranslation" data-placeholder="translation" required>${flashcard.translation}</textarea>
            </div>
            <div class="url-inputs" style="display: flex; flex-direction: column; gap: 0px;margin-right: 35px;">
                <input type="text" id="editMediaUrl" data-placeholder="imageLink" value="${flashcard.mediaUrl || ''}" style="width: 100%;">
                <input type="text" id="editAudioUrl" data-placeholder="audioLink" value="${flashcard.audioUrl || ''}" style="width: 100%;">
            </div>
               <div class="button-group">
                   <button type="submit" class="submit-button" data-translate="save">Save</button>
                    <button type="button" class="cancel-button" onclick="cancelEdit()" data-translate="cancel">Cancel</button>
                </div>
            </form>
        `;

    // Funkcja do odtwarzania tekstu
    window.speakWord = function(textareaId) {
        const TtsLang = localStorage.getItem('ttsLanguage') || 'en';
        const text = document.getElementById(textareaId).value;
        const encodedText = encodeURIComponent(text);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${TtsLang}&client=tw-ob`;
        
        const audio = new Audio(url);
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    };  
        
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
        // Dodaj znacznik czasu modyfikacji
        updatedData.lastModified = new Date().toISOString();

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

// Zmodyfikowana funkcja exportFlashcards
function createExportBlob() {
  // Przygotuj dane w formacie CSV
  let csvContent = "front;back;context;MediaUrl;AudioUrl;Algorithm;FirstReviewDate;LastReviewed;NextReview;Difficulty;Streak;EasinessFactor;Interval;Repetitions;LeitnerBox\n";
  
  const currentAlgorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
  flashcards.forEach(card => {
      // Funkcja do przygotowania tekstu do CSV - zamienia znaki nowej linii na <br> i escapuje średniki
      const prepareText = (text) => {
          if (!text) return '';
          return text
              .replace(/\n/g, '<br>') // zamień znaki nowej linii na <br>
              .replace(/;/g, ',');     // zamień średniki na przecinki
      };

      const row = [
          // Podstawowe pola z przygotowaniem tekstu
          prepareText(card.word),
          prepareText(card.translation),
          prepareText(card.context),
          
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

  // Utwórz i zwróć blob
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// Funkcja do zapisywania fiszek do pliku
function saveFlashcardsToFile() {
  const blob = createExportBlob();
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'flashcards_export.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Funkcja do kopiowania fiszek do schowka
async function copyFlashcardsToClipboard() {
  try {
    const blob = createExportBlob();
    const text = await blob.text();
    
    await navigator.clipboard.writeText(text);
    showNotification(translations[currentLanguage].copiedToClipboard, 'success');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showNotification('Error copying to clipboard', 'error');
  }
}

// Funkcja do pokazania opcji eksportu
function showExportOptions() {
  const exportDialog = document.createElement('div');
  exportDialog.className = 'confirm-dialog export-dialog';
  exportDialog.innerHTML = `
    <div class="confirm-content">
      <h3 data-translate="exportOptions">Export Options</h3>
      <div class="export-buttons">
        <button class="export-clipboard-btn" data-translate="copyToClipboard">Copy flashcards to clipboard</button>
        <button class="export-file-btn" data-translate="saveToFile">Save to file</button>
      </div>
      <div class="confirm-buttons">
        <button class="confirm-no" data-translate="cancel">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(exportDialog);
  changeLanguage();

  const clipboardBtn = exportDialog.querySelector('.export-clipboard-btn');
  const fileBtn = exportDialog.querySelector('.export-file-btn');
  const cancelBtn = exportDialog.querySelector('.confirm-no');

  clipboardBtn.addEventListener('click', () => {
    copyFlashcardsToClipboard();
    exportDialog.remove();
  });

  fileBtn.addEventListener('click', () => {
    saveFlashcardsToFile();
    exportDialog.remove();
  });

  cancelBtn.addEventListener('click', () => {
    exportDialog.remove();
  });

  exportDialog.addEventListener('click', (e) => {
    if (e.target === exportDialog) {
      exportDialog.remove();
    }
  });
}

// Zachowaj starą funkcję dla kompatybilności wstecznej
function exportFlashcards() {
  showExportOptions();
}

// Funkcja do importu fiszek z pliku
function importFlashcardsFromFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (file) {
      processImportFile(file);
    }
  };
  input.click();
}

// Funkcja do importu fiszek ze schowka
async function importFlashcardsFromClipboard() {
  try {
    // Sprawdź czy clipboard API jest dostępne
    if (navigator.clipboard && window.isSecureContext) {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        processImportText(text);
        showNotification(translations[currentLanguage].importedFromClipboard, 'success');
        return;
      } else {
        showNotification('Clipboard is empty', 'error');
        return;
      }
    } else {
      // Fallback - pokaż dialog do ręcznego wklejenia
      showPasteDialog();
    }
  } catch (error) {
    console.error('Error reading from clipboard:', error);
    // Jeśli API nie działa, pokaż dialog do ręcznego wklejenia
    showPasteDialog();
  }
}

// Funkcja do przetwarzania pliku importu
function processImportFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    processImportText(content);
  };
  reader.readAsText(file);
}

// Funkcja do przetwarzania tekstu importu (wspólna dla pliku i schowka)
function processImportText(content) {
  // Dzielimy na wiersze, ale zachowujemy <br> wewnątrz pól
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  let importedCount = 0;
  let duplicateCount = 0;
  let updatedCount = 0;

  // Funkcja do przywracania oryginalnego tekstu z CSV
  const restoreText = (text) => {
    if (!text) return '';
    return text
      .replace(/<br>/g, '\n')  // zamień <br> z powrotem na znaki nowej linii
      .replace(/\\n/g, '\n');   // obsłuż escapowane znaki nowej linii
  };

  // Pomijamy pierwszy wiersz (nagłówki)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Prosty podział po średnikach
    const values = line.split(';');

    const [
      front, 
      back, 
      context, 
      mediaUrl, 
      audioUrl,
      algorithm,
      firstReviewDate,
      lastReviewed,
      nextReview,
      difficulty,
      streak,
      easinessFactor,
      interval,
      repetitions,
      leitnerBox
    ] = values;

    if (front && back) {
      // Przywróć oryginalne formatowanie tekstu
      const restoredFront = restoreText(front);
      const restoredBack = restoreText(back);
      const restoredContext = restoreText(context);

      // Sprawdź czy fiszka już istnieje
      const existingFlashcard = flashcards.find(f => 
        f.word === restoredFront && 
        f.translation === restoredBack && 
        f.context === (restoredContext || '')
      );

      if (existingFlashcard) {
        // Aktualizuj istniejącą fiszkę
        const existingLastReviewed = existingFlashcard.lastReviewed ? new Date(existingFlashcard.lastReviewed) : null;
        const newLastReviewed = lastReviewed ? new Date(lastReviewed) : null;

        if (newLastReviewed && (!existingLastReviewed || newLastReviewed > existingLastReviewed)) {
          Object.assign(existingFlashcard, {
            firstReviewDate: firstReviewDate || existingFlashcard.firstReviewDate,
            lastReviewed: lastReviewed || existingFlashcard.lastReviewed,
            nextReview: nextReview || existingFlashcard.nextReview,
            difficulty: difficulty || existingFlashcard.difficulty,
            streak: parseInt(streak) || existingFlashcard.streak,
            easinessFactor: parseFloat(easinessFactor) || existingFlashcard.easinessFactor,
            interval: parseInt(interval) || existingFlashcard.interval,
            repetitions: parseInt(repetitions) || existingFlashcard.repetitions,
            leitnerBox: parseInt(leitnerBox) || existingFlashcard.leitnerBox
          });
          updatedCount++;
        } else {
          duplicateCount++;
        }
      } else {
        // Dodaj nową fiszkę
        flashcards.push({
          id: Date.now() + Math.random(),
          word: restoredFront,
          translation: restoredBack,
          context: restoredContext || '',
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
        });
        importedCount++;
      }
    }
  }

  saveFlashcards();
  updateFlashcardTable();
  updateStats();
  
  const message = `Zaimportowano ${importedCount} nowych fiszek, zaktualizowano ${updatedCount}, pominięto ${duplicateCount} duplikatów.`;
  showNotification(message, 'success');
}

// Funkcja do pokazania opcji importu
function showImportOptions() {
  const importDialog = document.createElement('div');
  importDialog.className = 'confirm-dialog import-dialog';
  importDialog.innerHTML = `
    <div class="confirm-content">
      <h3 data-translate="importOptions">Import Options</h3>
      <div class="import-buttons">
        <button class="import-file-btn" data-translate="importFromFile">Import from file</button>
        <button class="import-clipboard-btn" data-translate="importFromClipboard">Import from clipboard</button>
      </div>
      <div class="confirm-buttons">
        <button class="confirm-no" data-translate="cancel">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(importDialog);
  changeLanguage();

  const fileBtn = importDialog.querySelector('.import-file-btn');
  const clipboardBtn = importDialog.querySelector('.import-clipboard-btn');
  const cancelBtn = importDialog.querySelector('.confirm-no');

  fileBtn.addEventListener('click', () => {
    importFlashcardsFromFile();
    importDialog.remove();
  });

  clipboardBtn.addEventListener('click', () => {
    importFlashcardsFromClipboard();
    importDialog.remove();
  });

  cancelBtn.addEventListener('click', () => {
    importDialog.remove();
  });

  importDialog.addEventListener('click', (e) => {
    if (e.target === importDialog) {
      importDialog.remove();
    }
  });
}

// Nowa funkcja do wysyłania eksportu przez Pushbullet
async function sendExportToPushbullet() {
    try {
        const blob = createExportBlob();
        const result = await window.sendCsvToPushbullet(blob);
        console.log('Export result:', result);
        return result;
    } catch (error) {
        console.error('Error sending export to Pushbullet:', error);
        throw error;
    }
}

// Eksportuj nową funkcję
window.sendExportToPushbullet = sendExportToPushbullet;

function escapeCSV(str) {
  if (str == null) return '';
  return '"' + str.replace(/"/g, '""').replace(/\n/g, ' ') + '"';
}

// Zachowaj starą funkcję dla kompatybilności wstecznej
function importFlashcards() {
  showImportOptions();
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
    if (!localStorage.getItem('show_hard_cards')) {
        localStorage.setItem('show_hard_cards', 'false'); // disabled for mobile
    }
    if (!localStorage.getItem('show_random')) {
        localStorage.setItem('show_random', 'false'); // disabled for mobile
    }
    if (!localStorage.getItem('show_cards_number')) {
        localStorage.setItem('show_cards_number', 'false'); // disabled for mobile
    }
    if (!localStorage.getItem('show_new_today')) {
        localStorage.setItem('show_new_today', 'false'); // disabled for mobile
    }
    if (!localStorage.getItem('exampleButtonPrompt')) {
        localStorage.setItem('exampleButtonPrompt', 'You are an English teacher. Give me 6 sentences with the word {word}. 3 sentences and 3 questions. Use 3 different tenses. Do not inform me about tenses. Use real-world examples. \n\n After that, give me an example of a very short story, maximum 6 sentences, easy to understand. Later explain this word in the story with different words.');
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
  window.flashcards = flashcards;

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
  
  // Sprawdź ustawienie domyślnego widoku
  const defaultView = localStorage.getItem('reps_default_view') || 'browse';
  if (defaultView === 'add') {
    showSection('add');
  } else {
    showSection('view');  // 'browse' flashcard
  }
  loadSavedLanguage();
  setupAutoResizingTextareas(); // Dodaj tę linię
   // Dodaj window.saveFlashcards i window.handleSync do globalnego obiektu
   window.saveFlashcards = saveFlashcards;
   window.handleSync = window.handleSync || handleSync; // Użyj istniejcej funkcji z synchronization.js

   // Sprawdź czy mamy zapisany klucz API i ustaw automatyczną synchronizację
   const apiKey = localStorage.getItem('pushbullet_api_key');
   if (apiKey) {
       console.log('Found API key, setting up automatic sync');
       setupAutomaticSync();
   }
      initializeSyncButton();
      initializeDeleteNotesButton();

    // Dodaj inicjalizację sprawdzania synchronizacji
   // if (typeof window.initSyncCheck === 'function') {
   //     window.initSyncCheck();
  //  }

    if (!localStorage.getItem('auto_sync')) {
        localStorage.setItem('auto_sync', 'false');
    }
    if (!localStorage.getItem('sync_interval')) {
        localStorage.setItem('sync_interval', '5');
    }
    // Zmiana: sprawdzamy czy wartość już istnieje
    if (localStorage.getItem('enable_sync_check') === null) {
        localStorage.setItem('enable_sync_check', 'true'); // Domyślnie włączone tylko przy pierwszym uruchomieniu
    }

    // Sprawdź czy sprawdzanie synchronizacji jest włączone
    if (localStorage.getItem('enable_sync_check') === 'true') {
        initSyncCheck();
    }

    // Dodaj inicjalizację ustawienia export_to_server jeśli nie istnieje (save button)
    if (localStorage.getItem('export_to_server') === null) {
        localStorage.setItem('export_to_server', 'false'); // Domyślnie wyłączone
    }

    // Dodaj inicjalizację ustawienia enable_auto_save jeśli nie istnieje (auto save during sync)
    if (localStorage.getItem('enable_auto_save') === null) {
        localStorage.setItem('enable_auto_save', 'false'); // Domyślnie wyłączone
    }

    
    // Dodaj inicjalizację ustawienia enable_sync_after_review jeśli nie istnieje (auto sync after review)
    if (localStorage.getItem('enable_sync_after_review') === null) {
        localStorage.setItem('enable_sync_after_review', 'true'); // Domyślnie wyłączone
    }
    
    // Dodaj inicjalizację ustawienia reps_default_view jeśli nie istnieje
    if (localStorage.getItem('reps_default_view') === null) {
        localStorage.setItem('reps_default_view', 'browse'); // Domyślnie Browse flashcard
    }
    
    // Dodaj wywołanie funkcji aktualizującej widoczność przycisku Save
    updateSaveButtonVisibility();

    // Dodaj obsługę przycisku Save
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', handleSave);
    }

    // Sprawdź pliki save na serwerze
    if (typeof window.checkSaveFiles === 'function') {
        window.checkSaveFiles();
    }

    // Inicjalizacja trybu ciemnego
    //isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Ustaw prawidłową ikonę przy starcie
    const darkModeIcon = document.querySelector('.dark-mode-icon');
    if (darkModeIcon) {
        darkModeIcon.textContent = isDarkMode ? '☼' : '☽';
    }
    
    // Dodaj nasłuchiwanie na przycisk trybu ciemnego
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    const testDate = new Date('2024-12-21'); // ustaw dowolną datę
    // Dodaj tę linię na początku funkcji
    addNewCardsForToday();

    // Dodaj obsługę słownika
    const toggleDictionaryBtn = document.getElementById('toggle-dictionary');
    const dictionaryFrame = document.getElementById('dictionary-frame');
    
    if (toggleDictionaryBtn && dictionaryFrame) {
        toggleDictionaryBtn.addEventListener('click', () => {
            const isMobileScreen = window.matchMedia('(max-width: 768px)').matches;
            
            // Sprawdź czy kontener już istnieje
            const existingContainer = document.getElementById('dictionary-container');
            if (existingContainer) {
                // Jeśli kontener już istnieje, tylko go pokaż
                existingContainer.classList.add('show');
                dictionaryFrame.style.display = 'none';
                
                // Przywróć zakładki jeśli istnieją
                setTimeout(() => {
                    repsInitializeFirstTab();
                }, 100);
                return;
            }
            
            // Dla obu wersji (mobile i desktop) tworzymy nowy kontener
            const dictionaryContainer = document.createElement('div');
            dictionaryContainer.className = 'reps-dictionary-container'; // Usuwamy starą klasę 'dictionary-container'
            dictionaryContainer.id = 'dictionary-container';
            
            // Pobierz aktualny domyślny słownik i niestandardowe słowniki
            const defaultDictionary = localStorage.getItem('defaultDictionary');
            // Przygotuj opcje dla selecta, włączając niestandardowe słowniki
            const dictionaryOptions = getAllDictionaries().map(dict => `
                <option value="${dict.url}" ${defaultDictionary === dict.url ? 'selected' : ''}>
                    ${dict.name}
                </option>
            `).join('');

            dictionaryContainer.innerHTML = `
                <div class="reps-dictionary-header">
                    <span class="reps-back-arrow" onclick="hideDictionary()">&#8594;</span>
                    <div class="reps-dictionary-select-container">
                        <select id="reps-dictionary-select" class="reps-dictionary-select" onchange="repsChangeDictionary()">
                            ${dictionaryOptions}
                            <option value="add_new">Add new</option>
                            <option value="remove_dictionary">Remove dictionary</option>
                        </select>
                    </div>
                <div class="reps-default-checkbox-container">
                    <input type="checkbox" id="reps-dictionary-default-checkbox" 
                           ${defaultDictionary ? 'checked' : ''} 
                           onchange="setDefaultDictionary()">
                    <label for="reps-dictionary-default-checkbox" title="Set as default dictionary">
                        Set as Default
                        <span class="reps-default-indicator">${defaultDictionary ? '' : ''}</span>
                    </label>
                    </div>
                </div>
                
                <div class="reps-tabs-container">
                    <div id="reps-tabs">
                        <button id="reps-add-tab" onclick="repsAddNewTabFromButton()">+</button>
                    </div>
                </div>
                
                <div class="reps-iframe-container" id="reps-iframe-container">
                    <p>No dictionary selected</p>
                </div>`;
            
            // Wstawiamy nowy kontener w miejsce iframe'a
            dictionaryFrame.parentNode.insertBefore(dictionaryContainer, dictionaryFrame);
            dictionaryContainer.classList.add('show');
            
            // Ukrywamy oryginalny iframe
            dictionaryFrame.style.display = 'none';
            
            // Initialize first tab
            setTimeout(() => {
                repsInitializeFirstTab();
            }, 100);
        });
    }
}

// Dodaj tę funkcję do sprawdzania i dodawania nowych kart na początku dnia
function addNewCardsForToday(testDate = null) {
    const now = testDate || new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastAddDate = localStorage.getItem('last_new_cards_add_date');
    
    // Sprawdź czy już dodano karty dzisiaj - porównaj pełne daty
    if (lastAddDate) {
        const lastDate = new Date(lastAddDate);
        if (lastDate.getFullYear() === today.getFullYear() &&
            lastDate.getMonth() === today.getMonth() &&
            lastDate.getDate() === today.getDate()) {
            return; // Już dodano karty dzisiaj
        }
    }

    // Pobierz liczbę nowych kart do dodania
    const newCardsPerDay = parseInt(localStorage.getItem('new_cards_per_day')) || 0; // Zmieniono z 5 na 0
    if (newCardsPerDay <= 0) return; // Jeśli ustawiono 0, nie dodawaj kart

    // Znajdź wszystkie karty, które nigdy nie były przeglądane
    const newCards = flashcards.filter(f => !f.lastReviewed);
    
    // Wybierz określoną liczbę kart
    const cardsToAdd = newCards.slice(0, newCardsPerDay);
    
    // Oznacz wybrane karty jako dodane dzisiaj i due today
    cardsToAdd.forEach(card => {
        card.firstReviewDate = today.toISOString();
        card.nextReview = today.toISOString();
        card.lastReviewed = today.toISOString(); // Zmienione z null na today.toISOString()
    });

    // Zapisz datę dodania kart
    localStorage.setItem('last_new_cards_add_date', today.toISOString());
    
    // Zapisz zaktualizowane fiszki
    saveFlashcards();
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

// Funkcja do aktualizacji istniejących i dodawania nowych fiszek
function updateExistingAndAddNewFlashcards(wordList) {
  const updatedFlashcards = [...flashcards];
  
  wordList.forEach(word => {
    const existingFlashcard = updatedFlashcards.find(f => 
      f.word === word.word && f.translation === word.translation
    );
    
    if (existingFlashcard) {
      existingFlashcard.context = word.context;
      //existingFlashcard.lastModified = new Date().toISOString();
    } else {
      const now = new Date().toISOString();
      const nowMs = Date.now();
      updatedFlashcards.push({
        id: nowMs + Math.random(),
        word: word.word,
        context: word.context,
        translation: word.translation,
        mediaUrl: '',
        audioUrl: '',
        repeats: 0,
        lastReviewed: null,
        firstReviewDate: null,
        createdAt: now,
        lastModified: null,
        difficulty: 'medium',
        nextReview: null,
        easinessFactor: 2.5,
        interval: 0,
        repetitions: 0,
        leitnerBox: 1,
        lastSync: null,
        streak: 0
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
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'confirm-dialog';
        confirmDialog.innerHTML = `
            <div class="confirm-content">
                <h3 data-translate="confirmDelete">Delete Flashcard</h3>
                <p data-translate="confirmDeleteMessage">Are you sure you want to delete this flashcard?</p>
                <p class="sync-warning" data-translate="syncDeleteWarning">Note: If you are using Synchronization, to prevent the deleted flashcard from reappearing in the table, you must also delete all notes on the server. Settings -> Delete all Notes. Then press the Sync button to update the flashcards on the server.</p>
                <div class="confirm-buttons">
                    <button class="confirm-yes" data-translate="yes">Yes</button>
                    <button class="confirm-no" data-translate="no2">No</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);
        changeLanguage();

        return new Promise((resolve) => {
            const yesButton = confirmDialog.querySelector('.confirm-yes');
            const noButton = confirmDialog.querySelector('.confirm-no');

            yesButton.addEventListener('click', () => {
                flashcards.splice(index, 1);
                saveFlashcards();
                updateFlashcardTable();
                updateStats();
                confirmDialog.remove();
                resolve(true);
            });

            noButton.addEventListener('click', () => {
                confirmDialog.remove();
                resolve(false);
            });

            confirmDialog.addEventListener('click', (e) => {
                if (e.target === confirmDialog) {
                    confirmDialog.remove();
                    resolve(false);
                }
            });
        });
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
    const currentAlgorithm = localStorage.getItem('reviewAlgorithm') || 'supermemo';
    const currentButtonMode = localStorage.getItem('gradeButtonMode') || 'four';
    const currentNewCardsPerDay = localStorage.getItem('new_cards_per_day') || '5';
    
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    overlay.id = 'settings-overlay';
    
    settingsForm = document.createElement('div');
    settingsForm.id = 'review-settings-form';
    settingsForm.className = 'settings-form';
    settingsForm.innerHTML = `
        <h3 data-translate="reviewSettings">Review Settings</h3>
        <div class="settings-group">
            <!-- Zmieniony tekst labela -->
            <div class="new-cards-settings">
                <label data-translate="automaticNewCards">Add automatically number of new cards every day:</label>
                <div class="radio-group horizontal">  <!-- Dodano klasę horizontal -->
                    <label class="radio-option">
                        <input type="radio" name="newCardsPerDay" value="0" 
                            ${currentNewCardsPerDay === '0' ? 'checked' : ''}>
                        <span class="radio-label">0</span>  <!-- Dodano klasę radio-label -->
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="newCardsPerDay" value="5" 
                            ${currentNewCardsPerDay === '5' ? 'checked' : ''}>
                        <span class="radio-label">5</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="newCardsPerDay" value="10" 
                            ${currentNewCardsPerDay === '10' ? 'checked' : ''}>
                        <span class="radio-label">10</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="newCardsPerDay" value="custom" 
                            ${!['0', '5', '10'].includes(currentNewCardsPerDay) ? 'checked' : ''}>
                        <span class="radio-label" data-translate="custom">Custom</span>
                        <input type="number" id="customNewCards" 
                            value="${!['0', '5', '10'].includes(currentNewCardsPerDay) ? currentNewCardsPerDay : '15'}"
                            min="1" max="100" 
                            class="${!['0', '5', '10'].includes(currentNewCardsPerDay) ? '' : 'hidden'}"
                            onclick="event.stopPropagation()">
                    </label>
                </div>
            </div>
        </div>

        <div class="settings-group">
            <label data-translate="roundDuration">Round duration (minutes):</label>
            <div class="radio-group horizontal">
                <label class="radio-option">
                    <input type="radio" name="roundDuration" value="disabled" 
                        ${(localStorage.getItem('round_duration') || '6') === 'disabled' ? 'checked' : ''}>
                    <span class="radio-label" data-translate="disabled">Disabled</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="roundDuration" value="3" 
                        ${(localStorage.getItem('round_duration') || '6') === '3' ? 'checked' : ''}>
                    <span class="radio-label">3</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="roundDuration" value="6" 
                        ${(localStorage.getItem('round_duration') || '6') === '6' ? 'checked' : ''}>
                    <span class="radio-label">6</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="roundDuration" value="9" 
                        ${(localStorage.getItem('round_duration') || '6') === '9' ? 'checked' : ''}>
                    <span class="radio-label">9</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="roundDuration" value="12" 
                        ${(localStorage.getItem('round_duration') || '6') === '12' ? 'checked' : ''}>
                    <span class="radio-label">12</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="roundDuration" value="15" 
                        ${(localStorage.getItem('round_duration') || '6') === '15' ? 'checked' : ''}>
                    <span class="radio-label">15</span>
                </label>
            </div>
        </div>

        <div class="settings-group">
            <label data-translate="countdownAnimationTime">Countdown animation time (seconds):</label>
            <div class="radio-group horizontal">
                <label class="radio-option">
                    <input type="radio" name="countdownTime" value="0" 
                        ${(localStorage.getItem('countdown_animation_time') || '2') === '0' ? 'checked' : ''}>
                    <span class="radio-label" data-translate="disabled">Disabled</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="countdownTime" value="2" 
                        ${(localStorage.getItem('countdown_animation_time') || '2') === '2' ? 'checked' : ''}>
                    <span class="radio-label">2s</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="countdownTime" value="3" 
                        ${(localStorage.getItem('countdown_animation_time') || '2') === '3' ? 'checked' : ''}>
                    <span class="radio-label">3s</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="countdownTime" value="4" 
                        ${(localStorage.getItem('countdown_animation_time') || '2') === '4' ? 'checked' : ''}>
                    <span class="radio-label">4s</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="countdownTime" value="5" 
                        ${(localStorage.getItem('countdown_animation_time') || '2') === '5' ? 'checked' : ''}>
                    <span class="radio-label">5s</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="countdownTime" value="7" 
                        ${(localStorage.getItem('countdown_animation_time') || '2') === '7' ? 'checked' : ''}>
                    <span class="radio-label">7s</span>
                </label>
            </div>
        </div>

        <div class="settings-group review-modes-options">
            <label data-translate="reviewModesVisibility">Show review modes:</label>
            <div class="checkbox-option">
                <label class="checkbox-label">
                    <input type="checkbox" id="show-new-today" ${localStorage.getItem('show_new_today') !== 'false' ? 'checked' : ''}>
                    <span data-translate="newTodayOnly">New Cards From Today Only</span>
                </label>
            </div>
            <div class="checkbox-option">
                <label class="checkbox-label">
                    <input type="checkbox" id="show-hard-cards" ${localStorage.getItem('show_hard_cards') !== 'false' ? 'checked' : ''}>
                    <span data-translate="hardFlashcardsOnly">Hard Cards Only</span>
                </label>
            </div>
            <div class="checkbox-option">
                <label class="checkbox-label">
                    <input type="checkbox" id="show-random" ${localStorage.getItem('show_random') !== 'false' ? 'checked' : ''}>
                    <span data-translate="randomFlashcards">Random Selection</span>
                </label>
            </div>
            <!-- Dodaj nową opcję -->
            <div class="checkbox-option">
                <label class="checkbox-label">
                    <input type="checkbox" id="show-cards-number" ${localStorage.getItem('show_cards_number') === 'true' ? 'checked' : ''}>
                    <span data-translate="showCardsNumber">Show Number of cards limit</span>
                </label>
            </div>
        </div>

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
            <p><span data-translate="moreInfo">More information</span>: <a href="https://github.com/theaidran/YoutubeReps" target="_blank">https://github.com/theaidran/YoutubeReps</a></p>
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

    // Zmiana obsługi kliknięcia na overlay
    overlay.addEventListener('click', () => {
        saveAlgorithmSettings();
    });

    // Dodaj obsługę radio buttonów dla nowych kart
    settingsForm.querySelectorAll('input[name="newCardsPerDay"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const customInput = document.getElementById('customNewCards');
            customInput.classList.toggle('hidden', this.value !== 'custom');
        });
    });

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
    const showNewToday = document.getElementById('show-new-today').checked;
    const showHardCards = document.getElementById('show-hard-cards').checked;
    const showRandom = document.getElementById('show-random').checked;
    const showCardsNumber = document.getElementById('show-cards-number').checked;
    
    // Dodaj zapisywanie liczby nowych kart
    const selectedNewCards = document.querySelector('input[name="newCardsPerDay"]:checked');
    let newCardsPerDay = selectedNewCards.value;
    if (newCardsPerDay === 'custom') {
        newCardsPerDay = document.getElementById('customNewCards').value;
    }
    
    // Dodaj zapisywanie czasu animacji odliczania
    const selectedCountdownTime = document.querySelector('input[name="countdownTime"]:checked');
    const countdownTime = selectedCountdownTime ? selectedCountdownTime.value : '2';
    
    // Dodaj zapisywanie czasu trwania rundy
    const selectedRoundDuration = document.querySelector('input[name="roundDuration"]:checked');
    const roundDuration = selectedRoundDuration ? selectedRoundDuration.value : '6';
    
    localStorage.setItem('reviewAlgorithm', algorithm);
    localStorage.setItem('gradeButtonMode', buttonMode);
    localStorage.setItem('show_new_today', showNewToday);
    localStorage.setItem('show_hard_cards', showHardCards);
    localStorage.setItem('show_random', showRandom);
    localStorage.setItem('new_cards_per_day', newCardsPerDay);
    localStorage.setItem('show_cards_number', showCardsNumber);
    localStorage.setItem('countdown_animation_time', countdownTime);
    localStorage.setItem('round_duration', roundDuration);
    
    updateStats();
    drawLearningProgressChart();
    closeReviewSettings();
    showReviewModeSelection();
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
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-dialog';
    confirmDialog.innerHTML = `
        <div class="confirm-content">
            <h3 data-translate="confirmDeleteAll">Delete All Flashcards</h3>
            <p data-translate="confirmDeleteAllMessage">Are you sure you want to delete all flashcards? This action cannot be undone.</p>
            <p class="sync-warning" data-translate="syncDeleteWarning">Note: If you are using Synchronization, to prevent the deleted flashcards from reappearing in the table, you must also delete all notes on the server. Settings -> Delete all Notes. Then press the Sync button to update the flashcards on the server.</p>
            <div class="confirm-buttons">
                <button class="confirm-yes" data-translate="yes">Yes</button>
                <button class="confirm-no" data-translate="no2">No</button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmDialog);
    changeLanguage();

    return new Promise((resolve) => {
        const yesButton = confirmDialog.querySelector('.confirm-yes');
        const noButton = confirmDialog.querySelector('.confirm-no');

        yesButton.addEventListener('click', () => {
            flashcards = [];
            saveFlashcards();
            updateFlashcardTable();
            updateStats();
            drawLearningProgressChart();
            // Resetujemy czas ostatniej synchronizacji
            localStorage.setItem('last_sync_time', '0');
            confirmDialog.remove();
            resolve(true);
        });

        noButton.addEventListener('click', () => {
            confirmDialog.remove();
            resolve(false);
        });

        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                confirmDialog.remove();
                resolve(false);
            }
        });
    });
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
                <button class="review-edit-button" onclick="editFlashcardDuringReview(${flashcard.id})" data-translate="edit">Edit</button>
                ${algorithm === 'leitner' ? leitnerInfo : ''}
                <p><strong data-translate="wordPhrase">Word / Phrase:</strong></p>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <textarea id="word-${currentFlashcardIndex}" style="display: none;">${flashcard.word}</textarea>
                    <pre style="margin: 0;">${flashcard.word}</pre>
                    <button type="button" class="speaker-button" onclick="speakWord2('word-${currentFlashcardIndex}')" style="background: none; border: none; cursor: pointer; padding: 0;">
                        <svg width="23" height="23" viewBox="0 0 24 24" fill="#333333">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                    </button>
                </div>
                <p><strong data-translate="contextExample">Context / Example:</strong></p>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <textarea id="context-${currentFlashcardIndex}" style="display: none;">${flashcard.context || 'No context provided'}</textarea>
                    <pre style="margin: 0;">${flashcard.context || 'No context provided'}</pre>
                    <button type="button" class="speaker-button" onclick="speakWord3('context-${currentFlashcardIndex}')" style="background: none; border: none; cursor: pointer; padding: 0;">
                        <svg width="23" height="23" viewBox="0 0 24 24" fill="#333333">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                    </button>
                </div>
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
        // Funkcja do odtwarzania tekstu
    window.speakWord3 = function(textareaId) {
        const TtsLang = localStorage.getItem('ttsLanguage') || 'en';
        const text = document.getElementById(textareaId).value;
        const encodedText = encodeURIComponent(text);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${TtsLang}&client=tw-ob`;
        
        const audio = new Audio(url);
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    };
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
        
        // Dodaj automatyczną synchronizację po zakończeniu powtórki
        const enableSyncAfterReview = localStorage.getItem('enable_sync_after_review') === 'true';
        if (enableSyncAfterReview) {
            setTimeout(async () => {
                try {
                    // Usuń wyświetlanie okna dialogowego - po prostu wykonaj synchronizację
                    const apiKey = localStorage.getItem('pushbullet_api_key');
                    if (apiKey) {
                        await handleSync();
                    }
                } catch (error) {
                    console.error('Auto sync after review failed:', error);
                }
            }, 1);
        }
        
        setTimeout(() => {
            stopRoundTimer(); // Stop timer when review ends
            showReviewModeSelection();
        }, 2000);
    }
}

// Round timer functions
function startRoundTimer() {
    if (reviewTimer) {
        clearInterval(reviewTimer);
    }
    
    // Check if round timer is disabled
    const roundDurationSetting = localStorage.getItem('round_duration') || '6';
    if (roundDurationSetting === 'disabled') {
        return; // Don't start timer if disabled
    }
    
    reviewStartTime = Date.now();
    currentRound = 1;
    isRoundPaused = false;
    
    // Get round duration from settings
    const roundDurationMinutes = parseInt(roundDurationSetting);
    const roundDurationMs = roundDurationMinutes * 60 * 1000; // Convert minutes to milliseconds
    
    reviewTimer = setInterval(() => {
        if (!isRoundPaused) {
            showRoundFinished();
        }
    }, roundDurationMs);
}

function stopRoundTimer() {
    if (reviewTimer) {
        clearInterval(reviewTimer);
        reviewTimer = null;
    }
    currentRound = 0;
    isRoundPaused = false;
}

function pauseRoundTimer() {
    isRoundPaused = true;
}

function resumeRoundTimer() {
    isRoundPaused = false;
}

function showRoundFinished() {
    pauseRoundTimer();
    
    // Create round finished modal
    const modal = document.createElement('div');
    modal.className = 'round-modal';
    const roundText = translations[currentLanguage].roundFinished ? 
        translations[currentLanguage].roundFinished.replace('{round}', currentRound) :
        `Round ${currentRound} is finished!`;
    const readyText = translations[currentLanguage].areYouReady || "Are you ready for next round?";
    const okText = translations[currentLanguage].okButton || "OK";
    const finishText = translations[currentLanguage].finish || "Finish";
    
    // Get round duration for display
    const roundDurationMinutes = parseInt(localStorage.getItem('round_duration') || '6');
    const durationText = `${roundDurationMinutes} ${roundDurationMinutes === 1 ? 'minute' : 'minutes'}`;
    
    modal.innerHTML = `
        <div class="round-modal-content">
            <div class="round-animation">
                <h2>${roundText}</h2>
                <div class="round-progress">
                    <div class="round-duration">
                        <span class="duration-text">${durationText}</span>
                    </div>
                </div>
                <p>${readyText}</p>
                <div class="round-buttons">
                    <button onclick="cancelRoundAndReturnToMenu()" class="round-cancel-button">${finishText}</button>
                    <button onclick="continueToNextRound()" class="round-ok-button">${okText}</button>
                </div>
            </div>
        </div>
    `;
    
    // Add click outside to continue functionality
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            continueToNextRound();
        }
    });
    
    // Prevent clicks inside the modal content from triggering the outside click
    modal.querySelector('.round-modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    document.body.appendChild(modal);
    
    // Add animation class after a small delay
    setTimeout(() => {
        modal.classList.add('show');
    }, 100);
}

window.continueToNextRound = function() {
    const modal = document.querySelector('.round-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
    
    currentRound++;
    resumeRoundTimer();
    
    // Restart timer for next round
    if (reviewTimer) {
        clearInterval(reviewTimer);
    }
    
    // Check if round timer is disabled
    const roundDurationSetting = localStorage.getItem('round_duration') || '6';
    if (roundDurationSetting === 'disabled') {
        return; // Don't restart timer if disabled
    }
    
    // Get round duration from settings
    const roundDurationMinutes = parseInt(roundDurationSetting);
    const roundDurationMs = roundDurationMinutes * 60 * 1000; // Convert minutes to milliseconds
    
    reviewTimer = setInterval(() => {
        if (!isRoundPaused) {
            showRoundFinished();
        }
    }, roundDurationMs);
}

window.cancelRoundAndReturnToMenu = function() {
    const modal = document.querySelector('.round-modal');
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
    
    // Stop the round timer completely
    stopRoundTimer();
    
    // Return to review mode selection
    startReview();
}



// Obsługa synchronizacji
async function handleSync() {
    console.log('handleSync called');
    const syncButton = document.getElementById('sync-button');
    if (!syncButton) {
        console.error('Sync button not found in handleSync');
        return;
    }
    
    if (isSyncing) {
        console.log('Sync already in progress');
        return;
    }
    
    const apiKey = localStorage.getItem('pushbullet_api_key');
    if (!apiKey) {
        console.log('No API key found, showing Pushbullet dialog');
        showPushbulletDialog();
        return;
    }

    try {
        console.log('Starting sync process');
        isSyncing = true;
        syncButton.classList.add('syncing');
        syncButton.querySelector('[data-translate="sync"]').textContent = 
            translations[currentLanguage].syncInProgress;



        await waitForFlashcards();
        await fetchFromPushbullet();
        await syncWithPushbullet();
        //updateLastSyncTime();


        // Po udanej synchronizacji usuń klasę new-sync
        syncButton.classList.remove('new-sync');

        console.log('Sync completed successfully');
        updateFlashcardTable();
        updateStats();
        showNotification(translations[currentLanguage].syncSuccess, 'success');
    } catch (error) {
        console.error('Sync failed:', error);
        showNotification(translations[currentLanguage].syncError + ': ' + error.message, 'error');
    } finally {
        console.log('Sync process finished');
        isSyncing = false;
        syncButton.classList.remove('syncing');
        syncButton.querySelector('[data-translate="sync"]').textContent = 
            translations[currentLanguage].sync;
    }

                    // Dodajemy wywołanie funkcji Save po synchronizacji
                    const enable_auto_save = localStorage.getItem('enable_auto_save') === 'true';
                     if (enable_auto_save) { //zawsze wysyłaj plik 
                         try {
                             await sendExportToPushbullet();
                             // Odświeżamy link do pobrania
                             if (typeof window.checkSaveFiles === 'function') {
                                 await window.checkSaveFiles();
                             }
                         } catch (error) {
                             console.error('Save during sync failed:', error);
                             // Kontynuujemy synchronizację nawet jeśli save się nie powiedzie
                         }
                     }
    
}

// Dodaj funkcję pomocniczą do czekania na inicjalizację fiszek
function waitForFlashcards() {
  return new Promise((resolve, reject) => {
      const maxAttempts = 10;
      let attempts = 0;

      function checkFlashcards() {
          if (typeof window.flashcards !== 'undefined' && window.flashcards) {
              resolve();
          } else if (attempts >= maxAttempts) {
              reject(new Error('Flashcards initialization timeout'));
          } else {
              attempts++;
              setTimeout(checkFlashcards, 500);
          }
      }

      checkFlashcards();
  });
}

function showPushbulletDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'pushbullet-dialog';
    dialog.innerHTML = `
        <h3 data-translate="pushbulletSetup">Pushbullet Setup</h3>
        <p class="settings-description" data-translate="syncDescription">Synchronization allows you to review flashcards on two devices.</p>
        <div class="api-key-input">
            <input type="password" id="pushbullet-api-key" placeholder="${translations[currentLanguage].enterApiKey}"/>
            <button type="button" class="toggle-password" onclick="togglePasswordVisibility(this)">
                👁
            </button>
        </div>
        <div class="api-key-info">
            <a href="https://www.pushbullet.com/#settings/account" 
               target="_blank" 
               data-translate="getApiKey">Get your API key</a>
            <span style="margin-left: 5px;" data-translate="apiKeyLimit">(Free account: Limited to 500 pushes per month, which should be sufficient for daily synchronization of 100 reviewed flashcards)</span>
        </div>
        <div class="dialog-buttons">
            <button onclick="connectPushbullet()" class="submit-button" data-translate="connect">Connect</button>
            <button onclick="closePushbulletDialog()" class="cancel-button" data-translate="cancel">Cancel</button>
        </div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.onclick = closePushbulletDialog;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    changeLanguage();
}

async function connectPushbullet() {
  const apiKey = document.getElementById('pushbullet-api-key').value;
  if (!apiKey) {
      showNotification(translations[currentLanguage].enterApiKey, 'error');
      return;
  }

  try {
      const connected = await initPushbullet(apiKey);
      if (connected) {
          showNotification(translations[currentLanguage].syncEnabled, 'success');
          closePushbulletDialog();
          setupAutomaticSync();
          handleSync(); // Rozpocznij pierwszą synchronizację
      }
  } catch (error) {
      console.error('Pushbullet connection failed:', error);
      showNotification(`${translations[currentLanguage].syncError}: ${error.message}`, 'error');
  }
}

function closePushbulletDialog() {
  const dialog = document.querySelector('.pushbullet-dialog');
  const overlay = document.querySelector('.dialog-overlay');
  if (dialog) dialog.remove();
  if (overlay) overlay.remove();
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
      <div class="notification-content">
          <span class="notification-message">${message}</span>
          <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
  `;
  
  document.body.appendChild(notification);
  
  // Automatycznie usuń powiadomienie po 5 sekundach
  setTimeout(() => {
      if (notification.parentElement) {
          notification.remove();
      }
  }, 5000);
}

// Dodaj nasłuchiwanie na przycisk synchronizacji po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
  const syncButton = document.getElementById('sync-button');
  if (syncButton) {
      syncButton.addEventListener('click', handleSync);
  }

  // Sprawdź czy synchronizacja jest już skonfigurowana
  const apiKey = localStorage.getItem('pushbullet_api_key');
  if (apiKey) {
      setupAutomaticSync();
  }
  
  // Dodaj obsługę linku "My Playlists" - ustaw flagę przed przejściem do index.html
  const myPlaylistsLink = document.querySelector('a[href="index.html"]');
  if (myPlaylistsLink) {
      myPlaylistsLink.addEventListener('click', () => {
          sessionStorage.setItem('returnedFromReps', 'true');
      });
  }
  
  // Wyczyść flagę goingToReps jeśli użytkownik dotarł do reps.html
  if (sessionStorage.getItem('goingToReps') === 'true') {
      sessionStorage.removeItem('goingToReps');
  }
});

// Dodaj nową funkcję inicjalizacji przycisku synchronizacji
function initializeSyncButton() {
    const syncButton = document.getElementById('sync-button');
    if (syncButton) {
        console.log('Initializing sync button');
        
        // Usuń wszystkie istniejące event listenery
        const newSyncButton = syncButton.cloneNode(true);
        syncButton.parentNode.replaceChild(newSyncButton, syncButton);
        
        // Dodaj nowy event listener
        newSyncButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Sync button clicked');
            if (typeof window.handleSync === 'function') {
                try {
                    await window.handleSync();
                } catch (error) {
                    console.error('Sync error:', error);
                    showNotification('Synchronization failed: ' + error.message, 'error');
                }
            } else {
                console.error('handleSync function not found');
                showNotification('Synchronization function not available', 'error');
            }
        });
    } else {
        console.error('Sync button not found');
    }
}

// Funkcja otwierająca okno ustawień
function openMainSettings() {
    const currentApiKey = localStorage.getItem('pushbullet_api_key') || '';
    const autoSync = localStorage.getItem('auto_sync') === 'true';
    const syncInterval = localStorage.getItem('sync_interval') || '5';
    const inactivityTimeout = localStorage.getItem('inactivity_timeout') || '10';
    const enableSyncCheck = localStorage.getItem('enable_sync_check') === 'true';
    const exportToServer = localStorage.getItem('export_to_server') === 'true';
    const enableAutoSave = localStorage.getItem('enable_auto_save') === 'true';
    const enableSyncAfterReview = localStorage.getItem('enable_sync_after_review') === 'true'; // Dodane
    
    const settingsDialog = document.createElement('div');
    settingsDialog.className = 'main-settings-dialog';

    const savedTtsLang = localStorage.getItem('ttsLanguage') || 'en'; //defalut
    
    // Pobierz zapisany prompt lub użyj domyślnego
    const savedPrompt = localStorage.getItem('exampleButtonPrompt') ;
    const savedGroqApiKey = localStorage.getItem('groq_api_key') || '';
    settingsDialog.innerHTML = `
        <h2 data-translate="mainSettings">Main Settings</h2>

        <div class="settings-section">
            <h3>Groq API key:</h3>
            <div class="form-group">
                <div class="api-key-input">
                    <input type="password" id="groq-api-key" style="width: 100%; padding: 8px; margin-bottom: 4px;" placeholder="Enter your Groq API key" value="${savedGroqApiKey}">
                    <button type="button" class="toggle-password" onclick="toggleGroqPasswordVisibility(this)">👁</button>
                    <button type="button" class="remove-api-key" onclick="removeGroqApiKey()">✕</button>
                    <button type="button" class="model-settings" onclick="openGroqModelSettings()">⋮</button>
                </div>
                <small>API key for DictAI chatbot integration</small>
            </div>
        </div>

        <div class="settings-section">
          <h3>Flashcard Context "Show Examples" - Prompt</h3>
            <div class="form-group">
                <textarea id="exampleButtonPrompt" rows="2" style="width: 100%;">${savedPrompt}</textarea>
                <small>Use {word} as placeholder for the current word</small>
            </div>
        </div>

        <div class="settings-section">
          <h3>DictAI - Prompt</h3>
            <div class="form-group">
                <textarea id="dictAiPrompt" rows="4" style="width: 100%;">${localStorage.getItem('dictAiPrompt') || 'You are an English teacher. Give me the meaning of the word in the next prompt. Just ask about the word. Explain in different words and provide me 3 example sentences with this word.'}</textarea>
                <small>Prompt used for DictAI dictionary integration</small>
            </div>

                        <!-- Dodajemy sekcję języka TTS -->
            <div class="settings-section">
                <h3>Text to Speech Language</h3>
                <div class="form-group">
                    <select id="ttsLanguage" style="width: 100%; padding: 8px; margin-bottom: 4px;">
                         <option value="af" ${savedTtsLang === 'af' ? 'selected' : ''}>Afrikaans</option>
                         <option value="sq" ${savedTtsLang === 'sq' ? 'selected' : ''}>Albanian</option>
                         <option value="am" ${savedTtsLang === 'am' ? 'selected' : ''}>Amharic</option>
                         <option value="ar" ${savedTtsLang === 'ar' ? 'selected' : ''}>Arabic</option>
                         <option value="hy" ${savedTtsLang === 'hy' ? 'selected' : ''}>Armenian</option>
                         <option value="az" ${savedTtsLang === 'az' ? 'selected' : ''}>Azerbaijani</option>
                         <option value="eu" ${savedTtsLang === 'eu' ? 'selected' : ''}>Basque</option>
                         <option value="be" ${savedTtsLang === 'be' ? 'selected' : ''}>Belarusian</option>
                         <option value="bn" ${savedTtsLang === 'bn' ? 'selected' : ''}>Bengali</option>
                         <option value="bs" ${savedTtsLang === 'bs' ? 'selected' : ''}>Bosnian</option>
                         <option value="bg" ${savedTtsLang === 'bg' ? 'selected' : ''}>Bulgarian</option>
                         <option value="ca" ${savedTtsLang === 'ca' ? 'selected' : ''}>Catalan</option>
                         <option value="ceb" ${savedTtsLang === 'ceb' ? 'selected' : ''}>Cebuano</option>
                         <option value="zh-CN" ${savedTtsLang === 'zh-CN' ? 'selected' : ''}>Chinese (Simplified)</option>
                         <option value="zh-TW" ${savedTtsLang === 'zh-TW' ? 'selected' : ''}>Chinese (Traditional)</option>
                         <option value="co" ${savedTtsLang === 'co' ? 'selected' : ''}>Corsican</option>
                         <option value="hr" ${savedTtsLang === 'hr' ? 'selected' : ''}>Croatian</option>
                         <option value="cs" ${savedTtsLang === 'cs' ? 'selected' : ''}>Czech</option>
                         <option value="da" ${savedTtsLang === 'da' ? 'selected' : ''}>Danish</option>
                         <option value="nl" ${savedTtsLang === 'nl' ? 'selected' : ''}>Dutch</option>
                         <option value="en" ${savedTtsLang === 'en' ? 'selected' : ''}>English</option>
                         <option value="eo" ${savedTtsLang === 'eo' ? 'selected' : ''}>Esperanto</option>
                         <option value="et" ${savedTtsLang === 'et' ? 'selected' : ''}>Estonian</option>
                         <option value="fi" ${savedTtsLang === 'fi' ? 'selected' : ''}>Finnish</option>
                         <option value="fr" ${savedTtsLang === 'fr' ? 'selected' : ''}>French</option>
                         <option value="fy" ${savedTtsLang === 'fy' ? 'selected' : ''}>Frisian</option>
                         <option value="gl" ${savedTtsLang === 'gl' ? 'selected' : ''}>Galician</option>
                         <option value="ka" ${savedTtsLang === 'ka' ? 'selected' : ''}>Georgian</option>
                         <option value="de" ${savedTtsLang === 'de' ? 'selected' : ''}>German</option>
                         <option value="el" ${savedTtsLang === 'el' ? 'selected' : ''}>Greek</option>
                         <option value="gu" ${savedTtsLang === 'gu' ? 'selected' : ''}>Gujarati</option>
                         <option value="ht" ${savedTtsLang === 'ht' ? 'selected' : ''}>Haitian Creole</option>
                         <option value="ha" ${savedTtsLang === 'ha' ? 'selected' : ''}>Hausa</option>
                         <option value="iw" ${savedTtsLang === 'iw' ? 'selected' : ''}>Hebrew</option>
                         <option value="hi" ${savedTtsLang === 'hi' ? 'selected' : ''}>Hindi</option>
                         <option value="hmn" ${savedTtsLang === 'hmn' ? 'selected' : ''}>Hmong</option>
                         <option value="hu" ${savedTtsLang === 'hu' ? 'selected' : ''}>Hungarian</option>
                         <option value="is" ${savedTtsLang === 'is' ? 'selected' : ''}>Icelandic</option>
                         <option value="ig" ${savedTtsLang === 'ig' ? 'selected' : ''}>Igbo</option>
                         <option value="id" ${savedTtsLang === 'id' ? 'selected' : ''}>Indonesian</option>
                         <option value="ga" ${savedTtsLang === 'ga' ? 'selected' : ''}>Irish</option>
                         <option value="it" ${savedTtsLang === 'it' ? 'selected' : ''}>Italian</option>
                         <option value="ja" ${savedTtsLang === 'ja' ? 'selected' : ''}>Japanese</option>
                         <option value="jw" ${savedTtsLang === 'jw' ? 'selected' : ''}>Javanese</option>
                         <option value="kn" ${savedTtsLang === 'kn' ? 'selected' : ''}>Kannada</option>
                         <option value="kk" ${savedTtsLang === 'kk' ? 'selected' : ''}>Kazakh</option>
                         <option value="km" ${savedTtsLang === 'km' ? 'selected' : ''}>Khmer</option>
                         <option value="ko" ${savedTtsLang === 'ko' ? 'selected' : ''}>Korean</option>
                         <option value="ku" ${savedTtsLang === 'ku' ? 'selected' : ''}>Kurdish</option>
                         <option value="ky" ${savedTtsLang === 'ky' ? 'selected' : ''}>Kyrgyz</option>
                         <option value="lo" ${savedTtsLang === 'lo' ? 'selected' : ''}>Lao</option>
                         <option value="la" ${savedTtsLang === 'la' ? 'selected' : ''}>Latin</option>
                         <option value="lv" ${savedTtsLang === 'lv' ? 'selected' : ''}>Latvian</option>
                         <option value="lt" ${savedTtsLang === 'lt' ? 'selected' : ''}>Lithuanian</option>
                         <option value="lb" ${savedTtsLang === 'lb' ? 'selected' : ''}>Luxembourgish</option>
                         <option value="mk" ${savedTtsLang === 'mk' ? 'selected' : ''}>Macedonian</option>
                         <option value="mg" ${savedTtsLang === 'mg' ? 'selected' : ''}>Malagasy</option>
                         <option value="ms" ${savedTtsLang === 'ms' ? 'selected' : ''}>Malay</option>
                         <option value="ml" ${savedTtsLang === 'ml' ? 'selected' : ''}>Malayalam</option>
                         <option value="mt" ${savedTtsLang === 'mt' ? 'selected' : ''}>Maltese</option>
                         <option value="mi" ${savedTtsLang === 'mi' ? 'selected' : ''}>Maori</option>
                         <option value="mr" ${savedTtsLang === 'mr' ? 'selected' : ''}>Marathi</option>
                         <option value="mn" ${savedTtsLang === 'mn' ? 'selected' : ''}>Mongolian</option>
                         <option value="ne" ${savedTtsLang === 'ne' ? 'selected' : ''}>Nepali</option>
                         <option value="no" ${savedTtsLang === 'no' ? 'selected' : ''}>Norwegian</option>
                         <option value="or" ${savedTtsLang === 'or' ? 'selected' : ''}>Odia (Oriya)</option>
                         <option value="pl" ${savedTtsLang === 'pl' ? 'selected' : ''}>Polish</option>
                         <option value="pt" ${savedTtsLang === 'pt' ? 'selected' : ''}>Portuguese</option>
                         <option value="ro" ${savedTtsLang === 'ro' ? 'selected' : ''}>Romanian</option>
                         <option value="ru" ${savedTtsLang === 'ru' ? 'selected' : ''}>Russian</option>
                         <option value="sr" ${savedTtsLang === 'sr' ? 'selected' : ''}>Serbian</option>
                         <option value="si" ${savedTtsLang === 'si' ? 'selected' : ''}>Sinhala</option>
                         <option value="sk" ${savedTtsLang === 'sk' ? 'selected' : ''}>Slovak</option>
                         <option value="sl" ${savedTtsLang === 'sl' ? 'selected' : ''}>Slovenian</option>
                         <option value="es" ${savedTtsLang === 'es' ? 'selected' : ''}>Spanish</option>
                         <option value="su" ${savedTtsLang === 'su' ? 'selected' : ''}>Sundanese</option>
                         <option value="sw" ${savedTtsLang === 'sw' ? 'selected' : ''}>Swahili</option>
                         <option value="sv" ${savedTtsLang === 'sv' ? 'selected' : ''}>Swedish</option>
                         <option value="tg" ${savedTtsLang === 'tg' ? 'selected' : ''}>Tajik</option>
                         <option value="ta" ${savedTtsLang === 'ta' ? 'selected' : ''}>Tamil</option>
                         <option value="te" ${savedTtsLang === 'te' ? 'selected' : ''}>Telugu</option>
                         <option value="th" ${savedTtsLang === 'th' ? 'selected' : ''}>Thai</option>
                         <option value="tr" ${savedTtsLang === 'tr' ? 'selected' : ''}>Turkish</option>
                         <option value="uk" ${savedTtsLang === 'uk' ? 'selected' : ''}>Ukrainian</option>
                         <option value="ur" ${savedTtsLang === 'ur' ? 'selected' : ''}>Urdu</option>
                         <option value="uz" ${savedTtsLang === 'uz' ? 'selected' : ''}>Uzbek</option>
                         <option value="vi" ${savedTtsLang === 'vi' ? 'selected' : ''}>Vietnamese</option>
                         <option value="cy" ${savedTtsLang === 'cy' ? 'selected' : ''}>Welsh</option>
                         <option value="xh" ${savedTtsLang === 'xh' ? 'selected' : ''}>Xhosa</option>
                         <option value="yi" ${savedTtsLang === 'yi' ? 'selected' : ''}>Yiddish</option>
                         <option value="yo" ${savedTtsLang === 'yo' ? 'selected' : ''}>Yoruba</option>
                         <option value="zu" ${savedTtsLang === 'zu' ? 'selected' : ''}>Zulu</option>                 
                        </select>
                    <small>Language used for text to speech pronunciation</small>
                </div>
            </div>
                </div>
            
        <div class="settings-section">
            <h3>Repetitions Default View</h3>
            <div class="settings-content">
                <div class="settings-group">
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="reps-default-view" value="browse" id="reps-view-browse" ${localStorage.getItem('reps_default_view') === 'browse' || !localStorage.getItem('reps_default_view') ? 'checked' : ''}>
                            <span>Browse flashcard</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="reps-default-view" value="add" id="reps-view-add" ${localStorage.getItem('reps_default_view') === 'add' ? 'checked' : ''}>
                            <span>Add Flashcard</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <h3 data-translate="syncSettings">Synchronization Settings</h3>
            <p class="settings-description" data-translate="syncDescription">Synchronization allows you to study on two devices.</p>
            <div class="settings-content">
                <div class="settings-group">
                    <label for="pushbullet-api-key" data-translate="pushbulletApiKey">Pushbullet API Key:</label>
                    <div class="api-key-input">
                        <input 
                            type="password" 
                            id="pushbullet-api-key" 
                            value="${currentApiKey}"
                            placeholder="Enter your Pushbullet API key"
                        >
                        <button type="button" class="toggle-password" onclick="togglePasswordVisibility(this)">
                            👁
                        </button>
                        <button type="button" class="remove-api-key" onclick="removeApiKey()">✕</button>
                    </div>
                    <div class="api-key-info">
                        <a href="https://www.pushbullet.com/#settings/account" 
                           target="_blank" 
                           data-translate="getApiKey">Get your API key</a>
                        <span style="margin-left: 5px;" data-translate="apiKeyLimit">(Free account: Limited to 500 pushes per month, which should be sufficient for daily synchronization of 100 reviewed flashcards)</span>
                    </div>
                </div>

                <div class="settings-group sync-settings">
                    <!-- Opcja Export to server z tooltipem -->
                    <div class="export-server-option">
                        <label class="checkbox-label" data-tooltip="${translations[currentLanguage].exportToServerTooltip}">
                            <input type="checkbox" id="export-to-server" ${exportToServer ? 'checked' : ''}>
                            <span data-translate="exportToServer">Enable Save button (useful if free 500 pushes is not enough)</span>
                        </label>
                    </div>

                    <!-- Dodajemy nową opcję Auto Save -->
                    <div class="auto-save-option">
                        <label class="checkbox-label">
                            <input type="checkbox" id="enable-auto-save" ${enableAutoSave ? 'checked' : ''}>
                            <span data-translate="enableAutoSave">Enable Auto Save during Sync</span>
                        </label>
                    </div>

                    <!-- Opcja Enable sync check -->
                    <div class="sync-check-option">
                        <label class="checkbox-label">
                            <input type="checkbox" id="enable-sync-check" ${enableSyncCheck ? 'checked' : ''}>
                            <span data-translate="enableSyncCheck">Enable sync check on start</span>
                        </label>
                    </div>

                    <!-- Dodajemy nową opcję Enable Sync after Review -->
                    <div class="sync-after-review-option">
                        <label class="checkbox-label">
                            <input type="checkbox" id="enable-sync-after-review" ${enableSyncAfterReview ? 'checked' : ''}>
                            <span data-translate="enableSyncAfterReview">Enable Sync after Review</span>
                        </label>
                    </div>

                    <!-- Pozostałe opcje -->
                    <div class="auto-sync-option">
                        <label class="checkbox-label">
                            <input type="checkbox" id="auto-sync" ${autoSync ? 'checked' : ''}>
                            <span data-translate="enableAutoSync">Enable automatic synchronization</span>
                        </label>
                    </div>
                    
                    <div class="sync-interval-option ${!autoSync ? 'disabled' : ''}">
                        <label for="sync-interval" data-translate="syncInterval">Sync interval (minutes):</label>
                        <select id="sync-interval" ${!autoSync ? 'disabled' : ''}>
                            <option value="5" ${syncInterval === '5' ? 'selected' : ''}>5</option>
                            <option value="10" ${syncInterval === '10' ? 'selected' : ''}>10</option>
                            <option value="15" ${syncInterval === '15' ? 'selected' : ''}>15</option>
                            <option value="30" ${syncInterval === '30' ? 'selected' : ''}>30</option>
                            <option value="60" ${syncInterval === '60' ? 'selected' : ''}>60</option>
                        </select>
                    </div>

                    <div class="inactivity-timeout-option">
                        <label for="inactivity-timeout" data-translate="inactivityTimeout">Stop sync after inactivity (minutes):</label>
                        <select id="inactivity-timeout">
                            <option value="5" ${inactivityTimeout === '5' ? 'selected' : ''}>5</option>
                            <option value="10" ${inactivityTimeout === '10' ? 'selected' : ''}>10</option>
                            <option value="15" ${inactivityTimeout === '15' ? 'selected' : ''}>15</option>
                            <option value="30" ${inactivityTimeout === '30' ? 'selected' : ''}>30</option>
                            <option value="60" ${inactivityTimeout === '60' ? 'selected' : ''}>60</option>
                        </select>
                    </div>

                    <div class="delete-notes-option">
                        <button type="button" class="delete-notes-button" onclick="handleDeleteNotes()">
                            <span data-translate="deleteAllNotes">Delete All Sync Notes</span>
                        </button>
                        <div class="delete-notes-info">
                            <span data-translate="deleteNotesWarning">Warning: This will delete all synchronization notes from Pushbullet</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-section">
          <!--  <h3 data-translate="generalSettings">General Settings</h3>
            <div class="settings-content">
                <!-- Przyszłe opcje ustawień 
            </div> -->
        </div>

        <div class="settings-footer">
            <button class="settings-save" data-translate="save">Save</button>
            <button class="settings-cancel" data-translate="cancel">Cancel</button>
        </div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';

    document.body.appendChild(overlay);
    document.body.appendChild(settingsDialog);

    // Obsługa zmiany stanu auto-sync
    const autoSyncCheckbox = settingsDialog.querySelector('#auto-sync');
    const syncIntervalSelect = settingsDialog.querySelector('#sync-interval');
    const syncIntervalOption = settingsDialog.querySelector('.sync-interval-option');

    autoSyncCheckbox.addEventListener('change', function() {
        syncIntervalSelect.disabled = !this.checked;
        syncIntervalOption.classList.toggle('disabled', !this.checked);
    });

    // Obsługa przycisków
    const saveButton = settingsDialog.querySelector('.settings-save');
    const cancelButton = settingsDialog.querySelector('.settings-cancel');

    // Funkcja do zapisywania ustawień
    async function saveSettings() {
        const newApiKey = document.getElementById('pushbullet-api-key').value.trim();
        const newAutoSync = document.getElementById('auto-sync').checked;
        const newSyncInterval = document.getElementById('sync-interval').value;
        const newInactivityTimeout = document.getElementById('inactivity-timeout').value;
        const newEnableSyncCheck = document.getElementById('enable-sync-check').checked;
        const newExportToServer = document.getElementById('export-to-server').checked;
        const newEnableAutoSave = document.getElementById('enable-auto-save').checked;
        const newEnableSyncAfterReview = document.getElementById('enable-sync-after-review').checked;
        const newRepsDefaultView = document.querySelector('input[name="reps-default-view"]:checked').value;
        
        if (newApiKey !== currentApiKey) {
            try {
                const isValid = await initPushbullet(newApiKey);
                if (isValid) {
                    showNotification(translations[currentLanguage].apiKeySaved || 'API key saved successfully', 'success');
                } else {
                    showNotification(translations[currentLanguage].invalidApiKey || 'Invalid API key', 'error');
                    return false;
                }
            } catch (error) {
                showNotification(translations[currentLanguage].apiKeyError || 'Error saving API key', 'error');
                return false;
            }
        }

        // Zapisz ustawienia
        localStorage.setItem('auto_sync', newAutoSync);
        localStorage.setItem('sync_interval', newSyncInterval);
        localStorage.setItem('inactivity_timeout', newInactivityTimeout);
        localStorage.setItem('enable_sync_check', newEnableSyncCheck);
        localStorage.setItem('export_to_server', newExportToServer);
        localStorage.setItem('enable_auto_save', newEnableAutoSave);
        localStorage.setItem('enable_sync_after_review', newEnableSyncAfterReview);
        localStorage.setItem('reps_default_view', newRepsDefaultView);

            // Zapisz template promptu
        const promptTemplate = document.getElementById('exampleButtonPrompt').value;
        localStorage.setItem('exampleButtonPrompt', promptTemplate);

        // Zapisz DictAI prompt
        const dictAiPrompt = document.getElementById('dictAiPrompt').value;
        localStorage.setItem('dictAiPrompt', dictAiPrompt);

        // Zapisz Groq API key
        const groqApiKey = document.getElementById('groq-api-key').value;
        localStorage.setItem('groq_api_key', groqApiKey);

        const ttsLangValue = document.getElementById('ttsLanguage').value;
    
        localStorage.setItem('ttsLanguage', ttsLangValue);

        if (newAutoSync) {
            setupAutomaticSync(parseInt(newSyncInterval) * 60 * 1000);
            showNotification(translations[currentLanguage].autoSyncEnabled || 'Automatic sync enabled', 'success');
        } else {
            clearAutomaticSync();
           // showNotification(translations[currentLanguage].autoSyncDisabled || 'Automatic sync disabled', 'info');
        }
        
        updateSaveButtonVisibility();
        return true;
    }

    // Obsługa kliknięcia na overlay
    overlay.addEventListener('click', async () => {
        if (await saveSettings()) {
            closeMainSettings();
        }
    });

    // Obsługa przycisku Save
    saveButton.addEventListener('click', async () => {
        if (await saveSettings()) {
            closeMainSettings();
        }
    });

    cancelButton.addEventListener('click', closeMainSettings);
    overlay.addEventListener('click', closeMainSettings);

    // Przetłumacz teksty
    changeLanguage();
}

// Funkcja zamykająca okno ustawień
function closeMainSettings() {
    const dialog = document.querySelector('.main-settings-dialog');
    const overlay = document.querySelector('.settings-overlay');
    
    if (dialog) dialog.remove();
    if (overlay) overlay.remove();
}

// Dodaj event listener do przycisku ustawień
document.addEventListener('DOMContentLoaded', () => {
    const settingsButton = document.getElementById('main-settings');
    if (settingsButton) {
        settingsButton.addEventListener('click', openMainSettings);
    }
});

// Funkcja do przełączania widoczności hasła
function togglePasswordVisibility(button) {
    const input = button.parentElement.querySelector('input');
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🔒';
    } else {
        input.type = 'password';
        button.textContent = '👁';
    }
}

// Funkcja do usuwania wszystkich notatek
async function handleDeleteNotes() {
    const deleteButton = document.querySelector('.delete-notes-button');
    if (!deleteButton) return;

    const originalContent = deleteButton.innerHTML;

    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-dialog';
    confirmDialog.innerHTML = `
        <div class="confirm-content">
            <h3 data-translate="confirmDelete">Confirm Deletion</h3>
            <p data-translate="confirmDeleteMessage">Are you sure you want to delete all synchronization notes? This action cannot be undone.</p>
            <div class="confirm-buttons">
                <button class="confirm-yes" data-translate="yes">Yes, delete all</button>
                <button class="confirm-no" data-translate="no2">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmDialog);
    changeLanguage();

    try {
        const confirmed = await new Promise((resolve) => {
            const yesButton = confirmDialog.querySelector('.confirm-yes');
            const noButton = confirmDialog.querySelector('.confirm-no');

            yesButton.addEventListener('click', () => {
                confirmDialog.remove();
                resolve(true);
            });

            noButton.addEventListener('click', () => {
                confirmDialog.remove();
                resolve(false);
            });

            confirmDialog.addEventListener('click', (e) => {
                if (e.target === confirmDialog) {
                    confirmDialog.remove();
                    resolve(false);
                }
            });
        });

        if (!confirmed) return;

        deleteButton.innerHTML = `
            <span class="loading-icon">↻</span>
            <span data-translate="deletingNotes">Deleting notes: 0/0</span>
        `;
        deleteButton.classList.add('deleting');
        deleteButton.disabled = true;

        const result = await window.deleteAllPushbulletNotes((deletedCount, skippedCount, totalNotes) => {
            deleteButton.innerHTML = `
                <span class="loading-icon">↻</span>
                <span data-translate="deletingNotes">Deleting notes: ${deletedCount + skippedCount}/${totalNotes}</span>
                <span class="delete-progress">(${Math.round(((deletedCount + skippedCount) / totalNotes) * 100)}%)</span>
            `;
        });

        const message = `Processed ${result.totalNotes} notes: ${result.deletedCount} deleted, ${result.skippedCount} skipped, ${result.errorCount} errors`;
        showNotification(message, result.errorCount > 0 ? 'warning' : 'success');

    } catch (error) {
        console.error('Error during deletion:', error);
        showNotification(translations[currentLanguage].deleteError || 'Error deleting notes', 'error');
    } finally {
        if (deleteButton) {
            deleteButton.innerHTML = originalContent;
            deleteButton.classList.remove('deleting');
            deleteButton.disabled = false;
        }
    }
}

// Funkcja do usuwania klucza API
function removeApiKey() {
    if (confirm(translations[currentLanguage].confirmRemoveKey || 'Are you sure you want to remove the API key?')) {
        localStorage.removeItem('pushbullet_api_key');
        localStorage.removeItem('last_sync_time');
        document.getElementById('pushbullet-api-key').value = '';
        showNotification(translations[currentLanguage].apiKeyRemoved || 'API key has been removed', 'success');
        
        // Wyłącz automatyczną synchronizację
        localStorage.setItem('auto_sync', 'false');
        clearAutomaticSync();
        
        // Odśwież widok ustawień
        closeMainSettings();
        openMainSettings();
    }
}

// Funkcja do przełączania widoczności hasła Groq API key
function toggleGroqPasswordVisibility(button) {
    const input = button.parentElement.querySelector('input');
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🔒';
    } else {
        input.type = 'password';
        button.textContent = '👁';
    }
}

// Funkcja do usuwania Groq API key
function removeGroqApiKey() {
    if (confirm('Are you sure you want to remove the Groq API key?')) {
        localStorage.removeItem('groq_api_key');
        document.getElementById('groq-api-key').value = '';
        showNotification('Groq API key has been removed', 'success');
    }
}

// Dodaj funkcję do aktualizacji widoczności przycisku Save
function updateSaveButtonVisibility() {
    const saveButton = document.getElementById('save-button');
    const exportToServer = localStorage.getItem('export_to_server') === 'true';
    
    if (saveButton) {
        saveButton.classList.toggle('show', exportToServer);
    }
}

// Dodaj funkcję obsługi przycisku Save
// Funkcja obsługi przycisku Save
async function handleSave() {
    const saveButton = document.getElementById('save-button');
    const saveLinkContainer = document.getElementById('save-link');
    const exportToServer = localStorage.getItem('export_to_server') === 'true';
    
    if (!saveButton || !saveLinkContainer || !exportToServer) return;

    try {
        saveLinkContainer.style.display = 'none';
        saveLinkContainer.innerHTML = '';

        saveButton.classList.add('syncing');
        saveButton.querySelector('[data-translate="save"]').textContent = 
            translations[currentLanguage].savingInProgress || 'Saving...';

        console.log('Starting save process...');
        const result = await sendExportToPushbullet();
        console.log('Save result:', result);

        if (result && result.file_url) {
            console.log('Creating download link for:', result.file_url);
            // Wyciągamy nazwę pliku z URL
            const fileName = result.file_name || result.file_url.split('/').pop();
            saveLinkContainer.innerHTML = `
                <a href="${result.file_url}" target="_blank">
                    Download ${fileName}
                </a>
            `;
            saveLinkContainer.style.display = 'block';
        } else {
            console.log('No file URL in result:', result);
        }

        showNotification(translations[currentLanguage].saveSuccess || 'Flashcards saved successfully', 'success');
    } catch (error) {
        console.error('Save failed:', error);
        showNotification(translations[currentLanguage].saveError || 'Error saving flashcards', 'error');
    } finally {
        saveButton.classList.remove('syncing');
        saveButton.querySelector('[data-translate="save"]').textContent = 
            translations[currentLanguage].save || 'Save';
    }
}



// Eksportujemy funkcje
window.sendExportToPushbullet = sendExportToPushbullet;
window.initSyncCheck = initSyncCheck;

// Dodaj na początku pliku
let isDarkMode = false;

// Dodaj funkcję do przełączania trybu
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    //localStorage.setItem('darkMode', isDarkMode);
    
    // Zmień ikonę na czarno-białą
    const darkModeIcon = document.querySelector('.dark-mode-icon');
    darkModeIcon.textContent = isDarkMode ? '☼' : '☽';
    
    // Aktualizuj wykresy jeśli istnieją
    if (typeof drawLearningProgressChart === 'function') {
        drawLearningProgressChart();
    }

    // Aktualizuj style dla wszystkich wykresów
    const charts = ['#leitnerBoxesChart', '#superMemoChart', '#superMemoIntervalsChart'];
    charts.forEach(chartId => {
        const chart = document.querySelector(chartId);
        if (chart) {
           // chart.style.backgroundColor = isDarkMode ? '#919191' : '#f8f9fa';
          //  chart.color = isDarkMode ? '#e0e0e0;' : '#e0e0e0';
           // chart.style.boxShadow = isDarkMode ? '#919191' : '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
    });

    updateStats();
}



// Dodaj tłumaczenia do translations.js
translations.en.darkModeTooltip = "Toggle dark mode";
translations.pl.darkModeTooltip = "Przełącz tryb ciemny";

// W sekcji tłumaczeń
translations.en.noDictionaryAvailable = "No dictionary available";
translations.pl.noDictionaryAvailable = "Słownik nie jest dostępny";

// Dodaj funkcje pomocnicze
function hideDictionary() {
    const dictionaryFrame = document.getElementById('dictionary-frame');
    if (dictionaryFrame) {
        dictionaryFrame.classList.remove('show');
    }
}

// Modyfikacja funkcji changeDictionary
function repsChangeDictionary() {
    const repsSelect = document.getElementById('reps-dictionary-select');
    const repsIframe = document.querySelector('.reps-dictionary-frame-mobile');
    const repsCheckbox = document.getElementById('reps-dictionary-default-checkbox');
    const repsIndicator = repsCheckbox.parentElement.querySelector('.reps-default-indicator');
    
    if (repsSelect.value === 'add_new') {
        addNewDictionary();
    } else if (repsSelect.value === 'remove_dictionary') {
        removeDictionary();
    } else {
        // Dodaj parametr dark=1 do URL jeśli tryb ciemny jest aktywny
        const isDarkMode = document.body.classList.contains('dark-mode');
        const urlWithDarkMode = isDarkMode ? 
            `${repsSelect.value}${repsSelect.value.includes('?') ? '&' : '?'}dark=1` : 
            repsSelect.value;
            
        repsAddNewTab();
        
        const defaultDictionary = localStorage.getItem('defaultDictionary');
        repsCheckbox.checked = (defaultDictionary === repsSelect.value);
        
        if (repsIndicator) {
            repsIndicator.textContent = (defaultDictionary === repsSelect.value) ? '' : '';
        }
    }
}

function setDefaultDictionary() {
    const repsCheckbox = document.getElementById('reps-dictionary-default-checkbox');
    const repsSelect = document.getElementById('reps-dictionary-select');
    const repsIndicator = repsCheckbox.parentElement.querySelector('.reps-default-indicator');
    
    if (repsCheckbox && repsSelect) {
        if (repsCheckbox.checked) {
            localStorage.setItem('defaultDictionary', repsSelect.value);
            if (repsIndicator) {
                repsIndicator.textContent = '';
            }
        } else {
            localStorage.removeItem('defaultDictionary');
            if (repsIndicator) {
                repsIndicator.textContent = '';
            }
        }
    }
}

// Modyfikujemy funkcję hideDictionary
function hideDictionary() {
    const dictionaryFrame = document.getElementById('dictionary-frame');
    const dictionaryContainer = document.getElementById('dictionary-container');
    
    if (dictionaryContainer) {
        dictionaryContainer.classList.remove('show');
        // Nie usuwamy iframe'ów, tylko ukrywamy kontener
    } else if (dictionaryFrame) {
        dictionaryFrame.classList.remove('show');
    }
}

// Dodaj funkcje do obsługi dodawania i usuwania słowników
function addNewDictionary() {
    // Tworzymy okno dialogowe
    const dialog = document.createElement('dialog');
    dialog.innerHTML = `
        <h3>Add new dictionary</h3>
        <div>
            <label for="reps-dictionary-name">Dictionary name:</label>
            <input type="text" id="reps-dictionary-name" placeholder="Enter dictionary name">
        </div>
        <div>
            <label for="reps-dictionary-url">Dictionary URL:</label>
            <input type="text" id="reps-dictionary-url" placeholder="Enter URL (without https://)">
        </div>
        <div>
            <button id="reps-add-confirm">Add</button>
            <button id="reps-add-cancel">Cancel</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector('#reps-add-confirm').addEventListener('click', () => {
        const name = dialog.querySelector('#reps-dictionary-name').value;
        let url = dialog.querySelector('#reps-dictionary-url').value;
        
        if (name && url) {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            // Zapisz do localStorage
            const dictionaries = JSON.parse(localStorage.getItem('customDictionaries') || '[]');
            dictionaries.push({ name, url });
            localStorage.setItem('customDictionaries', JSON.stringify(dictionaries));
            
            // Przebuduj dropdown używając getAllDictionaries()
            const repsSelect = document.getElementById('reps-dictionary-select');
            const allDictionaries = getAllDictionaries();
            const dictionaryOptions = allDictionaries.map(dict => `
                <option value="${dict.url}" ${dict.url === url ? 'selected' : ''}>
                    ${dict.name}
                </option>
            `).join('');
            
            repsSelect.innerHTML = `
                ${dictionaryOptions}
                <option value="add_new">Add new</option>
                <option value="remove_dictionary">Remove dictionary</option>
            `;
            
            repsSelect.value = url;
            repsChangeDictionary();
        }
        
        dialog.close();
        dialog.remove();
    });

    dialog.querySelector('#reps-add-cancel').addEventListener('click', () => {
        dialog.close();
        dialog.remove();
    });

    const repsSelect = document.getElementById('reps-dictionary-select');
    if (repsSelect.value === 'add_new') {
        repsSelect.value = repsSelect.querySelector('option:not([value="add_new"]):not([value="remove_dictionary"])').value;
    }
    repsChangeDictionary();
}

function removeDictionary() {
    const repsSelect = document.getElementById('reps-dictionary-select');
    
    // Tworzymy okno dialogowe
    const dialog = document.createElement('dialog');
    dialog.innerHTML = `
        <h3>Select a dictionary to remove</h3>
        <select id="reps-dictionary-to-remove">
            ${Array.from(repsSelect.options)
                .filter(option => !['add_new', 'remove_dictionary'].includes(option.value))
                .map(option => `<option value="${option.value}">${option.text}</option>`)
                .join('')}
        </select>
        <div>
            <button id="reps-confirm-remove">Remove</button>
            <button id="reps-cancel-remove">Cancel</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector('#reps-confirm-remove').addEventListener('click', () => {
        const selectToRemove = dialog.querySelector('#reps-dictionary-to-remove');
        const dictionaryToRemove = selectToRemove.options[selectToRemove.selectedIndex].text;
        const optionToRemove = Array.from(repsSelect.options).find(option => option.text === dictionaryToRemove);
        
        if (optionToRemove) {
            // Usuń z localStorage
            const dictionaries = JSON.parse(localStorage.getItem('customDictionaries') || '[]');
            const updatedDictionaries = dictionaries.filter(dict => dict.name !== dictionaryToRemove);
            localStorage.setItem('customDictionaries', JSON.stringify(updatedDictionaries));
            
            // Sprawdź czy to był defaultowy słownik
            if (localStorage.getItem('defaultDictionary') === optionToRemove.value) {
                localStorage.removeItem('defaultDictionary');
                document.getElementById('reps-dictionary-default-checkbox').checked = false;
            }
            
            // Przebuduj dropdown używając getAllDictionaries()
            const allDictionaries = getAllDictionaries();
            const defaultDictionary = localStorage.getItem('defaultDictionary');
            const dictionaryOptions = allDictionaries.map(dict => `
                <option value="${dict.url}" ${defaultDictionary === dict.url ? 'selected' : ''}>
                    ${dict.name}
                </option>
            `).join('');
            
            repsSelect.innerHTML = `
                ${dictionaryOptions}
                <option value="add_new">Add new</option>
                <option value="remove_dictionary">Remove dictionary</option>
            `;
            
            // Ustaw na pierwszy dostępny słownik jeśli usunięto aktualnie wybrany
            if (repsSelect.value === '' || repsSelect.value === 'add_new' || repsSelect.value === 'remove_dictionary') {
                repsSelect.value = repsSelect.querySelector('option:not([value="add_new"]):not([value="remove_dictionary"])').value;
            }
            
            repsChangeDictionary();
            alert(`Dictionary "${dictionaryToRemove}" has been removed.`);
        }
        
        dialog.close();
        dialog.remove();
    });

    dialog.querySelector('#reps-cancel-remove').addEventListener('click', () => {
        dialog.close();
        dialog.remove();
    });

    repsSelect.value = repsSelect.querySelector('option:not([value="add_new"]):not([value="remove_dictionary"])').value;
    repsChangeDictionary();
}

// Dodaj nową funkcję do edycji fiszki podczas powtórki
function editFlashcardDuringReview(id) {
    pauseRoundTimer(); // Pause the round timer when entering edit mode
    const flashcard = flashcards.find(f => f.id === id);
    if (flashcard) {

    const editForm = document.createElement('div');
    editForm.className = 'section edit-form';

    editForm.id = 'edit';
    editForm.innerHTML = `
        <h2 data-translate="editFlashcard">Edit Flashcard</h2>
        <form id="editFlashcardForm" style="display: flex; flex-direction: column; gap: 10px;">
            <div class="word-container" style="display: flex; align-items: flex-start; gap: 0px; width: 100%;">
                <textarea id="editWord" data-placeholder="wordPhrase" required style="flex: 1;">${flashcard.word}</textarea>
                <button type="button" class="speaker-button" onclick="speakWord('editWord')" style="background: none; border: none; cursor: pointer; padding: 8px 0 0 0; margin-right: -12px;">
                    <svg width="23" height="23" viewBox="0 0 24 24" fill="#333333">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                </button>
            </div>
            <div class="context-container" style="display: flex; align-items: flex-start; gap: 0px; width: 100%;">
                <textarea id="editContext" data-placeholder="contextExample" style="flex: 1;">${flashcard.context || ''}</textarea>
                <button type="button" class="speaker-button" onclick="speakWord('editContext')" style="background: none; border: none; cursor: pointer; padding: 8px 0 0 0; margin-right: -12px;">
                    <svg width="23" height="23" viewBox="0 0 24 24" fill="#333333">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                </button>
            </div>
            <div class="examples-button-container">
                <button type="button" class="show-examples-button" onclick="showExamples('${flashcard.word}')">
                    <small data-translate="showExamples">Show examples</small>
                </button>
            </div>
            <div class="context-container2" style="display: flex; align-items: flex-start; gap: 0px;  margin-right: 15px;">
            <textarea id="editTranslation" data-placeholder="translation" required>${flashcard.translation}</textarea>
            </div>
            <div class="url-inputs" style="display: flex; flex-direction: column; gap: 0px;margin-right: 35px;">
                <input type="text" id="editMediaUrl" data-placeholder="imageLink" value="${flashcard.mediaUrl || ''}" style="width: 100%;">
                <input type="text" id="editAudioUrl" data-placeholder="audioLink" value="${flashcard.audioUrl || ''}" style="width: 100%;">
            </div>
            <div class="button-group">
                <button type="button" onclick="cancelEditDuringReview()" data-translate="cancel">Cancel</button>
                <button type="submit" data-translate="save">Save</button>
            </div>
        </form>
    `;

    // Funkcja do odtwarzania tekstu
    window.speakWord = function(textareaId) {
        const TtsLang = localStorage.getItem('ttsLanguage') || 'en';
        const text = document.getElementById(textareaId).value;
        const encodedText = encodeURIComponent(text);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${TtsLang}&client=tw-ob`;
        
        const audio = new Audio(url);
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    };

    // Reszta kodu pozostaje bez zmian...
    editForm.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        updateFlashcardDuringReview(id, {
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

    adjustTextareaHeight('editWord', flashcard.word);
    adjustTextareaHeight('editContext', flashcard.context);
    adjustTextareaHeight('editTranslation', flashcard.translation);

    changeLanguage();
    }
}

// Funkcja do aktualizacji fiszki podczas powtórki
function updateFlashcardDuringReview(id, updatedData) {
    const index = flashcards.findIndex(f => f.id === id);
    if (index !== -1) {
        updatedData.lastModified = new Date().toISOString();
        flashcards[index] = { ...flashcards[index], ...updatedData };
        saveFlashcards();
        
        // Aktualizuj również fiszkę w tablicy flashcardsToReview
        const reviewIndex = flashcardsToReview.findIndex(f => f.id === id);
        if (reviewIndex !== -1) {
            flashcardsToReview[reviewIndex] = { ...flashcardsToReview[reviewIndex], ...updatedData };
        }

        showSection('review');
        showNextFlashcard(); // Pokaż ponownie aktualną fiszkę
        resumeRoundTimer(); // Resume the round timer when returning to review
        changeLanguage();
    }
}

// Funkcja do anulowania edycji podczas powtórki
function cancelEditDuringReview() {
    showSection('review');
    showNextFlashcard(); // Pokaż ponownie aktualną fiszkę
    resumeRoundTimer(); // Resume the round timer when returning to review
    changeLanguage();
}

// Funkcja pomocnicza do pobierania wszystkich słowników
function getAllDictionaries() {
    const customDictionaries = JSON.parse(localStorage.getItem('customDictionaries') || '[]');
    const dictAiPrompt = localStorage.getItem('dictAiPrompt') || 'You are an English teacher. Give me the meaning of the word in the next prompt. Just ask about the word. Explain in different words and provide me 3 example sentences with this word.';
    return [
        { name: 'Wiktionary', url: 'https://wiktionary.org' },
        { name: 'DictAI', url: 'chat.html?q=' + encodeURIComponent(dictAiPrompt) },
        ...customDictionaries
    ];
}

// Dodaj nową funkcję do obsługi przycisku Show me examples
function showExamples(word) {
    // Najpierw wywołujemy funkcjonalność przycisku Dictionary
    const toggleDictionaryBtn = document.getElementById('toggle-dictionary');
    if (toggleDictionaryBtn) {
        toggleDictionaryBtn.click(); // Symulujemy kliknięcie przycisku Dictionary
        
        setTimeout(() => {
            // Pobierz zapisany prompt lub użyj domyślnego
            const promptTemplate = localStorage.getItem('exampleButtonPrompt') || 'You are an English teacher. Give me the meaning of the word in the next prompt. Just ask about the word. Explain in different words and provide me 3 example sentences with this word. Word: {word}';
            const prompt = promptTemplate.replace('{word}', word);
            const encodedPrompt = encodeURIComponent(prompt);
            const url = `chat.html?q=${encodedPrompt}`;

            // Sprawdź, czy już istnieje zakładka Examples dla tego słowa
            const existingExamplesTab = repsTabs.find(tab => tab.name === `Examples: ${word}`);
            
            if (existingExamplesTab) {
                // Jeśli zakładka już istnieje, po prostu przełącz na nią
                repsSwitchToTab(existingExamplesTab.id);
            } else {
                // Utwórz nową zakładkę Examples
                const newTab = {
                    id: Date.now(),
                    name: `Examples: ${word}`,
                    url: url,
                    active: true
                };
                
                // Usuń status aktywny z innych zakładek
                repsTabs.forEach(tab => tab.active = false);
                
                // Dodaj nową zakładkę na początku tablicy (będzie pierwsza po lewej)
                repsTabs.unshift(newTab);
                
                repsRenderTabs();
                repsCreateIframe(newTab);
                repsSwitchToTab(newTab.id);
            }
            
            // Na urządzeniach mobilnych (poniżej 520px) przewiń do widoku słownika
            if (window.innerWidth <= 520) {
                setTimeout(() => {
                    const dictionaryContainer = document.querySelector('.reps-dictionary-container');
                    if (dictionaryContainer) {
                        dictionaryContainer.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                }, 300); // Krótkie opóźnienie żeby słownik zdążył się otworzyć
            }
        }, 100); // Krótkie opóźnienie, żeby słownik zdążył się otworzyć
    }
}

// Dictionary tabs functionality
function repsAddNewTab() {
    const dictionarySelect = document.getElementById('reps-dictionary-select');
    const selectedDictionary = dictionarySelect.value;
    const dictionaryName = dictionarySelect.options[dictionarySelect.selectedIndex].text;
    
    // Skip if it's add_new or remove_dictionary
    if (selectedDictionary === 'add_new' || selectedDictionary === 'remove_dictionary') {
        return;
    }
    
    // Remove "No dictionary selected" message
    const iframeContainer = document.getElementById('reps-iframe-container');
    if (iframeContainer.innerHTML.includes('No dictionary selected')) {
        iframeContainer.innerHTML = '';
    }
    
    const newTab = {
        id: Date.now(),
        name: dictionaryName,
        url: selectedDictionary
    };
    
    repsTabs.push(newTab);
    repsRenderTabs();
    repsCreateIframe(newTab);
    repsSwitchToTab(newTab.id);
}

function repsCreateIframe(tab) {
    const iframeContainer = document.getElementById('reps-iframe-container');
    const iframe = document.createElement('iframe');
    iframe.src = tab.url;
    iframe.id = `reps-iframe-${tab.id}`;
    iframe.className = 'reps-dictionary-frame-mobile';
    iframe.style.display = 'none';
    iframeContainer.appendChild(iframe);
}

function repsSwitchToTab(tabId) {
    const tab = repsTabs.find(t => t.id === tabId);
    if (!tab) return;
    
    // Aktualizuj stan w tablicy
    repsTabs.forEach(t => t.active = (t.id === tabId));
    
    const iframeContainer = document.getElementById('reps-iframe-container');
    const iframes = iframeContainer.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        iframe.style.display = 'none';
    });
    
    const activeIframe = document.getElementById(`reps-iframe-${tabId}`);
    if (activeIframe) {
        activeIframe.style.display = 'block';
    }
    
    // Odśwież zakładki żeby pokazać aktywną
    repsRenderTabs();
}

function repsRenderTabs() {
    const tabsContainer = document.getElementById('reps-tabs');
    if (!tabsContainer) return;
    
    // Zachowaj przycisk + jeśli istnieje
    const addButton = document.getElementById('reps-add-tab');
    
    // Wyczyść kontener
    tabsContainer.innerHTML = '';
    
    // Dodaj wszystkie zakładki
    repsTabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = `reps-tab ${tab.active ? 'active' : ''}`;
        tabElement.setAttribute('data-id', tab.id);
        tabElement.onclick = () => repsSwitchToTab(tab.id);
        
        const tabText = document.createElement('span');
        tabText.textContent = tab.name;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.className = 'reps-close-tab';
        closeButton.onclick = (e) => {
            e.stopPropagation();
            repsCloseTab(tab.id);
        };
        
        tabElement.appendChild(tabText);
        tabElement.appendChild(closeButton);
        tabsContainer.appendChild(tabElement);
    });
    
    // Dodaj przycisk + na końcu po wszystkich zakładkach
    if (addButton) {
        tabsContainer.appendChild(addButton);
    } else {
        // Jeśli przycisk nie istnieje, utwórz go
        const newAddButton = document.createElement('button');
        newAddButton.id = 'reps-add-tab';
        newAddButton.textContent = '+';
        newAddButton.onclick = () => window.repsAddNewTabFromButton();
        tabsContainer.appendChild(newAddButton);
    }
}

function repsCloseTab(tabId) {
    const tabIndex = repsTabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    // Remove tab from array
    repsTabs.splice(tabIndex, 1);

    // Remove corresponding iframe
    const iframe = document.getElementById(`reps-iframe-${tabId}`);
    if (iframe) {
        iframe.remove();
    }

    // If closing active tab, switch to another
    const activeTab = document.querySelector('.reps-tab.active');
    if (activeTab && activeTab.getAttribute('data-id') == tabId) {
        if (repsTabs.length > 0) {
            repsSwitchToTab(repsTabs[0].id);
        } else {
            // If no more tabs, show empty message
            const iframeContainer = document.getElementById('reps-iframe-container');
            iframeContainer.innerHTML = '<p>No dictionary selected</p>';
        }
    }

    // Re-render tabs
    repsRenderTabs();
}

function repsInitializeFirstTab() {
    // Jeśli już mamy zakładki, nie twórz nowych - tylko przywróć istniejące
    if (repsTabs.length > 0) {
        repsRenderTabs();
        // Przywróć wszystkie iframe'y
        repsTabs.forEach(tab => {
            const existingIframe = document.getElementById(`reps-iframe-${tab.id}`);
            if (!existingIframe) {
                repsCreateIframe(tab);
            }
        });
        // Przełącz na pierwszą zakładkę
        repsSwitchToTab(repsTabs[0].id);
        return;
    }
    
    const defaultDictionary = localStorage.getItem('defaultDictionary');
    const dictionarySelect = document.getElementById('reps-dictionary-select');
    
    if (defaultDictionary && dictionarySelect) {
        dictionarySelect.value = defaultDictionary;
        const selectedOption = dictionarySelect.options[dictionarySelect.selectedIndex];
        
        if (selectedOption && selectedOption.value !== 'add_new' && selectedOption.value !== 'remove_dictionary') {
            // Remove "No dictionary selected" message
            const iframeContainer = document.getElementById('reps-iframe-container');
            if (iframeContainer && iframeContainer.innerHTML.includes('No dictionary selected')) {
                iframeContainer.innerHTML = '';
            }
            
            const firstTab = {
                id: Date.now(),
                name: selectedOption.text,
                url: defaultDictionary
            };
            
            repsTabs.push(firstTab);
            repsRenderTabs();
            repsCreateIframe(firstTab);
            repsSwitchToTab(firstTab.id);
        }
    }
}

// Function to add new tab from + button
window.repsAddNewTabFromButton = function repsAddNewTabFromButton() {
    const dictionarySelect = document.getElementById('reps-dictionary-select');
    if (!dictionarySelect) return;
    
    const selectedUrl = dictionarySelect.value;
    const selectedName = dictionarySelect.options[dictionarySelect.selectedIndex].text;
    
    // Skip if it's add_new or remove_dictionary
    if (selectedUrl === 'add_new' || selectedUrl === 'remove_dictionary') {
        return;
    }
    
    // Always create a new tab instance, even if dictionary already exists
    
    // Remove "No dictionary selected" message
    const iframeContainer = document.getElementById('reps-iframe-container');
    if (iframeContainer.innerHTML.includes('No dictionary selected')) {
        iframeContainer.innerHTML = '';
    }
    
    // Count existing tabs with the same dictionary to create unique names
    const existingCount = repsTabs.filter(tab => tab.url === selectedUrl).length;
    const tabName = existingCount > 0 ? `${selectedName} (${existingCount + 1})` : selectedName;
    
    const newTab = {
        id: Date.now(),
        name: tabName,
        url: selectedUrl
    };
    
    repsTabs.push(newTab);
    repsRenderTabs();
    repsCreateIframe(newTab);
    repsSwitchToTab(newTab.id);
}

// === Groq model settings dialog ===
function openGroqModelSettings() {
    if (document.getElementById('groq-model-settings-overlay')) return; // Prevent duplicates
    const savedModel = localStorage.getItem('groq_model') || 'meta-llama/llama-4-scout-17b-16e-instruct';
    const savedTemperature = localStorage.getItem('groq_temperature') || '0.1';
    const savedMaxTokens = localStorage.getItem('groq_max_tokens') || '8192';
    const savedTopP = localStorage.getItem('groq_top_p') || '1.0';

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.id = 'groq-model-settings-overlay';
    overlay.onclick = closeGroqModelSettings;

    const dialog = document.createElement('div');
    dialog.className = 'pushbullet-dialog groq-model-dialog';
    dialog.innerHTML = `
        <h3>Groq Model Settings</h3>
        <div class="form-group">
            <label>Model:</label>
            <select id="groq-model-select" style="width:100%; padding:8px; margin-bottom:8px;">
                <option value="meta-llama/llama-4-scout-17b-16e-instruct" ${savedModel === 'meta-llama/llama-4-scout-17b-16e-instruct' ? 'selected' : ''}>meta-llama/llama-4-scout-17b-16e-instruct</option>
                <option value="meta-llama/llama-4-maverick-17b-128e-instruct" ${savedModel === 'meta-llama/llama-4-maverick-17b-128e-instruct' ? 'selected' : ''}>meta-llama/llama-4-maverick-17b-128e-instruct</option>
                <option value="llama3-70b-8192" ${savedModel === 'llama3-70b-8192' ? 'selected' : ''}>llama3-70b-8192</option>
                <option value="llama-3.3-70b-versatile" ${savedModel === 'llama-3.3-70b-versatile' ? 'selected' : ''}>llama-3.3-70b-versatile</option>
                <option value="custom">Custom...</option>
            </select>
            <input type="text" id="groq-model-input" placeholder="Custom model name" style="width:100%; padding:8px; margin-bottom:8px;" value="${savedModel}">
        </div>
        <div class="form-group">
            <label>Temperature (0-1):</label>
            <input type="number" id="groq-temperature-input" min="0" max="1" step="0.05" style="width:100%; padding:8px; margin-bottom:8px;" value="${savedTemperature}">
        </div>
        <div class="form-group">
            <label>Top P (0-1):</label>
            <input type="number" id="groq-top-p-input" min="0" max="1" step="0.05" style="width:100%; padding:8px; margin-bottom:8px;" value="${savedTopP}">
        </div>
        <div class="form-group">
            <label>Max tokens (128 - 131072):</label>
            <input type="number" id="groq-max-tokens-input" min="128" max="131072" style="width:100%; padding:8px; margin-bottom:8px;" value="${savedMaxTokens}">
        </div>
        <div class="dialog-buttons">
            <button class="submit-button" id="groq-model-save-btn">Save</button>
            <button class="cancel-button" id="groq-model-cancel-btn">Cancel</button>
        </div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    const modelSelect = dialog.querySelector('#groq-model-select');
    const modelInput = dialog.querySelector('#groq-model-input');

    modelSelect.addEventListener('change', () => {
        if (modelSelect.value === 'custom') {
            modelInput.focus();
        } else {
            modelInput.value = modelSelect.value;
        }
    });

    dialog.querySelector('#groq-model-save-btn').addEventListener('click', () => {
        const model = modelInput.value.trim();
        const temperature = parseFloat(dialog.querySelector('#groq-temperature-input').value);
        const topP = parseFloat(dialog.querySelector('#groq-top-p-input').value);
        const maxTokens = parseInt(dialog.querySelector('#groq-max-tokens-input').value);

        if (model) localStorage.setItem('groq_model', model);
        if (!isNaN(temperature)) localStorage.setItem('groq_temperature', temperature.toString());
        if (!isNaN(topP)) localStorage.setItem('groq_top_p', topP.toString());
        if (!isNaN(maxTokens)) localStorage.setItem('groq_max_tokens', maxTokens.toString());

        showNotification('Groq model settings saved', 'success');
        closeGroqModelSettings();
    });

    dialog.querySelector('#groq-model-cancel-btn').addEventListener('click', closeGroqModelSettings);
}

function closeGroqModelSettings() {
    const dialog = document.querySelector('.groq-model-dialog');
    const overlay = document.getElementById('groq-model-settings-overlay');
    if (dialog) dialog.remove();
    if (overlay) overlay.remove();
}

// Dialog do ręcznego wklejenia danych ze schowka
function showPasteDialog() {
  const pasteDialog = document.createElement('div');
  pasteDialog.className = 'confirm-dialog paste-dialog';
  pasteDialog.innerHTML = `
    <div class="confirm-content">
      <h3 data-translate="importFromClipboard">Import from clipboard</h3>
      <p style="margin: 10px 0; color: #666; font-size: 14px;" data-translate="pasteInstructions">Paste copied CSV data in the field below:</p>
      <textarea id="pasteArea" data-placeholder="pasteDataHere" rows="8" style="width: 100%; margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px;"></textarea>
      <div class="confirm-buttons">
        <button class="confirm-yes" data-translate="importFromClipboard">Import</button>
        <button class="confirm-no" data-translate="cancel">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(pasteDialog);
  changeLanguage();

  // Set placeholder after changeLanguage
  const textarea = pasteDialog.querySelector('#pasteArea');
  textarea.placeholder = translations[currentLanguage].pasteDataHere || 'Paste CSV data here...';

  const importBtn = pasteDialog.querySelector('.confirm-yes');
  const cancelBtn = pasteDialog.querySelector('.confirm-no');

  // Automatycznie focus na textarea
  setTimeout(() => {
    textarea.focus();
    textarea.select();
  }, 100);

  importBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (text) {
      try {
        processImportText(text);
        showNotification(translations[currentLanguage].importedFromClipboard, 'success');
      } catch (error) {
        showNotification('Error processing data: ' + error.message, 'error');
      }
    } else {
      showNotification('Please paste CSV data first', 'error');
      return;
    }
    pasteDialog.remove();
  });

  cancelBtn.addEventListener('click', () => {
    pasteDialog.remove();
  });

  // Zamknij po kliknięciu tła
  pasteDialog.addEventListener('click', (e) => {
    if (e.target === pasteDialog) {
      pasteDialog.remove();
    }
  });
}




