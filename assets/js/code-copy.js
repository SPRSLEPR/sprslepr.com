document.addEventListener('click', async event => {
  const button = event.target.closest('.sps-copy');
  if (!button) return;
  const code = button.closest('.sps-codeblock').querySelector('code');
  try {
    await navigator.clipboard.writeText(code.textContent);
    button.textContent = 'Copied!';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(code);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = 'Code selected';
  }
  setTimeout(() => { button.textContent = 'Copy'; }, 1800);
});
