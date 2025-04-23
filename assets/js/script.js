const themeToggleButton = document.getElementById('theme-toggle-button');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
} else {
    body.classList.add('dark-theme');
}

if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        body.classList.toggle('dark-theme');
        let currentTheme = body.classList.contains('light-theme') ? 'light-theme' : 'dark-theme';
        localStorage.setItem('theme', currentTheme);
    });
}

const fullscreenBtn = document.getElementById('fullscreen-btn');
const toggleSizeBtn = document.getElementById('toggle-size-btn');
const appIframe = document.getElementById('app-iframe');
const appPlayerDiv = document.querySelector('.app-player');

if (fullscreenBtn && appIframe) {
    fullscreenBtn.addEventListener('click', () => {
        if (body.classList.contains('player-expanded') && appPlayerDiv) {
            appPlayerDiv.classList.remove('app-player--expanded');
            body.classList.remove('player-expanded');
            if (toggleSizeBtn) toggleSizeBtn.title = "크기 전환";
        }

        if (appIframe.requestFullscreen) {
            appIframe.requestFullscreen().catch(err => console.error(`Fullscreen request failed: ${err.message} (${err.name})`));
        } else if (appIframe.webkitRequestFullscreen) {
            appIframe.webkitRequestFullscreen().catch(err => console.error(`Fullscreen request failed: ${err.message} (${err.name})`));
        } else if (appIframe.msRequestFullscreen) {
            appIframe.msRequestFullscreen();
        }
    });
}

if (toggleSizeBtn && appPlayerDiv) {
    toggleSizeBtn.addEventListener('click', () => {
        const isExpanded = appPlayerDiv.classList.toggle('app-player--expanded');
        body.classList.toggle('player-expanded', isExpanded);

        toggleSizeBtn.title = isExpanded ? "원래 크기로" : "크기 전환";

    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && body.classList.contains('player-expanded') && appPlayerDiv) {
        appPlayerDiv.classList.remove('app-player--expanded');
        body.classList.remove('player-expanded');
        if (toggleSizeBtn) toggleSizeBtn.title = "크기 전환";
    }
});


let lastScrollTop = 0;
const header = document.querySelector('header');
const scrollThreshold = 50;

if (header) {
    window.addEventListener('scroll', function () {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (body.classList.contains('player-expanded')) {
            header.classList.remove('header-hidden');
            return;
        }

        if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
            header.classList.add('header-hidden');
        } else {
            if (scrollTop < lastScrollTop || scrollTop <= scrollThreshold) {
                header.classList.remove('header-hidden');
            }
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, false);
}
