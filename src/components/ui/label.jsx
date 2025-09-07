import React from 'react'
import { cn } from '@/lib/cn'
export function Label({ className, ...props }){ return <label className={cn('label', className)} {...props} /> }
