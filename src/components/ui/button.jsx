import React from 'react'
import { cn } from '@/lib/cn'
export function Button({ className, variant='primary', ...props }){
  const map = { primary:'btn btn-primary', secondary:'btn btn-secondary', outline:'btn btn-outline' }
  return <button className={cn(map[variant]||map.primary, className)} {...props} />
}
export default Button
