# HTML, CSS & JavaScript Interview Preparation

## 🎯 Purpose
This folder contains practical examples demonstrating core web development concepts frequently asked in frontend interviews. Each file includes detailed comments explaining the concepts.

## 📁 Project Structure

```
html/
├── index.html                    # Main entry point with navigation
├── core-web-vitals.html         # LCP, FID, CLS explained
├── critical-rendering-path.html # How browsers render pages
├── javascript/
│   ├── hoisting.html            # Variable and function hoisting
│   ├── event-loop.html          # Call stack, task queue, microtasks
│   ├── closures.html            # Closures and scope
│   ├── promises-async.html      # Promises, async/await
│   ├── this-keyword.html        # 'this' binding rules
│   └── prototypes.html          # Prototypal inheritance
├── css/
│   ├── box-model.html           # Box model and layout
│   ├── flexbox-grid.html        # Modern CSS layouts
│   └── specificity.html         # CSS specificity rules
└── performance/
    ├── lazy-loading.html        # Image and component lazy loading
    └── debounce-throttle.html   # Performance optimization techniques
```

## 🔑 Key Topics Covered

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: Loading performance
- **FID (First Input Delay)**: Interactivity
- **CLS (Cumulative Layout Shift)**: Visual stability

### Critical Rendering Path
- DOM construction
- CSSOM construction
- Render tree
- Layout and paint
- Blocking vs non-blocking resources

### JavaScript Concepts
- **Hoisting**: Variable and function declarations
- **Event Loop**: Call stack, task queue, microtasks
- **Closures**: Lexical scope and data privacy
- **Promises**: Async programming patterns
- **this keyword**: Binding rules
- **Prototypes**: Inheritance in JavaScript

### CSS Concepts
- Box model (content, padding, border, margin)
- Flexbox and Grid layouts
- Specificity calculation
- Animations and transitions

### Performance
- Lazy loading strategies
- Debounce and throttle
- Memory leak prevention

## 🚀 Getting Started

Open any HTML file directly in a browser, or use a local server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx)
npx serve .

# Using VS Code Live Server extension
# Right-click on index.html -> "Open with Live Server"
```

## 🎤 Common Interview Questions

1. What are Core Web Vitals and how do you optimize them?
2. Explain the Critical Rendering Path
3. What is hoisting in JavaScript?
4. How does the event loop work?
5. Explain closures with an example
6. What's the difference between == and ===?
7. How does 'this' work in JavaScript?
8. Explain CSS specificity
9. What causes layout shifts (CLS)?
10. How do you prevent memory leaks?
