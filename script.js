document.addEventListener('DOMContentLoaded', () => {
    // Pobranie zgody na lokalizację
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            console.log('Lokalizacja uzyskana:', position);
        }, error => {
            console.error('Błąd lokalizacji:', error);
        });
    } else {
        console.error('Geolokalizacja nie jest wspierana przez tę przeglądarkę.');
    }

    // Pobranie zgody na wyświetlanie powiadomień
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Zgoda na powiadomienia uzyskana.');
            }
        });
    }

    // Inicjalizacja mapy
    const map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Obsługa przycisku „Moja lokalizacja”
    document.getElementById('myLocationBtn').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                alert(`Twoje współrzędne to: ${latitude}, ${longitude}`);
                L.marker([latitude, longitude]).addTo(map)
                    .bindPopup('Twoja lokalizacja')
                    .openPopup();
            });
        }
    });

    // Obsługa przycisku „Pobierz mapę”
    document.getElementById('downloadMapBtn').addEventListener('click', () => {
        console.log('Pobieranie mapy...');
        let width = 600;
        let height = 400;
        domtoimage.toPng(document.getElementById('map'), { width, height }).then(dataUrl => {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'map.png';
            link.click();
        }).catch(error => {
            console.error('Error generating canvas:', error);
        });
    });

    // Mechanizm drag & drop
    const puzzleContainer = document.getElementById('puzzle');

    // Obsługa przycisku „Stwórz puzzle”
    document.getElementById('generatePuzzleBtn').addEventListener('click', () => {
        console.log('Tworzenie puzzli...');
        let width = 600;
        let height = 400;
        domtoimage.toPng(document.getElementById('map'), {width, height}).then(dataUrl => {
            const pieces = createPuzzlePieces(dataUrl);
            const dropZones = createDropZones(puzzleContainer);
            const puzzleStartContainer = document.getElementById('start-zone');
            setupPuzzle(puzzleStartContainer, pieces);
            setupDragAndDrop(pieces, dropZones);
        });
    });
});

function createPuzzlePieces(mapElement) {
    const pieces = [];
    const pieceHeight = 100; // Assuming each piece is 100x100 pixels
    const pieceWidth = 150; // Assuming each piece is 100x100 pixels
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const piece = document.createElement('div');
            piece.classList.add('puzzle-piece');
            piece.style.width = `${pieceWidth}px`;
            piece.style.height = `${pieceHeight}px`;
            piece.style.backgroundImage = `url(${mapElement})`;
            piece.style.backgroundPosition = `-${x * pieceWidth}px -${y * pieceHeight}px`;
            piece.setAttribute('data-x', x);
            piece.setAttribute('data-y', y);
            piece.draggable = true;
            pieces.push(piece);
        }
    }
    return pieces.sort(() => Math.random() - 0.5); // Shuffle pieces
}

function setupPuzzle(puzzleContainer, pieces) {
    pieces.forEach(piece => {
        puzzleContainer.appendChild(piece);
    });
}

function createDropZones(puzzleContainer) {
    const dropZones = [];
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const dropZone = document.createElement('div');
            dropZone.classList.add('drop-zone');
            dropZone.style.width = '150px';
            dropZone.style.height = '100px';
            dropZone.setAttribute('data-x', x);
            dropZone.setAttribute('data-y', y);
            puzzleContainer.appendChild(dropZone);
            dropZones.push(dropZone);
        }
    }
    const dropZone = document.createElement('div');
    dropZone.classList.add('drop-zone');
    dropZone.style.width = '600px';
    dropZone.style.height = '100px';
    dropZone.setAttribute('data-x', -1);
    dropZone.setAttribute('data-y', -1);
    dropZone.id = 'start-zone';
    puzzleContainer.appendChild(dropZone);
    dropZones.push(dropZone);

    return dropZones;
}

function setupDragAndDrop(pieces, dropZones) {
    pieces.forEach(piece => {
        piece.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', `${piece.getAttribute('data-x')},${piece.getAttribute('data-y')}`);
        });
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            const [x, y] = e.dataTransfer.getData('text/plain').split(',');
            const piece = document.querySelector(`.puzzle-piece[data-x="${x}"][data-y="${y}"]`);
            if (piece) {
                zone.appendChild(piece);
                checkPuzzleCompletion(pieces, dropZones);
            } else {
                console.error(`Piece not found for coordinates: ${x}, ${y}`);
            }
        });
    });
}

function checkPuzzleCompletion(pieces, dropZones) {
    let isComplete = true;
    dropZones.forEach(zone => {
        if(zone.getAttribute('data-y') === '-1') {
            return;
        }
        const piece = zone.querySelector('.puzzle-piece');
        if (!piece || piece.getAttribute('data-x') !== zone.getAttribute('data-x')
            || piece.getAttribute('data-y') !== zone.getAttribute('data-y')) {
            isComplete = false;
            console.log('Piece in incorrect position:', zone.getAttribute('data-x'), zone.getAttribute('data-y'));
        }
        else {
            console.log('Piece in correct position:', piece.getAttribute('data-x'), piece.getAttribute('data-y'));
        }
    });

    if (isComplete) {
        console.log('Puzzle completed!');
        new Notification('Puzzle completed!');
    }
}