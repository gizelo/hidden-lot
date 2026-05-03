import { fetchFeedLots } from "@/actions/feed";
import { FeedClient } from "@/components/feed/feed-client";

export default async function FeedPage() {
  const { lots, nextCursor } = await fetchFeedLots({});

  return (
    <div className="mx-auto max-w-6xl">
      <FeedClient initialLots={lots} initialCursor={nextCursor} />
    </div>
  );
}
