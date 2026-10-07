# Daily Zodiac

A public daily zodiac site built from real ephemeris positions plus a reusable interpretation library.

## Purpose

Daily Zodiac is a light, entertainment-focused astrology project. It does **not** collect birth date, birth time, or personal chart data. Visitors choose one of the 12 Sun signs and see a general daily reading generated from the current sky.

## Method

1. Read current planetary positions from an ephemeris engine.
2. Convert longitudes into tropical zodiac signs.
3. Detect the five major aspects: conjunction, sextile, square, trine, opposition.
4. Relate the current sky to each selected Sun sign.
5. Pull reusable interpretation fragments from JSON.
6. Assemble sections such as Overall, Love, Work, Money, Communication, Social, Energy, and Advice.

## Interpretation layers

- 10 bodies: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- 12 zodiac signs
- 5 major aspects
- Theme-specific interpretation fields
- Retrograde and daily weighting rules

## Important distinction

The ephemeris provides astronomical positions. The interpretation text is our own traditional-astrology content layer.

Astrology content is for entertainment, reflection, and general interest only. It should not be treated as fact, fate, professional advice, or a basis for important decisions.

## Ephemeris

The browser integration is designed for `@swisseph/browser`. The initial app keeps the ephemeris adapter isolated so the package can be self-hosted under `vendor/swisseph/` and, if desired, use a CDN only as a fallback.

Because Swiss Ephemeris JS is AGPL-3.0 under its free licensing model, this project must keep licensing compatibility in mind before public deployment.
