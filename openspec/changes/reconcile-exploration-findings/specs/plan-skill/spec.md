# Plan Skill Delta

## ADDED Requirements

### Requirement: Fault injection technique
The plan SHALL accept `fault-injection` as a technique for recovery rules and SHALL reject unknown techniques.

#### Scenario: Recovery case uses fault injection
- **WHEN** a case declares the `fault-injection` technique
- **THEN** plan validation accepts it

### Requirement: Perishable prerequisites
The plan SHALL declare the time window of time-dependent cases, account state that cannot be forged in the target environment, and shared test instruments that other testers may exhaust, with a documented fallback.

#### Scenario: Time-window case outside its window
- **WHEN** a case depends on a slot less than a set number of minutes away
- **THEN** its prerequisite names the window in which it can run
