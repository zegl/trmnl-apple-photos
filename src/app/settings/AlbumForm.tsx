'use client';

import { useState } from 'react';
import { Settings } from './types';

interface AlbumFormProps {
  uuid: string;
  initialSettings?: Settings;
}

export default function AlbumForm({ uuid, initialSettings }: AlbumFormProps) {
  const [sharedAlbumUrl, setSharedAlbumUrl] = useState<string>(
    initialSettings?.sharedAlbumUrl || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const [didSaveNewAlbum, setDidSaveNewAlbum] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState(false);
  const [didChangeUrl, setDidChangeUrl] = useState(false);

  const validateSharedAlbumUrl = (url: string) => {
    return url.includes('icloud.com/sharedalbum/#');
  };

  const onFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSharedAlbumUrl(e.target.value);
    setIsUrlValid(validateSharedAlbumUrl(e.target.value));
    setDidChangeUrl(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setDidSaveNewAlbum(false);

    const settings: Settings = {
      uuid,
      sharedAlbumUrl,
    };

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (response.ok) {
        setDidSaveNewAlbum(true);
      } else {
        setMessage({
          text: `Error: ${result.error || 'Failed to save settings'}`,
          type: 'error',
        });
      }
    } catch (error) {
      setMessage({
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <h2>Album Settings</h2>

      <p
        style={{
          fontSize: '14px',
          color: '#666',
        }}
      >
        To use this plugin, setup a public shared album in iCloud / Apple
        Photos. Enter the URL of the album below.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <input
          style={{
            width: '100%',
          }}
          type="text"
          id="sharedAlbumUrl"
          name="sharedAlbumUrl"
          value={sharedAlbumUrl}
          onChange={onFormChange}
          className="settings-input"
          placeholder="https://www.icloud.com/sharedalbum/#AlbumID"
        />

        {didSaveNewAlbum && (
          <div
            style={{
              color: 'darkgreen',
              fontSize: '14px',
            }}
          >
            Album settings saved successfully! It make take a minute or two to
            process it.
          </div>
        )}

        {didChangeUrl && !isUrlValid && (
          <div
            style={{
              color: 'red',
              fontSize: '14px',
            }}
          >
            The URL does not look like a valid shared album URL.
          </div>
        )}

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Album'}
        </button>
      </form>
    </div>
  );
}
