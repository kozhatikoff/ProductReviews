'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <DialogPrimitive.Content className={cn('fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg', className)} {...props}>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogHeader = (props: React.HTMLAttributes<HTMLDivElement>) => <div className="mb-4" {...props} />;
export const DialogFooter = (props: React.HTMLAttributes<HTMLDivElement>) => <div className="mt-4 flex justify-end gap-2" {...props} />;
export const DialogTitle = (props: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className="text-lg font-semibold" {...props} />;
export const DialogDescription = (props: React.HTMLAttributes<HTMLParagraphElement>) => <p className="text-sm text-slate-600" {...props} />;
