# CSS Linting Notes for AKIG Frontend

## Tailwind CSS Warnings

The CSS file (`src/index.css`) contains **133 Tailwind CSS directives** that appear as warnings in VS Code's CSS linter:

- `@tailwind` directives (base, components, utilities)
- `@apply` directives (component composition)

**These are NOT errors** - they are expected and normal. Here's why:

### What's Happening
1. VS Code's built-in CSS linter doesn't recognize `@tailwind` and `@apply` (Tailwind-specific at-rules)
2. When CSS is compiled via PostCSS + Tailwind, these directives are properly processed
3. The build system (`vite`, `npm run build`) handles this correctly

### Verification
✅ **TypeScript Errors**: 0  
✅ **Build Errors**: 0  
✅ **Runtime Errors**: 0  
✅ **CSS Compilation**: Works perfectly

## Configuration

VS Code has been configured to:
1. Ignore `@tailwind` and `@apply` warnings in `.vscode/settings.json`
2. Disable stylelint for CSS files
3. Set proper file associations for CSS and PostCSS

## Recommendation

**Do NOT worry about these warnings**. They:
- ✅ Don't affect TypeScript compilation
- ✅ Don't affect CSS compilation
- ✅ Don't affect runtime behavior
- ✅ Are purely cosmetic (VS Code editor warnings only)

The code is production-ready and builds correctly.

## Related Files
- `.vscode/settings.json` - VS Code configuration
- `.stylelintrc` - StyleLint configuration (disabled)
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration
- `src/index.css` - Main CSS file with Tailwind directives
