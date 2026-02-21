"use client";

import clsx from "clsx";
import { HTMLAttributes, ReactNode } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  children: ReactNode;
};

export const Card = ({ title, children, className, ...props }: CardProps) => {
  return (
    <div
      className={clsx(
        "rounded-lg border border-gray-200 bg-white p-6 shadow-sm",
        className,
      )}
      {...props}
    >
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      )}
      {children}
    </div>
  );
};
