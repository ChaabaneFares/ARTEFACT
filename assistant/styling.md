# CSS Conversion Guide: px to vw (Simplified)

Convert **ALL** length units (e.g., `px`, `rem`, etc.) to `vw` units throughout the entire stylesheet, with base/desktop, tablet, and mobile breakpoints. Keep `em` as-is.

---

## CSS Formatting Rules:
- One line per class/selector
- No line breaks within declarations
- Space after colon in properties
- No space before colon
- Semi-colon after each declaration 
- Single quotes for string values
- Space after comma in values
- No trailing semi-colon on last property

Example Format:
```css
.className { color: #000; font-size: 16px; background: linear-gradient(to right, #fff, #000); }
```

---

## Unit Rules:
- Convert all length units (e.g., `px`, `rem`, etc.) to `vw`. Keep `em` values as-is.
- For `rem` values, resolve to px using the defined root font-size if present. If no root size is defined, assume `1rem = 16px` for conversion.
- Remove `clamp()` usage after conversion. Replace `clamp(min, preferred, max)` with the preferred value only for that breakpoint.

---

## 1. **Base/Desktop Styles (outside media queries):**
- **Convert all length units to `vw` using desktop reference: `vw = (px / 1920) * 100`**
- Example: `20px` → `1.04vw` (20 / 1920 * 100)
- If you encounter an existing `vw` value in desktop styles, assume it’s based on a 1920px reference. Reverse-calculate its original px using: `px = (vw × 1920) ÷ 100`. Then apply the resulting px value when converting to tablet and mobile vw breakpoints.
- **No length units should remain** in the base styles, with the exception of `em` values and specific properties like `border` thickness and `filter` values.
- Convert ALL properties: margins, paddings, font-sizes, heights, widths, etc.
- **Exceptions**:
  - `border`: Use `px` for border thickness (e.g., `border: 1px solid #000`).
  - `filter`: Use `px` for values like `blur` (e.g., `filter: blur(12px)`).
  - `border-radius`: If the radius makes the element fully round, use `360px`. Otherwise, convert to `vw`.
- **These base styles will apply to ALL desktop screens** regardless of size

---

## 2. **Media Queries Conversion:**

### a. **Tablet screens (@media screen and (max-width: 1024px)):**
- Convert ALL length values to `vw` using: `vw = (px / 768) * 100`
- Example: `16px` → `1.56vw` (16 / 768 * 100)
- If this media query doesn't exist, create it and include converted base styles
- **No length units should remain** inside this media query (except `em`, `border` thickness, and `filter` values)

### b. **Mobile screens (@media screen and (max-width: 600px)):**
- Convert ALL length values to `vw` using: `vw = (px / 412) * 100`
- Example: `14px` → `3.56vw` (14 / 412 * 100)
- If this media query doesn't exist, create it and include converted base styles
- **No length units should remain** inside this media query (except `em`, `border` thickness, and `filter` values)

---

## 3. **CRITICAL: Cross-checking Between All Styles**
- Create a master list of ALL selectors from base styles and ALL media queries
- Every selector with properties in base styles MUST have corresponding entries in ALL media queries
- If a property exists in the base styles, it MUST be converted and included in ALL media queries
- **Systematically cross-reference base styles and both media queries** to ensure no selector conversions are missed

---

## 4. **Adding Missing Property Overrides:**
- For ANY property in the base styles, check if it exists in EACH media query
- If the property is missing in a media query, ADD it with the appropriate `vw` conversion
- If a selector from the base styles is missing entirely in a media query, ADD the complete selector with ALL properties converted to the appropriate `vw` value for that media query

Example:
```css
/* Base style (desktop) - already in vw units based on 1920px */
.item { 
  font-size: 0.73vw;  /* (14 / 1920 * 100) */
  margin: 0.52vw;     /* (10 / 1920 * 100) */
}

/* What should be in ALL media queries (with appropriate conversions for each) */
@media screen and (max-width: 1024px) {
  .item { 
    font-size: 1.37vw;  /* (14 / 1024 * 100) */
    margin: 0.98vw;     /* (10 / 1024 * 100) */
  }
}

@media screen and (max-width: 600px) {
  .item { 
    font-size: 3.56vw;  /* (14 / 393 * 100) */
    margin: 2.54vw;     /* (10 / 393 * 100) */
  }
}
```

---

## 5. **Implementation Process:**
1. Make a complete list of ALL selectors in the entire CSS file
2. For EACH selector:
   - Convert ALL length values to `vw` in base styles using desktop formula (1920px reference)
   - Ensure the selector appears in BOTH tablet and mobile media queries with proper conversions for each screen size
   - Check ALL properties within each selector for length values
3. Perform a final regex search for any remaining `px`/`rem` values and for `clamp(` usage

---

## 6. **Thorough Verification:**
- Search for any remaining `px`/`rem` units anywhere using regex: `\d+(px|rem)`
- Search for any remaining `clamp(` usage using regex: `clamp\(`
- Common missed elements: navigation links, borders, paddings, margins, box-shadows, font-sizes
- Review the ENTIRE CSS file to ensure complete conversion in base styles and ALL media queries
- Double-check math calculations for accuracy (round to 2 decimal places)
- **Verify each entry in your master list appears in base styles AND BOTH media queries**

---

## ✅ Key Points:
- Convert **ALL** length values (`px`, `rem`, etc.) to `vw` throughout entire CSS file, with the following exceptions:
  - **`em` values**: Keep as-is.
  - **`border` thickness**: Should remain in `px` (e.g., `border: 1px solid black`).
  - **`filter` properties**: Values like `blur` should remain in `px` (e.g., `filter: blur(10px)`).
  - **`border-radius`**: For fully rounded elements, use `360px`. Otherwise, convert to `vw`.
- Remove `clamp()` usage after conversion; use the preferred value only.
- Base styles use desktop reference (1920px) for conversion and apply to all desktop screens
- **No separate large screen media query** is needed
- Add missing properties/selectors to media queries when they exist in base styles
- **Never leave a converted selector in one place but miss it in another**
- Maintain original CSS structure and formatting
- Verify conversions using regex search for any remaining `px` values
- Use a systematic approach to ensure nothing is missed
- Round all calculations to 2 decimal places for consistency

---

## 7. **Final Cleanup:**
- Do a second pass after conversions to remove duplicate selectors/properties, redundant rules, and any leftover clamps created during conversion.
- Remove any duplicate selectors or properties that have been created during the conversion process.
- Ensure the final code is clean, efficient, and free of repetitions.
