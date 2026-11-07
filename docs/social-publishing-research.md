# Meta social publishing integration

The website uses the server-side Meta Graph API adapters below. Tokens are stored in Manus Admin and are never included in browser bundles.

## Facebook Page publishing

The server publishes text and link posts with `POST /{page-id}/feed`. Image posts use `POST /{page-id}/photos` with a publicly reachable image URL. The Page access token must have the Page publishing permissions and the app user must have the required Page tasks.

Source: [Meta Pages API Posts](https://developers.facebook.com/documentation/pages-api/posts)

## Instagram publishing

The server publishes a single image by first creating a media container with `POST /{instagram-professional-account-id}/media`, then publishing it with `POST /{instagram-professional-account-id}/media_publish`. The media URL must be publicly reachable when Meta fetches it, and the supported image format is JPEG. The Facebook Login route uses a Page access token and the Instagram content-publishing permissions described by Meta.

Source: [Meta Instagram Content Publishing](https://developers.facebook.com/documentation/instagram-platform/content-publishing)

## Website behavior

- `/api/functions/social-status` performs read-only Page and Instagram account checks.
- `/api/functions/facebook-publish` publishes an approved Facebook post.
- `/api/functions/instagram-publish` creates and publishes an Instagram image post.
- All three endpoints require the signed Manus session, the application admin role, and the additional website admin-password session.
- Publishing is manual from `/admin/social-publisher`; the website does not publish automatically.
