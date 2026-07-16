"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { motion, stagger, useAnimate, useInView } from "motion/react";
import { useEffect } from "react";

export const TypewriterEffect = ({ words, className, cursorClassName }) => {
  // split text inside of words into array of characters
  const wordsArray = words.map((word) => {
    return {
      ...word,
      text: word.text.split(""),
    };
  });

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);
  useEffect(() => {
    if (isInView) {
      animate(
        "span",
        {
          display: "inline-block",
          opacity: 1,
          width: "fit-content",
        },
        {
          duration: 0.3,
          delay: stagger(0.1),
          ease: "easeInOut",
        },
      );
    }
  }, [isInView]);

  const renderWords = () => {
    return (
      <motion.div ref={scope} className="inline">
        {wordsArray.map((word, idx) => {
          return (
            <div key={`word-${idx}`} className="inline-block">
              {word.text.map((char, index) => (
                <motion.span
                  initial={{}}
                  key={`char-${index}`}
                  className={cn(
                    `dark:text-white text-black opacity-0 hidden`,
                    word.className,
                  )}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          );
        })}
      </motion.div>
    );
  };
  return (
    <div
      className={cn(
        "text-base sm:text-xl md:text-3xl lg:text-5xl font-bold text-center",
        className,
      )}
    >
      {renderWords()}
      <motion.span
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className={cn(
          "inline-block rounded-sm w-[4px] h-4 md:h-6 lg:h-10 bg-blue-500",
          cursorClassName,
        )}
      ></motion.span>
    </div>
  );
};

export const TypewriterEffectSmooth = ({
  words,
  className,
  cursorClassName,
}) => {
  const containerRef = React.useRef(null);
  const [containerHeight, setContainerHeight] = React.useState(0);

  // This calculates the estimated height before animation
  React.useEffect(() => {
    if (containerRef.current) {
      // Create a hidden clone to measure full height
      const clone = containerRef.current.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.visibility = "hidden";
      clone.style.width = `${containerRef.current.clientWidth}px`;

      // Make sure the clone's content is fully visible
      const spans = clone.querySelectorAll("span");
      spans.forEach((span) => {
        span.style.opacity = "1";
        span.style.display = "inline";
      });

      document.body.appendChild(clone);
      setContainerHeight(clone.clientHeight);
      document.body.removeChild(clone);
    }
  }, [words]);

  // Create a string representation of all words to estimate size
  const fullText = words.map((word) => word.text).join("");

  // Animate characters sequentially
  const [visibleChars, setVisibleChars] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (visibleChars < fullText.length) {
        setVisibleChars((prev) => prev + 1);
      }
    }, 20); // Speed of typing

    return () => clearTimeout(timer);
  }, [visibleChars, fullText]);

  return (
    <div
      className={cn("relative", className)}
      style={{ minHeight: `${containerHeight}px` }}
    >
      <div
        ref={containerRef}
        className="whitespace-pre-wrap break-words text-sm"
      >
        {words.map((word, wordIdx) => (
          <span key={`word-${wordIdx}`} className={cn(word.className)}>
            {word.text.split("").map((char, charIdx) => {
              // Calculate absolute character position
              const absoluteCharIdx =
                words
                  .slice(0, wordIdx)
                  .reduce((total, w) => total + w.text.length, 0) + charIdx;

              return (
                <span
                  key={`char-${wordIdx}-${charIdx}`}
                  style={{
                    opacity: absoluteCharIdx < visibleChars ? 1 : 0,
                    display: "inline",
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
        {visibleChars < fullText.length && (
          <span
            className={cn(
              "inline-block rounded-sm w-[2px] h-4 bg-blue-500 ml-0.5 animate-blink",
              cursorClassName,
            )}
          ></span>
        )}
      </div>
    </div>
  );
};
