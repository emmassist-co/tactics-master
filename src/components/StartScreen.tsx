interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <section className="panel hero">
      <p className="eyebrow">Same-device tactics duel</p>
      <h1>tactics-master</h1>
      <p className="lede">
        Two coaches. Two prompts at kick-off. Two more at halftime. Then let the shape,
        pressing, and passing patterns decide the bragging rights.
      </p>
      <button className="primary-button" onClick={onStart}>
        Start match
      </button>
    </section>
  );
}
