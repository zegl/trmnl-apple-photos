import FullScreenMessage from '../FullScreenMessage';
import Render from '../Render';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const user_uuid = params.user_uuid;
  if (!user_uuid) {
    return <FullScreenMessage message="Bad Request: No user_uuid" />;
  }
  if (typeof user_uuid !== 'string') {
    return (
      <FullScreenMessage message="Bad Request: user_uuid is not a string" />
    );
  }

  const size = params.size ?? 'full';
  if (typeof size !== 'string') {
    return <FullScreenMessage message="Bad Request: size is not a string" />;
  }

  const url = params.url;
  if (typeof url !== 'string') {
    return <FullScreenMessage message="Album has not been configured yet." />;
  }

  const show_message =
    typeof params.show_message === 'string' ? params.show_message : undefined;

  return <Render url={url} size={size} show_message={show_message} />;
}
