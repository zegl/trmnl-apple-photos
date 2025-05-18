'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Settings, UserBlob } from './types';

interface AlbumFormProps {
  uuid: string;
  initialSettings?: Settings;
  user: UserBlob;
}

interface FormValues {
  sharedAlbumUrl: string;
}

export default function AlbumForm({
  uuid,
  initialSettings,
  user,
}: AlbumFormProps) {
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

  const backToTrmnlUrl = `https://usetrmnl.com/plugin_settings/${user.user.plugin_setting_id}/edit?force_refresh=true`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        height: '100%',
      }}
    >
      <h2>Album Settings</h2>

      <ol
        style={{
          color: '#666',
          paddingLeft: '20px',
        }}
      >
        <li>
          <p>
            Setup a "Shared Album" in iCloud / Apple Photos &mdash; How to:{' '}
            <a href="https://support.apple.com/en-us/108314#createios">iOS</a> /{' '}
            <a href="https://support.apple.com/en-us/108314#create-macos">
              macOS
            </a>
            .
          </p>
        </li>
        <li>
          <p>
            Create a "Public Website" for the shared album &mdash; How to:{' '}
            <a href="https://support.apple.com/en-us/108314#invite-ios">iOS</a>{' '}
            /{' '}
            <a href="https://support.apple.com/en-us/108314#invite-macos">
              macOS
            </a>
            .
          </p>
        </li>
        <li>
          <p>Copy the link to the albums website, and paste it below.</p>
        </li>
      </ol>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
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

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100px',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Album'}
          </button>
        </div>

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
      </form>

      <div style={{ flex: 1 }}></div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '40px',
        }}
      >
        <a href={backToTrmnlUrl} className="button">
          Back to TRMNL
        </a>

        <a href={`/preview?user_uuid=${uuid}&size=full`} className="button">
          Preview Album
        </a>
      </div>
    </div>
  );
}
