"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
  useToast,
} from "@/components/ui";

export default function DesignSystemDemo() {
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div className="container mx-auto p-8 space-y-12 max-w-6xl">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold text-nude-900">
          Buffr Host Design System v1.0.0
        </h1>
        <p className="text-lg text-nude-600">
          Core UI components built with Tailwind CSS and Radix UI
        </p>
      </div>

      {/* Buttons Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-nude-900">Buttons</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-nude-700 mb-3">Variants</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="luxury">Luxury</Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-nude-700 mb-3">Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-nude-700 mb-3">States</h3>
            <div className="flex flex-wrap gap-3">
              <Button isLoading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-nude-900">Cards</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Subtle shadow, perfect for content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-nude-600">
                This is a default card with standard styling.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>Medium shadow for emphasis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-nude-600">
                This card stands out with a stronger shadow.
              </p>
            </CardContent>
          </Card>

          <Card variant="luxury">
            <CardHeader>
              <CardTitle>Luxury Card</CardTitle>
              <CardDescription>Premium gradient background</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-nude-600">
                Perfect for highlighting premium features.
              </p>
            </CardContent>
          </Card>

          <Card variant="interactive" onClick={() => toast({ variant: "info", title: "Card clicked!" })}>
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
              <CardDescription>Click me!</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-nude-600">
                This card has hover effects and is clickable.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Form Components Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-nude-900">Form Components</h2>
        
        <Card>
          <CardContent className="pt-6 space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
            />

            <Input
              label="Password"
              type="password"
              error="Password must be at least 8 characters"
              placeholder="••••••••"
            />

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="guesthouse">Guest House</SelectItem>
                <SelectItem value="bnb">Bed & Breakfast</SelectItem>
                <SelectItem value="resort">Resort</SelectItem>
                <SelectItem value="lodge">Lodge</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              label="Description"
              placeholder="Tell us about your property..."
              rows={5}
            />

            <Input
              label="Disabled Field"
              value="This field is disabled"
              disabled
            />
          </CardContent>
        </Card>
      </section>

      {/* Toasts Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-nude-900">Toast Notifications</h2>
        
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  toast({
                    variant: "success",
                    title: "Success!",
                    description: "Your changes have been saved.",
                  })
                }
              >
                Success Toast
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  toast({
                    variant: "error",
                    title: "Error",
                    description: "Something went wrong. Please try again.",
                  })
                }
              >
                Error Toast
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  toast({
                    variant: "warning",
                    title: "Warning",
                    description: "Please review your changes before saving.",
                  })
                }
              >
                Warning Toast
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  toast({
                    variant: "info",
                    title: "Information",
                    description: "This is an informational message.",
                  })
                }
              >
                Info Toast
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Modal Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-nude-900">Modal / Dialog</h2>
        
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <Modal>
                <ModalTrigger asChild>
                  <Button>Open Modal</Button>
                </ModalTrigger>
                <ModalContent>
                  <ModalHeader>
                    <ModalTitle>Welcome to Buffr Host</ModalTitle>
                    <ModalDescription>
                      This is a modal dialog built with Radix UI and styled according to the Design System v1.0.0.
                    </ModalDescription>
                  </ModalHeader>
                  <div className="py-4">
                    <p className="text-nude-600 text-sm">
                      Modals are great for focused tasks that require user attention.
                      They include backdrop blur, smooth animations, and proper accessibility.
                    </p>
                  </div>
                  <ModalFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Confirm</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              <Modal open={modalOpen} onOpenChange={setModalOpen}>
                <ModalTrigger asChild>
                  <Button variant="destructive">Delete Action</Button>
                </ModalTrigger>
                <ModalContent>
                  <ModalHeader>
                    <ModalTitle>Are you sure?</ModalTitle>
                    <ModalDescription>
                      This action cannot be undone. This will permanently delete your data.
                    </ModalDescription>
                  </ModalHeader>
                  <ModalFooter>
                    <Button variant="outline" onClick={() => setModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setModalOpen(false);
                        toast({
                          variant: "success",
                          title: "Deleted",
                          description: "Your item has been deleted.",
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Design System Info */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-nude-900">Design System Principles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Touch Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-nude-600">
                All interactive elements meet the 44px minimum touch target for accessibility.
                Medium and large buttons comply by default.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-nude-600" />
                  <span className="text-sm text-nude-600">nude-600 (Primary)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-nude-700" />
                  <span className="text-sm text-nude-600">nude-700 (Secondary)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-luxury-charlotte" />
                  <span className="text-sm text-nude-600">luxury-charlotte</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Animations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-nude-600">
                All animations respect 200ms duration for snappy feel. Scale, fade, and lift animations
                provide subtle feedback.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
