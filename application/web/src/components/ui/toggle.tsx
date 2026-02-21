"use client";

import clsx from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

export type ToggleProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "role"
> & {
  label?: string;
};

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, checked, className, id, ...props }, ref) => {
    const toggleId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <label
        htmlFor={toggleId}
        className={clsx(
          "inline-flex cursor-pointer items-center gap-3",
          props.disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <div className="relative">
          <input
            ref={ref}
            id={toggleId}
            type="checkbox"
            role="switch"
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={clsx(
              "h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-[#6C5CE7] peer-focus-visible:ring-2 peer-focus-visible:ring-[#6C5CE7] peer-focus-visible:ring-offset-2",
            )}
          />
          <div
            className={clsx(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5",
            )}
          />
        </div>
        {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      </label>
    );
  },
);

Toggle.displayName = "Toggle";
