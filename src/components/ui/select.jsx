import React from 'react'
import { cn } from '@/lib/cn'

export function Select({ value, onValueChange, children }){
  const items = []
  function walk(nodes){
    React.Children.forEach(nodes, (child)=>{
      if (!child) return
      if (child.type && child.type.displayName === 'SelectItem'){
        items.push({ value: child.props.value, label: child.props.children })
      } else if (child && child.props && child.props.children){
        walk(child.props.children)
      }
    })
  }
  walk(children)
  return (
    <div>
      <select className="input" value={value} onChange={e=>onValueChange?.(e.target.value)}>
        {items.map(it => <option key={String(it.value)} value={it.value}>{it.label}</option>)}
      </select>
    </div>
  )
}
export function SelectTrigger(){ return null }
export function SelectValue(){ return null }
export function SelectContent({ className, children, ...p }){ return <div className={cn('hidden', className)} {...p}>{children}</div> }
export function SelectItem({ value, children }){ return <div>{children}</div> }
SelectItem.displayName = 'SelectItem'
