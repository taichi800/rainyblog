<script>
    const article = document.querySelector('article');

    // Font size controls
    document.getElementById('increase-font').addEventListener('click', () => {
        const currentSize = parseFloat(window.getComputedStyle(article).fontSize);
        article.style.fontSize = `${currentSize + 2}px`;
    });

    document.getElementById('decrease-font').addEventListener('click', () => {
        const currentSize = parseFloat(window.getComputedStyle(article).fontSize);
        article.style.fontSize = `${currentSize - 2}px`;
    });

    // Font style controls
    document.getElementById('sans-serif').addEventListener('click', () => {
        article.style.fontFamily = 'Arial, sans-serif';
    });

    document.getElementById('serif').addEventListener('click', () => {
        article.style.fontFamily = 'Georgia, serif';
    });

    document.getElementById('monospace').addEventListener('click', () => {
        article.style.fontFamily = 'Courier New, monospace';
    });

    document.getElementById('dyslexia').addEventListener('click', () => {
        article.style.fontFamily = 'OpenDyslexic, sans-serif';
    });

    // Text alignment controls
    document.getElementById('align-left').addEventListener('click', () => {
        article.style.textAlign = 'left';
    });

    document.getElementById('align-center').addEventListener('click', () => {
        article.style.textAlign = 'center';
    });

    document.getElementById('align-right').addEventListener('click', () => {
        article.style.textAlign = 'right';
    });

    // Content width control
    document.getElementById('content-width').addEventListener('input', (e) => {
        article.style.maxWidth = `${e.target.value}px`;
    });

    // Appearance menu
    document.getElementById('appearance-menu').addEventListener('change', (e) => {
        const theme = e.target.value;
        switch (theme) {
            case 'dark':
                document.body.style.backgroundColor = '#333';
                document.body.style.color = '#fff';
                break;
            case 'light':
                document.body.style.backgroundColor = '#f5f5f5';
                document.body.style.color = '#333';
                break;
            case 'sepia':
                document.body.style.backgroundColor = '#f4ecd8';
                document.body.style.color = '#5b4636';
                break;
            case 'gray':
                document.body.style.backgroundColor = '#ccc';
                document.body.style.color = '#333';
                break;
            case 'high-contrast':
                document.body.style.backgroundColor = '#000';
                document.body.style.color = '#fff';
                break;
        }
    });

    // Advanced settings toggle
    document.getElementById('toggle-advanced').addEventListener('click', () => {
        const advanced = document.getElementById('advanced-settings');
        advanced.style.display = advanced.style.display === 'none' ? 'block' : 'none';
    });

    // Advanced settings sliders
    document.getElementById('line-spacing').addEventListener('input', (e) => {
        article.style.lineHeight = e.target.value;
    });

    document.getElementById('char-spacing').addEventListener('input', (e) => {
        article.style.letterSpacing = `${e.target.value}px`;
    });

    document.getElementById('word-spacing').addEventListener('input', (e) => {
        article.style.wordSpacing = `${e.target.value}px`;
    });
</script>
