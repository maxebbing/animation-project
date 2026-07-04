import ScrollRig from '@/components/ScrollRig';
import SceneCanvas from '@/components/canvas/SceneCanvas';
import EditorialSections from '@/components/EditorialSections';
import SiteChrome from '@/components/SiteChrome';

export default function Home() {
  return (
    <>
      <ScrollRig />
      <SceneCanvas />
      <SiteChrome />
      <EditorialSections />
    </>
  );
}
