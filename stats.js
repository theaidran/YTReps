// Funkcja do rysowania wykresu dla systemu Leitnera
function drawLeitnerBoxesChart() {
    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
    if (algorithm !== 'leitner') return;

    let canvas = document.getElementById('leitnerBoxesChart');
    if (!canvas) {
        const statsSection = document.getElementById('stats');
        canvas = document.createElement('canvas');
        canvas.id = 'leitnerBoxesChart';
        canvas.width = 600;  // Zwiększamy szerokość z 300 na 600
        canvas.height = 200;
        statsSection.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Oblicz statystyki pudełek Leitnera
    const boxStats = {
        box1: 0, box2: 0, box3: 0, box4: 0, box5: 0
    };

    // Zliczanie fiszek w pudełkach
    flashcards.forEach(flashcard => {
        if (flashcard.leitnerBox) {
            boxStats[`box${flashcard.leitnerBox}`]++;
        } else {
            // Jeśli fiszka nie ma przypisanego pudełka, przypisz ją do pierwszego
            boxStats.box1++;
        }
    });

    // Kolory dla pudełek
    const boxColors = {
        box1: '#dc3545',  // czerwony
        box2: '#fd7e14',  // pomarańczowy
        box3: '#ffc107',  // żółty
        box4: '#28a745',  // zielony
        box5: '#17a2b8'   // niebieski
    };

    // Wyczyść canvas
    ctx.clearRect(0, 0, width, height);

    // Dodaj sprawdzenie trybu ciemnego przed ustawieniem koloru tekstu
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e0e0e0' : '#333';
    const backgroundColor = isDarkMode ? '#2d2d2d' : '#f8f9fa';

    // Ustaw tło
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Zmień kolor tekstu dla tytułu
    ctx.fillStyle = textColor;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    const total = Object.values(boxStats).reduce((a, b) => a + b, 0);
    ctx.fillText(`${translations[currentLanguage].leitnerBoxesStats || 'Leitner Boxes Statistics'} (Total: ${total})`, width / 2, 30);

    const barWidth = width / 8;  // Zmniejszamy z 6 na 8 aby zwiększyć odstępy
    const intervals = [1, 3, 7, 14, 30];

    // Funkcja do rysowania słupka
    function drawBar(x, count, color, label, interval) {
        const total = Object.values(boxStats).reduce((a, b) => a + b, 0);
        const barHeight = total > 0 ? (count / total) * (height - 120) : 0;
        const y = height - barHeight - 40;

        // Rysuj słupek
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 20, barHeight);

        // Zmień efekt 3D na cień w kolorze tła
        ctx.fillStyle = isDarkMode ? 'rgba(45, 45, 45, 0.3)' : 'rgba(248, 249, 250, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10, y - 10);
        ctx.lineTo(x + barWidth - 10, y - 10);
        ctx.lineTo(x + barWidth - 20, y);
        ctx.closePath();
        ctx.fill();

        // Dodaj etykietę
        ctx.fillStyle = textColor; // Zmieniony kolor tekstu
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Box ${label}`, x + (barWidth - 20) / 2, height - 20);
        ctx.fillText(`${interval} days`, x + (barWidth - 20) / 2, height - 5);

        // Dodaj liczbę fiszek
        ctx.fillStyle = textColor; // Zmieniony kolor tekstu
        ctx.font = 'bold 16px Arial';
        ctx.fillText(count, x + (barWidth - 20) / 2, y - 25);
    }

    // Rysuj słupki dla każdego pudełka z większymi odstępami
    Object.entries(boxStats).forEach(([box, count], index) => {
        drawBar(
            width / 6 + index * (barWidth + 30),  // Dodajemy +30 dla większego odstępu
            count,
            boxColors[box],
            index + 1,
            intervals[index]
        );
    });
}

// Dodaj funkcję do rysowania wykresu dla SuperMemo
function drawSuperMemoChart() {
    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
    if (algorithm !== 'supermemo') return;

    let canvas = document.getElementById('superMemoChart');
    if (!canvas) {
        const statsSection = document.getElementById('stats');
        canvas = document.createElement('canvas');
        canvas.id = 'superMemoChart';
        canvas.width = 600;  // Zwiększamy szerokość z 300 na 600
        canvas.height = 200;
        statsSection.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Przedziały EF
    const efRanges = {
        veryHard: { min: 1.3, max: 1.7, color: '#dc3545', count: 0 },  // czerwony
        hard: { min: 1.7, max: 2.1, color: '#fd7e14', count: 0 },      // pomarańczowy
        medium: { min: 2.1, max: 2.5, color: '#ffc107', count: 0 },    // żółty
        easy: { min: 2.5, max: 2.9, color: '#28a745', count: 0 },      // zielony
        veryEasy: { min: 2.9, max: 3.3, color: '#17a2b8', count: 0 }   // niebieski
    };

    // Zliczanie fiszek w przedziałach EF
    flashcards.forEach(flashcard => {
        if (flashcard.easinessFactor) {
            const ef = flashcard.easinessFactor;
            if (ef >= 1.3 && ef < 1.7) efRanges.veryHard.count++;
            else if (ef >= 1.7 && ef < 2.1) efRanges.hard.count++;
            else if (ef >= 2.1 && ef < 2.5) efRanges.medium.count++;
            else if (ef >= 2.5 && ef < 2.9) efRanges.easy.count++;
            else if (ef >= 2.9) efRanges.veryEasy.count++;
        }
    });

    // Wyczyść canvas
    ctx.clearRect(0, 0, width, height);

    // Dodaj sprawdzenie trybu ciemnego przed ustawieniem koloru tekstu
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e0e0e0' : '#333';
    const backgroundColor = isDarkMode ? '#2d2d2d' : '#f8f9fa';

    // Ustaw tło
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Oblicz całkowitą liczbę fiszek
    const total = Object.values(efRanges).reduce((sum, r) => sum + r.count, 0);

    // Zmień kolor tekstu dla tytułu
    ctx.fillStyle = textColor;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`SuperMemo Easiness Factor Distribution (Total: ${total})`, width / 2, 30);

    const barWidth = width / 6;

    // Funkcja do rysowania słupka
    function drawBar(x, range, label) {
        const total = Object.values(efRanges).reduce((sum, r) => sum + r.count, 0);
        const barHeight = total > 0 ? (range.count / total) * (height - 120) : 0;
        const y = height - barHeight - 40;

        // Rysuj słupek
        ctx.fillStyle = range.color;
        ctx.fillRect(x, y, barWidth - 20, barHeight);

        // Zmień efekt 3D na cień w kolorze tła
        ctx.fillStyle = isDarkMode ? 'rgba(45, 45, 45, 0.3)' : 'rgba(248, 249, 250, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10, y - 10);
        ctx.lineTo(x + barWidth - 10, y - 10);
        ctx.lineTo(x + barWidth - 20, y);
        ctx.closePath();
        ctx.fill();

        // Dodaj etykietę
        ctx.fillStyle = textColor; // Zmieniony kolor tekstu
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + (barWidth - 20) / 2, height - 20);
        ctx.fillText(`EF: ${range.min}-${range.max}`, x + (barWidth - 20) / 2, height - 5);

        // Dodaj liczbę fiszek
        ctx.fillStyle = textColor; // Zmieniony kolor tekstu
        ctx.font = 'bold 16px Arial';
        ctx.fillText(range.count, x + (barWidth - 20) / 2, y - 25);
    }

    // Rysuj słupki dla każdego przedziału EF
    let x = width / 8;
    drawBar(x, efRanges.veryHard, 'Very Hard');
    x += barWidth;
    drawBar(x, efRanges.hard, 'Hard');
    x += barWidth;
    drawBar(x, efRanges.medium, 'Medium');
    x += barWidth;
    drawBar(x, efRanges.easy, 'Easy');
    x += barWidth;
    drawBar(x, efRanges.veryEasy, 'Very Easy');
}

// Dodaj nową funkcję do rysowania wykresu interwałów SuperMemo
function drawSuperMemoIntervalsChart() {
    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
    if (algorithm !== 'supermemo') return;

    let canvas = document.getElementById('superMemoIntervalsChart');
    if (!canvas) {
        const statsSection = document.getElementById('stats');
        canvas = document.createElement('canvas');
        canvas.id = 'superMemoIntervalsChart';
        canvas.width = 600;
        canvas.height = 200;
        statsSection.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Przedziały interwałów (w dniach) - dodajemy nowy przedział dla 0 dni
    const intervalRanges = {
        newCards: { min: 0, max: 0, color: '#dc3545', count: 0, label: '0 days' },      // Nowy przedział
        shortTerm: { min: 1, max: 7, color: '#fd7e14', count: 0, label: '1-7 days' },   // Zmieniono kolor
        mediumTerm: { min: 8, max: 30, color: '#ffc107', count: 0, label: '8-30 days' },
        longTerm: { min: 31, max: 90, color: '#28a745', count: 0, label: '31-90 days' },
        veryLongTerm: { min: 91, max: 365, color: '#17a2b8', count: 0, label: '91-365 days' }
    };

    // Zliczanie fiszek według interwałów
    flashcards.forEach(flashcard => {
        if (flashcard.interval === 0 && flashcard.lastReviewed) {
            intervalRanges.newCards.count++;
        } else if (flashcard.interval) {
            const interval = flashcard.interval;
            if (interval <= 7) intervalRanges.shortTerm.count++;
            else if (interval <= 30) intervalRanges.mediumTerm.count++;
            else if (interval <= 90) intervalRanges.longTerm.count++;
            else intervalRanges.veryLongTerm.count++;
        }
    });

    // Wyczyść canvas
    ctx.clearRect(0, 0, width, height);

    // Dodaj sprawdzenie trybu ciemnego przed ustawieniem koloru tekstu
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e0e0e0' : '#333';
    const backgroundColor = isDarkMode ? '#2d2d2d' : '#f8f9fa';

    // Ustaw tło
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Oblicz całkowitą liczbę fiszek
    const total = Object.values(intervalRanges).reduce((sum, r) => sum + r.count, 0);

    // Zmień kolor tekstu dla tytułu
    ctx.fillStyle = textColor;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`SuperMemo Review Intervals Distribution (Total: ${total})`, width / 2, 30);

    const barWidth = width / 6;

    // Funkcja do rysowania słupka
    function drawBar(x, range, label) {
        const barHeight = total > 0 ? (range.count / total) * (height - 120) : 0;
        const y = height - barHeight - 40;

        // Rysuj słupek
        ctx.fillStyle = range.color;
        ctx.fillRect(x, y, barWidth - 20, barHeight);

        // Zmień efekt 3D na cień w kolorze tła
        ctx.fillStyle = isDarkMode ? 'rgba(45, 45, 45, 0.3)' : 'rgba(248, 249, 250, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10, y - 10);
        ctx.lineTo(x + barWidth - 10, y - 10);
        ctx.lineTo(x + barWidth - 20, y);
        ctx.closePath();
        ctx.fill();

        // Dodaj etykietę
        ctx.fillStyle = textColor; // Zmieniony kolor tekstu
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + (barWidth - 20) / 2, height - 20);
        ctx.fillText(`${range.count} cards`, x + (barWidth - 20) / 2, height - 5);

        // Dodaj liczbę fiszek
        if (range.count > 0) {
            ctx.fillStyle = textColor; // Zmieniony kolor tekstu
            ctx.font = 'bold 16px Arial';
            ctx.fillText(range.count, x + (barWidth - 20) / 2, y - 25);
        }
    }

    // Rysuj słupki dla każdego przedziału interwałów
    let x = width / 7; // Zmniejszamy odstęp, bo mamy więcej słupków
    Object.entries(intervalRanges).forEach(([key, range]) => {
        drawBar(x, range, range.label);
        x += barWidth;
    });
}
// Sprawdź czy zmienne istnieją w globalnym zakresie
if (typeof flashcards === 'undefined') {
    console.error('flashcards is not defined. Make sure reps.js is loaded first.');
}

if (typeof translations === 'undefined') {
    console.error('translations is not defined. Make sure reps.js is loaded first.');
}

if (typeof currentLanguage === 'undefined') {
    console.error('currentLanguage is not defined. Make sure reps.js is loaded first.');
}

// Usuń duplikat translations, ponieważ jest już zdefiniowany w reps.js

// Modyfikacja funkcji updateStats nie jest potrzebna, ponieważ jest już zdefiniowana w reps.js
// Funkcja do aktualizacji statystyk
function updateStats() {
    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';
    let totalFlashcards = flashcards.length;
    //let knownFlashcards = countKnownFlashcards();
    let masteredLast7Days = 0;
    //let masteredLast7Days = countMasteredLast7Days();
  
     // Oblicz stan znajomości w zależności od algorytmu
     let knownCards = 0;
     let totalReviewedCards = 0;
     const total = flashcards.length;
  
     switch (algorithm) {
         case 'supermemo':
             // Dla SuperMemo - karty z EF > 2 i co najmniej 5 powtórzeniami
             knownCards = flashcards.filter(f => 
                 f.easinessFactor > 2 && f.repetitions >= 5
             ).length;
             totalReviewedCards = flashcards.filter(f => f.lastReviewed).length;
             break;
             
         case 'leitner':
             // Dla Leitnera - karty w pudełku 5
             knownCards = flashcards.filter(f => 
                 f.leitnerBox && f.leitnerBox >= 5
             ).length;
             totalReviewedCards = flashcards.filter(f => f.lastReviewed).length;
             break;
             
         default:
             // Dla standardowego - karty ze streak >= 5 i difficulty 'easy'
             knownCards = flashcards.filter(f => 
                 f.streak >= 5 
             ).length;
             totalReviewedCards = flashcards.filter(f => f.lastReviewed).length;
     }
  
    
    const statsSection = document.getElementById('stats');
    statsSection.innerHTML = generateStatsHTML();
    
    document.getElementById('totalFlashcards').textContent = totalFlashcards;
    
    // Oblicz procent znanych fiszek
    let knownPercentage = totalFlashcards > 0 ? (knownCards / totalReviewedCards * 100).toFixed(1) : 0;
    document.getElementById('knownFlashcards').textContent = `${knownPercentage}%`;
  
        // Oblicz liczbę opanowanych w ostatnich 7 dniach
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        
        switch (algorithm) {
            case 'supermemo':
                masteredLast7Days = flashcards.filter(f => 
                    f.lastReviewed && 
                    new Date(f.lastReviewed) >= sevenDaysAgo && 
                    f.easinessFactor > 2 &&
                    f.repetitions >= 5
                ).length;
                break;
                
            case 'leitner':
                masteredLast7Days = flashcards.filter(f => 
                    f.lastReviewed && 
                    new Date(f.lastReviewed) >= sevenDaysAgo && 
                    f.leitnerBox >= 5
                ).length;
                break;
                
            default:
                masteredLast7Days = flashcards.filter(f => 
                    f.lastReviewed && 
                    new Date(f.lastReviewed) >= sevenDaysAgo && 
                    f.streak >= 5
                    
                ).length;
        }
    
    document.getElementById('masteredLast7Days').textContent = masteredLast7Days;
  
   
    if (algorithm === 'leitner') {
        drawLeitnerBoxesChart();
    } else if (algorithm === 'supermemo') {
        drawSuperMemoChart();
        drawSuperMemoIntervalsChart();  // Dodaj wywołanie nowego wykresu
    } else {
        drawLearningProgressChart();
    }
  
    changeLanguage(); // Dodajemy to wywołanie, aby przetłumaczyć nowo wygenerowaną zawartość
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
    const algorithm = localStorage.getItem('reviewAlgorithm') || 'standard';

    // Oblicz statystyki w zależności od algorytmu
    const newCards = flashcards.filter(f => !f.lastReviewed).length;
    
    let learningCards = 0;
    switch (algorithm) {
        case 'supermemo':
            // Dla SuperMemo - karty z 1-4 powtórzeniami
            learningCards = flashcards.filter(f => 
                f.lastReviewed && f.repetitions >= 0 && f.repetitions < 5
            ).length;
            break;
        case 'leitner':
            // Dla Leitnera - karty w pudełkach 1-4
            learningCards = flashcards.filter(f => 
                f.lastReviewed && f.leitnerBox >= 1 && f.leitnerBox <= 4
            ).length;
            break;
        default:
            // Dla standardowego - karty ze streak 1-4
            learningCards = flashcards.filter(f => 
                f.lastReviewed && f.streak >= 0 && f.streak < 5
            ).length;
    }

    // Opanowane fiszki też zależą od algorytmu
    let masteredCards = 0;
    switch (algorithm) {
        case 'supermemo':
            masteredCards = flashcards.filter( f => f.repetitions >= 5 && f.easinessFactor > 2 ).length;
            break;
        case 'leitner':
            masteredCards = flashcards.filter(f => f.leitnerBox >= 5).length;
            break;
        default:
            masteredCards = flashcards.filter(f => f.streak >= 5 ).length;
    }

    const total = flashcards.length;
    const barWidth = width / 4;

    console.log(`Statystyki: Nowe: ${newCards}, Uczone: ${learningCards}, Opanowane: ${masteredCards}`);

    // Wyczyść canvas
    ctx.clearRect(0, 0, width, height);

    // Dodaj sprawdzenie trybu ciemnego przed ustawieniem koloru tekstu
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e0e0e0' : '#333';
    const backgroundColor = isDarkMode ? '#2d2d2d' : '#f8f9fa';
    
    // Ustaw tło
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Dodaj tytuł wykresu
    ctx.fillStyle = textColor;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(translations[currentLanguage].flashcardStatistics || 'Statystyki fiszek', width / 2, 30);

    // Funkcja do rysowania słupka
    function drawBar(x, count, color, label) {
        const barHeight = total > 0 ? (count / total) * (height - 120) : 0;
        const y = height - barHeight - 40;

        // Rysuj słupek
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 20, barHeight);

        // Zmień efekt 3D na cień w kolorze tła
        ctx.fillStyle = isDarkMode ? 'rgba(45, 45, 45, 0.3)' : 'rgba(248, 249, 250, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10, y - 10);
        ctx.lineTo(x + barWidth - 10, y - 10);
        ctx.lineTo(x + barWidth - 20, y);
        ctx.closePath();
        ctx.fill();

        // Dodaj etykietę
        ctx.fillStyle = textColor;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + (barWidth - 20) / 2, height - 20);

        // Dodaj liczbę
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px Arial';
        ctx.fillText(count, x + (barWidth - 20) / 2, y - 25);
    }

    // Rysuj słupki
    if (total > 0) {
        drawBar(width / 8, newCards, '#4CAF50', translations[currentLanguage].newFlashcards || 'Nowe');
        drawBar(width * 3 / 8, learningCards, '#36A2EB', translations[currentLanguage].learningFlashcards || 'Uczone');
        drawBar(width * 5 / 8, masteredCards, '#4BC0C0', translations[currentLanguage].masteredFlashcards || 'Opanowane');
    } else {
        ctx.fillStyle = textColor;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Brak danych do wyświetlenia', width / 2, height / 2);
    }

    console.log('Zakończono rysowanie wykresu');
}

