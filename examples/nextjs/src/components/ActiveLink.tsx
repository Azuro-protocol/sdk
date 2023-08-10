'use client'
import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link, { LinkProps } from 'next/link'


type ActiveLinkProps = LinkProps & {
  className?: string
  activeClassName: string
}

export const ActiveLink: React.FC<React.PropsWithChildren<ActiveLinkProps>> = ({ children, activeClassName, className, ...props }) => {
  const pathname = usePathname()
  const [ computedClassName, setComputedClassName ] = useState(className)

  useEffect(() => {
    // Dynamic route will be matched via props.as
    // Static route will be matched via props.href
    const linkPathname = new URL(
      (props.as || props.href) as string,
      location.href
    ).pathname

    // Using URL().pathname to get rid of query and hash
    const activePathname = new URL(pathname, location.href).pathname

    const newClassName =
      linkPathname === activePathname
        ? `${className} ${activeClassName}`.trim()
        : className

    if (newClassName !== computedClassName) {
      setComputedClassName(newClassName)
    }
  }, [
    pathname,
    props.as,
    props.href,
    activeClassName,
    className,
    computedClassName,
  ])

  return (
    <Link className={computedClassName} {...props}>
      {children}
    </Link>
  )
}
