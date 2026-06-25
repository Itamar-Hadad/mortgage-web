# calc-engine

Owned by issue #3 — porting `calcRoute`/`calcMix`/`PMT`/`mixRisk` from
`project files/סימולטור_משכנתא.html` into this module.

Fixed contract (ARCHITECTURE.md §13, §6): functions take `route`/`params`
in and return a calc object out. Admin/advisor screens call this module
directly client-side; consumer-facing screens call it through a Cloud
Function wrapper instead of shipping the formulas to the browser.