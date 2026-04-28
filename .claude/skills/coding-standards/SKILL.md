---
name: coding-standards
description: This skill should be used when writing code, creating components, or implementing features. It provides the 23 essential coding standards that must be followed for every piece of code, ensuring scalable, efficient, and maintainable codebases.
---

# Coding Standards

This skill provides the 23 essential coding standards that must be followed with every piece of code you write, ensuring scalable, efficient, and maintainable codebases.

## When to Use This Skill

Use this skill when:
- Writing any code
- Creating components
- Implementing API endpoints
- Reviewing code
- Planning implementations
- Ensuring code quality

## The 23 Essential Rules

### 1. Always Use DaisyUI
- Utilize DaisyUI for all UI components to maintain consistent styling across the application.

### 2. Create New UI Components
- Always create new, modular UI components to facilitate easy bug fixes and maintenance.
- Avoid large, monolithic components by breaking them into smaller, manageable pieces.
- **ALWAYS ask if you should break a component down into smaller chunks first.**

### 3. Component Documentation
- Each component must include a comment at the top explaining:
  - Purpose
  - Functionality
  - Location within the project

### 4. Vercel Compatibility for Endpoints
- Ensure that any endpoint created will **always work when deployed on Vercel**.
- Test in localhost:3000 and deploy to Vercel.
- This should always be considered in **ALL code you write**.

### 5. Design Quick and Scalable Endpoints
- Design all endpoints to be quick and scalable.
- Optimize performance to handle increased load without degradation.

### 6. Asynchronous Data Handling
- When pulling data or chaining multiple endpoints, implement asynchronous operations or data streaming.
- Prevent long wait times for users.
- Use techniques to show data quickly, rendering stuff on client side if possible.

### 7. API Response Documentation
- When receiving a response from an API, add comments and descriptions within the endpoint.
- Clearly outline the response structure.
- This facilitates easier chaining of APIs together.

### 8. Database Integration with SSR
- Integrate your chosen database using Server-Side Rendering (SSR).
- Ensure secure and efficient data access.
- Choose the appropriate database based on requirements.

### 9. Maintain Existing Functionality During Debugging
- When debugging or adding new features, always preserve the existing functionality.
- Prevent breaking current features.

### 10. Comprehensive Error Handling and Logging
- For complex APIs, include detailed error checks and logging.
- This aids in debugging, especially after deployment on Vercel.

### 11. Optimize for Quick and Easy Use
- Ensure the application is fast and user-friendly.
- Rapidly pull data from databases or external APIs.
- Use best practices to minimize the need for loading animations.

### 12. Complete Code Verification
- **Every command you write must ensure that the code is complete, correct, error-free, and bug-free.**
- Verify all dependencies between files.
- Ensure all imports are accurate.

### 13. Use TypeScript
- **TypeScript is being used.**
- All development must be done using TypeScript with proper type definitions.

### 14. Ensure Application Security and Scalability
- Build a secure, hack-proof, and scalable application.
- Use modern coding techniques to reduce server workload and operational costs.

### 15. Include Error Checks and Logging
- All code must contain error checks and logging.
- Handle edge cases effectively.
- Adhere to the standards of a senior developer.

### 16. Protect Exposed Endpoints
- Implement rate limiting.
- Secure endpoints with API keys or other authentication methods.
- Prevent unauthorized access.

### 17. Secure Database Access
- Ensure all interactions with the database are performed securely.
- Follow best practices to protect user data.

### 18. Step-by-Step Planning for Every Task
For every task or message, **first**:
1. Plan the approach meticulously.
2. Read and understand the existing code.
3. Identify what needs to be done.
4. Create a detailed, step-by-step plan, considering all edge cases.
5. Only then implement and write the code.

### 19. Utilize Specified Technology Stack
- **Frontend:** Next.js (v14) with App Router and SSR
- **Backend/Database:** Choose based on requirements:
  - **SQL:** PostgreSQL (Supabase, Neon, Railway), MySQL (PlanetScale, Railway)
  - **NoSQL:** MongoDB, Redis (caching), DynamoDB (AWS)
  - **Serverless-friendly:** Supabase, Neon, PlanetScale, MongoDB Atlas
- **Deployment:** Vercel (Free Plan), Railway, Render, or other serverless platforms
- **Styling:** Tailwind CSS and DaisyUI
- **Payment Processing:** Stripe (to be set up at a later stage)

### 20. Consistent Use of Existing Styles
- Always use existing styles from the codebase.
- Maintain consistency in padding, animations, styles, tooltips, popups, and alerts.
- Reuse existing components whenever possible.

### 21. Specify Script/File for Code Changes
- **Every time you suggest a change to the code**, **always specify which script or file** needs to be modified or created.
- This ensures clarity and organization within the project structure.

### 22. Organize UI Components Properly
- **All UI components must reside in the `/components` folder** located in the root directory.
- **Do not create additional components folders.**
- Place all components within this designated folder.

### 23. Efficient Communication
- **Be efficient in the number of messages** used in the AI chat.
- Optimize interactions to maintain productivity and streamline the development process.

## React Hooks Best Practices

Use these React hooks to speed up coding and keep it simple and efficient:

- **`useRef`** - For accessing DOM elements and storing mutable values
- **`useState`** - For component state management
- **`useEffect`** - For side effects and lifecycle management

## Integration with Design Principles

These coding standards align with software design principles:

| Coding Rule | Design Principle Connection |
|-------------|----------------------------|
| **Rule 2: Modular Components** | **KISS** - Simple, manageable pieces |
| **Rule 18: Step-by-Step Planning** | **Avoid Over-engineering** - Plan before building |
| **Rule 9: Maintain Existing Functionality** | **Boy Scout Rule** - Leave code better than found |
| **Rule 20: Consistent Styles** | **DRY** - Reuse existing components |
| **Rule 4: Vercel Compatibility** | **Ship Stable Code** - Production-ready from start |

## Database Considerations

### Choose SQL When:
- ✅ Structured data with clear relationships
- ✅ Need ACID transactions (financial, e-commerce)
- ✅ Complex queries with JOINs
- ✅ Strong consistency required

### Choose NoSQL When:
- ✅ Unstructured or semi-structured data
- ✅ High write throughput needed
- ✅ Horizontal scaling required
- ✅ Flexible schema needed

## Component Architecture

Following Rule 2 (Modular Components) and Rule 22 (Component Organization):

```
/components
├── ui/              # Base UI components (Button, Input, Card)
├── forms/           # Form-specific components
├── layout/          # Layout components (Header, Footer, Sidebar)
├── features/        # Feature-specific components
└── shared/          # Shared utilities and helpers
```

## Code Review Checklist

When reviewing code, ensure:

- [ ] All 23 rules are followed
- [ ] Components are modular and documented
- [ ] Error handling is comprehensive
- [ ] TypeScript types are properly defined
- [ ] Vercel compatibility is ensured
- [ ] Security measures are in place
- [ ] Performance is optimized
- [ ] Code is maintainable and readable

## Reference Material

For detailed examples and explanations, refer to:
- `../system-design-master/references/SYSTEM_DESIGN_MASTER_GUIDE.md` - Part 1: Foundations, Coding Standards & Best Practices section
