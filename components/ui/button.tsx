import type { ButtonHTMLAttributes, ReactNode } from 'react';

export default function Button({ variant, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost'; children: ReactNode }) { return <button className={`ui-button ${variant ?? ''} ${className}`} {...props}>{children}</button>; }
