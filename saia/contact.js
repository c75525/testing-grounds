// No endpoint has been approved. Do not navigate, transmit, or persist entries.
const form = document.querySelector('.contact-form');
form.addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#contact-status').textContent = 'Sending is not connected yet. Your message has not been sent.';
});
