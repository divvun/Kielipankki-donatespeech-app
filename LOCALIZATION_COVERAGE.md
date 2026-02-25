# Localization Coverage Report

**Generated:** 2026-02-25  
**Status:** Complete ✓

## Language Support

Both .NET MAUI and Tauri implementations support **9 languages**:

| Language Code | Language Name (English) | Language Name (Native) |
|---------------|------------------------|------------------------|
| `fi` | Finnish | Suomi |
| `se` | Northern Sámi | Davvisámegiella |
| `sma` | Southern Sámi | Åarjelsaemien |
| `smj` | Lule Sámi | Julevsámegiella |
| `sms` | Skolt Sámi | Sääʹmǩiõll |
| `smn` | Inari Sámi | Anarâškielâ |
| `nb` | Norwegian Bokmål | Norsk Bokmål |
| `nn` | Norwegian Nynorsk | Norsk Nynorsk |
| `sv` | Swedish | Svenska |

### File Mapping

**.NET MAUI ResX Files:**
- `AppResources.resx` → Finnish (base/default)
- `AppResources.nb.resx` → Norwegian Bokmål
- `AppResources.nn.resx` → Norwegian Nynorsk
- `AppResources.se.resx` → Northern Sámi
- `AppResources.sv.resx` → Swedish
- `AppResources.smn.resx` → Inari Sámi
- `AppResources.fo.resx` → Southern Sámi (misnamed as Faroese)
- `AppResources.is.resx` → Lule Sámi (misnamed as Icelandic)
- `AppResources.kl.resx` → Skolt Sámi (misnamed as Greenlandic)

**Tauri Fluent Files:**
- `fi.ftl` → Finnish
- `nb.ftl` → Norwegian Bokmål
- `nn.ftl` → Norwegian Nynorsk
- `se.ftl` → Northern Sámi
- `sv.ftl` → Swedish
- `smn.ftl` → Inari Sámi
- `sma.ftl` → Southern Sámi
- `smj.ftl` → Lule Sámi
- `sms.ftl` → Skolt Sámi

## Translation Key Coverage

**Total Keys:**
- .NET MAUI: 100 keys
- Tauri: 102 keys (all 9 language files)

**Coverage:** All .NET MAUI translation keys are present in Tauri ✓

**Additional Tauri Keys:**
1. `RecordingApproachingLimitMessage` - Warning when recording time approaches 10 minute limit (added in section 1.4)
2. `ThemesPageBody2Text` - Additional body text for themes page

**Verification:**
```bash
# Compare keys between implementations
diff -u \
  <(grep '<data name=' Recorder.Maui/ResX/AppResources.resx | sed 's/.*<data name="\([^"]*\)".*/\1/' | sort) \
  <(grep '^[A-Za-z].*=' tauri-app/src/locales/fi.ftl | sed 's/ *=.*//' | sort)
```

Result: All MAUI keys present in Tauri ✓

## Language Switching Implementation

### Storage
- Language preference stored in browser `localStorage` with key `"language"`
- Default language: Finnish (`fi`)
- Persists across sessions

### UI Components
Language selector available on:
1. **OnboardingPage** - First screen users see
2. **ThemesPage** - Main navigation/theme selection screen

### Localization Stack
- **Library:** `@fluent/bundle` and `@fluent/react`
- **File Format:** Fluent (`.ftl`) - industry standard by Mozilla
- **Fallback:** All non-Finnish languages fallback to Finnish if translation missing
- **Loading:** Asynchronous with loading state indicator

### Language Names
Language names in the selector are **fully localized**:
- Display in current UI language
- E.g., when UI is in Finnish: "Pohjoissaame" (Northern Sámi)
- E.g., when UI is in Swedish: "Nordsamiska" (Northern Sámi)

## Testing Checklist

### Manual Testing (Section 1.5 bullet 3)

- [x] **Build verification:** All language files copied to `dist/` correctly
- [ ] **Language switching:** Change language updates all UI text immediately
- [ ] **Persistence:** Selected language persists after closing/reopening app
- [ ] **Fallback:** Missing translations fall back to Finnish
- [ ] **All languages:** Verify each language displays correctly:
  - [ ] Finnish (fi)
  - [ ] Northern Sámi (se)
  - [ ] Southern Sámi (sma)
  - [ ] Lule Sámi (smj)
  - [ ] Skolt Sámi (sms)
  - [ ] Inari Sámi (smn)
  - [ ] Norwegian Bokmål (nb)
  - [ ] Norwegian Nynorsk (nn)
  - [ ] Swedish (sv)

### Automated Verification
```bash
# Verify all language files have same number of keys
cd tauri-app/src/locales
for f in *.ftl; do 
  echo "$f: $(grep -c '^[A-Za-z].*=' "$f")"; 
done

# Expected output: all files have 102 keys
```

Result:
```
fi.ftl: 102
nb.ftl: 102
nn.ftl: 102
se.ftl: 102
sma.ftl: 102
smj.ftl: 102
smn.ftl: 102
sms.ftl: 102
sv.ftl: 102
```

✓ All language files complete and synchronized

## Recommendations

### Phase 2 Testing
During quality assurance, perform manual testing on actual devices:
1. Test language switching on iOS device
2. Test language switching on Android device
3. Verify special characters (Sámi diacritics: á, č, đ, ŋ, š, ŧ, ž, ǯ, etc.) display correctly
4. Test with screen readers in different languages

### Future Maintenance
When adding new UI strings:
1. Add key to `fi.ftl` (Finnish base)
2. Run script to sync keys to all other language files
3. Request translations from native speakers for each Sámi variant
4. Consider adding automated test to verify key count consistency

## References

- Fluent Syntax Guide: https://projectfluent.org/fluent/guide/
- Sámi Languages Info: https://en.wikipedia.org/wiki/Sámi_languages
- MAUI Localization: `Recorder.Maui/ResX/`
- Tauri Localization: `tauri-app/src/locales/`
