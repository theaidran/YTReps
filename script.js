let isIndexDarkMode = false;
var isPortrait = window.innerHeight > window.innerWidth ;
var isLandscape = window.innerWidth  > window.innerHeight;

// Funkcja do przełączania trybu ciemnego
function toggleIndexDarkMode() {
    isIndexDarkMode = !isIndexDarkMode;
    document.body.classList.toggle('index-dark-mode', isIndexDarkMode);
   // localStorage.setItem('indexDarkMode', isIndexDarkMode);
    
    // Zmień ikonę
    const darkModeIcon = document.querySelector('#index-dark-mode .dark-mode-icon');
    if (darkModeIcon) {
        darkModeIcon.textContent = isIndexDarkMode ? '☼' : '☽';
    }
}

// Inicjalizacja trybu ciemnego przy ładowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    if (isIndexDarkMode) {
        document.body.classList.add('index-dark-mode');
        const darkModeIcon = document.querySelector('#index-dark-mode .dark-mode-icon');
        if (darkModeIcon) {
            darkModeIcon.textContent = '☼';
        }
    }
});

var player;
var watchedVideos = {}; // Obiekt przechowujący obejrzane filmy dla każdej playlisty
var currentVideoId = null;
var currentVideoTitle = null;
var isAutoplayEnabled = false;
var currentPlaylistId = '';

var playlistVideoIds = [];
var videoIdToIndexMap = {};
var listItemVideoId = null;

var playlists = [
    { id: 'PLcetZ6gSk96-FECmH9l7Vlx5VDigvgZpt', name: '6 Minute English' },
    { id: 'PLcetZ6gSk96_Fprtuj6gKN9upPjaDrARH', name: 'English In A Minute' },
    { id: 'PLcetZ6gSk96_sototkO7HFkGA8zL8H0lq', name: 'The English We Speak' },
    { id: 'PLcetZ6gSk96--2ELXoJeyafP6wg4n53uh', name: 'Phrasal Verbs' },
    { id: 'PLcetZ6gSk96_zHuVg6Ecy2F7j4Aq4valQ', name: '6 Minute Grammar' } // Dodana nowa playlista
];

var trimTimes = {};

// Dodaj tę linię na początku skryptu, wraz z innymi globalnymi zmiennymi
var previousState;

// Dodaj tę funkcję na początku skryptu
function initializeDefaultTrimTimes() {
    playlists.forEach(function(playlist) {
        if (!playlist.custom && !trimTimes.hasOwnProperty(playlist.id)) {
            trimTimes[playlist.id] = 366; // 6:06 w sekundach
        }
    });
    saveTrimTimesToLocalStorage();
}

// Zmień inicjalizację zmiennej globalnej
var addToWatchedOnStart = true;

// Dodaj tę funkcję na początku pliku, wraz z innymi zmiennymi globalnymi
function showColumnDividerTooltip() {
    // Nie pokazuj tooltipa na małych ekranach
    if (window.innerWidth  <= 915) {
        return;
    }

    if (localStorage.getItem('columnDividerTooltipShown') !== 'true') {
        const tooltip = document.createElement('div');
        tooltip.className = 'column-divider-tooltip';
        tooltip.innerHTML = `
            Change the width of the player / dictionary using the column handle
            <button class="tooltip-close">×</button>
        `;
        
        const columnDivider = document.querySelector('.column-divider');
        columnDivider.appendChild(tooltip);
        
        // Dodaj klasę highlighted do dividera
        columnDivider.classList.add('highlighted');
        
        // Obsługa zamknięcia tooltipa
        tooltip.querySelector('.tooltip-close').addEventListener('click', () => {
            tooltip.remove();
            columnDivider.classList.remove('highlighted');
            localStorage.setItem('columnDividerTooltipShown', 'true');
        });
        
        // Automatyczne zamknięcie po 40 sekundach
        setTimeout(() => {
            if (tooltip.parentElement) {
                tooltip.remove();
                columnDivider.classList.remove('highlighted');
                localStorage.setItem('columnDividerTooltipShown', 'true');
            }
        }, 40000);

        // Dodaj nasłuchiwanie na zmianę rozmiaru okna
        const resizeHandler = () => {
            if (window.innerWidth  <= 520 && tooltip.parentElement) {
                tooltip.remove();
                columnDivider.classList.remove('highlighted');
                localStorage.setItem('columnDividerTooltipShown', 'true');
            }
        };

        window.addEventListener('resize', resizeHandler);
    }
}

function createPlaylistButtons() {
    var container = document.getElementById('playlist-container');
    container.innerHTML = '';

    playlists.forEach(function(playlist) {
        var buttonContainer = document.createElement('div');
        buttonContainer.className = 'playlist-button-container';

        var button = document.createElement('button');
        button.textContent = playlist.name;
        button.className = 'playlist-button';
        button.onclick = function() { loadPlaylist(playlist.id); };
        buttonContainer.appendChild(button);

        if (playlist.custom) {
            var removeButton = document.createElement('button');
            removeButton.textContent = 'X';
            removeButton.className = 'remove-playlist-button';
            removeButton.onclick = function(e) {
                e.stopPropagation();
                removePlaylist(playlist.id);
            };
            buttonContainer.appendChild(removeButton);
        }

        container.appendChild(buttonContainer);
    });

    // Dodaj przycisk "+" do pokazywania/ukrywania inputa
    var toggleButton = document.createElement('button');
    toggleButton.textContent = '+';
    toggleButton.className = 'toggle-input-button';
    toggleButton.onclick = toggleCustomPlaylistInput;
    container.appendChild(toggleButton);

    // Dodaj input i przycisk do dodawania nowej playlisty
    var customContainer = document.createElement('div');
    customContainer.className = 'custom-playlist-container';
    customContainer.style.display = 'none';

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'custom-playlist-link';
    input.placeholder = 'Paste the link to a YouTube playlist or video.';
    customContainer.appendChild(input);

    var addButton = document.createElement('button');
    addButton.textContent = 'Add';
    addButton.onclick = addCustomPlaylistOrVideo;
    customContainer.appendChild(addButton);

    container.appendChild(customContainer);
    addNoteIconHoverListeners();
}

