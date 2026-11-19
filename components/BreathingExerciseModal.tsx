"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface BreathingExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinished?: () => void;
}

export default function BreathingExerciseModal({
  isOpen,
  onClose,
  onFinished,
}: BreathingExerciseModalProps) {
  // 4 saniye nefes al, 7 saniye tut, 8 saniye ver (4-7-8 Tekniği - Anksiyete & Kriz önleyici)
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [counter, setCounter] = useState(4);
  const [cyclesLeft, setCyclesLeft] = useState(4);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isOpen || !isActive) return;

    const timer = setInterval(() => {
      setCounter((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Faz geçişi
        if (phase === "inhale") {
          setPhase("hold");
          return 7;
        } else if (phase === "hold") {
          setPhase("exhale");
          return 8;
        } else {
          // exhale bitti
          if (cyclesLeft > 1) {
            setCyclesLeft((c) => c - 1);
            setPhase("inhale");
            return 4;
          } else {
            setIsActive(false);
            return 0;
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, phase, cyclesLeft]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
        >
          ✕
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase mb-2">
          🧘‍♂️ 4-7-8 Kriz Savar Nefes Tekniği
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Sakinleşin, Bu Dalga Geçecek
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Sigara isteği en fazla 3 dakika sürer. Derin nefes alarak oksijeni vücudunuza doldurun.
        </p>

        {isActive ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-1000 ${
                phase === "inhale"
                  ? "bg-emerald-500/20 scale-110 border-4 border-emerald-500"
                  : phase === "hold"
                  ? "bg-amber-500/20 scale-105 border-4 border-amber-500"
                  : "bg-teal-500/20 scale-95 border-4 border-teal-500"
              }`}
            >
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                {counter}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider mt-1 text-slate-700 dark:text-slate-300">
                {phase === "inhale"
                  ? "Derin Nefes Al"
                  : phase === "hold"
                  ? "Nefesini Tut"
                  : "Yavaşça Ağızdan Ver"}
              </span>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
              Kalan Tur: <strong className="text-emerald-500">{cyclesLeft}</strong> / 4
            </p>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl">
              🎉
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Tebrikler! Kriz Dalgasını Yendiniz.
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Şimdi bir bardak soğuk su için ve vücudunuzun temiz oksijenle dolmasının tadını çıkarın.
            </p>
            <Button
              onClick={() => {
                onFinished?.();
                onClose();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl"
            >
              Harika Hissediyorum, Devam Et
            </Button>
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
}
