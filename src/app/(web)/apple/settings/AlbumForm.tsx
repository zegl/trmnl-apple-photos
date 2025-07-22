'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { UserBlob } from '@/app/types';
import LinkButton from '@/app/LinkButton';
import { AppleSettings } from '@/apple/types';
import { PrimaryButton } from '@/app/Button';
import { AppleRediscoverImagesRequest } from '@/app/api/apple/rediscover-images/type';

interface AlbumFormProps {
  uuid: string;
  initialSettings?: AppleSettings;
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
  const [hasAlbumUrl, setHasAlbumUrl] = useState(
    !!initialSettings?.sharedAlbumUrl
  );

  const {
    register,
    handleSubmit,
    formState: { isDirty },
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

    const settings: AppleSettings = {
      uuid,
      sharedAlbumUrl: data.sharedAlbumUrl,
    };

    try {
      const response = await fetch('/api/apple/save-album', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (response.ok) {
        setDidSaveNewAlbum(true);
        setHasAlbumUrl(true);
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

  const [isRediscoveringImages, setIsRediscoveringImages] = useState(false);
  const [didRediscoverImages, setDidRediscoverImages] = useState(false);

  const onRediscoverImagesClick = async () => {
    setIsRediscoveringImages(true);
    setDidRediscoverImages(false);

    const request: AppleRediscoverImagesRequest = {
      user_uuid: uuid,
    };

    try {
      const response = await fetch('/api/apple/rediscover-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (response.ok) {
        setDidRediscoverImages(true);
      } else {
        setMessage({
          text: `Error: ${result.error || 'Failed to re-discover images'}`,
          type: 'error',
        });
      }
    } catch (error) {
      setMessage({
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setIsRediscoveringImages(false);
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

      <ol className="list-decimal text-gray-500 pl-4">
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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="sm:col-span-4">
          <label
            htmlFor="sharedAlbumUrl"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Album URL
          </label>
          <div className="mt-2">
            <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-600">
              <input
                id="sharedAlbumUrl"
                type="text"
                placeholder="https://www.icloud.com/sharedalbum/#AlbumID"
                value={sharedAlbumUrl}
                {...register('sharedAlbumUrl', {
                  validate: sharedAlbumUrlValidator,
                })}
                className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
              />
            </div>
          </div>

          {isDirty && !isUrlValid && (
            <div className="text-red-500 text-sm mt-2 bg-red-50 p-4">
              The URL does not look like a valid shared album URL.
            </div>
          )}
        </div>

        {didSaveNewAlbum && (
          <div className="text-green-500 text-sm mt-2 bg-green-50 p-4">
            Album settings saved successfully! It make take a minute or two to
            process it.
          </div>
        )}

        {message && (
          <>
            {message.type === 'success' && (
              <div className="text-green-500 text-sm mt-2">{message.text}</div>
            )}
            {message.type === 'error' && (
              <div className="text-red-500 text-sm mt-2">{message.text}</div>
            )}
          </>
        )}

        {didRediscoverImages && (
          <div className="text-green-500 text-sm mt-2">
            The album contents will now be re-discovered in the background, it
            might take a minute or two to process it.
          </div>
        )}

        <div className="flex flex-row gap-4">
          <PrimaryButton type="submit" disabled={isSubmitting} color="blue">
            {isSubmitting ? 'Saving...' : 'Save Album'}
          </PrimaryButton>

          {hasAlbumUrl && (
            <PrimaryButton href={`/preview?user_uuid=${uuid}`} color="gray">
              👀 Preview Album
            </PrimaryButton>
          )}

          {hasAlbumUrl && (
            <PrimaryButton
              onClick={onRediscoverImagesClick}
              disabled={isRediscoveringImages}
              color="gray"
            >
              {isRediscoveringImages
                ? 'Re-discovering...'
                : '🔃 Re-discover images'}
            </PrimaryButton>
          )}
        </div>
      </form>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '40px',
        }}
      >
        <LinkButton href={backToTrmnlUrl}>↩️ Back to TRMNL</LinkButton>
      </div>
    </div>
  );
}
