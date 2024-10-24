var player;
var watchedVideos = {}; // Obiekt przechowujący obejrzane filmy dla każdej playlisty
var currentVideoId = null;
var currentVideoTitle = null;
var isAutoplayEnabled = false;
var currentPlaylistId = '';

var playlistVideoIds = [];
var videoIdToIndexMap = {};

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

    watchedVideos[currentPlaylistId].forEach(function(video, index) {
        var videoId = video.id;
        var title = video.title.replace(/[⏲️⏰✈️]/g, '').trim();
        var videoIndex = videoIdToIndexMap[videoId];
        var videoNumber = videoIndex !== undefined ? videoIndex + 1 : 1; // Zmiana tutaj

        var listItem = document.createElement('li');
        listItem.id = videoId;

        listItem.innerHTML = `
            <a onclick="playPlaylistFromIndex('${videoId}')">${videoNumber}. ${title}</a>
            <span class="note-icon" onclick="toggleNoteForm('${videoId}')">${video.notes && video.notes.length > 0 ? '📝' : '➕'}</span>
            <div class="note-form" style="display: none;">
                <div class="word-translation-pairs"></div>
                <button onclick="addWordTranslationPair('${videoId}')">+ Dodaj słowo/frazę</button>
                <button onclick="saveNote('${videoId}')">Zapisz notatkę</button>
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
            smoothScrollTo(offset, 1000); // 1000ms (1 sekunda) na animację
            
            // Dostosuj pozycję playera YouTube
            adjustYouTubePlayerPosition(videoId, true);
        }, 100); // Dajemy trochę czasu na renderowanie formularza
    } else {
        saveNote(videoId);
        noteForm.style.display = 'none';
        noteIcon.textContent = noteIcon.textContent === '➖' ? '➕' : '📝'; // Przywracamy oryginalną ikonę
        
        // Przywróć oryginalną pozycję playera YouTube
        resetYouTubePlayerPosition();
    }
    setTimeout(adjustIframeSize, 0);
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
            smoothScrollTo(scrollTarget, 500);
        }
    } else {
        resetYouTubePlayerPosition();
    }
}

function resetYouTubePlayerPosition() {
    var playerContainer = document.querySelector('.player-container');
    playerContainer.style.position = 'relative';
    playerContainer.style.width = '100%';
    playerContainer.style.maxWidth = '640px';
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
        const defaultAspectRatio = 16 / 9; // Domyślny współczynnik proporcji
        
        let newWidth = Math.min(maxWidth, 640); // Nie większe niż oryginalne 640px
        let newHeight = newWidth / defaultAspectRatio;
        
        // Ograniczamy wysokość do maksymalnie 360px
        if (newHeight > 360) {
            newHeight = 360;
            newWidth = newHeight * defaultAspectRatio;
        }
        
        playerContainer.style.width = newWidth + 'px';
        playerContainer.style.height = newHeight + 'px';
        playerContainer.style.paddingBottom = '0'; // Usuwamy padding-bottom
        
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

        // Przewiń do 1/6 strony
        var newPairRect = pairDiv.getBoundingClientRect();
        var targetScrollPosition = newPairRect.top + window.pageYOffset - (window.innerHeight / 6);
        smoothScrollTo(targetScrollPosition, 500);
    }, 100);
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
        var playlistName = prompt("Podaj nazwę dla tej playlisty:");
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
        alert("Nieprawidłowy link do playlisty. Spróbuj ponownie.");
    }
}

function addSingleVideo(videoLink) {
    var videoId = extractVideoId(videoLink);
    
    if (videoId) {
        var videoName = prompt("Podaj nazwę dla tego filmu:");
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
        alert("Nieprawidłowy link do filmu. Spróbuj ponownie.");
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

function loadPlaylistsFromLocalStorage() {
    var storedPlaylists = localStorage.getItem('customPlaylists');
    if (storedPlaylists) {
        playlists = JSON.parse(storedPlaylists);
    }
    
    // Upewnij się, że domyślne playlisty zawsze są dostępne
    var defaultPlaylists = [
        { id: 'PLcetZ6gSk96-FECmH9l7Vlx5VDigvgZpt', name: '6 Minute English' },
        { id: 'PLcetZ6gSk96_Fprtuj6gKN9upPjaDrARH', name: 'English In A Minute' },
        { id: 'PLcetZ6gSk96_sototkO7HFkGA8zL8H0lq', name: 'The English We Speak' },
        { id: 'PLcetZ6gSk96--2ELXoJeyafP6wg4n53uh', name: 'Phrasal Verbs' },
        { id: 'PLcetZ6gSk96_zHuVg6Ecy2F7j4Aq4valQ', name: '6 Minute Grammar' }
    ];

    defaultPlaylists.forEach(function(defaultPlaylist) {
        if (!playlists.some(p => p.id === defaultPlaylist.id)) {
            playlists.push(defaultPlaylist);
        }
    });

    savePlaylistsToLocalStorage(); // Zapisz zaktualizowaną listę
}

function removePlaylist(playlistId) {
    if (confirm("Czy na pewno chcesz usunąć tę playlistę?")) {
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
    return playlist ? playlist.name : 'Nieznana playlista';
}

function setTrimTime() {
    var currentTrimTime = trimTimes[currentPlaylistId] || 0;
    var minutes = Math.floor(currentTrimTime / 60);
    var seconds = currentTrimTime % 60;
    var currentTimeString = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

    var timeInput = prompt("Podaj czas w formacie MM:SS, po którym film ma przeskoczyć do końcowych 3 sekund (00:00 aby wyłączyć):", currentTimeString);
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

function adjustIframeSize() {
    var container = document.querySelector('.iframe-container');
    var rightColumn = document.querySelector('.right-column');
    var dictionarySelect = document.querySelector('#dictionary-select');
    var separator = document.querySelector('#separator');
    var activeNoteForm = document.querySelector('.note-form[style="display: block;"]');
    
    // Oblicz minimalną górną pozycję (tuż pod separatorem)
    var minTop = dictionarySelect.offsetTop + dictionarySelect.offsetHeight + separator.offsetHeight;
    
    if (activeNoteForm) {
        var lastWordPair = activeNoteForm.querySelector('.word-translation-pair:last-child');
        if (lastWordPair) {
            var lastWordPairRect = lastWordPair.getBoundingClientRect();
            var newTop = Math.max(minTop, lastWordPairRect.bottom + window.pageYOffset - 160); // Zmieniamy offset na 160px
            container.style.top = newTop + 'px';
        } else {
            container.style.top = minTop + 'px';
        }
    } else {
        container.style.top = minTop + 'px';
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

function addNoteIconHoverListeners() {
    var noteIcons = document.querySelectorAll('.note-icon');
    noteIcons.forEach(function(icon) {
        icon.addEventListener('mouseenter', adjustIframeSize);
        icon.addEventListener('mouseleave', adjustIframeSize);
    });
}

// Dodaj wywołanie funkcji adjustIframeSize przy adowaniu strony i zmianie rozmiaru okna
window.addEventListener('load', adjustIframeSize);
window.addEventListener('resize', adjustIframeSize);

// Dodaj wywołanie funkcji adjustIframeSize po każdej zmianie w notatkach
function addNoteIconHoverListeners() {
    var noteIcons = document.querySelectorAll('.note-icon');
    noteIcons.forEach(function(icon) {
        icon.addEventListener('mouseenter', adjustIframeSize);
        icon.addEventListener('mouseleave', adjustIframeSize);
    });
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
                        word: note.word,
                        translation: note.translation,
                        context: note.context,
                        videoTitle: video.title
                    });
                });
            }
        });
    });

    // Export as CSV
    var csvContent = "Word/Phrase;Translation;Context;;;Video Title\n";
    allWords.forEach(note => {
        csvContent += `${escapeCSV(note.word)};`;
        csvContent += `${escapeCSV(note.translation)};`;
        csvContent += `${escapeCSV(note.context)};`;
        csvContent += `;;`; // Dodajemy dwie puste kolumny
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
        if (window.innerWidth <= 768) {
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

    // Usuń zakładkę z tablicy
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
            iframeContainer.innerHTML = '<p>No dictionary selected</p>';
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
    initializeFirstTab(); // Przenieś to wywołanie tutaj
    setTimeout(autosizePlayer, 100);
}

// Dodaj na końcu pliku script.js
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('autoplay-btn').addEventListener('click', toggleAutoplay);
    document.querySelector('.clear-button').addEventListener('click', clearWatchedVideos);
    document.querySelector('.trim-button').addEventListener('click', setTrimTime);
    document.querySelector('.word-list-button').addEventListener('click', toggleWordList);
    document.getElementById('toggle-add-to-watched').addEventListener('click', toggleAddToWatchedOnStart);
    document.getElementById('dictionary-select').addEventListener('change', changeDictionary);
    document.getElementById('default-dictionary-checkbox').addEventListener('change', setDefaultDictionary);
    document.getElementById('add-tab').addEventListener('click', addNewTab);
    document.getElementById('export-word-list').addEventListener('click', exportWordList);
    document.getElementById('clear-watched-videos').addEventListener('click', clearWatchedVideos);
    document.getElementById('close-word-list').addEventListener('click', toggleWordList);
});

function updateCSPForDictionaries() {
    const dictionaries = [
        'https://www.onelook.com',
        'https://www.diki.pl',
        'https://dict.com',
        'https://ling.pl'
    ];
    
    // Dodaj niestandardowe słowniki
    const customDictionaries = JSON.parse(localStorage.getItem('customDictionaries') || '[]');
    customDictionaries.forEach(dict => {
        const url = new URL(dict.url);
        dictionaries.push(url.origin);
    });
    
    const uniqueDomains = [...new Set(dictionaries)];
    
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    let content = meta.getAttribute('content');
    
    // Aktualizuj frame-src
    content = content.replace(/frame-src([^;]+);/, function(match, p1) {
        return `frame-src${p1} ${uniqueDomains.join(' ')};`;
    });
    
    // Aktualizuj connect-src
    content = content.replace(/connect-src([^;]+);/, function(match, p1) {
        return `connect-src${p1} ${uniqueDomains.join(' ')};`;
    });
    
    meta.setAttribute('content', content);
}

// Wywołaj tę funkcję po załadowaniu strony i po dodaniu nowego słownika
document.addEventListener('DOMContentLoaded', updateCSPForDictionaries);