function loadPlaylist(playlistId) {
    currentPlaylistId = playlistId;
    var playlist = playlists.find(p => p.id === playlistId);
    
    if (player) {
        player.destroy();
    }
    
    var playerContainer = document.getElementById('player');
    playerContainer.innerHTML = ''; // Wyczyść kontener przed utworzeniem nowego odtwarzacza
    
    if (playlist && playlist.singleVideo) {
        loadSingleVideo(playlistId, playlist.singleVideo);
    } else {
        player = new YT.Player('player', {
            height: '360',
            width: '640',
            playerVars: {
                'listType': 'playlist',
                'list': playlistId,
                'autoplay': 0,
                'controls': 1,
                'rel': 0,
                'modestbranding': 1,
                'iv_load_policy': 3,
                'cc_load_policy': 1,
                'cc_lang_pref': 'en'
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }
    
    updateActivePlaylistButton(playlistId);
    loadWatchedVideosFromLocalStorage();
    updateWatchedVideosList();
    updateWatchedCount();
    
    setTimeout(autosizePlayer, 100);
}

function onPlayerReady(event) {
    console.log("Player gotowy do odtwarzania!");
    updatePlaylistData();
    loadWatchedVideosFromLocalStorage();
    setTimeout(autosizePlayer, 100); // Dodaj małe opóźnienie
    setInterval(function() {
        updatePlaylistData();
    }, 120000);
}

function onPlayerStateChange(event) {
    console.log("Stan odtwarzacza:", event.data);

    if (event.data === YT.PlayerState.PLAYING) {
        var videoData = player.getVideoData();
        currentVideoId = videoData.video_id;
        currentVideoTitle = videoData.title;
        console.log("Aktualny film:", currentVideoTitle);

        // Dodaj film do listy obejrzanych na początku odtwarzania tylko jeśli flaga jest true
        if (addToWatchedOnStart) {
            markVideoAsWatched(currentVideoId, currentVideoTitle);
        }

        // Sprawdzamy czas przycinania przy każdym odtworzeniu
        checkTrimTime();
        
        setTimeout(autosizePlayer, 100);
    }

    if (event.data === YT.PlayerState.UNSTARTED && previousState === YT.PlayerState.PLAYING) {
        console.log("Film zakończył odtwarzanie.");

        // Dodaj film do listy obejrzanych na końcu odtwarzania, jeśli flaga jest false
        if (!addToWatchedOnStart) {
            markVideoAsWatched(currentVideoId, currentVideoTitle);
        }

        if (!isAutoplayEnabled) {
            console.log("Auto-play wyłączony, zatrzymuję odtwarzanie.");
            player.stopVideo();
        }
    }

    previousState = event.data;
}

function checkTrimTime() {
    if (trimTimes[currentPlaylistId] !== undefined) {
        var checkInterval = setInterval(function() {
            if (player && player.getCurrentTime) {
                var currentTime = player.getCurrentTime();
                var duration = player.getDuration();
                if (trimTimes[currentPlaylistId] > 0 && currentTime >= trimTimes[currentPlaylistId] && currentTime < duration - 3) {
                    player.seekTo(duration - 3, true);
                    clearInterval(checkInterval);
                } else if (currentTime >= duration - 1) {
                    // Zatrzymaj sprawdzanie, gdy film jest blisko końca
                    clearInterval(checkInterval);
                }
            }
        }, 1000); // Sprawdzaj co sekundę
    }
}

function updatePlaylistData() {
    var newPlaylistVideoIds = player.getPlaylist();

    if (JSON.stringify(playlistVideoIds) !== JSON.stringify(newPlaylistVideoIds)) {
        playlistVideoIds = newPlaylistVideoIds;
        console.log("Playlista została zaktualizowana.");
        videoIdToIndexMap = {};
        playlistVideoIds.forEach(function(videoId, index) {
            videoIdToIndexMap[videoId] = index;
        });
        document.getElementById('total-videos').textContent = playlistVideoIds.length;
        document.getElementById('total-videos-2').textContent = playlistVideoIds.length;
        updateWatchedVideosList();
        updateWatchedCount();
    }
}

function updateWatchedVideosList() {
    var videoListElement = document.getElementById('video-list');
    videoListElement.innerHTML = '';

    if (!watchedVideos[currentPlaylistId]) {
        watchedVideos[currentPlaylistId] = [];
    }

    // Tworzymy kopię tablicy i odwracamy ją
    const reversedVideos = [...watchedVideos[currentPlaylistId]].reverse();

    reversedVideos.forEach(function(video, index) {
        var videoId = video.id;
        var title = video.title.replace(/[⏲️⏰✈️]/g, '').trim();
        var videoIndex = videoIdToIndexMap[videoId];
        var videoNumber = videoIndex !== undefined ? videoIndex + 1 : 1;

        var listItem = document.createElement('li');
        listItem.id = videoId;

        listItem.innerHTML = `
            <a onclick="playPlaylistFromIndex('${videoId}')">${videoNumber}. ${title}</a>
            <span class="note-icon" onclick="toggleNoteForm('${videoId}')">${video.notes && video.notes.length > 0 ? '📝' : '➕'}</span>
            <div class="note-form" style="display: none;">
                <div class="word-translation-pairs"></div>
                <button onclick="addWordTranslationPair('${videoId}')">+ Add word/phrase</button>
                <button onclick="saveNote2('${videoId}')">Save note</button>
            </div>
        `;
        videoListElement.appendChild(listItem);

        if (video.notes && video.notes.length > 0) {
            video.notes.forEach(note => {
                addWordTranslationPair(videoId, note.word, note.context, note.translation);
            });
        }
    });

    adjustAllTextareas();
}

function markVideoAsWatched(videoId, title) {
    console.log("Oznaczanie filmu jako obejrzany:", title);
    console.log("Stan watchedVideos przed oznaczeniem:", JSON.parse(JSON.stringify(watchedVideos)));
    if (!watchedVideos[currentPlaylistId]) {
        watchedVideos[currentPlaylistId] = [];
    }
    // Sprawdź, czy film już istnieje w liście obejrzanych
    const existingVideo = watchedVideos[currentPlaylistId].find(video => video.id === videoId);
    if (!existingVideo) {
        // Jeśli to pojedynczy film, użyj nazwy playlisty jako tytułu
        var playlist = playlists.find(p => p.id === currentPlaylistId);
        var videoTitle = playlist && playlist.singleVideo ? playlist.name : title;
        watchedVideos[currentPlaylistId].push({ id: videoId, title: videoTitle });
        console.log("Stan watchedVideos po oznaczeniu:", JSON.parse(JSON.stringify(watchedVideos)));
        updateWatchedVideosList();
        saveWatchedVideosToLocalStorage();
        updateWatchedCount();
    } else {
        console.log("Film już był oznaczony jako obejrzany");
    }
}

function playPlaylistFromIndex(videoId) {
    var videoIndex = videoIdToIndexMap[videoId];
    if (videoIndex !== undefined) {
        player.loadPlaylist({
            'list': currentPlaylistId,
            'index': videoIndex,
            'startSeconds': 0,
            'suggestedQuality': 'default'
        });
        jumpPerformed = false;
        previousState = null;
    } else {
        console.log("Nie znaleziono identyfikatora wideo w playliście.");
    }
}

function toggleNoteForm(videoId) {
    var listItem = document.getElementById(videoId);
    var noteForm = listItem.querySelector('.note-form');
    var noteIcon = listItem.querySelector('.note-icon');
    var pairsContainer = listItem.querySelector('.word-translation-pairs');
    
    if (noteForm.style.display === 'none') {
        noteForm.style.display = 'block';
        noteIcon.textContent = '➖'; // Zmieniamy ikonę na minus
        document.querySelector('.dictionary-select-container').classList.add('sticky');
        if (pairsContainer.children.length === 0) {
            addWordTranslationPair(videoId);
        } else {
            adjustAllTextareas();
        }
        
        // Przewiń do notatki z animacją
        setTimeout(() => {
            const noteFormRect = noteForm.getBoundingClientRect();
            const offset = noteFormRect.top + window.pageYOffset - (window.innerHeight / 2) + (noteFormRect.height / 2);
            
            // Użyj animacji do przewijania
            if (window.innerWidth  > 915) { //nie mobile, wacz przewijanie
            smoothScrollTo(offset, 1000); // 1000ms (1 sekunda) na animację
            }
            // Dostosuj pozycję playera YouTube
            adjustYouTubePlayerPosition(videoId, true);
        }, 100); // Dajemy trochę czasu na renderowanie formularza
    } else {
        saveNote(videoId);
        noteForm.style.display = 'none';
        noteIcon.textContent = noteIcon.textContent === '➖' ? '➕' : '📝'; // Przywracamy oryginalną ikonę
        document.querySelector('.dictionary-select-container').classList.remove('sticky');
        // Przywróć oryginalną pozycję playera YouTube
        resetYouTubePlayerPosition();
    }
    setTimeout(() => adjustIframeSize(videoId), 0);
}

function adjustYouTubePlayerPosition(videoId, isResizing = false) {
    var playerContainer = document.querySelector('.player-container');
    var activeNoteForm = document.querySelector('.note-form[style="display: block;"]');
    var listItem = document.getElementById(videoId);
    var leftColumn = document.querySelector('.left-column');
    
    if (activeNoteForm && listItem) {
        var noteFormRect = activeNoteForm.getBoundingClientRect();
        var leftColumnRect = leftColumn.getBoundingClientRect();
        
        // Ustaw pozycję playera pod formularzem notatki
        var newTop = noteFormRect.bottom + window.pageYOffset + 10; // 10px odstępu
        
        playerContainer.style.position = 'absolute';
        playerContainer.style.top = newTop + 'px';
        playerContainer.style.left = '20px';
        playerContainer.style.zIndex = '1000';
        
        // Wywołaj autosizePlayer aby dostosować rozmiar
        autosizePlayer();
        
        // Jeśli to nie jest zmiana rozmiaru, przewiń do formularza
        
        if (!isResizing) {
            var scrollTarget = noteFormRect.top + window.pageYOffset - 50; // 50px offset
            if (window.innerWidth  > 915) { //wlacz tylko dla desktop
                smoothScrollTo(scrollTarget, 500);
            }
        }
        
    } else {
        resetYouTubePlayerPosition();
    }
}

function resetYouTubePlayerPosition() {
    var playerContainer = document.querySelector('.player-container');
    playerContainer.style.position = 'relative';
    playerContainer.style.width = '100%';
    playerContainer.style.maxWidth = '2160px';
    playerContainer.style.height = '0';
    playerContainer.style.paddingBottom = '56.25%'; // Przywracamy aspect ratio 16:9
    playerContainer.style.top = 'auto';
    playerContainer.style.left = 'auto';
    playerContainer.style.zIndex = 'auto';
}

// Zmodyfikuj funkcję autosizePlayer
function autosizePlayer() {
    const leftColumn = document.querySelector('.left-column');
    const playerContainer = document.querySelector('.player-container');
    const youtubeIframe = playerContainer.querySelector('iframe');
    
    if (youtubeIframe) {
        const maxWidth = leftColumn.offsetWidth - 40; // 20px padding z każdej strony
        const defaultAspectRatio = 16 / 9;
        
        let newWidth = maxWidth; // Usuwamy ograniczenie do 640px
        let newHeight = newWidth / defaultAspectRatio;
        
        // Usuwamy ograniczenie wysokości do 360px
        
        playerContainer.style.width = newWidth + 'px';
        playerContainer.style.height = newHeight + 'px';
        playerContainer.style.paddingBottom = '0';
        
        youtubeIframe.style.width = '100%';
        youtubeIframe.style.height = '100%';
    }
    
    console.log("autosizePlayer wykonane, nowe wymiary:", playerContainer.style.width, playerContainer.style.height);
}

// Dodaj wywołanie autosizePlayer w funkcji onPlayerReady
function onPlayerReady(event) {
    console.log("Player gotowy do odtwarzania!");
    updatePlaylistData();
    loadWatchedVideosFromLocalStorage();
    setTimeout(autosizePlayer, 100); // Dodaj małe opóźnienie
    setInterval(function() {
        updatePlaylistData();
    }, 120000);
}

// Dodaj wywołanie autosizePlayer po załadowaniu filmu
function onPlayerStateChange(event) {
    console.log("Stan odtwarzacza:", event.data);

    if (event.data === YT.PlayerState.PLAYING) {
        var videoData = player.getVideoData();
        currentVideoId = videoData.video_id;
        currentVideoTitle = videoData.title;
        console.log("Aktualny film:", currentVideoTitle);

        // Dodaj film do listy obejrzanych na początku odtwarzania tylko jeśli flaga jest true
        if (addToWatchedOnStart) {
            markVideoAsWatched(currentVideoId, currentVideoTitle);
        }

        // Sprawdzamy czas przycinania przy każdym odtworzeniu
        checkTrimTime();
        
        setTimeout(autosizePlayer, 100);
    }

    if (event.data === YT.PlayerState.UNSTARTED && previousState === YT.PlayerState.PLAYING) {
        console.log("Film zakończył odtwarzanie.");

        // Dodaj film do listy obejrzanych na końcu odtwarzania, jeśli flaga jest false
        if (!addToWatchedOnStart) {
            markVideoAsWatched(currentVideoId, currentVideoTitle);
        }

        if (!isAutoplayEnabled) {
            console.log("Auto-play wyłączony, zatrzymuję odtwarzanie.");
            player.stopVideo();
        }
    }

    previousState = event.data;
}

// Dodaj tę funkcję, aby obsłużyć zmiany rozmiaru okna
function handleResize() {
    var activeNoteForm = document.querySelector('.note-form[style="display: block;"]');
    if (activeNoteForm) {
        var videoId = activeNoteForm.closest('li').id;
        adjustYouTubePlayerPosition(videoId, true);
    } else {
        autosizePlayer();
    }
}

// Zmodyfikuj nasłuchiwanie na zmianę rozmiaru okna
window.removeEventListener('resize', handleResize); // Usuń poprzednie nasłuchiwanie, jeli istnieje
window.addEventListener('resize', handleResize);

// Wywołaj autosizePlayer po załadowaniu strony
window.addEventListener('load', function() {
    autosizePlayer();
    console.log("autosizePlayer wywołane po załadowaniu strony");
});

// Dodaj tę nową funkcję do płynnego przewijania
function smoothScrollTo(targetPosition, duration) {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

function addWordTranslationPair(videoId, word = '', context = '', translation = '') {
    var listItem = document.getElementById(videoId);
    var pairsContainer = listItem.querySelector('.word-translation-pairs');
    var pairDiv = document.createElement('div');
    pairDiv.className = 'word-translation-pair';
    pairDiv.innerHTML = `
        <textarea class="word-input" placeholder="Word/Phrase">${word}</textarea>
        <textarea class="context-input" placeholder="Context">${context}</textarea>
        <textarea class="translation-input" placeholder="Translation">${translation}</textarea>
    `;
    pairsContainer.appendChild(pairDiv);

    // Dodaj obsługę automatycznego rozszerzania
    var textareas = pairDiv.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', autoResize);
        autoResize.call(textarea); // Wywołaj raz, aby ustawić początkową wysokość
    });

    // Ustaw focus na pierwszym polu textarea, jeśli to pierwsza para
    if (pairsContainer.children.length === 1) {
        pairDiv.querySelector('.word-input').focus();
    }

    // Aktualizuj przyciski na angielskie wersje
    var addButton = listItem.querySelector('button[onclick^="addWordTranslationPair"]');
    var saveButton = listItem.querySelector('button[onclick^="saveNote"]');
    if (addButton) addButton.textContent = '+ Add word/phrase';
    if (saveButton) saveButton.textContent = 'Save note';
    // Dodajemy opóźnienie, aby dać czas na renderowanie nowego pola
    setTimeout(() => {
        adjustIframeSize();
        adjustYouTubePlayerPosition(videoId, false);
        if (window.innerWidth  > 915 ) { //wlacz tylko dla desktop
            // Przewiń do 1/3 strony zamiast 1/6 (zwiększamy wartość)
            var newPairRect = pairDiv.getBoundingClientRect();
            var targetScrollPosition = newPairRect.top + window.pageYOffset - (window.innerHeight / 20) + 31;
            smoothScrollTo(targetScrollPosition, 500);
        }
        else if (isPortrait) { // 1/4 strony dla mobile 1/3.65
            var newPairRect = pairDiv.getBoundingClientRect();
            var targetScrollPosition = newPairRect.top + window.pageYOffset - (window.innerHeight / 3.65) ;
         smoothScrollTo(targetScrollPosition, 500);
        }
     // Dla wszytkicj mniejszych niz 915px w trybie landscape, wyłacz przewijanie

    }, 100);
	
    //Zapisz aktualny stan notki
    saveNote2(videoId);	
}

function autoResize() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    var videoId = this.closest('.note-form').parentElement.id;
    adjustYouTubePlayerPosition(videoId, true);
    adjustIframeSize(); // Dodajemy to wywołanie
}

function adjustAllTextareas() {
    document.querySelectorAll('.word-translation-pair textarea').forEach(textarea => {
        autoResize.call(textarea);
    });
}

function saveNote2(videoId) {
    var listItem = document.getElementById(videoId);
    var pairs = listItem.querySelectorAll('.word-translation-pair');
    var notes = [];
    pairs.forEach(pair => {
        var word = pair.querySelector('.word-input').value.trim();
        var context = pair.querySelector('.context-input').value.trim();
        var translation = pair.querySelector('.translation-input').value.trim();
        if (word || context || translation) {
            notes.push({ word, context, translation });
        }
    });

    var video = watchedVideos[currentPlaylistId].find(v => v.id === videoId);
    if (video) {
        video.notes = notes;
        saveWatchedVideosToLocalStorage();
        //updateWatchedVideosList();
    }
	
}

function saveNote(videoId) {
    var listItem = document.getElementById(videoId);
    var pairs = listItem.querySelectorAll('.word-translation-pair');
    var notes = [];
    pairs.forEach(pair => {
        var word = pair.querySelector('.word-input').value.trim();
        var context = pair.querySelector('.context-input').value.trim();
        var translation = pair.querySelector('.translation-input').value.trim();
        if (word || context || translation) {
            notes.push({ word, context, translation });
        }
    });

    var video = watchedVideos[currentPlaylistId].find(v => v.id === videoId);
    if (video) {
        video.notes = notes;
        saveWatchedVideosToLocalStorage();
        updateWatchedVideosList();
    }

    // Aktualizuj ikonę notatki
    var noteIcon = listItem.querySelector('.note-icon');
    noteIcon.textContent = notes.length > 0 ? '📝' : '➕';
    adjustIframeSize();
}

function toggleAutoplay() {
    isAutoplayEnabled = !isAutoplayEnabled;
    var button = document.getElementById('autoplay-btn');
    if (isAutoplayEnabled) {
        button.textContent = "Auto-play: ON";
        button.classList.add('active');
    } else {
        button.textContent = "Auto-play: OFF";
        button.classList.remove('active');
        console.log("Auto-play wyłączony.");
        if (player && player.getPlayerState() === YT.PlayerState.PLAYING) {
            player.stopVideo();
        }
    }
}

function saveWatchedVideosToLocalStorage() {
    try {
        console.log('Próba zapisu do localStorage. Dane przed zapisem:', watchedVideos);
        const watchedVideosJSON = JSON.stringify(watchedVideos);
        console.log('Dane po konwersji do JSON:', watchedVideosJSON);
        localStorage.setItem('watchedVideos', watchedVideosJSON);
        console.log('Zapisano obejrzane filmy do localStorage');
        console.log('Zawartość localStorage po zapisie:', localStorage.getItem('watchedVideos'));
        debugLocalStorage();
    } catch (e) {
        console.error('Błąd przy zapisywaniu do localStorage:', e);
        console.error('Stos wywołań:', e.stack);
    }
}

function loadWatchedVideosFromLocalStorage() {
try {
console.log('Próba odczytu z localStorage');
const storedWatchedVideos = localStorage.getItem('watchedVideos');
console.log('Odczytane dane z localStorage:', storedWatchedVideos);
if (storedWatchedVideos) {
    const parsedData = JSON.parse(storedWatchedVideos);
    if (Array.isArray(parsedData)) {
        // Stary format danych (tablica)
        watchedVideos = {
            [currentPlaylistId]: parsedData
        };
    } else {
        // Nowy format danych (obiekt)
        watchedVideos = parsedData;
    }
    console.log('Sparsowane dane:', watchedVideos);
    updateWatchedVideosList();
} else {
    console.log('Brak zapisanych danych w localStorage');
    watchedVideos = {};
}
} catch (e) {
console.error('Błąd przy odczytywaniu z localStorage:', e);
console.error('Stos wywołań:', e.stack);
watchedVideos = {};
}
}

function debugWatchedVideos() {
    console.log("Debugowanie watchedVideos:");
    console.log("currentPlaylistId:", currentPlaylistId);
    console.log("watchedVideos:", JSON.parse(JSON.stringify(watchedVideos)));
    console.log("localStorage:", localStorage.getItem('watchedVideos'));
}

function clearWatchedVideos() {
    if (confirm("Are you sure you want to clear all data about watched videos?")) {
        localStorage.removeItem('watchedVideos');
        watchedVideos = {};
        updateWatchedVideosList();
        updateWatchedCount();
        updateWordList(); // Dodaj tę linię, aby odświeżyć listę słów
        console.log("Cleared data about watched videos");
        alert("Data about watched videos has been cleared.");
    }
}

window.onerror = function(message, source, lineno, colno, error) {
    console.error("Błąd JavaScript:", message, "w", source, "linia:", lineno);
    return false;
};

function addCustomPlaylistOrVideo() {
    var linkInput = document.getElementById('custom-playlist-link');
    var link = linkInput.value.trim();
    
    if (isPlaylistLink(link)) {
        addCustomPlaylist(link);
    } else if (isVideoLink(link)) {
        addSingleVideo(link);
    } else {
        alert("Invalid link. Please enter a valid link to a YouTube playlist or video.");
    }
}

function addCustomPlaylist(playlistLink) {
    var playlistId = extractPlaylistId(playlistLink);
    
    if (playlistId) {
        var playlistName = prompt("Enter a name for this playlist:");
        if (playlistName) {
            playlists.push({ id: playlistId, name: playlistName, custom: true });
            trimTimes[playlistId] = 0;
            savePlaylistsToLocalStorage();
            saveTrimTimesToLocalStorage();
            createPlaylistButtons();
            document.getElementById('custom-playlist-link').value = '';
            loadPlaylist(playlistId);
        }
    } else {
        alert("Invalid playlist link. Please try again.");
    }
}

function addSingleVideo(videoLink) {
    var videoId = extractVideoId(videoLink);
    
    if (videoId) {
        var videoName = prompt("Enter a name for this video:");
        if (videoName) {
            var customPlaylistId = 'custom_videos_' + Date.now();
            playlists.push({ id: customPlaylistId, name: videoName, custom: true, singleVideo: videoId });
            trimTimes[customPlaylistId] = 0;
            savePlaylistsToLocalStorage();
            saveTrimTimesToLocalStorage();
            createPlaylistButtons();
            document.getElementById('custom-playlist-link').value = '';
            loadSingleVideo(customPlaylistId, videoId);
        }
    } else {
        alert("Invalid video link. Please try again.");
    }
}

function isPlaylistLink(link) {
    return link.includes('list=');
}

function isVideoLink(link) {
    return link.includes('v=') || link.includes('youtu.be/');
}

function extractVideoId(link) {
    var regex = /(?:v=|youtu\.be\/)([^&\?]+)/;
    var match = link.match(regex);
    return match && match[1] ? match[1] : null;
}

function loadSingleVideo(customPlaylistId, videoId) {
    currentPlaylistId = customPlaylistId;
    if (player) {
        player.destroy();
    }
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: videoId,
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'rel': 0,
            'modestbranding': 1,
            'iv_load_policy': 3,
            'cc_load_policy': 1,
            'cc_lang_pref': 'en'
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
    updateActivePlaylistButton(customPlaylistId);
    loadWatchedVideosFromLocalStorage();
    updateWatchedVideosList();
    
    // Dodaj to wywołanie, aby oznaczyć pojedynczy film jako obejrzany
    var playlist = playlists.find(p => p.id === customPlaylistId);
    if (playlist && playlist.singleVideo) {
        markVideoAsWatched(videoId, playlist.name);
    }
}

function savePlaylistsToLocalStorage() {
    localStorage.setItem('customPlaylists', JSON.stringify(playlists));
}

    // Domyślne playlisty BBC
    const defaultPlaylists = [
        { id: 'PLcetZ6gSk96-FECmH9l7Vlx5VDigvgZpt', name: '6 Minute English' },
        { id: 'PLcetZ6gSk96_Fprtuj6gKN9upPjaDrARH', name: 'English In A Minute' },
        { id: 'PLcetZ6gSk96_sototkO7HFkGA8zL8H0lq', name: 'The English We Speak' },
        { id: 'PLcetZ6gSk96--2ELXoJeyafP6wg4n53uh', name: 'Phrasal Verbs' },
        { id: 'PLcetZ6gSk96_zHuVg6Ecy2F7j4Aq4valQ', name: '6 Minute Grammar' }
    ];

function loadPlaylistsFromLocalStorage() {
    var storedPlaylists = localStorage.getItem('customPlaylists');
    if (storedPlaylists) {
        playlists = JSON.parse(storedPlaylists);
    }
    
    // Sprawdź ustawienie BBC playlist
    const bbcPlaylistEnabled = localStorage.getItem('bbcPlaylistEnabled') === 'true';
    


    // Dodaj domyślne playlisty tylko jeśli BBC jest włączone
    if (bbcPlaylistEnabled) {
        defaultPlaylists.forEach(function(defaultPlaylist) {
            if (!playlists.some(p => p.id === defaultPlaylist.id)) {
                playlists.push(defaultPlaylist);
            }
        });
    }

    savePlaylistsToLocalStorage(); // Zapisz zaktualizowaną listę
}

function removePlaylist(playlistId) {
    if (confirm("Are you sure you want to remove this playlist?")) {
        playlists = playlists.filter(p => p.id !== playlistId);
        savePlaylistsToLocalStorage();
        createPlaylistButtons();
        if (currentPlaylistId === playlistId) {
            loadPlaylist(playlists[0].id);
        }
    }
}

function updateActivePlaylistButton(playlistId) {
    var buttons = document.getElementsByClassName('playlist-button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
        if (buttons[i].textContent === getPlaylistName(playlistId)) {
            buttons[i].classList.add('active');
        }
    }
}

function getPlaylistName(playlistId) {
    var playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.name : 'Unknown playlist';
}

function setTrimTime() {
    var currentTrimTime = trimTimes[currentPlaylistId] || 0;
    var minutes = Math.floor(currentTrimTime / 60);
    var seconds = currentTrimTime % 60;
    var currentTimeString = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

    var timeInput = prompt("Podaj czas w formacie MM:SS, po którym film ma przeskoczyć do końcowych 3 sekund (00:00 aby wyłączy):", currentTimeString);
    if (timeInput !== null) {
        var parts = timeInput.split(':');
        var minutes = parseInt(parts[0], 10);
        var seconds = parseInt(parts[1], 10);
        var trimTime = minutes * 60 + seconds;
        trimTimes[currentPlaylistId] = trimTime;
        saveTrimTimesToLocalStorage();
        var message = trimTime > 0 
            ? "Ustawiono nowy czas przeskoku dla playlisty " + getPlaylistName(currentPlaylistId) + ": " + minutes + " minut " + seconds + " sekund."
            : "Wyłączono przeskok dla playlisty " + getPlaylistName(currentPlaylistId) + ".";
        alert(message);
    }
}

function saveTrimTimesToLocalStorage() {
    localStorage.setItem('trimTimes', JSON.stringify(trimTimes));
}

function loadTrimTimesFromLocalStorage() {
    var storedTrimTimes = localStorage.getItem('trimTimes');
    if (storedTrimTimes) {
        trimTimes = JSON.parse(storedTrimTimes);
    }
}

function toggleCustomPlaylistInput() {
    var customContainer = document.querySelector('.custom-playlist-container');
    var toggleButton = document.querySelector('.toggle-input-button');
    if (customContainer.style.display === 'none') {
        customContainer.style.display = 'flex';
        toggleButton.textContent = '-';
    } else {
        customContainer.style.display = 'none';
        toggleButton.textContent = '+';
    }
}

function toggleWordList() {
    var container = document.getElementById('word-list-container');
    if (container.style.display === 'none') {
        updateWordList();
        container.style.display = 'block';
        makeDraggable(container);
    } else {
        container.style.display = 'none';
    }
}

function updateWordList() {
    var allWords = [];
    Object.values(watchedVideos).forEach(playlist => {
        playlist.forEach(video => {
            if (video.notes) {
                allWords = allWords.concat(video.notes);
            }
        });
    });

    var tableBody = document.querySelector('#word-list-table tbody');
    tableBody.innerHTML = '';

    var maxWordLength = 0;
    var maxContextLength = 0;
    var maxTranslationLength = 0;

    allWords.forEach((note, index) => {
        var row = tableBody.insertRow();
        row.className = index % 2 === 0 ? 'even' : 'odd';
        var cellNumber = row.insertCell(0);
        var cellWord = row.insertCell(1);
        var cellContext = row.insertCell(2);
        var cellTranslation = row.insertCell(3);
        
        cellNumber.textContent = index + 1;
        cellWord.textContent = note.word;
        cellContext.textContent = note.context;
        cellTranslation.textContent = note.translation;

        maxWordLength = Math.max(maxWordLength, note.word.length);
        maxContextLength = Math.max(maxContextLength, note.context.length);
        maxTranslationLength = Math.max(maxTranslationLength, note.translation.length);
    });

    // Ustawiamy szerokość kontenera na podstawie najdłuższych wpisów
    var container = document.getElementById('word-list-container');
    var numberWidth = 30; // Szerokość kolumny z numeracją
    var wordWidth = maxWordLength * 10; // Przybliżona szerokość znaku w pikselach
    var contextWidth = maxContextLength * 10;
    var translationWidth = maxTranslationLength * 10;
    var totalWidth = numberWidth + wordWidth + contextWidth + translationWidth + 100; // Dodajemy margines na obramowanie i padding
    container.style.width = totalWidth + 'px';

    // Ustawiamy szerokość kolumn
    var table = document.getElementById('word-list-table');
    table.style.width = '100%';
    table.style.tableLayout = 'fixed';
    var columns = table.getElementsByTagName('th');
    columns[0].style.width = (numberWidth / totalWidth * 100) + '%';
    columns[1].style.width = (wordWidth / totalWidth * 100) + '%';
    columns[2].style.width = (contextWidth / totalWidth * 100) + '%';
    columns[3].style.width = (translationWidth / totalWidth * 100) + '%';
}

// Dodaj tę funkcj na końcu sekcji <script>
function makeDraggable(elmnt, isIframe = false) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    var header = isIframe ? null : elmnt.querySelector('#word-list-header');
    var resizer = isIframe ? document.getElementById('iframe-resizer') : elmnt.querySelector('#word-list-resizer');

    if (header) {
        header.onmousedown = dragMouseDown;
    } else if (!isIframe) {
        elmnt.onmousedown = dragMouseDown;
    }

    if (resizer) {
        resizer.onmousedown = resizeMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function resizeMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeResizeElement;
        document.onmousemove = elementResize;
    }

    function elementResize(e) {
        e = e || window.event;
        e.preventDefault();
        var newWidth = elmnt.offsetWidth + (e.clientX - pos3);
        var newHeight = elmnt.offsetHeight + (e.clientY - pos4);
        
        // Ustaw minimalne wymiary
        newWidth = Math.max(newWidth, 300);
        newHeight = Math.max(newHeight, 200);
        
        if (isIframe) {
            // Ogranicz maksymalną wysokość do wysokości okna
            var maxHeight = window.innerHeight - elmnt.getBoundingClientRect().top - 20;
            newHeight = Math.min(newHeight, maxHeight);
        }
        
        elmnt.style.width = newWidth + "px";
        elmnt.style.height = newHeight + "px";
        pos3 = e.clientX;
        pos4 = e.clientY;

        if (isIframe) {
            // Aktualizuj wysokość iframe'a
            var iframe = elmnt.querySelector('iframe');
            iframe.style.height = newHeight + "px";
            iframe.style.width = newWidth + "px";
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }

    function closeResizeElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Wywołaj tę funkcję po załadowaniu strony
window.addEventListener('load', function() {
    var wordListContainer = document.getElementById("word-list-container");
    makeDraggable(wordListContainer);

    var iframeContainer = document.querySelector('.iframe-container');
    makeDraggable(iframeContainer, true);
});

function changeDictionary() {
    const select = document.getElementById('dictionary-select');
    const checkbox = document.getElementById('default-dictionary-checkbox');
    const selectedUrl = select.value;
    
    if (selectedUrl === 'add_new') {
        addNewDictionary();
    } else if (selectedUrl === 'remove_dictionary') {
        removeDictionary();
    } else {
        // Dodaj parametr dark=1 do URL jeśli tryb ciemny jest aktywny
        const isDarkMode = document.body.classList.contains('dark-mode');
        const urlWithDarkMode = isDarkMode ? 
            `${selectedUrl}${selectedUrl.includes('?') ? '&' : '?'}dark=1` : 
            selectedUrl;
            
        addNewTab();
        // Aktualizuj stan checkboxa
        const defaultDictionary = localStorage.getItem('defaultDictionary');
        checkbox.checked = (defaultDictionary === selectedUrl);
    }
}

function addNewDictionary() {
    const name = prompt("Enter the name of the new dictionary:");
    if (name) {
        let url = prompt("Enter the URL of the new dictionary (without https://):");
        if (url) {
            // Dodaj https:// jeśli nie zostało podane
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            const select = document.getElementById('dictionary-select');
            const option = document.createElement('option');
            option.value = url;
            option.textContent = name;
            
            // Wstaw nową opcję przed "Add new"
            const addNewOption = select.querySelector('option[value="add_new"]');
            select.insertBefore(option, addNewOption);
            
            select.value = url;
            changeDictionary();
            
            // Zapisz nowy słownik w localStorage
            const dictionaries = JSON.parse(localStorage.getItem('customDictionaries') || '[]');
            dictionaries.push({ name, url });
            localStorage.setItem('customDictionaries', JSON.stringify(dictionaries));
        }
    }
    // Jeśli użytkownik anulował, przywróć poprzednią wartość
    const select = document.getElementById('dictionary-select');
    if (select.value === 'add_new') {
        select.value = select.querySelector('option:not([value="add_new"]):not([value="remove_dictionary"])').value;
    }
    changeDictionary();
}

function removeDictionary() {
    const select = document.getElementById('dictionary-select');
    
    // Tworzymy nowe okno dialogowe
    const dialog = document.createElement('dialog');
    dialog.innerHTML = `
        <h3>Select a dictionary to remove</h3>
        <select id="dictionary-to-remove">
            ${Array.from(select.options)
                .filter(option => !['add_new', 'remove_dictionary'].includes(option.value))
                .map(option => `<option value="${option.value}">${option.text}</option>`)
                .join('')}
        </select>
        <div>
            <button id="confirm-remove">Remove</button>
            <button id="cancel-remove">Cancel</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    dialog.showModal();

    // Obsługa przycisków
    dialog.querySelector('#confirm-remove').addEventListener('click', () => {
        const selectToRemove = dialog.querySelector('#dictionary-to-remove');
        const dictionaryToRemove = selectToRemove.options[selectToRemove.selectedIndex].text;
        const optionToRemove = Array.from(select.options).find(option => option.text === dictionaryToRemove);
        
        if (optionToRemove) {
            // Usuń z select
            select.removeChild(optionToRemove);
            
            // Usuń z localStorage
            const dictionaries = JSON.parse(localStorage.getItem('customDictionaries') || '[]');
            const updatedDictionaries = dictionaries.filter(dict => dict.name !== dictionaryToRemove);
            localStorage.setItem('customDictionaries', JSON.stringify(updatedDictionaries));
            
            // Jeśli usunięty słownik był domyślny, usuń ustawienie domyślne
            if (localStorage.getItem('defaultDictionary') === optionToRemove.value) {
                localStorage.removeItem('defaultDictionary');
                document.getElementById('default-dictionary-checkbox').checked = false;
            }
            
            alert(`Dictionary "${dictionaryToRemove}" has been removed.`);
        }
        
        dialog.close();
        dialog.remove();
    });

    dialog.querySelector('#cancel-remove').addEventListener('click', () => {
        dialog.close();
        dialog.remove();
    });

    // Przywróć poprzednią wartość
    select.value = select.querySelector('option:not([value="add_new"]):not([value="remove_dictionary"])').value;
    changeDictionary();
}

// Dodaj tę funkcję, aby ładować niestandardowe słowniki przy starcie
function loadCustomDictionaries() {
    const dictionaries = JSON.parse(localStorage.getItem('customDictionaries') || '[]');
    const select = document.getElementById('dictionary-select');
    
    // Usuń wszystkie opcje z select
    while (select.firstChild) {
        select.removeChild(select.firstChild);
    }
    
    // Dodaj domyślne słowniki
    const defaultDictionaries = [
        { name: 'onelook.com', url: 'https://www.onelook.com/' },
        { name: 'diki.pl', url: 'https://www.diki.pl/' },
        { name: 'dict.com', url: 'https://dict.com/angielsko-polski' },
        { name: 'ling.pl', url: 'https://ling.pl/' }
    ];
    
    // Dodaj domyślne i niestandardowe słowniki
    [...defaultDictionaries, ...dictionaries].forEach(dict => {
        const option = document.createElement('option');
        option.value = dict.url;
        option.textContent = dict.name;
        select.appendChild(option);
    });
    
    // Dodaj opcje "Add new" i "Remove" na końcu
    const addNewOption = document.createElement('option');
    addNewOption.value = 'add_new';
    addNewOption.textContent = 'Add new';
    select.appendChild(addNewOption);
    
    const removeOption = document.createElement('option');
    removeOption.value = 'remove_dictionary';
    removeOption.textContent = 'Remove';  // Zmieniono z 'Remove dictionary' na 'Remove'
    select.appendChild(removeOption);
}

// Wywołaj tę funkcję przy ładowaniu strony
window.addEventListener('load', function() {
    loadCustomDictionaries();
    loadDefaultDictionary();
    // ... inne funkcje wywoływane przy ładowaniu ...
});

function adjustIframeSize(videoId) {
    var container = document.querySelector('.iframe-container');
    var rightColumn = document.querySelector('.right-column');
    var dictionarySelect = document.querySelector('#dictionary-select');
    var dictionarySelectContainer = document.querySelector('.dictionary-select-container');
    var separator = document.querySelector('#separator');
    var activeNoteForm = document.querySelector('.note-form[style="display: block;"]');
    
    // Oblicz minimalną górną pozycję (tuż pod separatorem)
    var minTop = dictionarySelect.offsetTop + dictionarySelect.offsetHeight;
    
    if (window.innerWidth  > 520 ) { // tryb desktop, na mobile
        if (activeNoteForm) { //notatka otwarta
        var lastWordPair = activeNoteForm.querySelector('.word-translation-pair:last-child');
        if (lastWordPair) {
            var lastWordPairRect = lastWordPair.getBoundingClientRect();
            var newTop = Math.max(minTop, lastWordPairRect.bottom + window.pageYOffset - 295); // Podwyzszanie słownika
            container.style.top = newTop + 'px';
            dictionarySelectContainer.style.position = 'relative';   //wazne! 
            dictionarySelectContainer.style.top = newTop + 125+ 'px'; // offset
        } else {
            container.style.top = minTop + 'px';
            dictionarySelectContainer.style.position = 'sticky';
        }
    }   else {  // pozycja default słwonika na stronie, notatka zamknieta
            container.style.top = minTop - 213 +'px';   
            dictionarySelectContainer.style.position = 'sticky'; // powrot do sticky , zadziałalo
            dictionarySelectContainer.style.top = 'auto';  // zadziałalo      
        }

    }

    else { //mobile

        if (activeNoteForm) { //notatka otwarta
            var videoList = document.getElementById('video-list');
            var allItems = Array.from(videoList.getElementsByTagName('li'))
            var videoItems = videoList.getElementsByTagName('li');
            var rowHeight = 30; // Przybliżona wysokość jednego wiersza

            var lastWordPair = activeNoteForm.querySelector('.word-translation-pair:last-child');
            var clickedIndex = 0;
            var listOffset = 0;
            if (videoId){
            listItemVideoId = document.getElementById(videoId);
            clickedIndex = allItems.indexOf(listItemVideoId);
            listOffset = (allItems.length - (clickedIndex + 1)) * rowHeight;
            }
            else{
                console.log('No videoID');
                listOffset = 0;
            }
            
        
            console.log('Clicked item index:', clickedIndex + 1); // +1 dla numeracji od 1
            console.log('Total items:', allItems.length);

            if (lastWordPair) {
                var lastWordPairRect = lastWordPair.getBoundingClientRect();
                var newTop = Math.max(minTop, lastWordPairRect.bottom + window.pageYOffset - 295); // Podwyzszanie słownika
                container.style.top = minTop  + 22 - listOffset + 'px';
                dictionarySelectContainer.style.position = 'relative';   //wazne! 
                dictionarySelectContainer.style.top = minTop + 40 + 125 - listOffset + 'px'; // offset
            } else {
                container.style.top = minTop + 'px';
                dictionarySelectContainer.style.position = 'sticky';
            }
        } else {  // pozycja default słwonika na stronie, notatka zamknieta
            container.style.top = minTop - 210 + 'px';   
            dictionarySelectContainer.style.position = 'relative'; // powrot do sticky , zadziałalo
            dictionarySelectContainer.style.top = minTop - 70 + 'px';
        }
        //var separator = document.querySelector('#separator');
        //separator.style.zIndex = '1000';
        //dictionarySelect.style.zIndex = '1000';
        //dictionarySelectContainer.style.zIndex = '1000';
        container.style.zIndex = '1000';
        //container.style.background = 'none';
    }
    // Dostosuj szerokość kontenera do szerokości dropdown menu
    container.style.width = dictionarySelect.offsetWidth + 'px';
}

function calculateNoteFormHeight() {
    var activeNoteForm = document.querySelector('.note-form[style="display: block;"]');
    if (activeNoteForm) {
        return activeNoteForm.offsetHeight + 20; // Dodajemy 20px dodatkowego miejsca
    }
    return 0;
}
/*
function addNoteIconHoverListeners() {
    var noteIcons = document.querySelectorAll('.note-icon');
    noteIcons.forEach(function(icon) {
        icon.addEventListener('mouseenter', adjustIframeSize);
        icon.addEventListener('mouseleave', adjustIframeSize);
    });
}
*/

// Dodaj wywołanie funkcji adjustIframeSize przy adowaniu strony i zmianie rozmiaru okna
window.addEventListener('load', adjustIframeSize);
window.addEventListener('resize', adjustIframeSize);

// Dodaj wywołanie funkcji adjustIframeSize po każdej zmianie w notatkach

function addNoteIconHoverListeners() {
   // var noteIcons = document.querySelectorAll('.note-icon');
  //  noteIcons.forEach(function(icon) {
 //       icon.addEventListener('mouseenter', adjustIframeSize);
 //       icon.addEventListener('mouseleave', adjustIframeSize);
 //   });
}


// Wywołaj addNoteIconHoverListeners po zaadowaniu strony i po każdej aktualizacji listy notatek
window.addEventListener('load', addNoteIconHoverListeners);
// Dodaj wywołanie addNoteIconHoverListeners w funkcji updateWatchedVideosList

// Dodaj nasłuchiwanie na zdarzenie zmiany rozmiaru okna
window.addEventListener('resize', adjustIframeSize);

function checkLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('localStorage jest dostępny');
        return true;
    } catch(e) {
        console.error('localStorage nie jest dostępny:', e);
        console.error('Stos wywołań:', e.stack);
        return false;
    }
}

// Wywołaj tę funkcję przy ładowaniu strony i po każdej operacji na localStorage
window.addEventListener('load', function() {
    checkLocalStorage();
    debugLocalStorage();
});

// Dodaj tę funkcję, aby sprawdzić stan localStorage w dowolnym momencie
function debugLocalStorage() {
    console.log('Zawartość localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`${key}: ${value}`);
    }
}

function initializeWatchedVideos() {
    if (!watchedVideos || typeof watchedVideos !== 'object') {
        watchedVideos = {};
    }
    playlists.forEach(playlist => {
        if (!watchedVideos[playlist.id]) {
            watchedVideos[playlist.id] = [];
        }
    });
}

function makeResizable(element) {
    const resizer = element.querySelector('.player-resizer');
    let isResizing = false;
    let originalWidth, originalHeight, originalX, originalY;

    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        originalWidth = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
        originalHeight = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
        originalX = e.pageX;
        originalY = e.pageY;
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        const width = originalWidth + (e.pageX - originalX);
        const height = originalHeight + (e.pageY - originalY);
        element.style.width = width + 'px';
        element.style.height = height + 'px';
        
        // Dostosuj rozmiar iframe'a YouTube
        const youtubeIframe = element.querySelector('iframe');
        if (youtubeIframe) {
            youtubeIframe.style.width = '100%';
            youtubeIframe.style.height = '100%';
        }
        
        adjustResizerPosition(); // Dodajemy to wywołanie
    });

    document.addEventListener('mouseup', function() {
        isResizing = false;
        document.body.style.cursor = 'default';
        adjustResizerPosition(); // Dodajemy to wywołanie
    });
}

// Wywołajmy tę funkcję również po załadowaniu strony
window.addEventListener('load', function() {
    const playerContainer = document.querySelector('.player-container');
    makeResizable(playerContainer);
    adjustResizerPosition();
});

function adjustResizerPosition() {
    const playerContainer = document.querySelector('.player-container');
    const resizer = playerContainer.querySelector('.player-resizer');
    resizer.style.right = '0';
    resizer.style.bottom = '0';
}

window.addEventListener('resize', function() {
    var activeNoteForm = document.querySelector('.note-form[style="display: block;"]');
    if (activeNoteForm) {
        var videoId = activeNoteForm.closest('li').id;
        adjustYouTubePlayerPosition(videoId, false);
    }
});

// Add this function to update the watched count
function updateWatchedCount() {
    var watchedCount = watchedVideos[currentPlaylistId] ? watchedVideos[currentPlaylistId].length : 0;
    document.getElementById('watched-count').textContent = watchedCount;
}

function exportWordList() {
    var allWords = [];
    Object.values(watchedVideos).forEach(playlist => {
        playlist.forEach(video => {
            if (video.notes) {
                video.notes.forEach(note => {
                    allWords.push({
                        front: note.word,
                        back: note.translation,
                        context: note.context,
                        videoTitle: video.title
                    });
                });
            }
        });
    });

    // Export as CSV
    var csvContent = "front;back;context;;;Video Title\n";
    allWords.forEach(note => {
        csvContent += `${escapeCSV(note.front)};`;
        csvContent += `${escapeCSV(note.back)};`;
        csvContent += `${escapeCSV(note.context)};`;
        csvContent += `;;`;
        csvContent += `${escapeCSV(note.videoTitle)}\n`;
    });

    // Create and trigger download for CSV
    downloadFile(csvContent, 'anki_import.csv', 'text/csv;charset=utf-8');
}

function downloadFile(content, fileName, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var link = document.createElement("a");
    if (link.download !== undefined) {
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
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

// Dodaj te funkcje na końcu pliku

function setDefaultDictionary() {
    const select = document.getElementById('dictionary-select');
    const checkbox = document.getElementById('default-dictionary-checkbox');
    if (checkbox.checked) {
        localStorage.setItem('defaultDictionary', select.value);
    } else {
        localStorage.removeItem('defaultDictionary');
    }
    // Dodajemy to wywołanie, aby zaktualizować stan checkboxa
    changeDictionary();
}

function loadDefaultDictionary() {
    const defaultDictionary = localStorage.getItem('defaultDictionary');
    const select = document.getElementById('dictionary-select');
    const checkbox = document.getElementById('default-dictionary-checkbox');
    
    if (defaultDictionary) {
        select.value = defaultDictionary;
        checkbox.checked = true;
    } else {
        // Jeśli nie ma zapisanego domyślnego słownika, ustaw pierwszy z listy
        select.selectedIndex = 0;
        checkbox.checked = false;
    }
    
    // Zwróć URL wybranego słownika
    return select.value;
}

// Upewnijmy się, że loadDefaultDictionary jest wywoływane po załadowaniu strony
window.addEventListener('load', loadDefaultDictionary);

document.addEventListener('DOMContentLoaded', function() {
    const mainContainer = document.querySelector('.main-container');

    function adjustLayoutForMobile() {
        if (window.innerWidth  <= 520) {
            mainContainer.classList.add('mobile-view');
        } else {
            mainContainer.classList.remove('mobile-view');
        }
        
        // Dostosuj rozmiar playera YouTube po zmianie układu
        if (typeof autosizePlayer === 'function') {
            setTimeout(autosizePlayer, 300);
        }
    }

    // Wywołaj funkcję przy załadowaniu strony i przy zmianie rozmiaru okna
    adjustLayoutForMobile();
    window.addEventListener('resize', adjustLayoutForMobile);
});

// Dodaj nową funkcję do przełączania funkcjonalności
function toggleAddToWatchedOnStart() {
    addToWatchedOnStart = !addToWatchedOnStart;
    var button = document.getElementById('toggle-add-to-watched');
    button.textContent = addToWatchedOnStart ? 'Create a note on end of movie' : 'Create a note on beginning of movie';
}

// Dodaj nową funkcję do inicjalizacji przycisku
function initializeAddToWatchedButton() {
    var button = document.getElementById('toggle-add-to-watched');
    button.textContent = 'Create a note on end of movie';
    // Usunięto renderTabs();
}

// Dodaj wywołanie tej funkcji w onYouTubeIframeAPIReady lub w event listener 'load'
window.addEventListener('load', function() {
    // ... inne istniejące wywołania ...
    initializeAddToWatchedButton();
});

let tabs = [];

// Zmodyfikuj funkcję addNewTab
function addNewTab() {
    const dictionarySelect = document.getElementById('dictionary-select');
    const selectedDictionary = dictionarySelect.value;
    const dictionaryName = dictionarySelect.options[dictionarySelect.selectedIndex].text;
    
    // Usuń komunikat "No dictionary selected"
    const iframeContainer = document.getElementById('iframe-container');
    if (iframeContainer.innerHTML.includes('No dictionary selected')) {
        iframeContainer.innerHTML = '';
    }
    
    const newTab = {
        id: Date.now(),
        name: dictionaryName,
        url: selectedDictionary
    };
    
    tabs.push(newTab);
    renderTabs();
    createIframe(newTab);
    switchToTab(newTab.id);
}

// Dodaj nową funkcję createIframe
function createIframe(tab) {
    const iframeContainer = document.getElementById('iframe-container');
    const iframe = document.createElement('iframe');
    iframe.src = tab.url;
    iframe.id = `iframe-${tab.id}`;
    iframe.style.display = 'none';
    iframeContainer.appendChild(iframe);
}

// Zmodyfikuj funkcję switchToTab
function switchToTab(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const iframeContainer = document.getElementById('iframe-container');
    const iframes = iframeContainer.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        iframe.style.display = 'none';
    });
    
    const activeIframe = document.getElementById(`iframe-${tabId}`);
    if (activeIframe) {
        activeIframe.style.display = 'block';
    }
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-id="${tabId}"]`).classList.add('active');
}

// Zmodyfikuj funkcję renderTabs
function renderTabs() {
    const tabsContainer = document.getElementById('tabs');
    tabsContainer.innerHTML = '';
    
    tabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.setAttribute('data-id', tab.id);
        tabElement.onclick = () => switchToTab(tab.id); // Dodajemy to
        
        const tabText = document.createElement('span');
        tabText.textContent = tab.name;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.className = 'close-tab';
        closeButton.onclick = (e) => {
            e.stopPropagation(); // Zapobiegamy propagacji zdarzenia do rodzica
            closeTab(tab.id);
        };
        
        tabElement.appendChild(tabText);
        tabElement.appendChild(closeButton);
        tabsContainer.appendChild(tabElement);
    });
}

