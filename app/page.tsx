import { FeedPanel } from "@/components/feed/feed-panel";
import { ContentPanel } from "@/components/tabs/content-panel";
import { MainShell } from "@/components/layout/main-shell";

export default function Home() {
  return (
    <MainShell
      content={<ContentPanel />}
      feed={<FeedPanel />}
    />
  );
}
