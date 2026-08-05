import Link from "next/link";
import type {
    ButtonHTMLAttributes,
    ReactNode,
} from "react";

type AdminButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "danger";

type CommonProps = {
    children: ReactNode;
    variant?: AdminButtonVariant;
    className?: string;
};

type ButtonProps =
    CommonProps &
    ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: never;
    };

type LinkProps = CommonProps & {
    href: string;
    target?: string;
    rel?: string;
};

const variantClasses: Record<
    AdminButtonVariant,
    string
> = {
    primary: [
        "border-[#192a3a]",
        "bg-[#192a3a]",
        "!text-white",
        "hover:border-[#29465c]",
        "hover:bg-[#29465c]",
        "hover:!text-white",
        "[&_*]:!text-current",
    ].join(" "),

    secondary: [
        "border-[#192a3a]/15",
        "bg-[#eef0ee]",
        "!text-[#192a3a]",
        "hover:border-[#192a3a]/30",
        "hover:bg-[#e1e5e3]",
        "hover:!text-[#192a3a]",
        "[&_*]:!text-current",
    ].join(" "),

    ghost: [
        "border-transparent",
        "bg-transparent",
        "!text-slate-600",
        "hover:border-[#192a3a]/15",
        "hover:bg-[#eef0ee]",
        "hover:!text-[#192a3a]",
        "[&_*]:!text-current",
    ].join(" "),

    danger: [
        "border-red-200",
        "bg-red-50",
        "!text-red-700",
        "hover:border-red-300",
        "hover:bg-red-100",
        "hover:!text-red-700",
        "[&_*]:!text-current",
    ].join(" "),
};

const baseClasses = [
    "inline-flex h-11 items-center justify-center gap-2",
    "rounded-md border px-4",
    "text-xs font-black",
    "transition duration-200",
    "active:scale-[0.98]",
    "disabled:pointer-events-none",
    "disabled:opacity-50",
].join(" ");

export function AdminButton(
    props: ButtonProps | LinkProps
) {
    const {
        children,
        variant = "primary",
        className = "",
    } = props;

    const classes = [
        baseClasses,
        variantClasses[variant],
        className,
    ].join(" ");

    if ("href" in props && props.href) {
        return (
            <Link
                href={props.href}
                target={props.target}
                rel={props.rel}
                className={classes}
            >
                {children}
            </Link>
        );
    }

    const {
        href: _href,
        variant: _variant,
        ...buttonProps
    } = props as ButtonProps & {
        variant?: AdminButtonVariant;
    };

    return (
        <button
            {...buttonProps}
            className={classes}
        >
            {children}
        </button>
    );
}