## ADDED Requirements

### Requirement: Declared skill sequencing
The skill manifest SHALL declare, for every skill, whether it belongs to the ordered pipeline or is an independent audit, and which declared skills must complete before it. An audit skill SHALL NOT declare prerequisites, and every prerequisite SHALL name a declared skill. Each generated skill SHALL state its pipeline position and its prerequisites in its description and metadata using that provider's invocation naming, so ordering is visible where a skill is selected rather than only inside its body. Each generated provider layout SHALL include an index document that lists the pipeline in order and the independent audits separately.

#### Scenario: Prerequisite stated at selection time
- **WHEN** a skill that depends on an earlier stage is packaged
- **THEN** its description names its position in the pipeline and the completed run it requires, in that provider's invocation naming

#### Scenario: Independent audit
- **WHEN** an audit skill is packaged
- **THEN** it declares no prerequisite and its description states that it runs against an authorized target environment rather than a plan

#### Scenario: Unknown or cyclic prerequisite
- **WHEN** the manifest names a prerequisite that is not a declared skill, gives an audit skill a prerequisite, or forms a cycle
- **THEN** packaging fails before any installation layout is generated

#### Scenario: Installed layout is self-describing
- **WHEN** a provider layout is installed into a project
- **THEN** it includes an index naming the pipeline order and the independent audits without requiring the source repository
