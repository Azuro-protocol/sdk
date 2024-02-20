'use client'
import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link, { LinkProps } from 'next/link'


type ActiveLinkProps = LinkProps & {
  className?: string
  activeClassName: string
  regex?: string
}

export const ActiveLink: React.FC<React.PropsWithChildren<ActiveLinkProps>> = (props) => {
  const { children, className, activeClassName, regex, ...rest } = props

  const pathname = usePathname()
  const [ computedClassName, setComputedClassName ] = useState(className)

  useEffect(() => {
    // Dynamic route will be matched via props.as
    // Static route will be matched via props.href
    const linkPathname = new URL(
      (rest.as || rest.href) as string,
      location.href
    ).pathname

    // Using URL().pathname to get rid of query and hash
    const activePathname = new URL(pathname, location.href).pathname
    const isMatch = regex ? new RegExp(regex).test(activePathname) : activePathname.includes(linkPathname)

    const newClassName =
      isMatch
        ? `${className} ${activeClassName}`.trim()
        : className

    if (newClassName !== computedClassName) {
      setComputedClassName(newClassName)
    }
  }, [
    pathname,
    rest.as,
    rest.href,
    activeClassName,
    className,
    computedClassName,
  ])

  return (
    <Link className={computedClassName} {...rest}>
      {children}
    </Link>
  )
}
