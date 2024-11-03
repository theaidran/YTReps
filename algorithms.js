// Funkcje dla systemu Leitnera
function calculateLeitnerInterval(box) {
    const intervals = {
        1: 0,    // każdy dzień
        2: 3,    // co 3 dni
        3: 7,    // co 7 dni
        4: 14,   // co 14 dni
        5: 30   // co 30 dni
    };
    return intervals[box];
}

function initializeLeitnerFlashcard(flashcard) {
    if (!flashcard.leitnerBox && !flashcard.repetitions) {
        flashcard.leitnerBox = 1;
        flashcard.lastReviewed = null;
        flashcard.nextReview = null;
    }
    else if (flashcard.repetitions >=5) {
        flashcard.leitnerBox = 5;
    }
    else {
        flashcard.leitnerBox = flashcard.repetitions;
    }
    return flashcard;
}

function updateLeitnerBox(flashcard, wasCorrect) {
    if (wasCorrect) {
        // Przejście do następnego pudełka (max 5)
        flashcard.leitnerBox = Math.min(5, (flashcard.leitnerBox || 1) + 1);
        flashcard.repetitions++; // potentially to remove
    } else {
        // Powrót do pierwszego pudełka
        flashcard.leitnerBox = 1;
        flashcard.repetitions = 0; // potentially to remove
    }
    
    const interval = calculateLeitnerInterval(flashcard.leitnerBox);
    const now = new Date();
    flashcard.lastReviewed = now.toISOString();
    flashcard.nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000).toISOString();
    
    return flashcard;
}

// Funkcje dla standardowego algorytmu
function calculateNextInterval(flashcard, wasCorrect) {
    const difficultyFactors = {
        easy: 2.5,
        medium: 2.0,
        hard: 1.5,
        veryHard: 1.2 // for 4 butons grade this will not be used
    };

    if (!wasCorrect) {
        flashcard.streak = 0;
        flashcard.repetitions = 0; // potentially to remove
        return 0; // 0 dzień dla błędnej odpowiedzi
    }

    const factor = difficultyFactors[flashcard.difficulty] || 2.0; // domyślnie medium
    const interval = Math.ceil(Math.pow(factor, flashcard.streak));
    
    return Math.min(interval, 365); // maksymalnie rok
}

// Funkcje dla algorytmu SuperMemo
function calculateSuperMemoInterval(flashcard, grade) {
    if (!flashcard.easinessFactor) {
        flashcard.easinessFactor = 2.5;
    }
    if (!flashcard.repetitions) {
        flashcard.repetitions = 0;
    }
    if (!flashcard.interval ) {
        flashcard.interval = 0;
    }

    let interval;
    let repetitions = flashcard.repetitions;
    let easinessFactor = flashcard.easinessFactor;

    if (grade >= 3) {
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(flashcard.interval * easinessFactor);
        }
        repetitions++;
    } else {
        repetitions = 0;
        interval = 0;
    }

    // Oblicz nowy współczynnik łatwości (EF)  SuperMemo 2 changed to ANKI algo with 4 grade scale
    if (localStorage.getItem('gradeButtonMode') === 'four' && grade === 0)
       { 
        grade = 1; // in 4 scale, because button with grade 1 is hidden, so button with grade 0 changes to grade 1
       }
    grade = grade + 2 ; // 2-7 (4 buttons EF adj: -0.18, -0.02, 0.1, 0.18) or (for 6 buttons EF adj: -0.38,-0.18(unhidden), -0.02, 0.1, 0.18, 0.22(unhidden) )
    easinessFactor = easinessFactor + 0.1 - (5 - grade) * (0.1 + (5 - grade) * 0.02);
    easinessFactor = Math.max(1.3, easinessFactor); // EF nie może być mniejszy niż 1.3

    return {
        interval: Math.min(interval, 365), // Maksymalnie rok
        easinessFactor,
        repetitions
    };
}

// Funkcja do filtrowania fiszek do powtórki
function getFlashcardsForReview() {
    const now = new Date();
    return flashcards.filter(flashcard => {
        if (!flashcard.nextReview) return true;
        return new Date(flashcard.nextReview) <= now;
    });
}

// Funkcja do sprawdzania, czy fiszka powinna być powtórzona
function shouldReview(flashcard) {
    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
    const now = new Date();

    if (!flashcard.nextReview) return true;

    switch (algorithm) {
        case 'leitner':
            // Dla systemu Leitnera sprawdzamy nextReview
            return new Date(flashcard.nextReview) <= now;

        case 'supermemo':
            // Dla SuperMemo sprawdzamy nextReview i interval
            if (!flashcard.interval) return true;
            return new Date(flashcard.nextReview) <= now;

        case 'standard':
        default:
            // Dla standardowego algorytmu sprawdzamy nextReview i difficulty
            if (!flashcard.difficulty) {
                flashcard.difficulty = 'medium';
                return true;
            }
            return new Date(flashcard.nextReview) <= now;
    }
}

// Funkcja do filtrowania fiszek do powtórki
function getFlashcardsForReview() {
    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
    
    return flashcards.filter(flashcard => {
        // Inicjalizacja fiszki dla odpowiedniego algorytmu jeśli potrzebne
        if (algorithm === 'leitner' && !flashcard.leitnerBox) {
            initializeLeitnerFlashcard(flashcard);
        } else if (algorithm === 'supermemo' && !flashcard.easinessFactor) {
            flashcard.easinessFactor = 2.5;
            flashcard.interval = 0;
            flashcard.repetitions = 0;
        } else if (algorithm === 'standard' && !flashcard.difficulty) {
            flashcard.difficulty = 'medium';
            flashcard.streak = 0;
        }

        return shouldReview(flashcard);
    });
}