// Dodaj nową funkcję closeTab
function closeTab(tabId) {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    // Usu�� zakładkę z tablicy
    tabs.splice(tabIndex, 1);

    // Usuń odpowiadający iframe
    const iframe = document.getElementById(`iframe-${tabId}`);
    if (iframe) {
        iframe.remove();
    }

    // Jeśli zamykamy aktywną zakładkę, przełącz na inną
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.getAttribute('data-id') == tabId) {
        if (tabs.length > 0) {
            switchToTab(tabs[0].id);
        } else {
            // Jeśli nie ma więcej zakładek, możesz np. pokazać pusty kontener
            const iframeContainer = document.getElementById('iframe-container');
            iframeContainer.innerHTML = '<p></p>';
        }
    }

    // Przerysuj zakładki
    renderTabs();
}

// Zmodyfikuj funkcję changeDictionary
function changeDictionary() {
    const select = document.getElementById('dictionary-select');
    const checkbox = document.getElementById('default-dictionary-checkbox');
    const selectedUrl = select.value;
    
    if (selectedUrl === 'add_new') {
        addNewDictionary();
    } else if (selectedUrl === 'remove_dictionary') {
        removeDictionary();
    } else {
        // Dodaj parametr dark=1 do URL jeśli tryb ciemny jest aktywny
        const isDarkMode = document.body.classList.contains('dark-mode');
        const urlWithDarkMode = isDarkMode ? 
            `${selectedUrl}${selectedUrl.includes('?') ? '&' : '?'}dark=1` : 
            selectedUrl;
            
        addNewTab();
        // Aktualizuj stan checkboxa
        const defaultDictionary = localStorage.getItem('defaultDictionary');
        checkbox.checked = (defaultDictionary === selectedUrl);
    }
}

