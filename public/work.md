# Form Validation Regex Patterns

## Email Validation
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Usage: emailRegex.test("user@example.com")
```

## URL Validation
```javascript
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
// Usage: urlRegex.test("https://example.com")
```

## Phone Number
```javascript
const phoneRegex = /^[\d\s\-\(\)]{10,}$/;
// Usage: phoneRegex.test("123-456-7890")
```

## Alphanumeric Only
```javascript
const alphanumericRegex = /^[a-zA-Z0-9]+$/;
// Usage: alphanumericRegex.test("Title123")
```

## Price (Number with decimals)
```javascript
const priceRegex = /^\d+(\.\d{1,2})?$/;
// Usage: priceRegex.test("99.99")
```

## No Special Characters
```javascript
const noSpecialRegex = /^[a-zA-Z0-9\s\-\.]+$/;
// Usage: noSpecialRegex.test("New York City")
```

## Minimum Length (at least 3 characters)
```javascript
const minLengthRegex = /^.{3,}$/;
// Usage: minLengthRegex.test("ABC")
```

## Custom: Listing Title (letters, numbers, spaces, hyphens)
```javascript
const titleRegex = /^[a-zA-Z0-9\s\-]{3,100}$/;
// Usage: titleRegex.test("Beautiful House - Lake View")
```

## Custom: Location/Country (letters, spaces, hyphens, commas)
```javascript
const locationRegex = /^[a-zA-Z\s\-,]{2,}$/;
// Usage: locationRegex.test("New York, USA")
```

---

### Implementation Example:
```javascript
function validateForm(formData) {
  const titleRegex = /^[a-zA-Z0-9\s\-]{3,100}$/;
  const priceRegex = /^\d+(\.\d{1,2})?$/;
  const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  
  if (!titleRegex.test(formData.title)) {
    return { valid: false, message: "Invalid title" };
  }
  if (!priceRegex.test(formData.price)) {
    return { valid: false, message: "Invalid price" };
  }
  if (!urlRegex.test(formData.image)) {
    return { valid: false, message: "Invalid image URL" };
  }
  return { valid: true };
}
```
