import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'roughatsea-code-language';
const LANGUAGE_EVENT = 'roughatsea:code-language';

export default function CodeLanguageToggle({ csharp, python, label = 'Example' }) {
  const [language, setLanguage] = useState('csharp');

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (savedLanguage === 'csharp' || savedLanguage === 'python') {
      setLanguage(savedLanguage);
    }

    const syncLanguage = (event) => setLanguage(event.detail);
    window.addEventListener(LANGUAGE_EVENT, syncLanguage);
    return () => window.removeEventListener(LANGUAGE_EVENT, syncLanguage);
  }, []);

  const chooseLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: nextLanguage }));
  };

  const buttonStyle = (buttonLanguage) => ({
    appearance: 'none',
    border: 0,
    borderRadius: '6px',
    background: language === buttonLanguage ? 'var(--accent-color)' : 'transparent',
    color: language === buttonLanguage ? 'var(--bg-color)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    fontWeight: 600,
    padding: '0.45rem 0.8rem',
    transition: 'var(--transition-smooth)'
  });

  const code = language === 'csharp' ? csharp : python;

  return (
    <section
      aria-label={`${label} code example`}
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        margin: '1.5rem 0 2rem',
        overflow: 'hidden',
        background: 'var(--surface-color)'
      }}
    >
      <div
        style={{
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'space-between',
          padding: '0.65rem 0.75rem'
        }}
      >
        <strong style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}>{label}</strong>
        <div aria-label="Code language" role="group" style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            aria-pressed={language === 'csharp'}
            onClick={() => chooseLanguage('csharp')}
            style={buttonStyle('csharp')}
          >
            C#
          </button>
          <button
            type="button"
            aria-pressed={language === 'python'}
            onClick={() => chooseLanguage('python')}
            style={buttonStyle('python')}
          >
            Python
          </button>
        </div>
      </div>
      <pre
        style={{
          background: '#0d1117',
          color: '#e6edf3',
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
          fontSize: '0.86rem',
          lineHeight: 1.6,
          margin: 0,
          overflowX: 'auto',
          padding: '1.1rem 1.25rem',
          tabSize: 4,
          whiteSpace: 'pre'
        }}
      >
        <code className={`language-${language === 'csharp' ? 'csharp' : 'python'}`}>{code.trim()}</code>
      </pre>
    </section>
  );
}
