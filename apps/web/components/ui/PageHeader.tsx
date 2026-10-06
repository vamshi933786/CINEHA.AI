import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/layout/Breadcrumbs";

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-6 sm:pb-8 border-b border-cine-border/50">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-cine-text">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-cine-muted mt-1.5 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 sm:self-auto self-start">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
