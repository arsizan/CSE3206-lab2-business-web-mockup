import {
  createElement,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react"

type ButtonProps = {
  children: ReactNode
  variant?: "primary" | "secondary" | "text" | "icon" | "light"
} & ButtonHTMLAttributes<HTMLButtonElement>

type FieldLabelProps = {
  label: string
  id: string
}

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return createElement(
    "button",
    { ...props, type, className: `button button--${variant} ${className}` },
    children,
  )
}

export function Link({
  children,
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return createElement(
    "a",
    { ...props, className: `link ${className}` },
    children,
  )
}

export function Heading({
  level = 2,
  children,
  className = "",
  id,
}: {
  level?: 1 | 2 | 3 | 4
  children: ReactNode
  className?: string
  id?: string
}) {
  return createElement(`h${level}`, { className, id }, children)
}

export function Field({
  label,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldLabelProps) {
  return (
    <label className={`field ${className}`} htmlFor={id}>
      <span>
        {label}
        {props.required && <span className="required-mark"> *</span>}
      </span>
      {createElement("input", { ...props, id })}
    </label>
  )
}

export function SelectField({
  label,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & FieldLabelProps) {
  return (
    <label className="field" htmlFor={id}>
      <span>
        {label}
        {props.required && <span className="required-mark"> *</span>}
      </span>
      {createElement("select", { ...props, id }, children)}
    </label>
  )
}

export function TextAreaField({
  label,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldLabelProps) {
  return (
    <label className="field field--full" htmlFor={id}>
      <span>
        {label}
        {props.required && <span className="required-mark"> *</span>}
      </span>
      {createElement("textarea", { ...props, id })}
    </label>
  )
}