// Dodaj tę nową funkcję
function updateDefaultDictionaryCheckbox() {
    const select = document.getElementById('dictionary-select');
    const checkbox = document.getElementById('default-dictionary-checkbox');
    const defaultDictionary = localStorage.getItem('defaultDictionary');
    checkbox.checked = (defaultDictionary === select.value);
}

// Zmodyfikuj funkcję initializeFirstTab
function initializeFirstTab() {
    const dictionaryUrl = loadDefaultDictionary();
    const dictionarySelect = document.getElementById('dictionary-select');
    const selectedOption = dictionarySelect.options[dictionarySelect.selectedIndex];
    
    const firstTab = {
        id: Date.now(),
        name: selectedOption.text,
        url: dictionaryUrl
    };
    
    tabs.push(firstTab);
    renderTabs();
    createIframe(firstTab);
    switchToTab(firstTab.id);
    updateDefaultDictionaryCheckbox();
}

// Dodaj nasłuchiwanie na zmiany w select
document.getElementById('dictionary-select').addEventListener('change', updateDefaultDictionaryCheckbox);

// Dodaj tę funkcję, aby inicjalizować pierwszą zakładkę przy ładowaniu strony
function initializeFirstTab() {
    const dictionaryUrl = loadDefaultDictionary();
    const dictionarySelect = document.getElementById('dictionary-select');
    const selectedOption = dictionarySelect.options[dictionarySelect.selectedIndex];
    
    const firstTab = {
        id: Date.now(),
        name: selectedOption.text,
        url: dictionaryUrl
    };
    
    tabs.push(firstTab);
    renderTabs();
    createIframe(firstTab);
    switchToTab(firstTab.id);
    updateDefaultDictionaryCheckbox();
}

// Zmodyfikuj funkcję onYouTubeIframeAPIReady
function onYouTubeIframeAPIReady() {
    console.log("API YouTube IFrame załadowane.");
    loadPlaylistsFromLocalStorage();
    loadTrimTimesFromLocalStorage();
    loadWatchedVideosFromLocalStorage();
    initializeWatchedVideos();
    initializeDefaultTrimTimes();
    createPlaylistButtons();
    loadPlaylist(playlists[0].id);
    updateWatchedCount();
    initializeAddToWatchedButton();
    initializeFirstTab();
    initializeColumnResizer();
    
    // Dodaj to wywołanie
    const ratio = loadDefaultColumnRatio();
    applyColumnRatio(ratio);
    
    setTimeout(autosizePlayer, 100);
}

function initializeColumnResizer() {
    const divider = document.querySelector('.column-divider');
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    let isResizing = false;

    // Dodajemy wywołanie funkcji pokazującej tooltip
    showColumnDividerTooltip();

    divider.addEventListener('mousedown', startResizing);

    function startResizing(e) {
        console.log('Started resizing');
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResizing);
        e.preventDefault();
    }

    function resize(e) {
        if (!isResizing) return;

        const containerWidth = document.querySelector('.main-container').offsetWidth;
        const mouseX = e.clientX;
        const containerLeft = document.querySelector('.main-container').getBoundingClientRect().left;
        const position = mouseX - containerLeft;

        // Oblicz procenty
        const leftPercent = (position / containerWidth) * 100;
        const rightPercent = 100 - leftPercent;

        // Ustaw minimalne szerokości (np. 20%)
        if (leftPercent < 20 || leftPercent > 80) return;

        leftColumn.style.width = leftPercent + '%';
        rightColumn.style.width = (rightPercent - 0.4) + '%';

        // Dostosuj szerokość iframe'a i jego kontenera
        const iframeContainer = document.querySelector('.iframe-container');
        const tabs = document.querySelectorAll('iframe');
        if (iframeContainer) {
            iframeContainer.style.width = '100%';
            tabs.forEach(iframe => {
                iframe.style.width = '100%';
            });
        }

        // Aktualizuj rozmiar playera YouTube
        autosizePlayer();
    }

    function stopResizing() {
        isResizing = false;
        document.body.style.cursor = 'default';
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResizing);
        
        // Dodaj zapisywanie aktualnego podziału
        const containerWidth = document.querySelector('.main-container').offsetWidth;
        const leftColumn = document.querySelector('.left-column');
        const leftWidth = (leftColumn.offsetWidth / containerWidth) * 100;
        saveDefaultColumnRatio(Math.round(leftWidth));
    }
}

// Dodaj wywołanie funkcji przy ładowaniu strony
window.addEventListener('load', initializeColumnResizer);

function openSettings() {
    let settingsForm = document.getElementById('review-settings-form');
    let overlay = document.getElementById('settings-overlay');
    
    if (settingsForm) {
        settingsForm.remove();
        overlay.remove();
        return;
    }

    overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    overlay.id = 'settings-overlay';
    
    const bbcPlaylistEnabled = localStorage.getItem('bbcPlaylistEnabled') === 'true';
    const currentRatio = loadDefaultColumnRatio();
    
    settingsForm = document.createElement('div');
    settingsForm.id = 'review-settings-form';
    settingsForm.className = 'settings-form';
    settingsForm.innerHTML = `
        <div class="settings-header">
            <h3>Settings</h3>
            <button onclick="closeSettings()" class="close-button">×</button>
        </div>
        <div class="settings-group">
            <label class="checkbox-label">
                <input type="checkbox" id="bbcPlaylistCheckbox" ${bbcPlaylistEnabled ? 'checked' : ''}>
                BBC learning English playlists
            </label>
        </div>
        <div class="settings-group">
            <label>Column divider ratio:</label>
            <div class="ratio-control">
                <input type="range" id="columnRatioSlider" 
                    min="20" max="80" value="${currentRatio}" 
                    class="ratio-slider">
                <span id="ratioValue">${currentRatio}%</span>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(settingsForm);
    
    // Event listener dla checkboxa BBC
    const checkbox = settingsForm.querySelector('#bbcPlaylistCheckbox');
    checkbox.addEventListener('change', function() {
        localStorage.setItem('bbcPlaylistEnabled', this.checked);
        updatePlaylistVisibility();
    });
    
    // Event listener dla suwaka
    const slider = settingsForm.querySelector('#columnRatioSlider');
    const ratioValue = settingsForm.querySelector('#ratioValue');
    slider.addEventListener('input', function() {
        ratioValue.textContent = this.value + '%';
        saveDefaultColumnRatio(this.value);
    });
    
    overlay.addEventListener('click', closeSettings);
}

// Dodaj wywołanie przy inicjalizacji
window.addEventListener('load', function() {
    const ratio = loadDefaultColumnRatio();
    applyColumnRatio(ratio);
});

// Dodaj funkcję do zapisywania i wczytywania domyślnego podziału
function saveDefaultColumnRatio(ratio) {
    localStorage.setItem('defaultColumnRatio', ratio);
    applyColumnRatio(ratio);
}

function loadDefaultColumnRatio() {
    return localStorage.getItem('defaultColumnRatio') || 44;
}

function applyColumnRatio(ratio) {
    // Nie stosuj podziału dla małych ekranów
    if (window.innerWidth  <= 520) {
        return;
    }
    
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    leftColumn.style.width = ratio + '%';
    rightColumn.style.width = (100 - ratio - 0.4) + '%';
    
    // Dostosuj szerokość iframe'a i jego kontenera
    const iframeContainer = document.querySelector('.iframe-container');
    const iframes = document.querySelectorAll('iframe');
    if (iframeContainer) {
        iframeContainer.style.width = '100%';
        iframes.forEach(iframe => {
            iframe.style.width = '100%';
        });
    }
    
    // Aktualizuj rozmiar playera YouTube
    autosizePlayer();
}

// Funkcja do aktualizacji widoczności playlist
function updatePlaylistVisibility() {
    const bbcPlaylistEnabled = localStorage.getItem('bbcPlaylistEnabled') === 'true';
    
    if (!bbcPlaylistEnabled) {
        // Jeśli BBC jest wyłączone, usuwamy TYLKO domyślne playlisty BBC, zachowując custom playlisty
        playlists = playlists.filter(playlist => 
            !defaultPlaylists.some(defaultPlaylist => defaultPlaylist.id === playlist.id)
        );
    } else {
        // Jeśli BBC jest włączone, dodajemy domyślne playlisty BBC
        defaultPlaylists.forEach(bbcPlaylist => {
            if (!playlists.some(p => p.id === bbcPlaylist.id)) {
                playlists.push(bbcPlaylist);
            }
        });
    }

    // Zapisz stan playlist w localStorage
    savePlaylistsToLocalStorage();
    
    // Aktualizuj przyciski playlist
    createPlaylistButtons();
    
    // Jeśli nie ma aktywnej playlisty lub aktywna playlista została usunięta,
    // załaduj pierwszą dostępną playlistę
    if (!playlists.some(p => p.id === currentPlaylistId)) {
        if (playlists.length > 0) {
            loadPlaylist(playlists[0].id);
        }
    }
}

// Dodaj wywołanie przy starcie aplikacji
window.addEventListener('load', function() {
    // Wczytaj stan z localStorage
    const bbcPlaylistEnabled = localStorage.getItem('bbcPlaylistEnabled');
    // Jeśli nie ma zapisanego stanu, ustaw domyślnie na true
    if (bbcPlaylistEnabled === null) {
        localStorage.setItem('bbcPlaylistEnabled', 'true');
    }
    updatePlaylistVisibility();
});

function closeSettings(){
    const settingsForm = document.getElementById('review-settings-form');
    const overlay = document.getElementById('settings-overlay');
    if (settingsForm) settingsForm.remove();
    if (overlay) overlay.remove();
}

function extractPlaylistId(link) {
    // Obsługa różnych formatów linków do playlist YouTube
    const patterns = [
        /[?&]list=([^&]+)/,  // Format: ?list= lub &list=
        /youtu.be\/.*[?&]list=([^&]+)/, // Format: youtu.be z list=
        /youtube.com\/playlist\?list=([^&]+)/ // Format: bezpośredni link do playlisty
    ];

    for (let pattern of patterns) {
        const match = link.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Zmodyfikowana funkcja debounce
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

// Zmodyfikowana funkcja sprawdzająca orientację
function checkOrientation() {
    console.log('checkOrientation wywołane'); // Dodajemy log do debugowania
    
    if (isPortrait) {
        console.log('Orientacja pionowa');
        //document.body.classList.add('index-dark-mode');
    } else if (isLandscape) {
        console.log('Orientacja pozioma');
      //  document.body.classList.remove('index-dark-mode');
    }
}


// Tworzymy zdebounce'owaną wersję funkcji
const debouncedCheckOrientation = debounce(checkOrientation, 250);

// Dodajemy bezpośrednie nasłuchiwanie na zdarzenie resize
window.addEventListener('resize', function() {
    console.log('Zdarzenie resize wywołane'); // Dodajemy log do debugowania
    debouncedCheckOrientation();
});

// Sprawdzamy orientację przy załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded wywołane'); // Dodajemy log do debugowania
    checkOrientation();
});

// Dodatkowe sprawdzenie po pełnym załadowaniu strony
window.addEventListener('load', function() {
    console.log('Load wywołane'); // Dodajemy log do debugowania
    checkOrientation();
});
/*
// Alternatywne podejście - użycie matchMedia
const mediaQuery = window.matchMedia("(orientation: portrait)");

function handleOrientationChange(e) {
    console.log('Zmiana orientacji wykryta');
    if (e.matches) {
        console.log('Orientacja pionowa');
        document.body.classList.add('index-dark-mode');
    } else {
        console.log('Orientacja pozioma');
        document.body.classList.remove('index-dark-mode');
    }
}

// Dodaj nasłuchiwanie na zmiany orientacji
mediaQuery.addListener(handleOrientationChange);

// Sprawdź orientację przy starcie
handleOrientationChange(mediaQuery);
*/
