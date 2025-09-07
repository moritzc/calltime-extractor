import React from 'react'
import { cn } from '@/lib/cn'
export function Card({ className, ...p }){ return <div className={cn('card', className)} {...p} /> }
export function CardHeader({ className, ...p }){ return <div className={cn('card-header', className)} {...p} /> }
export function CardTitle({ className, ...p }){ return <h3 className={cn('card-title', className)} {...p} /> }
export function CardContent({ className, ...p }){ return <div className={cn('card-content', className)} {...p} /> }
