'use client';

import { CreatePickSessionResponseSchema } from '@/app/api/google/create-pick-session/type';
import { AppState } from '@/app/api/google/get-app-state/type';
import { PrimaryButton } from '@/app/Button';
import { UserBlob } from '@/app/types';
import { useEffect, useState } from 'react';

export default function Client({
  user_uuid,
  backToTrmnlUrl,
  user,
}: {
  user_uuid: string;
  backToTrmnlUrl: string;
  user: UserBlob;
}) {
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [appStateLoading, setAppStateLoading] = useState(false);
  const [createAlbumError, setCreateAlbumError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);

  const fetchAppState = async () => {
    setAppStateLoading(true);

    // try {
    const response = await fetch(`/api/google/get-app-state`, {
      method: 'POST',
      body: JSON.stringify({ user_uuid }),
    })
      .catch((error) => {
        console.error('Error fetching app state', error);
        setAppState(null);
      })
      .finally(() => {
        setAppStateLoading(false);
      });

    console.log('response', response);

    if (response && response.ok) {
      const data = AppState.safeParse(await response.json());
      if (data.success) {
        setAppState(data.data);
      } else {
        setAppState(null);
      }
    } else {
      setAppState(null);
    }
    // } catch (error) {
    //   console.error('Error fetching app state', error);
    //   setAppState(null);
    // } finally {
    //   setAppStateLoading(false);
    // }
  };

  const createAlbum = async () => {
    setIsCreatingAlbum(true);
    setCreateAlbumError(null);
    setAppState(null);
    const response = await fetch(`/api/google/create-pick-session`, {
      method: 'POST',
      body: JSON.stringify({
        user_uuid,
      }),
    });

    const data = CreatePickSessionResponseSchema.safeParse(
      await response.json()
    );
    if (!data.success) {
      setCreateAlbumError('Failed to create album');
      return;
    }

    if (!data.data.success) {
      setCreateAlbumError(data.data.error);
      return;
    }

    window.open(data.data.pickerUri, '_blank');

    setTimeout(() => {
      fetchAppState();
    }, 1000);
  };

  useEffect(() => {
    const shouldPoll =
      (appState?.state === 'connected-pictures' && appState.imageCount === 0) ||
      appState?.state === 'connected-picking';
    if (!shouldPoll) {
      return;
    }
    console.log('scheduling poll');

    const interval = setInterval(() => {
      console.log('polling');
      fetchAppState();
    }, 2000);
    return () => clearInterval(interval);
  }, [appState]);

  useEffect(() => {
    fetchAppState();
  }, []);

  const canCreateNewAlbum = appState && appState.state === 'connected-pictures';

  if (!appState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {appStateLoading && <p>Loading...</p>}

      {appState.state === 'not-connected' && (
        <>
          <p>
            Hello <strong className="text-gray-900">{user.user.name}</strong>,
            let's get you set up!
          </p>

          <PrimaryButton href={appState.signInUrl}>
            Sign in with Google
          </PrimaryButton>
        </>
      )}

      {appState.state === 'connected-no-pictures' && (
        <>
          <p>Select pictures from your Google Photos album, opens a new tab.</p>
          <PrimaryButton onClick={createAlbum} disabled={isCreatingAlbum}>
            {isCreatingAlbum ? 'Loading...' : 'Select Pictures'}
          </PrimaryButton>
        </>
      )}

      {appState.state === 'connected-picking' && (
        <>
          <p>
            Please select photos in Google Photos, and come back here when
            you're done.
          </p>
          <PrimaryButton
            onClick={() => window.open(appState.pickerUri, '_blank')}
          >
            Open Google Photos
          </PrimaryButton>
        </>
      )}

      {createAlbumError && <p className="text-red-500">{createAlbumError}</p>}

      {appState.state === 'connected-pictures' && (
        <>
          {appState.imageCount > 0 && (
            <>
              <p>
                Your album with {appState.imageCount} pictures is ready. A
                photos will be displayed on your TRMNL device the next time the
                plugin is refreshed.
              </p>
              <div>
                <PrimaryButton href={backToTrmnlUrl}>
                  ↩️ Back to TRMNL
                </PrimaryButton>
              </div>
            </>
          )}
          {appState.imageCount === 0 && <p>Processing photos...</p>}
        </>
      )}

      {appState.state === 'error' && (
        <p className="text-red-500">{appState.error}</p>
      )}

      {canCreateNewAlbum && (
        <div>
          <PrimaryButton color="gray" onClick={createAlbum}>
            Select new photos
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
