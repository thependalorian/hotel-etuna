/**
 * Form Component System
 * 
 * Purpose: React Hook Form integration with Radix UI primitives
 * Location: /components/ui/Form.tsx
 * 
 * Features:
 * - Built on react-hook-form for robust form state management
 * - Automatic field validation and error display
 * - ARIA attribute management for accessibility
 * - Composable form field components
 * - Type-safe with TypeScript generics
 * 
 * Components:
 * - Form: Root provider (wraps form with FormProvider)
 * - FormField: Field controller with validation
 * - FormItem: Container for field components
 * - FormLabel: Accessible label with error styling
 * - FormControl: Input wrapper with ARIA attributes
 * - FormDescription: Helper text below field
 * - FormMessage: Error message display
 * 
 * Design System:
 * - Spacing: space-y-2 for field grouping (Gestalt proximity)
 * - Error state: Automatic error color styling
 * - Typography: Semantic text sizes
 * 
 * Accessibility:
 * - Automatic ID generation for associations
 * - aria-describedby for descriptions and errors
 * - aria-invalid for error states
 * - Proper label-input association
 * - Screen reader error announcements
 * 
 * Usage:
 * ```tsx
 * const form = useForm<FormData>({
 *   resolver: zodResolver(schema),
 * })
 * 
 * <Form {...form}>
 *   <FormField
 *     control={form.control}
 *     name="email"
 *     render={({ field }) => (
 *       <FormItem>
 *         <FormLabel>Email</FormLabel>
 *         <FormControl>
 *           <Input type="email" {...field} />
 *         </FormControl>
 *         <FormDescription>Your email address</FormDescription>
 *         <FormMessage />
 *       </FormItem>
 *     )}
 *   />
 * </Form>
 * ```
 * 
 * @module Form
 */

"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  useFormContext,
  FormProvider,
  UseFormReturn,
} from "react-hook-form"

import { cn } from "@/lib/utils/cn"

// Form context provider - wraps children with FormProvider
function FormComponent<T extends FieldValues>({ children, ...form }: { children: React.ReactNode } & UseFormReturn<T>) {
  return <FormProvider {...form}>{children}</FormProvider>;
}

type FormFieldContext<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContext>(
  {} as FormFieldContext
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div 
        ref={ref} 
        className={cn(
          "space-y-2", // Gestalt - proximity
          className
        )} 
        {...props} 
      />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        "text-sm font-semibold leading-tight mb-2 block text-base-content",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        error && "text-error",
        className
      )}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !formMessageId ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!useFormField().error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn(
        "text-xs text-base-content/60 leading-relaxed mt-1",
        className
      )}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

// Export Form as alias of FormComponent
export const Form = FormComponent;