"use client";
import { Tag, TagInput } from "emblor";
import { RefAttributes, useEffect, useId, useRef, useState } from "react";

type Props = RefAttributes<HTMLInputElement> & {
  id?: string;
  placeholder?: string;
  value: string[];
  onChange: (tags: string[]) => void;
};

export default function InputWithTag(props: Props) {
  const { id: propsId, onChange, value, ...rest } = props;
  const generatedId = useId();
  const id = propsId || generatedId;

  const [tags, setTags] = useState<Tag[]>(
    value?.map((tag) => ({ id: tag, text: tag })) || []
  );
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  // Track if this is initial mount - skip notifying parent on mount
  const isInitialMount = useRef(true);
  // Store pending tags to notify parent about (after render completes)
  const pendingNotify = useRef<Tag[] | null>(null);

  const handleSetTags = (newTags: Tag[] | ((prev: Tag[]) => Tag[])) => {
    setTags((prev) => {
      const resolved = typeof newTags === "function" ? newTags(prev) : newTags;
      // Schedule parent notification for after render
      pendingNotify.current = resolved;
      return resolved;
    });
  };

  // Notify parent after render completes (not during render)
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // If we have pending changes, notify parent
    if (pendingNotify.current !== null) {
      onChange(pendingNotify.current.map((t) => t.text));
      pendingNotify.current = null;
    }
  }, [tags, onChange]);

  return (
    <TagInput
      id={id}
      tags={tags}
      setTags={handleSetTags}
      placeholder={props.placeholder || "Aggiungi un tag..."}
      styleClasses={{
        inlineTagsContainer:
          "border-input rounded-md bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring outline-none focus-within:ring-[3px] focus-within:ring-ring/50 p-1 gap-1",
        input: "w-full min-w-[80px] shadow-none px-2 h-7",
        tag: {
          body: "h-7 relative bg-secondary border border-input hover:bg-secondary/70 rounded-md font-medium text-xs ps-2 pe-7 text-foreground",
          closeButton:
            "absolute -inset-y-px -end-px p-0 rounded-e-md flex size-7 transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-muted-foregroundhover:text-foreground",
        },
      }}
      activeTagIndex={activeTagIndex}
      setActiveTagIndex={setActiveTagIndex}
    />
  );
}
