// Compose locally in the visitor's email app; this site does not store or send form data.
const form = document.querySelector('.contact-form');
const status = document.querySelector('#contact-status');
const recipient = 'saia.club.phx@gmail.com';
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const firstName = String(data.get('firstName')).trim();
  const lastName = String(data.get('lastName')).trim();
  const email = String(data.get('email')).trim();
  const message = String(data.get('message')).trim();
  const subject = `S.A.I.A. website contact — ${firstName} ${lastName}`;
  const body = `Name: ${firstName} ${lastName}\nEmail: ${email}\n\n${message}`;
  status.textContent = `Opening a message to ${recipient} in your email app.`;
  window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
