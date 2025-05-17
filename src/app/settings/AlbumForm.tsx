'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Settings } from './types';

interface AlbumFormProps {
  uuid: string;
  initialSettings?: Settings;
}

interface FormValues {
  sharedAlbumUrl: string;
}

export default function AlbumForm({ uuid, initialSettings }: AlbumFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [didSaveNewAlbum, setDidSaveNewAlbum] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      sharedAlbumUrl: initialSettings?.sharedAlbumUrl || '',
    },
  });

  const sharedAlbumUrlValidator = (value: string): string | true => {
    if (!value.includes('icloud.com/sharedalbum/#')) {
      return 'Invalid shared album URL';
    }

    return true;
  };

  const sharedAlbumUrl = watch('sharedAlbumUrl');
  const isUrlValid = sharedAlbumUrl
    ? sharedAlbumUrlValidator(sharedAlbumUrl) === true
    : true;

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setMessage(null);
    setDidSaveNewAlbum(false);

    const settings: Settings = {
      uuid,
      sharedAlbumUrl: data.sharedAlbumUrl,
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
        onSubmit={handleSubmit(onSubmit)}
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
          placeholder="https://www.icloud.com/sharedalbum/#AlbumID"
          className="settings-input"
          {...register('sharedAlbumUrl', {
            validate: sharedAlbumUrlValidator,
          })}
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

        {isDirty && !isUrlValid && (
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

      <a href={`/preview?user_uuid=${uuid}&size=full`} className="button">
        Preview
      </a>
    </div>
  );
}
