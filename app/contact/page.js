'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { isRequired, isValidEmail } from '@/lib/validators';

export default function ContactPage() {
  const { showToast } = useApp();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!isRequired(form.name)) return setError('Please enter your name.');
    if (!isValidEmail(form.email)) return setError('Please enter a valid email.');
    if (!isRequired(form.message)) return setError('Please enter a message.');

    setError('');
    setSubmitting(true);

    try {
      // JSON format mein payload bhejna
      const response = await fetch("https://formspree.io/f/maewevpj", {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        showToast('Message sent! We will get back to you soon.');
        setForm({ name: '', email: '', message: '' });
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="static-page">
      <h1 className="page-title">Contact Us</h1>
      <p className="static-page__text">Have a question? Send us a message below.</p>
      <div className="contact-form">
        <input
          name="name"
          className="form-input"
          type="text"
          placeholder="Your Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          name="email"
          className="form-input"
          type="email"
          placeholder="Your Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <textarea
          name="message"
          className="form-input form-textarea"
          placeholder="Your Message"
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        {error && <p className="form-error">{error}</p>}
        <button
          className="btn btn--primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </section>
  );
}