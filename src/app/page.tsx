import ScrollRig from '@/components/ScrollRig';
import SceneCanvas from '@/components/canvas/SceneCanvas';

export default function Home() {
  return (
    <>
      <ScrollRig />
      <SceneCanvas />
      <main className="relative z-10">
        <section id="hero" className="h-screen">
          Hero
        </section>
        <section id="blueprint" className="h-screen">
          Blueprint
        </section>
        <section id="clay" className="h-screen">
          Clay
        </section>
        <section id="gloss" className="h-screen">
          Gloss
        </section>
        <section id="orbit" className="h-screen">
          Orbit
        </section>
        <section id="cta" className="h-screen">
          CTA
        </section>
      </main>
    </>
  );
}
