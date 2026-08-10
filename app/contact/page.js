'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { isRequired, isValidEmail } from '@/lib/validators';

export default function ContactPage() {
  const { showToast } = useApp();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!isRequired(form.name)) return setError('Please enter your name.');
    if (!isValidEmail(form.email)) return setError('Please enter a valid email.');
    if (!isRequired(form.message)) return setError('Please enter a message.');

    setError('');
    showToast('Message sent! We will get back to you soon.');
    setForm({ name: '', email: '', message: '' });
  }

  return (
    <section className="static-page">
      <h1 className="page-title">Contact Us</h1>
      <p className="static-page__text">Have a question? Send us a message below.</p>
      <div className="contact-form">
        <input
          className="form-input"
          type="text"
          placeholder="Your Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="form-input"
          type="email"
          placeholder="Your Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <textarea
          className="form-input form-textarea"
          placeholder="Your Message"
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn--primary" onClick={handleSubmit}>
          Send Message
        </button>
      </div>
    </section>
  );
}
