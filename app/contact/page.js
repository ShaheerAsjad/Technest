'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function ContactPage() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData(e.target);

    try {
      const response = await fetch("https://formspree.io/f/maewevpj", {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        showToast('Thank you! Your message has been sent.');
        setFormData({ name: '', email: '', message: '' });
      } else {
        showToast('Failed to send message. Please try again.', 'danger');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>Contact Us</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Have a question or feedback? Send us a message below.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>Your Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="John Doe"
            style={{
              padding: '10px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
              width: '100%'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>Your Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="john@example.com"
            style={{
              padding: '10px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
              width: '100%'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>Message</label>
          <textarea
            name="message"
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            placeholder="How can we help you?"
            style={{
              padding: '10px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
              width: '100%',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            marginTop: '8px'
          }}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}