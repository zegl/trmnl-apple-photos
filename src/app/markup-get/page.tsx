import Render from '../Render';
import { getPhotos } from '../photos';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const user_uuid = params.user_uuid;
  if (!user_uuid) {
    return <div>No user_uuid</div>;
  }
  if (typeof user_uuid !== 'string') {
    return <div>user_uuid is not a string</div>;
  }

  const size = params.size ?? 'full';
  if (typeof size !== 'string') {
    return <div>size is not a string</div>;
  }

  const url = params.url;
  if (typeof url !== 'string') {
    return <div>url is not a string</div>;
  }

  const show_message =
    typeof params.show_message === 'string' ? params.show_message : undefined;

  return <Render url={url} size={size} show_message={show_message} />;
}
