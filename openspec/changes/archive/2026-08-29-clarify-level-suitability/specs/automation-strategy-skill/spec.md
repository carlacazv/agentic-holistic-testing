## MODIFIED Requirements

### Requirement: Lowest effective level
The recommendation SHALL prefer unit, then component, then API, then browser E2E when that lower level can provide equivalent confidence; human judgment and non-automatable checks SHALL remain manual. A level's suitability SHALL declare that the level provides confidence equivalent to the levels above it rather than that the behavior is merely reachable there, so the recommendation SHALL be the lowest level marked suitable, and a risk observable only at a higher level SHALL be declared by withholding the lower level's suitability rather than by recommending above the flags.

#### Scenario: API-visible behavior
- **WHEN** behavior is fully observable and controllable at the HTTP boundary without browser-only risk
- **THEN** API is recommended instead of browser E2E

#### Scenario: Risk visible only in the assembled UI
- **WHEN** a widget can be exercised in isolation but its risk appears only once the interface is assembled
- **THEN** the row withholds component suitability and is recommended at browser E2E

#### Scenario: Recommendation above the declared flags
- **WHEN** a row marks a level suitable and recommends a higher level
- **THEN** validation fails naming the level the flags support
