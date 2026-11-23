"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/** The ten standard System Usability Scale statements; odd items are positive, even items negative. */
const statements = [
  "I think that I would like to use this system frequently.",
  "I found the system unnecessarily complex.",
  "I thought the system was easy to use.",
  "I think that I would need the support of a technical person to be able to use this system.",
  "I found the various functions in this system were well integrated.",
  "I thought there was too much inconsistency in this system.",
  "I would imagine that most people would learn to use this system very quickly.",
  "I found the system very cumbersome to use.",
  "I felt very confident using the system.",
  "I needed to learn a lot of things before I could get going with this system.",
];

export function susScore(answers: (number | null)[]): number | null {
  if (answers.some((a) => a === null)) return null;
  const total = (answers as number[]).reduce((sum, a, i) => sum + (i % 2 === 0 ? a - 1 : 5 - a), 0);
  return Math.round(total * 2.5 * 10) / 10;
}

function grade(score: number): { label: string; tone: string } {
  if (score >= 85) return { label: "Excellent", tone: "text-success" };
  if (score >= 72) return { label: "Good", tone: "text-success" };
  if (score >= 68) return { label: "Above average", tone: "text-primary" };
  if (score >= 51) return { label: "Below average (OK)", tone: "text-warning" };
  return { label: "Poor", tone: "text-danger" };
}

export function SusCalculator() {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null));
  const score = susScore(answers);
  const answered = answers.filter((a) => a !== null).length;

  return (
    <div className="border border-line bg-surface shadow-card rounded-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h3 className="text-base font-semibold text-ink">SUS score calculator</h3>
          <p className="text-xs text-muted">Enter one participant&rsquo;s answers (1 = strongly disagree, 5 = strongly agree).</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => setAnswers(Array(10).fill(null))}>
          Reset
        </Button>
      </div>
      <ol className="m-0 list-none divide-y divide-line p-0">
        {statements.map((text, i) => (
          <li key={text} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <p id={`sus-${i}`} className="text-sm text-ink md:max-w-[62%]">
              <span className="mr-2 font-mono text-xs text-muted">{i + 1}.</span>
              {text}
            </p>
            <div role="radiogroup" aria-labelledby={`sus-${i}`} className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={answers[i] === v}
                  aria-label={`${v} of 5`}
                  onClick={() => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
                  className={cn(
                    "h-9 w-9 border text-sm font-semibold rounded-sm transition-colors",
                    answers[i] === v ? "border-primary bg-primary text-white" : "border-line bg-bg text-ink hover:border-line-strong hover:bg-highlight",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-bg px-4 py-3" role="status" aria-live="polite">
        {score === null ? (
          <p className="text-sm text-muted">Answer all ten statements to see the score ({answered}/10 answered).</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              SUS score <span className="ml-1 text-2xl font-bold text-ink">{score}</span> <span className="text-xs">/ 100</span>
            </p>
            <p className={cn("text-sm font-semibold", grade(score).tone)}>{grade(score).label}</p>
          </>
        )}
      </div>
    </div>
  );
}
