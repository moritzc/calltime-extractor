import React from 'react'
import { cn } from '@/lib/cn'
export function Badge({ className, variant, ...props }){ return <span className={cn('badge', className)} {...props} /> }
