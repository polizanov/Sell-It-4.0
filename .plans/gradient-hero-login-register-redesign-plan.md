 Interactive Mouse-Following Gradients & Theme Changes Plan

 Context

 The Sell-It marketplace currently uses a dark theme throughout with static gradient effects. The user wants to create a more interactive and visually dynamic experience by:

 1. Making the hero section's orange gradient follow the user's mouse cursor
 2. Converting certain sections to a light theme (white background with dark text)
 3. Adding hover-activated mouse-following gradients to product listing and auth pages

 This change will make the UI more engaging and modern while maintaining the orange accent brand color (#ff5722). The implementation focuses on performance optimization using requestAnimationFrame and CSS custom properties to ensure smooth 60fps animations.

 Task Decomposition & Delegation

 This is a frontend-only task focused on interactive UI enhancements and theme changes with significant design considerations. The work will be delegated as follows:

 ┌─────┬─────────────────────────────────────────────────────────────────────────────────┬─────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │  #  │                                   Sub-problem                                   │     Expert      │                                                                                Description                                                                                 │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 1   │ Design specifications for mouse-following gradients and color theme transitions │ UI/UX Designer  │ Research optimal gradient behavior (activation modes, colors, sizes), define color theme specifications for white sections, ensure visual consistency and accessibility    │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 2   │ Create reusable mouse-following gradient system                                 │ Frontend Expert │ Implement useMouseGradient custom hook and MouseFollowGradient wrapper component with RAF optimization, CSS custom properties, and mobile detection per design specs       │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 3   │ Implement interactive gradients and theme changes across all pages              │ Frontend Expert │ Update Hero (always gradient), Features (white theme), Product Listing (hover gradient), and Login/Register pages (white + hover gradient) following design specifications │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 4   │ Test implementation for functionality, performance, and accessibility           │ QA Expert       │ Write unit tests for hook, update integration tests, verify 60fps performance, test mobile behavior, check WCAG compliance, ensure cross-browser compatibility             │
 └─────┴─────────────────────────────────────────────────────────────────────────────────┴─────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 Execution Strategy:
 - Phase 1: UI/UX Designer provides design specifications and recommendations (sub-problem 1)
 - Phase 2: Frontend Expert creates the reusable gradient system (sub-problem 2) - waits for design specs from Phase 1
 - Phase 3: Frontend Expert implements gradients and theme changes across pages (sub-problem 3) - depends on Phase 2
 - Phase 4: QA Expert tests the complete implementation (sub-problem 4) - depends on Phase 3

 All sub-problems execute sequentially as each depends on the output of the previous phase.

 Implementation Approach

 Architecture: Custom Hook + Wrapper Component

 Create a reusable useMouseGradient custom hook combined with a MouseFollowGradient wrapper component. This approach provides:

 - Reusability: Same logic for hero, product listing, and auth pages
 - Performance: Encapsulated RAF optimization and throttling
 - Flexibility: Components can use hook directly or wrapper component
 - Testability: Hook can be unit tested independently

 Technical Strategy: CSS Custom Properties

 Use CSS custom properties (--mouse-x, --mouse-y) updated via requestAnimationFrame for optimal performance:

 - Better than inline background-image updates (fewer reflows)
 - Smooth transitions with CSS
 - GPU-accelerated rendering
 - Clean separation of styling from logic

 Detailed Implementation Plan

 1. Create Core Hook: useMouseGradient

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/hooks/useMouseGradient.ts (NEW)

 Interface:
 interface UseMouseGradientOptions {
   activationMode: 'always' | 'hover';  // Always active or only on hover
   gradientColor: string;                // e.g., 'rgba(255, 87, 34, 0.15)'
   gradientSize: number;                 // Ellipse size percentage (e.g., 50)
   disableOnTouch?: boolean;             // Disable on mobile (default: true)
 }

 interface UseMouseGradientReturn {
   containerRef: RefObject<HTMLElement>;
   gradientStyle: CSSProperties;
   isActive: boolean;
 }

 Key Features:
 - Use useRef for container element reference
 - Use useState for mouse position (x%, y%) and hover/active state
 - Use requestAnimationFrame to batch updates with browser paint cycle
 - Convert mouse coordinates to percentage-based positions
 - Attach/detach event listeners in useEffect
 - Clean up RAF and listeners on unmount
 - Disable on touch devices using window.matchMedia('(pointer: coarse)')
 - Respect prefers-reduced-motion user preference

 Performance Optimizations:
 - requestAnimationFrame ensures updates sync with browser refresh (60fps)
 - Cancel pending RAF before queuing new one to prevent backlog
 - Direct CSS custom property updates on element (avoid state for position)
 - Early exit on touch devices to save resources

 2. Create Wrapper Component: MouseFollowGradient

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/components/common/MouseFollowGradient.tsx (NEW)

 Props:
 interface MouseFollowGradientProps {
   children: ReactNode;
   activationMode?: 'always' | 'hover';  // Default: 'hover'
   gradientColor?: string;                // Default: 'rgba(255, 87, 34, 0.15)'
   gradientSize?: number;                 // Default: 50
   className?: string;
   disableOnMobile?: boolean;             // Default: true
 }

 Structure:
 <div ref={containerRef} className={className}>
   {/* Gradient overlay */}
   <div
     className="absolute inset-0 pointer-events-none transition-opacity duration-300"
     style={{
       background: `radial-gradient(ellipse ${gradientSize}% ${gradientSize}% at var(--mouse-x, 50%) var(--mouse-y, 50%), ${gradientColor} 0%, transparent 100%)`,
       opacity: isActive ? 1 : 0
     }}
   />
   {children}
 </div>

 Export from components index:
 - Add to /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/components/common/index.ts

 3. Update Hero Section - Always Active Gradient

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/Home.tsx (Lines 144-181)

 Changes:

 1. Import the component:
 import { MouseFollowGradient } from '@/components/common/MouseFollowGradient';

 2. Replace static gradient overlay (line 147):
 // REMOVE:
 <div className="absolute inset-0 bg-gradient-hero-orange pointer-events-none" />

 // ADD:
 <MouseFollowGradient
   activationMode="always"
   gradientColor="rgba(255, 87, 34, 0.15)"
   gradientSize={50}
   className="absolute inset-0"
 >
   {/* Content wrapper */}
   <PageContainer className="py-20 md:py-32 relative z-10">
     {/* ... existing hero content ... */}
   </PageContainer>
 </MouseFollowGradient>

 3. Ensure section has relative positioning (already has it):
 <section className="relative bg-gradient-hero border-b border-dark-border overflow-hidden">

 Expected behavior: Orange gradient continuously follows cursor with smooth movement

 4. Update Features Section - White Theme (No Gradient)

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/Home.tsx (Lines 183-254)

 Changes:

 1. Section wrapper (line 185):
 // BEFORE:
 <section className="bg-dark-surface border-t border-dark-border relative overflow-hidden">

 // AFTER:
 <section className="bg-white border-t border-gray-200 relative overflow-hidden">

 2. Section header (lines 187-193):
 // Title (line 188):
 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"

 // Gradient underline remains: bg-gradient-cta (orange accent)

 3. Feature cards (all 3 cards - lines 198, 214, 230):
 // BEFORE:
 className="group relative bg-gradient-feature-glow-1 border border-dark-border rounded-2xl p-8 ..."

 // AFTER:
 className="group relative bg-white border border-gray-200 rounded-2xl p-8 shadow-md hover:shadow-xl ..."

 4. Card titles (lines 203, 219, 235):
 className="text-2xl font-semibold text-gray-900 mb-3"

 5. Card descriptions (lines 204, 220, 236):
 className="text-gray-600 leading-relaxed"

 6. Icon containers: Keep existing text-orange - orange works well on white background
 7. Arrow transition element (line 250):
 className="w-8 h-8 text-orange/80"  // Increased opacity from 60% to 80%

 Color mapping:
 - Backgrounds: #1a1a1a → #ffffff
 - Borders: #333333 → #e5e7eb (gray-200)
 - Headings: #ffffff → #111827 (gray-900)
 - Body text: #e5e5e5 → #4b5563 (gray-600)
 - Orange accents: Keep #ff5722

 5. Update Product Listing Section - Hover-Activated Gradient

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/Home.tsx (Lines 256-377)

 Changes:

 1. Wrap section with gradient component (line 256):
 // BEFORE:
 <section className="bg-dark-bg">
   <PageContainer>
     {/* content */}
   </PageContainer>
 </section>

 // AFTER:
 <section className="relative bg-dark-bg">
   <MouseFollowGradient
     activationMode="hover"
     gradientColor="rgba(255, 87, 34, 0.12)"
     gradientSize={60}
     className="absolute inset-0"
     disableOnMobile={true}
   />
   <PageContainer className="relative z-10">
     {/* ... existing content unchanged ... */}
   </PageContainer>
 </section>

 Expected behavior: Gradient appears only when mouse enters section, follows cursor, fades out on leave

 6. Update Login Page - White Background with Hover Gradient

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/Login.tsx

 Changes:

 1. Wrap entire page content (around line 92):
 // BEFORE:
 return (
   <PageContainer>
     <div className="max-w-md mx-auto">
       {/* form */}
     </div>
   </PageContainer>
 );

 // AFTER:
 return (
   <div className="min-h-screen relative bg-white">
     <MouseFollowGradient
       activationMode="hover"
       gradientColor="rgba(255, 87, 34, 0.08)"
       gradientSize={70}
       className="absolute inset-0"
       disableOnMobile={true}
     />
     <PageContainer className="relative z-10">
       <div className="max-w-md mx-auto">
         {/* form */}
       </div>
     </PageContainer>
   </div>
 );

 2. Update heading colors (lines 99-102):
 // Title:
 className="text-4xl font-bold text-gray-900 mb-3"

 // Subtitle:
 className="text-gray-600 text-lg"

 3. Update Card component (line 111):
 className="relative bg-white backdrop-blur-sm border-2 border-gray-200 hover:border-orange/30 transition-all duration-500 shadow-xl"

 4. Update form labels and text (throughout form):
 // Labels:
 className="block text-sm font-medium text-gray-700 mb-2"

 // Helper text, errors:
 className="text-gray-600"  // or "text-red-600" for errors

 5. Update link text (bottom of form):
 className="text-gray-600"
 // Keep orange link: className="text-orange hover:text-orange-hover"

 Note: Icon container with bg-gradient-icon-glow already works on white background

 7. Update Register Page - White Background with Hover Gradient

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/Register.tsx

 Registration Form View (lines 151-252):

 Apply same changes as Login page:

 1. Wrap with white background + gradient:
 return (
   <div className="min-h-screen relative bg-white">
     <MouseFollowGradient
       activationMode="hover"
       gradientColor="rgba(255, 87, 34, 0.08)"
       gradientSize={70}
       className="absolute inset-0"
       disableOnMobile={true}
     />
     <PageContainer className="relative z-10">
       <div className="max-w-md mx-auto">
         {/* form */}
       </div>
     </PageContainer>
   </div>
 );

 2. Update text colors (lines 156-160):
 // Title:
 className="text-4xl font-bold text-gray-900 mb-3"

 // Subtitle:
 className="text-gray-600 text-lg"

 3. Update Card:
 className="relative bg-white backdrop-blur-sm border-2 border-gray-200 hover:border-orange/30 transition-all duration-500 shadow-xl"

 Success State View (lines 114-148):

 Apply same white background + gradient wrapper:

 1. Wrap success state:
 return (
   <div className="min-h-screen relative bg-white">
     <MouseFollowGradient
       activationMode="hover"
       gradientColor="rgba(255, 87, 34, 0.08)"
       gradientSize={70}
       className="absolute inset-0"
       disableOnMobile={true}
     />
     <PageContainer className="relative z-10">
       <div className="max-w-md mx-auto">
         {/* success card */}
       </div>
     </PageContainer>
   </div>
 );

 2. Update success card (line 122):
 className="relative bg-white backdrop-blur-sm border-2 border-green-500/50 shadow-xl"

 3. Update text colors (lines 130-135):
 // Title:
 className="text-4xl font-bold text-gray-900 mb-4"

 // Subtitle:
 className="text-gray-600 text-lg mb-2"

 // Body text:
 className="text-gray-600 mb-8 max-w-sm mx-auto"

 Note: Success icon with bg-gradient-success-icon (green) works well on white

 8. Tailwind Configuration Updates

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/tailwind.config.js

 No changes required - Tailwind includes gray colors by default:
 - gray-50 through gray-900
 - white and black

 All colors used (gray-200, gray-600, gray-900) are standard Tailwind colors.

 Performance Optimizations

 RequestAnimationFrame Implementation

 const rafRef = useRef<number>();

 const handleMouseMove = (e: MouseEvent) => {
   if (rafRef.current) {
     cancelAnimationFrame(rafRef.current);
   }

   rafRef.current = requestAnimationFrame(() => {
     const rect = containerRef.current?.getBoundingClientRect();
     if (!rect) return;

     const x = ((e.clientX - rect.left) / rect.width) * 100;
     const y = ((e.clientY - rect.top) / rect.height) * 100;

     // Update CSS custom properties directly
     containerRef.current?.style.setProperty('--mouse-x', `${x}%`);
     containerRef.current?.style.setProperty('--mouse-y', `${y}%`);
   });
 };

 Benefits:
 - Syncs with browser refresh rate (60fps or higher)
 - Cancels pending frames to prevent backlog
 - GPU-accelerated via CSS custom properties
 - No React re-renders for position updates

 Mobile Device Optimization

 const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

 useEffect(() => {
   if (disableOnTouch && isTouchDevice) {
     return; // Skip setup on touch devices
   }
   // ... attach listeners
 }, []);

 Benefits:
 - Saves battery on mobile devices
 - Avoids confusing UX (no cursor on touch)
 - Reduces CPU/GPU usage

 Reduced Motion Support

 const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

 if (prefersReducedMotion) {
   return null; // Or show static gradient
 }

 Benefits:
 - Respects user accessibility preferences
 - WCAG 2.1 compliance (Motion Actuation)

 Accessibility Considerations

 Color Contrast (WCAG AA Compliance)

 White background sections:
 - Gray-900 text on white: 16.75:1 (AAA) ✓
 - Gray-600 text on white: 7.23:1 (AAA) ✓
 - Orange (#ff5722) on white: 3.05:1 (AA for large text) ✓

 Dark background sections (unchanged):
 - White text on dark: 21:1 (AAA) ✓
 - Orange on dark: ~4.5:1 (AA) ✓

 Recommendations:
 - Use text-gray-900 for headings (highest contrast)
 - Use text-gray-600 for body text (excellent readability)
 - Keep orange for accents and CTAs

 Keyboard Navigation

 No impact: Gradient is purely decorative and doesn't interfere with focus states or tab order.

 Screen Readers

 No impact: Gradient is CSS-only visual enhancement with no semantic meaning. No ARIA labels needed.

 Testing Strategy

 Unit Tests

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/tests/unit/useMouseGradient.test.ts (NEW)

 Test cases:
 1. Hook returns correct ref and initial state
 2. Mouse move updates position correctly
 3. Hover mode only activates when mouse enters
 4. Always mode is active immediately
 5. Touch device detection disables gradient
 6. Reduced motion disables animation
 7. Cleanup removes event listeners

 Integration Tests

 Update existing test files:
 1. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/tests/integration/Home.test.tsx - Update snapshots for white features section
 2. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/tests/integration/Login.test.tsx - Update for white background
 3. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/tests/integration/Register.test.tsx - Update for white background

 New test cases:
 - MouseFollowGradient component renders correctly
 - Gradient overlay is present but hidden initially (hover mode)
 - Props are passed correctly to hook

 Visual Testing

 Manual testing checklist:
 - Hero gradient follows mouse smoothly
 - Features section is white with good contrast
 - Product section gradient activates on hover
 - Login page gradient works correctly
 - Register page gradient works (form and success state)
 - Mobile devices show no gradient (disabled)
 - Reduced motion preference disables animation

 Performance Testing

 Metrics to verify:
 - Gradient updates maintain 60fps (check DevTools Performance tab)
 - No layout thrashing (check paint times)
 - No memory leaks (check event listener cleanup)
 - Smooth on mid-range devices

 Browser Compatibility

 Target browsers:
 - Chrome/Edge: 49+ (CSS custom properties support)
 - Firefox: 31+
 - Safari: 9.1+
 - Opera: 36+

 Features used:
 - CSS custom properties: ✓ Widely supported
 - RequestAnimationFrame: ✓ Universal support
 - matchMedia: ✓ Universal support

 Graceful degradation: On unsupported browsers, gradients simply won't animate but content remains fully accessible.

 Critical Files

 New files to create:
 1. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/hooks/useMouseGradient.ts - Custom hook for mouse tracking
 2. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/components/common/MouseFollowGradient.tsx - Wrapper component
 3. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/tests/unit/useMouseGradient.test.ts - Unit tests

 Files to modify:
 1. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/Home.tsx - Hero, features, and product listing sections
 2. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/Login.tsx - White background with gradient
 3. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/Register.tsx - White background with gradient
 4. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/components/common/index.ts - Export new component
 5. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/tests/integration/Home.test.tsx - Update snapshots
 6. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/tests/integration/Login.test.tsx - Update tests
 7. /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/tests/integration/Register.test.tsx - Update tests

 Implementation Sequence

 1. Create hook and component (useMouseGradient + MouseFollowGradient)
 2. Implement hero section (always-active gradient)
 3. Update features section (white theme, static)
 4. Implement product listing (hover gradient)
 5. Update Login page (white + hover gradient)
 6. Update Register page (white + hover gradient)
 7. Write tests (unit + integration)
 8. Performance testing (verify 60fps)
 9. Cross-browser testing
 10. Accessibility audit

 Verification

 To verify the implementation is successful:

 1. Start dev server: npm run dev -w frontend
 2. Visual checks:
   - Navigate to home page - hero gradient should follow mouse
   - Scroll to features section - should be white with dark text
   - Scroll to products section - gradient should appear on hover
   - Navigate to login page - white background, gradient on hover
   - Navigate to register page - same behavior as login
 3. Run tests: npm run test -w frontend
   - All existing tests should pass with updated snapshots
   - New useMouseGradient tests should pass
 4. Performance check:
   - Open DevTools → Performance tab
   - Record while moving mouse over hero
   - Verify FPS stays at 60fps
   - Check paint times are minimal
 5. Accessibility check:
   - Test with keyboard navigation (Tab key)
   - Check contrast ratios in DevTools
   - Test with reduced motion preference enabled
 6. Mobile check:
   - Open DevTools → Device toolbar
   - Switch to mobile viewport
   - Verify gradients are disabled (no mouse tracking)
 7. Build verification: npm run build -w frontend
   - Build should succeed without errors
   - Bundle size increase should be minimal (< 5KB)

 Success Criteria

 - ✓ Hero section gradient smoothly follows mouse cursor
 - ✓ Features section has white background with excellent contrast
 - ✓ Product listing gradient activates only on hover
 - ✓ Login/Register pages have white backgrounds with hover gradients
 - ✓ 60fps performance maintained during gradient animation
 - ✓ Mobile devices have gradients disabled
 - ✓ WCAG AA accessibility standards met
 - ✓ All tests pass
 - ✓ No regressions in existing functionality
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