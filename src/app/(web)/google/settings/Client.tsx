'use client';

import Button from '@/app/Button';
import LinkButton from '@/app/LinkButton';
import { useState } from 'react';

export type AppState =
  | {
      state: 'not-connected';
      signInUrl: string;
      user_uuid: string;
    }
  | {
      state: 'connected-no-pictures';
      user_uuid: string;
    }
  | {
      state: 'connected-pictures';
      user_uuid: string;
      //   album: {
      //     id: string;
      //     url: string;
      //   }
    };

export default function Client({ appState }: { appState: AppState }) {
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const createAlbum = async () => {
    setIsCreatingAlbum(true);
    const response = await fetch(`/api/google/create-pick-session`, {
      method: 'POST',
      body: JSON.stringify({
        user_uuid: appState.user_uuid,
      }),
    });

    if (response.ok) {
      // Reload page
      window.location.reload();
    }
  };

  return (
    <div>
      {appState.state === 'not-connected' && (
        <LinkButton href={appState.signInUrl}>Select Pictures</LinkButton>
      )}

      {appState.state === 'connected-no-pictures' && (
        <Button onClick={createAlbum} disabled={isCreatingAlbum}>
          {isCreatingAlbum ? '...' : 'Select Pictures'}
        </Button>
      )}

      {appState.state === 'connected-pictures' && (
        <p>You are connected to Google and have selected pictures</p>
      )}
    </div>
  );
}
