const themeToggleButton = document.getElementById('theme-toggle-button');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
} else {
    body.classList.add('dark-theme');
}

themeToggleButton.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    body.classList.toggle('dark-theme');
    let theme = body.classList.contains('light-theme') ? 'light-theme' : 'dark-theme';
    localStorage.setItem('theme', theme);
});

const fullscreenBtn = document.getElementById('fullscreen-btn');
const toggleSizeBtn = document.getElementById('toggle-size-btn');
const appIframe = document.getElementById('app-iframe');
const appPlayerDiv = document.querySelector('.app-player');

if (fullscreenBtn && appIframe) {
    fullscreenBtn.addEventListener('click', () => {
        if (appIframe.requestFullscreen) {
            appIframe.requestFullscreen();
        } else if (appIframe.webkitRequestFullscreen) {
            appIframe.webkitRequestFullscreen();
        } else if (appIframe.msRequestFullscreen) {
            appIframe.msRequestFullscreen();
        }
    });
}

if (toggleSizeBtn && appPlayerDiv) {
    toggleSizeBtn.addEventListener('click', () => {
        appPlayerDiv.classList.toggle('wide-mode');
        if (appPlayerDiv.classList.contains('wide-mode')) {
            toggleSizeBtn.title = "기본 크기";
        } else {
            toggleSizeBtn.title = "넓게 보기";
        }
    });
}

let lastScrollTop = 0;
const header = document.querySelector('header');
const scrollThreshold = 50;

if (header) {
    window.addEventListener('scroll', function () {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, false);
}
