import { useEffect, useMemo, useState } from "react";

const steps = [
  { selector: "#menu-locataires", text: "Gérez vos locataires ici" },
  { selector: "#menu-contrats", text: "Créez et révisez vos contrats" },
  { selector: "#btn-export", text: "Exportez vos rapports en un clic" },
];

function measure(selector) {
  if (typeof document === "undefined") {
    return null;
  }
  const element = document.querySelector(selector);
  if (!element) {
    return null;
  }
  const rect = element.getBoundingClientRect();
  return {
    element,
    rect,
  };
}

export default function Tour({ active, onFinish }) {
  const [index, setIndex] = useState(0);
  const currentStep = steps[index];

  useEffect(() => {
    if (!active) {
      setIndex(0);
    }
  }, [active]);

  const measurement = useMemo(() => {
    if (!active || !currentStep) {
      return null;
    }
    return measure(currentStep.selector);
  }, [active, currentStep]);

  useEffect(() => {
    if (!active || !currentStep) {
      return undefined;
    }

    const handleResize = () => {
      setIndex((value) => value);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [active, currentStep]);

  if (!active || !currentStep || !measurement) {
    return null;
  }

  const { rect } = measurement;

  const advance = () => {
    if (index + 1 >= steps.length) {
      onFinish?.();
      return;
    }
    setIndex((value) => value + 1);
  };

  const finish = () => {
    onFinish?.();
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="pointer-events-none absolute border-2 border-akig-red rounded"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
        }}
      />
      <div
        className="pointer-events-auto absolute w-64 rounded bg-white p-3 shadow"
        style={{ top: rect.bottom + 8, left: rect.left }}
      >
        <p className="text-sm">{currentStep.text}</p>
        <div className="mt-2 flex gap-2">
          <button type="button" className="rounded border px-2 py-1" onClick={advance}>
            Suivant
          </button>
          <button type="button" className="rounded border px-2 py-1" onClick={finish}>
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
}
